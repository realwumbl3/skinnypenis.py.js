import { io } from 'socket.io-client';
import zyX, { html, css } from 'zyX';

const socketio = io('/socket.io');

socketio.on('connect', () => {
    console.log('%c[socketio] Connected to server', 'color: lime');
    socketio.emit('enter', { room: "root" });
});

socketio.on('status', (data) => console.log("[socketio] status: ", data));


const chatHistory = html`
    <div this="chatHistory" id="chatHistory"></div>
`.pass(({ chatHistory } = {}) => {
    socketio.on('chat', (data) => {
        chatHistory.innerHTML += `<p>${data.message}</p>`;
    });
});

const chatInput = html`
    <input type="text" this="input" id="chatInput" placeholder="Enter your message">
`.pass(({ input } = {}) => {
    input.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            socketio.emit('chat', { message: e.target.value });
            e.target.value = '';
        }
    });
})

html`
    <h1>Hello World</h1>
    ${chatHistory}
    ${chatInput}
`.appendTo(document.body);

css`
    body {
        background-color: #f0f0f0;
        font-family: Arial, sans-serif;
    }
`;