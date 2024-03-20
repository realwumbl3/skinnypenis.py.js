from glob import glob
import logging
import re, os
import importlib
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

PY_COMMANDS = [os.path.splitext(os.path.basename(x))[0] for x in glob("commands/*.py")]
PY_COMMANDS_HUMAN = re.compile(rf"^\/({'|'.join(PY_COMMANDS)}) (.*)")


# match PY_COMMANDS and return leading content
def matchCommand(content):
    if match := PY_COMMANDS_HUMAN.match(content):
        return (match.group(1), match.group(2))
    return None


def executeCommand(command, *args, **kwargs):
    try:
        importlib.import_module(f"commands.{command}").command(*args, **kwargs)
    except Exception as e:
        logging.exception(e)


JS_EGGS = [os.path.splitext(os.path.basename(x))[0] for x in glob("static/eastereggs/*.js")]
JS_EGGS_RE = re.compile(rf"({')|('.join(JS_EGGS)})")


def matchEgg(content):
    if match := JS_EGGS_RE.search(content):
        return match.group()
    return None


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
            data={"latest": latestMessages(sess), "me": {"id": user.id, **user.serialize}, "src": srcstats, **CONFIG},
        )


@socketIO.on("chat", namespace="/socket.io")
def handle_chat(data):
    with db.w() as sess:
        content, user = remove_html_tags(data["content"][: CONFIG["MAX_LEN"]]), getMyUser(sess)
        if not content:
            return
        new_msg = Message(user=user, content=content)
        sess.add(new_msg)
        sess.commit()
        if match := matchCommand(content):
            executeCommand(match[0], trailing=match[1], content=content, user=user, sess=sess)
        broadcastEmit(event="chat", data={**new_msg.serialize, "egg": matchEgg(content)})
