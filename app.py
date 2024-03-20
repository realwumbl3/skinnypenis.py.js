from glob import glob
import re, os
from server import (
    app,
    session,
    socketIO,
    broadcastEmit,
    SqliteDatabase,
    render_template,
    filesLineCount,
    remove_html_tags,
)
from random import choice
from randomnames import random_names

db = SqliteDatabase({"db_path": "./app.db", "overwrite": False})

CONFIG = {"MSG_COUNT": 100, "MAX_LEN": 256, "MAX_NAME_LEN": 20}

JS_EASTEREGGS = [os.path.splitext(os.path.basename(x))[0] for x in glob("static/eastereggs/*.js")]
EASTEREGG_REGEX = re.compile(rf"({')|('.join(JS_EASTEREGGS)})")


class User(db.base):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, default=lambda: choice(random_names))
    sid = db.Column(db.String)
    messages = db.relationship("Message", backref="user")
    color = db.Column(db.String, default=lambda: f"#{hex(choice(range(256**3)))[2:]}")

    @property
    def serialize(self):
        return {"id": self.id, "name": self.name, "color": self.color}


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
        self.content = content


def latestMessages(sess, count=CONFIG["MSG_COUNT"]):
    return [msg.serialize for msg in sess.query(Message).order_by(Message.id.desc()).limit(count).all()]


db.create_all()


@app.route("/")
def index():
    with db.w() as sess:
        user, srcstats = getMyUser(sess), filesLineCount(["static/app.js", "static/css.css", "app.py"], noEmpty=True)
        return render_template(
            "index.html",
            data={
                "latest": latestMessages(sess),
                "me": {"id": user.id, **user.serialize},
                "src": srcstats,
                "JS_EASTEREGGS": JS_EASTEREGGS,
                **CONFIG,
            },
        )


@socketIO.on("chat", namespace="/socket.io")
def handle_chat(data):
    with db.w() as sess:
        content, user = remove_html_tags(data["content"][: CONFIG["MAX_LEN"]]), getMyUser(sess)
        if not content:
            return
        if content.lower().startswith("my name is "):
            old = user.name
            user.name = content[11 : CONFIG["MAX_NAME_LEN"] + 11]
            broadcastEmit(event="rename", data=dict(user.serialize, old=old))
        if content.lower().startswith("my color is "):
            user.color = content[12:20]
            broadcastEmit(event="recolor", data=user.serialize)
        new_msg = Message(user=user, content=content)
        sess.add(new_msg)
        sess.commit()
        if match := EASTEREGG_REGEX.search(content):
            egg = dict(egg=match.group(), msg=new_msg.serialize)
        else:
            egg = None
        broadcastEmit(event="chat", data={**new_msg.serialize, "egg": egg})
