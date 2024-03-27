import zyX, { html, css, zyXArray, zyxAudio } from 'zyX';

import { audio } from "../app.js"

export default async function secret({
    data, message, me, main, tab
}) {
    const { style } = html`
        <style this=style>
            .messagesArea {
                perspective: 40em;
                backdrop-filter: blur(0);
            }
            .kicked-forward {
                animation: kick-forward 1400ms 2200ms linear forwards;
            }
            .reset-anim {
                animation: reset 130ms ease-out forwards;
            }
            #fbi-video {
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
            @keyframes reset {
                0%{
                    opacity: 0;
                    transform: translate3d(0,0,-3em);
                }
                100%{
                    opacity: 1;
                    transform: translate3d(0,0,0);
                }
            }
        </style>
    `.const();

    (async () => {
        tab.messages_container.classList.add('kicked-forward');
        const { video } = html`<video this=video autoplay src="/static/videos/fbi-open-up.mp4" id="fbi-video"></video>`.const()
        tab.messages_container.before(video);
        await new Promise(r => video.addEventListener('canplay', r));
        console.log("video started")
        video.volume = 0.3;
        tab.messages_container.before(style);
        await new Promise(r => video.addEventListener('ended', r));
        tab.messages_container.classList.remove('kicked-forward');
        tab.messages_container.classList.add('reset-anim');
        await new Promise(r => setTimeout(r, 200));
        video.remove();
        style.remove();
        console.log("video ended")
        tab.messages_container.classList.remove('reset-anim');
    })()
}


