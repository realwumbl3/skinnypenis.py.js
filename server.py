"""skinnypenis.py.js"""

from datetime import timedelta
from user_agents import parse
import os

from flask import *
from flask_cors import CORS
from flask_caching import Cache
from flask_compress import Compress
from flask_socketio import SocketIO, join_room, leave_room, emit as socketEmit
from flask_session import Session
from zyXServe.Sqlite import SqliteDatabase
from zyXServe.Debug import createLogger
import atexit

logging = createLogger("./log.log")

app = Flask(__name__)
app.config["SECRET_KEY"] = "butts"
app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(days=31)
app.config["SESSION_TYPE"] = "filesystem"
app.config["SESSION_FILE_DIR"] = "./.flask_session/"
app.config["DEBUG"] = True
app.config["USE_RELOADER"] = True

caching = Cache()

Compress(app)

Session(app)

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


def cleanup():
    broadcastEmit(data={"status": "server is restarting"})


atexit.register(cleanup)


def broadcastEmit(event="status", data=None, room="root"):
    print("broadcastEmit room:", room, "event:", event, "data:", data)
    socketIO.emit(room=room, event=event, data=data, namespace="/socket.io")


# regex to match that all characters are one of `}; or empty
import re


def matchJsClosingLine(line):
    return re.match(r"^\s*([`};]|//|$)", line)


def filesLineCount(files, noEmpty=False):
    result = {}
    total_lines = 0
    for file in files:
        this_length = 0
        with open(file) as f:
            for line in f:
                if noEmpty and matchJsClosingLine(line.strip()):
                    continue
                total_lines += 1
                this_length += 1
            result[file] = {"lines": this_length}
    result["total"] = total_lines
    return result


import html


def remove_html_tags(input_str):
    return html.escape(input_str)
