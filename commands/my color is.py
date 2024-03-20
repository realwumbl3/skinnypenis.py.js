from app import broadcastEmit, CONFIG, logging


def command(content=None, trailing=None, user=None, sess=None):
    user.color = trailing[:7]
    broadcastEmit(event="recolor", data=user.serialize)
