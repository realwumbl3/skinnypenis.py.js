import zyX, { html, css, zyXArray, zyxAudio } from 'zyX';

import { audio } from "../app.js"

export default function secret({
    data, message, me,
}) {
    audio.play({ name: "fart-with-reverb.mp3" });
    zyX(this)
        .delayChain("fart")
        .then((_) => {
            document.body.style.transition = 'transform 1s';
            document.body.style.transform = 'rotate(360deg)';
        })
        .then((_) => {
            document.body.style.transform = 'rotate(0deg)';
            document.body.style.transition = '';
        }, 1000)
}