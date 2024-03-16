import { io } from 'socket.io-client';
import zyX, { html, css, zyXArray, zyXDomArray } from 'zyX';

const socketio = io('/socket.io');

socketio.on('connect', () => {
    console.log('%c[socketio] Connected to server', 'color: lime');
    socketio.emit('enter', { room: "root" });
});

socketio.on('status', (data) => console.log("[socketio] status: ", data));

const messages = new zyXArray();

const messagesDom = new zyXDomArray(messages, (message) => {
    return html`
        <div>${message}</div>
    `;
});

socketio.on('chat', (data) => {
    messages.unshift(data.message);
    if (messages.length > 10) messages.pop();
});


const input = html`
    <input type="text" this="input" id="input" placeholder="Enter your message">
`.pass(({ input } = {}) => {
    input.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            socketio.emit('chat', { message: e.target.value });
            e.target.value = '';
        }
    });
})

html`
    <h1>Chat Lite.</h1>
    ${messagesDom}
    ${input}
`.appendTo(document.body);

css`
    body {
        background-color: #f0f0f0;
        font-family: Arial, sans-serif;
    }
`;