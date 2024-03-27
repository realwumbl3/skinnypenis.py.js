import { html } from 'zyX';

export function createEmoji(src) {
    const { emoji } = html`<img this=emoji src="${src}" class="custom-emoji"/>`.const()
    emoji.addEventListener('dragstart', e => {
        e.preventDefault();
        console.log("implement emoji drag")
    })
    return emoji;
}
