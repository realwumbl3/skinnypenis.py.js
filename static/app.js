import { io } from 'socket.io-client';
import { html, css, zyXArray } from 'zyX';

const socketio = io('/socket.io');

socketio.on('connect', () => {
	messages.push({ type: "sys", user: { name: "system" }, content: "Connected to the server." });
	socketio.emit('enter', { room: "root" });
});

socketio.on('status', (data) => console.log("[socketio] status: ", data));

const { me, max_len, msg_limit } = data;
const messages = new zyXArray(...data.latest.reverse());

socketio.on('chat', (message) => {
	messages.push(message)
	if (message.user.id === me.id) scrollToBottom();
	else !isScrolledToBottom() && scrolldown.classList.add('visible');
});

await css`url(/static/css.css)`;

const { messages_list, input, limit, scrolldown } = html`
    <main>
		<span class=title>120 lines of code.</span>
		<div class="messagesArea">
				<div this=messages_list class="messages" 
					zyx-scroll="${messages_scroll}"
					zyx-array="${{ array: messages, range: -msg_limit, compose: newMessage }}"></div>
				<div this=scrolldown class="scrolldown" zyx-click="${scrollToBottom}">new messages</div>
			</div>
		<div class="input-area">
				<input type="text" this="input" id="input" placeholder="Enter your message" 
					zyx-keyup="${input_keyup}" zyx-input="${input_input}"></input>
				<div class=limit><a this=limit>0</a> / ${max_len}</div>
			</div>
	</main>
`.appendTo(document.body)

function newMessage(message) {
	return html`	
	<div class="message ${message?.type || "user"}">
        <div class=username>${message.user.name}</div> - <div class=content>${message.content}</div>
    </div>
`;
}

function scrollToBottom() { messages_list.scrollTo({ top: messages_list.scrollHeight, behavior: 'smooth' }); }

function isScrolledToBottom() {
	const { scrollHeight, scrollTop, clientHeight } = messages_list;
	return scrollTop + clientHeight >= scrollHeight - 1;
}

function messages_scroll() {
	if (scrolldown.classList.contains('visible') && isScrolledToBottom()) scrolldown.classList.remove('visible');
}

function input_keyup(e) {
	if (e.key === 'Enter') {
		if (e.target.value.trim() === '') return;
		socketio.emit('chat', { content: e.target.value });
		(e.target.value = '') || (limit.textContent = 0);
	}
}

function input_input() {
	if (input.value.length > max_len) input.value = input.value.slice(0, max_len);
	limit.textContent = input.value.length
}

input.focus();
setTimeout(_ => scrollToBottom(), 50);
