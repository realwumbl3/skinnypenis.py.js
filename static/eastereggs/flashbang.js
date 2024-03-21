import zyX, { html, getImageBlob } from 'zyX';
import { audio } from "../app.js"

export default async function secret({
    data, message, messages_list, me, socketio, main
}) {
    const flashbang_png = URL.createObjectURL(await getImageBlob("/static/pngs/flashbang.png"));
    await audio.addSound("flash-bounce.mp3");
    await audio.addSound("think-fast-chucklenuts.mp3");

    const { egg, flashbang, flash } = html`
        <div this=egg class="egg">
            <div this="flashbang" class=flashbang></div>
            <div this=flash class=flash></div>
            <style>
                .egg {
                    --flash_on_ground: calc(100vh - 150px);
                    position: absolute;
                    inset: 0;
                    pointer-events: none;
                    display: grid;
                }
                .flashbang {
                    position: absolute;
                    justify-self: center;
                    width: 100px;
                    height: 100px;
                    background-image: url("${flashbang_png}");
                    background-size: 100% 100%;
                    animation: flashbang-drop 1000ms ease-in forwards;
                }
                .flash {
                    position: absolute;
                    inset: 0;
                    background-color: white;
                    opacity: 0;
                    mix-blend-mode: hard-light;
                }
                @keyframes flashbang-drop {
                    0% { top: -100px; }
                    100% {
                        top: var(--flash_on_ground);
                        transform: rotate(720deg);
                    }
                }
                @keyframes flashbang-bounce {
                    0% { top: var(--flash_on_ground); }
                    100% { 
                        top: calc(var(--flash_on_ground) - 150px); 
                        transform: rotate(-720deg);
                    }
                }
                @keyframes flash {
                    0% { opacity: 0; }
                    1% { opacity: 1; }
                    100% { opacity: 0; }
                }
            </style>
        </div>
    `.appendTo(main);

    audio.play({ name: "think-fast-chucklenuts.mp3" });

    flashbang.addEventListener('animationend', (e) => {
        if (e.animationName !== "flashbang-drop") return;
        flashbang.style.animation = "flashbang-bounce 0.3s ease-in-out 2 alternate forwards";
        flash.style.animation = "flash 8s 300ms ease-in-out forwards";
        audio.play({ name: "flash-bounce.mp3" });
        zyX(data).delayChain("flash")
            .then(() => flashbang.remove(), 500)
            .then(() => egg.remove(), 10000)
    });

}
