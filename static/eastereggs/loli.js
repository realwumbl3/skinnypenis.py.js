import zyX, { html, css, zyXArray, zyxAudio } from 'zyX';

import { audio } from "../app.js"

export default async function secret({
    data, message, me, main
}) {

    const { style } = html`
        <style this=style>
            body {
                perspective: 40em;
            }
            main{
                animation: kick-forward 1400ms 2200ms linear forwards;
            }
            .fbi-open{
                position: absolute;
                width: 100%;
                height: 100%;
                inset: 0;
                object-fit: cover;
            }
            @keyframes kick-forward {
                0%{
                    transform: translate3d(0,0,0);
                }
                30%{
                    transform: translate3d(0,20%,10em) rotateX(20deg) rotateY(90deg) rotateZ(90deg);
                }
                100%{
                    transform: translate3d(0,200%,40em) rotateX(90deg) rotateY(200deg) rotateZ(300deg);
                }
            }

        </style>
    `.const()

    const { video } = html`<video this=video autoplay src="/static/videos/fbi-open-up.mp4" class="fbi-open"></video>`.const()
    main.before(video);
    await new Promise(r => video.addEventListener('canplay', r));
    console.log("video started")
    video.volume = 0.3;
    main.before(style);
    await new Promise(r => video.addEventListener('ended', r));
    video.remove();
    style.remove();
    console.log("video ended")
}


