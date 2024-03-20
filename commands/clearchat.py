from app import broadcastEmit, Message, DB_FILE, logging
import os
from shutil import copyfile


def command(trailing=None, user=None, sess=None, **kwargs):
    if user.id != 1:
        return
    # archive the current database
    active_db = f"./database/{DB_FILE}"
    archive_path = fileSuffix(f"./database/cleared/old")
    archive_path += ".db"
    copyfile(active_db, archive_path)
    # mark all messages as deleted
    sess.query(Message).update({Message.deleted: True})
    sess.commit()
    broadcastEmit("clearchat", {})


def fileSuffix(path):
    i = 0
    while os.path.exists(f"{path}_{i}"):
        i += 1
    return f"{path}-{i}"
