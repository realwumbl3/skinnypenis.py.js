import { io } from 'socket.io-client';
import { html, css, zyXArray, zyXDomArray } from 'zyX';

const socketio = io('/socket.io');

socketio.on('connect', () => {
	messages.push({ class: "sys", user: "system", content: "Connected to the server." });
	socketio.emit('enter', { room: "root" });
});

socketio.on('status', (data) => console.log("[socketio] status: ", data));

const msg_limit = data.latest.length;
const max_len = data.max_len;
const messages = new zyXArray(...data.latest.reverse());

socketio.on('chat', (message) => {
	messages.push(message)
	!isScrolledToBottom() && scrolldown.classList.add('visible');
});

const messagesDom = new zyXDomArray(messages, (message) => html`	
	<div class="message ${message?.class || "user"}">
        <div class=username>${message.user}</div> - 
        <div class=content>${message.content}</div>
    </div>
`, { classList: ['messages'], range: -msg_limit });

const scrollToBottom = () => messagesDom.scrollTo({ top: messagesDom.scrollHeight, behavior: 'smooth' });

const isScrolledToBottom = () => {
	const { scrollHeight, scrollTop, clientHeight } = messagesDom;
	return scrollTop + clientHeight >= scrollHeight - 1;
}

await css`url(/static/css.css)`;

const { input, limit, scrolldown } = html`
    <main>
		<h1>Chat Lite.</h1>
		<div class="messagesArea">
				${messagesDom}
				<div this=scrolldown class="scrolldown" zyx-click="${scrollToBottom}">new messages</div>
			</div>
		<div class="input-area">
				<input type="text" this="input" id="input" placeholder="Enter your message" 
					zyx-keyup="${handleKeyUp}">
				<div class=limit><a this=limit>0</a> / ${max_len}</div>
			</div>
	</main>
`.appendTo(document.body)

function scrolldownState() {
	if (scrolldown.classList.contains('visible') && isScrolledToBottom()) scrolldown.classList.remove('visible');
}

messagesDom.addEventListener('scroll', scrolldownState);

scrollToBottom();

function handleKeyUp(e) {
	if (e.key === 'Enter') {
		scrollToBottom();
		if (e.target.value.trim() === '') return;
		socketio.emit('chat', { content: e.target.value });
		e.target.value = '';
	}
}

input.addEventListener('input', () => {
	if (input.value.length > max_len) input.value = input.value.slice(0, msg_limit);
	limit.textContent = input.value.length
});

