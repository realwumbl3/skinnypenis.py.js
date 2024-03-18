import { io } from 'socket.io-client';
import zyX, { html, css, zyXArray, zyXDomArray } from 'zyX';

await css`url(/static/css.css)`;

const socketio = io('/socket.io');

socketio.on('connect', () => {
	console.log('%c[socketio] Connected to server', 'color: lime');
	socketio.emit('enter', { room: "root" });
});

socketio.on('status', (data) => console.log("[socketio] status: ", data));

const messages = new zyXArray(...data.latest_20);

socketio.on('chat', (message) => messages.push(message));

const messagesDom = new zyXDomArray(messages, (message) => html`	
	<div class=message>
        <div class=username>${message.user} - </div>
        <div>${message.content}</div>
    </div>
`, { classList: ['messages'], range: -10 });

function handleKeyUp(e) {
	if (e.key === 'Enter') {
		if (e.target.value.trim() === '') return;
		socketio.emit('chat', { content: e.target.value });
		e.target.value = '';
	}
}

html`
    <h1>Chat Lite.</h1>
    ${messagesDom}
    <input type="text" this="input" id="input" placeholder="Enter your message" zyx-keyup="${handleKeyUp}">
`.appendTo(document.body);
