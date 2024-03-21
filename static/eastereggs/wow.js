import { html, css, zyXArray, zyxAudio } from 'zyX';
import { audio } from "../app.js"

export default function secret({
    data, message, me,
}) {
    audio.play({ name: "wow-mlg-sound-effect.mp3" });
    data.style = "color: limegreen";
}

