import { io } from 'socket.io-client';
import { html, css, zyXArray, zyxAudio } from 'zyX';

export const audio = new zyxAudio("/static/sounds/");
const socketio = io('/socket.io');
const messages = new zyXArray(...data.latest.reverse());
const { me, MAX_LEN, MSG_COUNT } = data;
me.my_send_history = [];

socketio.on('connect', () => {
	messages.push({ type: "sys", user: { name: "system" }, content: "Connected to the server." });
	socketio.emit('enter', { room: "root" }) && messages_scrolltobottom() || input.focus();
});
socketio.on('disconnect', () => messages.push({ type: "sys", user: { name: "system" }, content: "Disconnected from the server." }));
socketio.on('status', (data) => console.log("[socketio] status: ", data));
socketio.on('chat', (message) => {
	messages.push(message) || audio.play({ name: "newmsg.mp3" });
	if (message.egg) executeEgg(message);
	if (message.user.id !== me.id) messages_nearbottom() ? messages_scrolltobottom() : scrolldown.classList.add('visible');
});
socketio.on('rename', (data) => {
	messages.push({ type: "sys", user: { name: "system" }, content: `${data.old} is now ${data.name}.` });
	messages.forEach(_ => _.user.id === data.id && (_.user.name = data.name))
})
socketio.on('recolor', (data) => {
	messages.push({ type: "sys", user: { name: "system" }, content: `${data.name} changed color to ${data.color}.` });
	messages.forEach(_ => _.user.id === data.id && (_.user.color = data.color))
})

await css`url(/static/css.css)`;

const { main, messages_list, input, limit, scrolldown } = html`
    <main this=main>
		<span class=title title="${data.src["static/css.css"].lines} css lines">
			${data.src["app.py"].lines} python lines // ${data.src["static/app.js"].lines} js lines</span>
		<div class=messagesArea>
			<div this=messages_list class=messages zyx-scroll="${messages_onscroll}"
				zyx-array="${{ array: messages, range: -MSG_COUNT, compose: newMessage }}"></div>
			<div this=scrolldown class=scrolldown zyx-click="${messages_scrolltobottom}">new messages</div>
		</div>
		<div class=input-area>
			<div class=input>
				<input type=text this=input id=input placeholder="Enter your message"
					zyx-keyup="${input_onkeyup}" zyx-input="${input_oninput}"></input></div>
				<div class=limit><span this=limit>0</span><span>/</span><span>${MAX_LEN}</span></div>
			
		</div>
	</main>
`.appendTo(document.body)

document.addEventListener('keydown', _ => !_.ctrlKey && input.focus());

function messages_onscroll() { (scrolldown.classList.contains('visible') && messages_nearbottom()) && scrolldown.classList.remove('visible') };
function disctanceFromBottom() { return messages_list.scrollHeight - messages_list.scrollTop - messages_list.clientHeight }
function messages_nearbottom() { return disctanceFromBottom() < 100 }
function messages_scrolltobottom() { messages_list.scrollTo({ top: messages_list.scrollHeight, behavior: 'smooth' }); }

function input_onkeyup(e) {
	if (e.key === 'Enter' && input.value.trim() !== '') {
		me.my_send_history.push(input.value);
		socketio.emit('chat', { content: input.value }) && (input.value = '') || (limit.textContent = 0);
		messages_scrolltobottom()
	}
	if (e.key === 'ArrowUp' && e.ctrlKey) {
		const history = me.my_send_history;
		if (history.length) {
			input.value = history[history.length - 1];
			input.setSelectionRange(input.value.length, input.value.length);
		}
	}
}
function input_oninput() { (input.value.length > MAX_LEN) && (input.value = input.value.slice(0, MAX_LEN)) || (limit.textContent = input.value.length); }

function newMessage(data, previous) {
	return html`<div this=msg class="message ${data?.type || "user"} ${previous && previous.item.user.id === data.user.id ? "sameuser" : "newmsg"}" style="${data?.style}">
        <div class=username style="${"color:" + data.user.color};" >${data.user.name}</div><div class=content>${data.content}</div>
    </div>`
}

function executeEgg(data) {
	setTimeout(_ => {
		const message = messages_list.__zyXArray__.get(data);
		import(`/static/eastereggs/${data.egg}.js`).then(_ => _.default({ data, message, me: me }))
	}, 50)
}
