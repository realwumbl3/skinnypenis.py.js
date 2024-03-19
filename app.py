from server import app, request, socketIO, broadcastEmit, SqliteDatabase, render_template
from random import choice
from randomnames import random_names

db = SqliteDatabase({"db_path": "./app.db", "overwrite": False})

LATEST_MSGS = 15
MAX_MSG_LEN = 300

USERS = {}


class Message(db.base):
    __tablename__ = "messages"
    id = db.Column(db.Integer, primary_key=True)
    user = db.Column(db.String)
    content = db.Column(db.String)

    @property
    def serialize(self):
        return {"id": self.id, "user": self.user, "content": self.content}

    def __init__(self, user, content):
        self.user = user
        self.content = content[0:MAX_MSG_LEN]


db.create_all()


@app.route("/")
def index():
    with db.w() as session:
        latest = session.query(Message).order_by(Message.id.desc()).limit(LATEST_MSGS).all()
        serialized = [msg.serialize for msg in latest]
        return render_template("index.html", data={"latest": serialized, "max_len": MAX_MSG_LEN})


@socketIO.on("chat", namespace="/socket.io")
def handle_chat(data):
    if request.sid not in USERS:
        USERS[request.sid] = choice(random_names)
    user = USERS[request.sid]
    with db.w(commit=True) as session:
        new_msg = Message(user=user, content=data["content"])
        session.add(new_msg)
        broadcastEmit(event="chat", data=new_msg.serialize)
