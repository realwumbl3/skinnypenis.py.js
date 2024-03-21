/*{ 
    "trigger-words": ["test"] 
}*/

import zyX, { html, css, zyXArray, zyxAudio } from 'zyX';
import { audio } from "../app.js"

export default function secret({
    data, message, messages_list, me, socketio, main
}) {

    //nudge the window like windows live messenger

    audio.play({ name: "nudge.mp3" });
    const nudge = { x: 0, y: 0 };
    const interval = setInterval(() => {
        nudge.x = Math.random() * 10 - 5;
        nudge.y = Math.random() * 10 - 5;
        main.style.transform = `translate(${nudge.x}px, ${nudge.y}px)`;
    }, 50);

    setTimeout(() => {
        clearInterval(interval);
        main.style.transform = `translate(0px, 0px)`;
    }, 1000);

}


