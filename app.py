import json
from types import SimpleNamespace
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
    _frags = db.Column(db.String(100000), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"))
    deleted = db.Column(db.Boolean, default=False)

    @property
    def serialize(self):
        return {"id": self.id, "user": self.user.serialize, "frags": self._frags}

    @property
    def frags(self):
        return json.loads(self._frags)

    @property
    def flattened(self):
        return "".join([frag["content"] for frag in self.frags if frag["type"] == "text"])

    def __init__(self, user, frags):
        accumulated_chars = 0
        at_limit = False
        limit = CONFIG["MAX_LEN"]
        for frag in frags:
            if at_limit:
                frags.remove(frag)
            if frag["type"] == "text":
                content = remove_html_tags(frag["content"])
                accumulated_chars += len(content)
                if accumulated_chars > limit:
                    content = content[: limit - accumulated_chars]
                    at_limit = True
                frag["content"] = content
            else:
                # TODO: media content, validate size
                accumulated_chars += 3
                if accumulated_chars > limit:
                    at_limit = True

        self.user = user
        self._frags = json.dumps(frags)


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
        frags, user = data["frags"], getMyUser(sess)
        if not frags:
            return
        new_msg = Message(user=user, frags=frags)
        sess.add(new_msg)
        print("new_msg", new_msg.serialize)
        print("new_msg flattened", new_msg.flattened)
        sess.commit()
        if match := matchCommand(new_msg.flattened):
            executeCommand(match[0], trailing=match[1], frags=frags, user=user, new_msg=new_msg, sess=sess)
        broadcastEmit(
            event="chat",
            data={
                **new_msg.serialize,
                "egg": matchEgg(new_msg.flattened),
            },
        )


from modules.simulate_users import SimulateUsers

# SimulateUsers().start()
