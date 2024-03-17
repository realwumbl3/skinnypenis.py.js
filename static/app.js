import { io } from 'socket.io-client';
import zyX, { html, css, zyxcss, zyXArray, zyXDomArray } from 'zyX';

const socketio = io('/socket.io');

socketio.on('connect', () => {
    console.log('%c[socketio] Connected to server', 'color: lime');
    socketio.emit('enter', { room: "root" });
});

socketio.on('status', (data) => console.log("[socketio] status: ", data));

const messages = new zyXArray();

socketio.on('chat', (message) => messages.push(message));

const messagesDom = new zyXDomArray(messages, (message) => html`
    <div>${message.content}</div>
`, { limit: 10, classList: ['messages'] });

const input = html`
    <input type="text" this="input" id="input" placeholder="Enter your message">
`.pass(({ input } = {}) => {
    input.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            if (e.target.value.trim() === '') return;
            socketio.emit('chat', { content: e.target.value });
            e.target.value = '';
        }
    });
})

await zyxcss.l("static/css.css");
 
html`
    <h1>Chat Lite.</h1>
    ${messagesDom}
    ${input}
`.appendTo(document.body);

