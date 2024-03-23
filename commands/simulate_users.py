from app import broadcastEmit, Message, logging
import os
from shutil import copyfile


# simluate users sending messages, strictly for UI testing

def command(trailing=None, user=None, sess=None, **kwargs):
    
    if trailing == "start":
        
    if state["active"]:
        return


def fileSuffix(path):
    i = 0
    while os.path.exists(f"{path}_{i}"):
        i += 1
    return f"{path}-{i}"
