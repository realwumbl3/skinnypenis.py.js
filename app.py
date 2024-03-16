from server import app, socketIO, broadcastEmit, render_template

from threading import Thread


@app.route("/")
def index():
    return render_template("index.html", data={"title": "ThingsAI"})


class BackgroundThread(Thread):
    def __init__(self):
        Thread.__init__(self, daemon=True)

    def run(self):
        while True:
            socketIO.sleep(5)
            broadcastEmit(event="status", data={"msg": "hello world?!"})


@socketIO.on("chat", namespace="/socket.io")
def handle_chat(data):
    print("chat:", data)
    broadcastEmit(event="chat", data=data)


BackgroundThread().start()

print("running app...")