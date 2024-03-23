import { io } from 'socket.io-client';
import { html, css, zyXArray, zyxAudio } from 'zyX';
import Particles from 'zyX/_/canvas/particles.js';

export const audio = new zyxAudio("/static/sounds/");
const socketio = io('/socket.io');
const messages = new zyXArray(...data.latest.reverse());
const { me, MAX_LEN, MSG_COUNT } = data;
const sent = { messages: [], index: 0 };

function systemMessage(content) { messages.push({ type: "sys", user: { name: "system" }, content: content }) }

socketio.on('connect', () => {
	systemMessage("Connected to the server.")
	socketio.emit('enter', { room: "root" }) && messages_scrollToBottom() || input.focus();
});
socketio.on('disconnect', () => messages.push({ type: "sys", user: { name: "system" }, content: "Disconnected from the server." }));
socketio.on('status', (data) => console.log("[socketio] status: ", data));
socketio.on('chat', async (message) => {
	if (message.egg) await executeEgg(message);
	messages.push(message) || audio.play({ name: "zipp.mp3" });
	if (messages_nearBottom()) messages_scrollToBottom()
	else if (message.user.id !== me.id) scrolldown.classList.add('visible');
});
socketio.on('rename', (data) => {
	systemMessage(`${data.old} is now ${data.name}.`)
	messages.forEach(_ => _.user.id === data.id && (_.user.name = data.name))
})
socketio.on('recolor', (data) => {
	messages.forEach(_ => _.user.id === data.id && (_.user.color = data.color))
})
socketio.on('clearchat', () => messages.clear() || systemMessage("Chat cleared."));

async function executeEgg(data) {
	const message = messages_list.__zyXArray__.get(data);
	await import(`/static/eastereggs/${data.egg}.js?v=${Math.round(Math.random() * 99999)}`).then(_ => _.default({ UI, data, message, messages_list, me, main, socketio }))
}

await css`url(/static/css.css)`;

const particles = new Particles()

import cursor from "./cursor.js";

const UI = html`
	${particles}
    <main this=main>
		<span class=title title="${data.src["static/css.css"].lines} css lines">
			${data.src["app.py"].lines} python lines // ${data.src["static/app.js"].lines} js lines</span>
		<div this=message_area class=messagesArea>
			<div this=messages_list class=messages zyx-scroll="${messages_onScroll}"
				zyx-array="${{ array: messages, range: -MSG_COUNT, compose: newMessage }}"></div>
			<div this=scrolldown class=scrolldown zyx-click="${messages_scrollToBottom}">new messages</div>
		</div>
		<div class=footer>
			<div this=media_area class=media-area></div>
			<div class=input-area>
				<div this=attach class="attach uwu"><span>+</span></div>
				<div this=input_container class="input uwu">
					<div this=virtual_input class="virtual-input">

					</div>
					<input type=text this=input id=input placeholder="Enter your message" maxlength="${MAX_LEN}" autocomplete="off" 
						zyx-keyup="${input_onkeyup}" zyx-input="${input_oninput}"/>
				</div>
				<div class="limit uwu"><span this=limit>0</span><span>/</span><span>${MAX_LEN}</span></div>
				<input type=file this=fakeinput style="display:none" />
			</div>
		</div>
	</main>
`.appendTo(document.body)

const { main, messages_list, input, limit, scrolldown, media_area, attach, fakeinput, input_container, virtual_input } = UI;

// cursor(input_container, input)

const buffer = new zyXArray();




particles.start()

document.addEventListener('keydown', _ => !_.ctrlKey && input.focus());

function messages_onScroll() { messages_nearBottom() && scrolldown.classList.remove('visible') };
function distanceFromBottom() { return messages_list.scrollHeight - messages_list.scrollTop - messages_list.clientHeight }
function messages_nearBottom() { return distanceFromBottom() < 100 }
function messages_scrollToBottom() { messages_list.scrollTo({ top: messages_list.scrollHeight, behavior: 'smooth' }); }

function input_onkeyup(e) {
	if (e.key === 'Enter') send(input.value.trim());
	if (e.key === 'ArrowUp' && e.ctrlKey) {
		input.value = sent.messages[sent.index] || "";
		sent.index = Math.min(sent.index + 1, sent.messages.length - 1);
	}
}

function send(content) {
	if (content === '') return;
	sent.messages.unshift(content) && (sent.index = 0);
	socketio.emit('chat', { content: content }) && (input.value = '') || (limit.textContent = 0);
	messages_scrollToBottom()
}

function input_oninput() { (limit.textContent = input.value.length); }

function handleOpenFile(files) {
	for (const file of files) {
		const reader = new FileReader();
		reader.onload = (e) => {
			const blob = new Blob([e.target.result], { type: "application/octet-stream" });
			mediaPreview(URL.createObjectURL(blob), file)
		}
		reader.readAsArrayBuffer(file);
	}
}

main.addEventListener("dragover", (e) => e.preventDefault() || e.stopPropagation());
main.addEventListener("drop", (e) => e.preventDefault() || e.stopPropagation() || handleOpenFile(e.dataTransfer.files));
attach.addEventListener("click", _ => fakeinput.dispatchEvent(new MouseEvent("click")))
fakeinput.addEventListener("change", (e) => handleOpenFile(e.target.files))

function newMessage(data, { prev, next }) {
	const [isSameUser, isLastOfUser] = [prev?.item && prev.item.user.id === data.user.id, !next || next.user.id !== data.user.id];
	const single = !isSameUser && isLastOfUser;
	const position_class = single ? "single" : `${isSameUser ? "usersame" : "userfirst"} ${isLastOfUser ? "userlast" : ""}`
	return html`<div this=msg class="message ${data?.type || "user"} ${position_class}" style="${data?.style};">
        <div class=username style="${"color:" + data.user.color};">${data.user.name}</div><div class=content>${data.content}</div>
    </div>`
}

function mediaPreview(data, file) {
	return html`<div this=preview class=media-preview> <div class=media-preview-content><img this=img src="${data}"/></div><a this=x>x</a></div>`
		.appendTo(media_area)
		.pass(({ preview, img, x }) => {
			x.addEventListener("click", _ => preview.remove());
		})
}
