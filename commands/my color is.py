from app import broadcastEmit, logging


def command(trailing=None, user=None, sess=None, **kwargs):
    user.color = trailing[:7]
    broadcastEmit(event="recolor", data=user.serialize)
    sess.commit()   
    logging.info(f"{user.name} changed their color to {user.color}")
