import { html, css, zyXArray, zyxAudio } from 'zyX';

import { flattenToTextNode, imgToDataUrl, insertAtRange } from './dom.js';

import { audio, zyXInput, socketio } from './app.js';

export const { me, MAX_LEN, MSG_COUNT } = data;

const emoji_charcount = 3;

export default class RoomTab {
    constructor({ room } = {}) {
        this.input = new Input({
            onSend: this.onSend.bind(this)
        });
        this.messages = new zyXArray(...data.latest.reverse());

        html`
            <div this=tab class=Tab>
                <div class="messages">
                    <div this=list class=list zyx-scroll="${this.onScroll.bind(this)}"
                        zyx-array="${{ array: this.messages, range: -MSG_COUNT, compose: newMessage }}"></div>
                    <div this=scrolldown class=scrolldown zyx-click="${this.scrollToBottom.bind(this)}">new messages</div>
                </div>
                <div class=footer>
                    <div this=media_area class=media-area></div>
                    <div class=InputArea>
                        ${this.input}
                    </div>
                </div>
            </div>
        `.bind(this)

        this.tab.addEventListener("dragover", (e) => e.preventDefault() || e.stopPropagation());
        this.tab.addEventListener("drop", (e) => e.preventDefault() || e.stopPropagation() ||
            this.input.handleOpenFile(e.dataTransfer.files)
        );
        zyXInput.setupMomentumScroll(this.list)

        socketio.on('disconnect', () => this.systemMessage("Disconnected from the server."))

        socketio.on('chat', async (message) => {
            if (message.egg) await this.executeEgg(message);
            this.messages.push(message) || audio.play({ name: "zipp.mp3" });
            if (this.nearBottom()) this.scrollToBottom()
            else if (message.user.id !== me.id) this.scrolldown.classList.add('visible');
        });
        socketio.on('rename', (data) => {
            this.systemMessage(`${data.old} is now ${data.name}.`)
            this.messages.forEach(_ => _.user.id === data.id && (_.user.name = data.name))
        })
        socketio.on('recolor', (data) => {
            this.messages.forEach(_ => _.user.id === data.id && (_.user.color = data.color))
        })
        socketio.on('clearchat', () => this.messages.clear() || this.systemMessage("Chat cleared."));

        this.systemMessage(`Connected to room ${room}.`)
        socketio.emit('enter', { room })
        setTimeout(() => this.scrollToBottom(), 100)
    }

    onSend({ input }) {
        // console.log("[Firefox blows pls fix] send({readInput()", frags)
        if (input === '') return;
        this.messages.unshift(input);
        socketio.emit('chat', { frags: input })
        this.scrollToBottom()
    }

    systemMessage(content) {
        this.messages.push({ type: "sys", user: { name: "system" }, frags: [{ type: "text", content }] })
    }

    onScroll() { this.nearBottom() && this.scrolldown.classList.remove('visible') };
    bottomDist() { return this.list.scrollHeight - this.list.scrollTop - this.list.clientHeight }
    nearBottom() { return this.bottomDist() < 100 }
    scrollToBottom() { this.list.scrollTo({ top: this.list.scrollHeight, behavior: 'smooth' }); }

    async executeEgg(data) {
        const message = this.list.__zyXArray__.get(data);
        await import(`/static/eastereggs/${data.egg}.js?v=${Math.round(Math.random() * 99999)}`)
            .then(_ => _.default({ tab: this.tab, data, message, list: this.list, me, socketio }))
    }

}

function createEmoji(src) {
    const { emoji } = html`<img this=emoji src="${src}" class="custom-emoji"/>`.const()
    emoji.addEventListener('dragstart', e => {
        e.preventDefault();
        console.log("implement emoji drag")
    })
    return emoji;
}

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
        if (frag.type === "img") fragments.push(createEmoji(frag.src))
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

