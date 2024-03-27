import { html, zyXArray } from 'zyX';

import { audio, zyXInput, socketio } from './app.js';

export const { me, MAX_LEN, MSG_COUNT } = data;

import { createEmoji } from './shared.js';

import Input from './input.js';

export default class RoomTab {
    constructor({ room } = {}) {
        this.input = new Input({
            onSend: this.onSend.bind(this)
        });
        this.messages = new zyXArray(...data.latest.reverse());

        html`
            <div this=tab class=Tab>
                <div this=messages_container class="messages">
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

        this.tab.addEventListener('keydown', _ => !_.ctrlKey && this.input.input.focus());

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
            .then(_ => _.default({ tab: this, data, message, list: this.list, me, socketio }))
    }

}

function newMessage(data, { prev, next }) {
    // console.log("newMessage", data)
    const isMe = data.user.id === me.id;
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
    return html`<div this=msg class="message ${data?.type || "user"} ${isMe && "me"} ${position_class}" style="${data?.style};">
        ${firstMessage && html`
            <div class=username style="${"color:" + data.user.color};">
                ${isMe && html`<div class=me-indicator></div>`}
                ${data.user.name}
            </div>`
        }
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
