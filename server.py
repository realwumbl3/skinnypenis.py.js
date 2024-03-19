"""skinnypenis.py.js"""

from datetime import timedelta
from user_agents import parse

from flask import *
from flask_cors import CORS
from flask_caching import Cache
from flask_compress import Compress
from flask_socketio import SocketIO, join_room, leave_room
from zyXServe.Sqlite import SqliteDatabase
from zyXServe.Debug import createLogger
logging = createLogger("./log.log")

app = Flask(__name__)
app.config["SECRET_KEY"] = "butts"
app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(days=31)
app.config["SESSION_TYPE"] = "filesystem"
app.config["DEBUG"] = True
app.config["USE_RELOADER"] = True

caching = Cache()

Compress(app)

socketIO = SocketIO(
    app,
    cors_allowed_origins="*",
    manage_session=False,
    logger=False,
    message_queue="redis://127.0.0.1:6379",
)

CORS(app, resources={r"/*": {"origins": "thingsai.pipp.social", "supports_credentials": True}})


@socketIO.on("enter", namespace="/socket.io")
def handle_socketio_enter(data):
    print("socketIO.on enter")
    if not (room := data.get("room")):
        raise ValueError("room is required")
    join_room(room)
    ua = parse(request.headers.get("User-Agent"))
    broadcastEmit(data={"room": room, "ua": str(ua), "status": f"a user has joined the room."}, room=room)


@socketIO.on("leave", namespace="/socket.io")
def handle_socketio_leave(data):
    print("socketIO.on leave")
    if not (room := data.get("room")):
        raise ValueError("room is required")
    leave_room(room)


def broadcastEmit(event="status", data=None, room="root"):
    print("broadcastEmit room:", room, "event:", event, "data:", data)
    socketIO.emit(room=room, event=event, data=data, broadcast=True, namespace="/socket.io")
