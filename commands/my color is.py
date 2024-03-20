from app import broadcastEmit


def command(trailing=None, user=None, sess=None, **kwargs):
    user.color = trailing[:7]
    broadcastEmit(event="recolor", data=user.serialize)
    sess.commit()
