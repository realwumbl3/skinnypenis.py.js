import importlib
import os
import re
from glob import glob
import logging

PY_COMMANDS = [os.path.splitext(os.path.basename(x))[0] for x in glob("commands/*.py")]
PY_COMMANDS_HUMAN = re.compile(r"^\/({})(?:\s+(.+))?$".format("|".join(PY_COMMANDS)))


# match PY_COMMANDS and return leading content
def matchCommand(content):
    if match := PY_COMMANDS_HUMAN.match(content):
        return (match.group(1), match.group(2))
    return None


def executeCommand(command, *args, **kwargs):
    try:
        importlib.import_module(f"commands.{command}").command(*args, **kwargs)
    except Exception as e:
        logging.exception(e)


JS_EGGS = [os.path.splitext(os.path.basename(x))[0] for x in glob("static/eastereggs/*.js")]
JS_EGGS_RE = re.compile(rf"({')|('.join(JS_EGGS)})")


def matchEgg(content):
    if match := JS_EGGS_RE.search(content):
        return match.group()
    return None
