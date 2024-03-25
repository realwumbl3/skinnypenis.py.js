import { io } from 'socket.io-client';
import { html, css, zyXArray, zyxAudio } from 'zyX';

import ZyXInput from 'zyX/_/zyx-Input.js';

import Particles from 'zyX/_/canvas/particles.js';

export const audio = new zyxAudio("/static/sounds/");
const socketio = io('/socket.io');
const messages = new zyXArray(...data.latest.reverse());
const { me, MAX_LEN, MSG_COUNT } = data;
const sent = { messages: [], index: 0 };
const emoji_charcount = 3;

function systemMessage(content) {
	messages.push({ type: "sys", user: { name: "system" }, frags: [{ type: "text", content }] })
}
socketio.on('connect', () => {
	systemMessage("Connected to the server.")
	socketio.emit('enter', { room: "root" }) && messages_scrollToBottom() || input.focus();
});
socketio.on('disconnect', () => systemMessage("Disconnected from the server."))
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
					<div this=input id=input class=contentinput contenteditable="true" 
						zyx-keyup="${inputOnKeyup}" zyx-input="${validateInput}"> 
					</div>
				</div>
				<div class="limit uwu"><span this=limit>0</span><span>/</span><span>${MAX_LEN}</span></div>
				<input type=file this=fakeinput style="display:none" />
			</div>
		</div>
	</main>
`.appendTo(document.body)

const { main, messages_list, input, limit, scrolldown, media_area, attach, fakeinput, input_container, virtual_input } = UI;

const zyXInputHandler = new ZyXInput({ app: UI, })

console.log({ zyXInputHandler })

zyXInputHandler.setupMomentumScroll(messages_list)

import { imgToDataUrl, insertAtRange } from "./misc.js";

input.addEventListener('paste', async function (e) {
	const pastedData = e.clipboardData.items;
	if (pastedData) for (const item of pastedData) {
		if (item.type.startsWith('image/')) {	// Insert the resized image into the div at the cursor position
			e.preventDefault();
			e.stopPropagation();
			const dataUrl = await imgToDataUrl(item.getAsFile());
			insertImageAtRange(dataUrl);
		}
	}
	validateInput()
});

function insertImageAtRange(src) {
	const { emoji } = html`<img this=emoji src="${src}" class="custom-emoji"/>`.const()
	insertAtRange(emoji);
}

function readInput() {
	const nodes = [...input.childNodes];
	const output = nodes.map(_ => {
		if (_.nodeName === "#text") return { type: "text", content: _.textContent }
		if (_.nodeName === "IMG") return { type: "img", src: _.src }
	}).filter(_ => _)
	return output;
}

function contentCharacterCount() {
	return [...input.childNodes].reduce((acc, _) => acc + (_.nodeName === "#text" ? _.textContent.length : emoji_charcount), 0)
}

function validateInput() {
	enforceLimit();
	for (const node of input.childNodes) {
		if (node.nodeName === "IMG") node.classList.add("custom-emoji");
	}
	limit.textContent = contentCharacterCount()
}

function enforceLimit() {
	const childNodes = [...input.childNodes];
	let accumulated = 0;
	for (const node of childNodes) {
		if (!["#text", "IMG"].includes(node.nodeName)) {
			node.replaceWith(flattenToTextNode(node));
		}
	}
	for (const node of childNodes) {
		if (node.nodeName === "#text") {
			accumulated += node.textContent.length;
			if (accumulated > MAX_LEN) {
				node.textContent = node.textContent.slice(0, MAX_LEN - accumulated);
			}
		} else {
			accumulated += emoji_charcount;
			if (accumulated > MAX_LEN) {
				node.remove();
				continue;
			}
		}
	}
}

function flattenToTextNode(node, acc = []) {
	if (node.nodeName === "#text") return acc.push(node.textContent);
	if (node.nodeName === "IMG") return node;
	for (const child of node.childNodes) flattenToTextNode(child, acc);
	return document.createTextNode(acc.join(""));
}

particles.start()

document.addEventListener('keydown', _ => !_.ctrlKey && input.focus());

function messages_onScroll() { messages_nearBottom() && scrolldown.classList.remove('visible') };
function messages_bottomDist() { return messages_list.scrollHeight - messages_list.scrollTop - messages_list.clientHeight }
function messages_nearBottom() { return messages_bottomDist() < 100 }
function messages_scrollToBottom() { messages_list.scrollTo({ top: messages_list.scrollHeight, behavior: 'smooth' }); }

function inputOnKeyup(e) {
	e.preventDefault();
	if (e.key === 'Enter') send();
	if (e.key === 'ArrowUp' && e.ctrlKey) {
		input.innerHTML = sent.messages[sent.index] || "";
		sent.index = Math.min(sent.index + 1, sent.messages.length - 1);
	}
}

function send() {
	const frags = readInput();
	console.log("send({readInput()", frags)
	if (frags === '') return;
	sent.messages.unshift(frags) && (sent.index = 0);
	socketio.emit('chat', { frags }) && (input.innerHTML = '') || (limit.textContent = 0);
	messages_scrollToBottom()
}

function handleOpenFile(files) {
	for (const file of files) {
		const reader = new FileReader();
		reader.onload = async (e) => {
			const blob = new Blob([e.target.result], { type: "application/octet-stream" });
			// mediaPreview(URL.createObjectURL(blob), file)
			insertImageAtRange(await imgToDataUrl(blob))
		}
		reader.readAsArrayBuffer(file);
	}
}

main.addEventListener("dragover", (e) => e.preventDefault() || e.stopPropagation());
main.addEventListener("drop", (e) => e.preventDefault() || e.stopPropagation() || handleOpenFile(e.dataTransfer.files));
attach.addEventListener("click", _ => fakeinput.dispatchEvent(new MouseEvent("click")))
fakeinput.addEventListener("change", (e) => handleOpenFile(e.target.files))

function newMessage(data, { prev, next }) {
	// console.log("newMessage", data)
	const [isSameUser, isLastOfUser] = [prev?.item && prev.item.user.id === data.user.id, !next || next.user.id !== data.user.id];
	const single = !isSameUser && isLastOfUser;
	const firstMessage = !prev.item || prev.item.user.id !== data.user.id;
	const position_class = single ? "single" : `${isSameUser ? "usersame" : "userfirst"} ${isLastOfUser ? "userlast" : ""}`
	const fragments = [];
	if (typeof data.frags === "string") data.frags = JSON.parse(data.frags);
	for (const frag of data.frags) {
		if (frag.type === "text") fragments.push(html`<span>${frag.content}</span>`)
		if (frag.type === "img") fragments.push(html`<img class=custom-emoji src="${frag.src}"/>`)
	}
	return html`<div this=msg class="message ${data?.type || "user"} ${position_class}" style="${data?.style};">
        ${firstMessage && html`<div class=username style="${"color:" + data.user.color};">${data.user.name}</div>`}
		<div class=content>${fragments}</div>
    </div>`
}

function mediaPreview(data, file) {
	return html`<div this=preview class=media-preview> <div class=media-preview-content><img this=img src="${data}"/></div><a this=x>x</a></div>`
		.appendTo(media_area)
		.pass(({ preview, img, x }) => {
			x.addEventListener("click", _ => preview.remove());
		})
}

