from app import broadcastEmit, CONFIG


def command(trailing=None, user=None, sess=None, **kwargs):
    old = user.name
    user.name = trailing[: CONFIG["MAX_NAME_LEN"]]
    broadcastEmit(event="rename", data=dict(user.serialize, old=old))
    sess.commit()