class Input {
    constructor({
        onSend

    } = {}) {

        this.onSend = onSend;

        html`
            <div this=attach class="attach uwu"><span>+</span></div>
            <input this=fakeinput  type=file style="display:none" />
            <div this=input_container class="Input uwu">
                <div this=input id=input class=contentinput contenteditable="true" 
                    zyx-keyup="${this.inputOnKeyup.bind(this)}" 
                    zyx-input="${this.validateInput.bind(this)}" 
                    zyx-pointerdown="${this.updateLastRange.bind(this)}"> 
                </div>
            </div>
            <div class="limit uwu"><span this=limit>0</span><span>/</span><span>${MAX_LEN}</span></div>
        `.bind(this)

        this.sent = { messages: [], index: 0 };
        this.last_range = new Range();

        document.addEventListener('keydown', _ => !_.ctrlKey && this.input.focus());
        this.input.addEventListener('focus', () => this.updateLastRange());
        this.input.addEventListener('blur', () => this.updateLastRange());
        this.input.addEventListener('paste', async function (e) {
            const pastedData = e.clipboardData.items;
            if (pastedData) for (const item of pastedData) {
                if (item.type.startsWith('image/')) {	// Insert the resized image into the div at the cursor position
                    e.preventDefault();
                    e.stopPropagation();
                    const dataUrl = await imgToDataUrl(item.getAsFile());
                    this.insertImageAtRange(dataUrl);
                }
            }
            this.validateInput()
        });
        this.attach.addEventListener("click", _ => this.fakeinput.dispatchEvent(new MouseEvent("click")))
        this.fakeinput.addEventListener("change", (e) => this.input.handleOpenFile(e.target.files))

    }

    contentCharacterCount() {
        return [...this.input.childNodes].reduce((acc, _) => acc + (_.nodeName === "#text" ? _.textContent.length : emoji_charcount), 0)
    }

    handleOpenFile(files) {
        for (const file of files) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const blob = new Blob([e.target.result], { type: "application/octet-stream" });
                // mediaPreview(URL.createObjectURL(blob), file)
                this.insertImageAtRange(await imgToDataUrl(blob))
            }
            reader.readAsArrayBuffer(file);
        }
    }

    insertImageAtRange(src) {
        insertAtRange(createEmoji(src), this.last_range);
    }

    updateLastRange() {
        const selection = window.getSelection();
        const selected_element = selection.focusNode;
        if (!(document.activeElement === this.input && selected_element === this.input)) return;
        this.last_range.setStart(selected_element, selection.focusOffset);
    }

    readInput() {
        const nodes = [...this.input.childNodes];
        const output = nodes.map(_ => {
            if (_.nodeName === "#text") return { type: "text", content: _.textContent }
            if (_.nodeName === "IMG") return { type: "img", src: _.src }
        }).filter(_ => _)
        return output;
    }

    updateLastRange() {
        const selection = window.getSelection();
        const selected_element = selection.focusNode;
        if (!(document.activeElement === this.input && selected_element === this.input)) return;
        this.last_range.setStart(selected_element, selection.focusOffset);
    }

    inputOnKeyup(e) {
        e.preventDefault();
        if (e.key === 'Enter') {
            this.onSend({ input: this.readInput() })
            this.input.innerHTML = ''
            this.sent.index = 0
            this.limit.textContent = 0
        }
        if (e.key === 'ArrowUp' && e.ctrlKey) {
            this.input.innerHTML = this.sent.messages[this.sent.index] || "";
            this.sent.index = Math.min(this.sent.index + 1, this.messages.length - 1);
        }
        this.updateLastRange();
    }

    validateInput() {
        this.enforceLimit();
        for (const node of this.input.childNodes) {
            if (node.nodeName === "IMG") node.classList.add("custom-emoji");
        }
        this.limit.textContent = this.contentCharacterCount()
    }

    enforceLimit() {
        const childNodes = [...this.input.childNodes];
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

}