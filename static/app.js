import { io } from 'socket.io-client';
import { html, css, zyXArray, zyxAudio } from 'zyX';

import ZyXInput from 'zyX/_/zyx-Input.js';

import Particles from 'zyX/_/Visuals/particles.js';

export const audio = new zyxAudio("/static/sounds/");
export const socketio = io('/socket.io');
export const { me } = data;

socketio.on('status', (data) => console.log("[socketio] status: ", data));

socketio.on('connect', () => { });

await css`url(/static/css.css)`;

const particles = new Particles()

export const zyXInput = new ZyXInput({ app: particles })

import RoomTab from './room.js';

const opened_rooms = new zyXArray();

html`
	${particles}
    <main this=main>
		<span class=title title="${data.src["static/css.css"].lines} css lines">
			${data.src["app.py"].lines} python lines // ${data.src["static/app.js"].lines} js lines</span>
		<div this=room_tabs class=roomTabs>
			<div this=tabs class=Tabs zyx-array="${{ array: opened_rooms }}"></div>
		</div>
	</main>
`.appendTo(document.body)


particles.start()

const root_room = new RoomTab({ room: "root" });
const test_room = new RoomTab({ room: "test" });

opened_rooms.push(
	root_room,
	// test_room
);