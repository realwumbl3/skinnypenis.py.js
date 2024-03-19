import { io } from 'socket.io-client';
import { html, css, zyXArray } from 'zyX';

const socketio = io('/socket.io');

socketio.on('connect', () => {
	messages.push({ class: "sys", user: { name: "system" }, content: "Connected to the server." });
	socketio.emit('enter', { room: "root" });
});

socketio.on('status', (data) => console.log("[socketio] status: ", data));

const msg_limit = data.msg_limit;
const max_len = data.max_len;
const messages = new zyXArray(...data.latest.reverse());

socketio.on('chat', (message) => {
	console.log("[socketio] chat: ", message);
	messages.push(message)
	!isScrolledToBottom() && scrolldown.classList.add('visible');
});

await css`url(/static/css.css)`;

const { messages_list, input, limit, scrolldown } = html`
    <main>
		<h1>Chat Lite.</h1>
		<div class="messagesArea">
				<div this=messages_list class="messages" 
					zyx-scroll="${messages_scroll}"
					zyx-array="${{ array: messages, range: -msg_limit, compose: newMessage }}"
				></div>
				<div this=scrolldown class="scrolldown" zyx-click="${scrollToBottom}">new messages</div>
			</div>
		<div class="input-area">
				<input type="text" this="input" id="input" placeholder="Enter your message" 
					zyx-keyup="${input_keyup}" zyx-input="${input_input}"
				></input>
				<div class=limit><a this=limit>0</a> / ${max_len}</div>
			</div>
	</main>
`.appendTo(document.body)

function newMessage(message) {
	return html`	
	<div class="message ${message?.class || "user"}">
        <div class=username>${message.user.name}</div> - 
        <div class=content>${message.content}</div>
    </div>
`;
}

function scrollToBottom() { messages_list.scrollTo({ top: messages_list.scrollHeight, behavior: 'smooth' }); }
setTimeout(_ => scrollToBottom(), 50);

function isScrolledToBottom() {
	const { scrollHeight, scrollTop, clientHeight } = messages_list;
	return scrollTop + clientHeight >= scrollHeight - 1;
}

function messages_scroll() {
	if (scrolldown.classList.contains('visible') && isScrolledToBottom()) scrolldown.classList.remove('visible');
}

function input_keyup(e) {
	if (e.key === 'Enter') {
		scrollToBottom();
		if (e.target.value.trim() === '') return;
		socketio.emit('chat', { content: e.target.value });
		e.target.value = '';
		limit.textContent = 0;
	}
}

function input_input() {
	if (input.value.length > max_len) input.value = input.value.slice(0, msg_limit);
	limit.textContent = input.value.length
}
