from server import (
    logging,
    app,
    session,
    socketIO,
    broadcastEmit,
    socketEmit,
    SqliteDatabase,
    render_template,
    filesLineCount,
    remove_html_tags,
)

from randos import random_name, random_color
from eggsAndCommands import matchEgg, matchCommand, executeCommand

db = SqliteDatabase({"db_path": f"./database/chat.db", "overwrite": False})

CONFIG = {"MSG_COUNT": 70, "MAX_LEN": 256, "MAX_NAME_LEN": 40}



class User(db.base):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, default=random_name)
    sid = db.Column(db.String)
    messages = db.relationship("Message", backref="user")
    color = db.Column(db.String, default=random_color)

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
    deleted = db.Column(db.Boolean, default=False)

    @property
    def serialize(self):
        return {"id": self.id, "user": self.user.serialize, "content": self.content}

    def __init__(self, user, content):
        self.user = user
        self.content = content


def latestMessages(sess, count=CONFIG["MSG_COUNT"]):
    return [
        msg.serialize
        for msg in sess.query(Message).filter(Message.deleted == False).order_by(Message.id.desc()).limit(count).all()
    ]


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
            executeCommand(match[0], trailing=match[1], content=content, user=user, new_msg=new_msg, sess=sess)
        broadcastEmit(event="chat", data={**new_msg.serialize, "egg": matchEgg(content)})

