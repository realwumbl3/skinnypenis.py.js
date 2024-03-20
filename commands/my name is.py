from app import broadcastEmit, CONFIG, logging


def command(content=None, trailing=None, user=None, sess=None):
    old = user.name
    user.name = trailing[: CONFIG["MAX_NAME_LEN"]]
    broadcastEmit(event="rename", data=dict(user.serialize, old=old))
