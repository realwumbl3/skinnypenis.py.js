import logging
from server import app, session, request, socketIO, broadcastEmit, SqliteDatabase, render_template
from random import choice
from randomnames import random_names

db = SqliteDatabase({"db_path": "./app.db", "overwrite": False})

LATEST_MSGS = 20
MAX_MSG_LEN = 300


class User(db.base):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, default=lambda: choice(random_names))
    sid = db.Column(db.String)
    messages = db.relationship("Message", backref="user")

    @property
    def serialize(self):
        return {"id": self.id, "name": self.name}


def getMyUser(sess):
    if not (user := sess.query(User).filter_by(sid=session.sid).first()):
        sess.add(user := User(sid=session.sid))
    return user


class Message(db.base):
    __tablename__ = "messages"
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.String)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"))

    @property
    def serialize(self):
        return {"id": self.id, "user": self.user.serialize, "content": self.content}

    def __init__(self, user, content):
        self.user = user
        self.content = content[0:MAX_MSG_LEN]


db.create_all()


@app.route("/")
def index():
    with db.w() as sess:
        user = getMyUser(sess)
        latest = sess.query(Message).order_by(Message.id.desc()).limit(LATEST_MSGS).all()
        return render_template(
            "index.html",
            data={
                "latest": [msg.serialize for msg in latest],
                "max_len": MAX_MSG_LEN,
                "msg_limit": LATEST_MSGS,
                "me": {"id": user.id, **user.serialize},
            },
        )


@socketIO.on("chat", namespace="/socket.io")
def handle_chat(data):
    with db.w() as sess:
        user = getMyUser(sess)
        new_msg = Message(user=user, content=data["content"])
        sess.add(new_msg)
        sess.commit()
        broadcastEmit(event="chat", data=new_msg.serialize)
