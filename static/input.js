import { html } from 'zyX';

import { flattenToTextNode, imgToDataUrl, insertAtRange } from './general.js';

const emoji_charcount = 3;

export const { me, MAX_LEN, MSG_COUNT } = data;

import { createEmoji } from './shared.js';

export default class Input {
    constructor({ onSend } = {}) {

        this.onSend = onSend;

        html`
            <div this=attach class="attach uwu"><span>+</span></div>
            <input this=fakeinput  type=file style="display:none" />
            <div this=input_container class="Input">
                <div this=limit_bar class=limitBar></div>
                <div this=input id=input class="contentinput uwu" contenteditable="true" 
                    zyx-keyup="${this.inputOnKeyup.bind(this)}" 
                    zyx-input="${this.validateInput.bind(this)}" 
                    zyx-pointerdown="${this.updateLastRange.bind(this)}"></div>
            </div>
            <!-- <div class="limit uwu"><span this=limit>0</span><span>/</span><span>${MAX_LEN}</span></div> -->
        `.bind(this)

        this.sent = { messages: [], index: 0 };
        this.last_range = new Range();

        this.input.addEventListener('focus', () => this.updateLastRange());
        this.input.addEventListener('blur', () => this.updateLastRange());
        this.input.addEventListener('paste', async (e) => {
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
        this.fakeinput.addEventListener("change", (e) => this.handleOpenFile(e.target.files))

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
        // console.log("[Firefox blows pls fix] send({readInput()", frags)
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
        }
        if (e.key === 'ArrowUp' && e.ctrlKey) {
            this.input.innerHTML = this.sent.messages[this.sent.index] || "";
            this.sent.index = Math.min(this.sent.index + 1, this.messages.length - 1);
        }
        this.updateLastRange();
        this.validateInput()
    }

    validateInput() {
        this.enforceLimit();
        for (const node of this.input.childNodes) {
            if (node.nodeName === "IMG") node.classList.add("custom-emoji");
        }
        const charCount = this.contentCharacterCount()
        this.limit_bar.style.setProperty("--limit", charCount / MAX_LEN);
    }

    enforceLimit() {
        const childNodes = [...this.input.childNodes];
        let accumulated = 0;
        let went_over = false;
        for (const node of childNodes) {
            if (!["#text", "IMG"].includes(node.nodeName)) {
                node.replaceWith(flattenToTextNode(node));
            }
        }
        for (const node of childNodes) {
            if (node.nodeName === "#text") {
                accumulated += node.textContent.length;
                if (accumulated > MAX_LEN) {
                    went_over = true;
                    node.textContent = node.textContent.slice(0, MAX_LEN - accumulated);
                }
            } else {
                accumulated += emoji_charcount;
                if (accumulated > MAX_LEN) {
                    went_over = true;
                    node.remove();
                    continue;
                }
            }
        }

        // if went over set selection range to end of input
        if (went_over) {
            const range = document.createRange();
            range.selectNodeContents(this.input);
            range.collapse(false);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }

}