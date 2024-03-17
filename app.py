from server import app, socketIO, broadcastEmit, request, render_template
from random import choice

from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

Base = declarative_base()
engine = create_engine("sqlite:///app.db")
Session = sessionmaker(bind=engine)


class Message(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True)
    user = Column(String)
    content = Column(String)

    @property
    def serialize(self):
        return {"id": self.id, "user": self.user, "content": self.content}


Base.metadata.create_all(engine)


@app.route("/")
def index():
    session = Session()
    latest_20 = session.query(Message).limit(20).all()
    session.close()
    return render_template("index.html", data={"latest_20": [message.serialize for message in latest_20]})


from randomnames import random_names

users = {}


@socketIO.on("chat", namespace="/socket.io")
def handle_chat(data):
    session_id = request.sid
    if session_id not in users:
        users[session_id] = choice(random_names)
    user = users[session_id]
    session = Session()
    message = Message(user=user, content=data["content"])
    session.add(message)
    session.commit()
    broadcastEmit(event="chat", data={**data, "user": user})
