import zyX, { html, css, zyXArray, zyxAudio } from 'zyX';

import { audio } from "../app.js"

export default function secret({
    data, message, me,
}) {
    audio.play({ name: "gay-echo.mp3" });
    zyX(this)
        .delayChain("fart")
        .then((_) => {
            document.body.style.transition = 'filter 2s';
            document.body.style.filter = 'hue-rotate(360deg)';
        })
        .then((_) => {
            document.body.style.filter = 'hue-rotate(0deg)';
            document.body.style.transition = '';
        }, 2000)
}