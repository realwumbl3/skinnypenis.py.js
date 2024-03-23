import zyX, { html, css, zyXArray, zyxAudio } from 'zyX';

import { audio } from "../app.js"

export default function secret({
    data, message, me,
}) {
    audio.play({ name: "perfect-fart.mp3" });
    data.style = "color: SaddleBrown";
}


