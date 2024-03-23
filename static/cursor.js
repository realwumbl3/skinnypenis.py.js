import zyX, { html, css, zyXArray, zyxAudio } from 'zyX';

export default function cursor(container, input) {
    return html`
				<span this="blinker" class="cursor-blinker"></span>
			`
        .pass(({ blinker } = {}) => {
            const refresh = (e) => {
                blinker.style.left = `calc(${input.selectionStart}ch - ${input.scrollLeft}px)`;
            };
            zyX(input).events("input focus pointerup keydown keyup", refresh);
            document.addEventListener("resize", refresh);
        }).appendTo(container);
}
css`
.cursor-blinker{
    height: 1ch;
    width: 0.1em;
    background-color: white;
    position: absolute;
}
`
