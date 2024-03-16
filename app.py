from server import app, socketIO, broadcastEmit, render_template


@app.route("/")
def index():
    return render_template("index.html", data={"title": "ThingsAI"})


@socketIO.on("chat", namespace="/socket.io")
def handle_chat(data):
    print("chat:", data)
    broadcastEmit(event="chat", data=data)
