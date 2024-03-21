import importlib
import os
import re
from glob import glob
import logging

PY_COMMANDS = [os.path.splitext(os.path.basename(x))[0] for x in glob("commands/*.py")]
PY_COMMANDS_REGEX = r"^\/({})(?:\s+(.+))?$".format("|".join(map(re.escape, PY_COMMANDS)))
PY_COMMANDS_REGEX = re.compile(PY_COMMANDS_REGEX, re.IGNORECASE)


# match PY_COMMANDS and return leading content
def matchCommand(content):
    if match := PY_COMMANDS_REGEX.match(content):
        return (match.group(1).lower(), match.group(2))
    return None


def executeCommand(command, *args, **kwargs):
    try:
        importlib.import_module(f"commands.{command}").command(*args, **kwargs)
    except Exception as e:
        logging.exception(e)


JS_EGGS = [os.path.splitext(os.path.basename(x))[0] for x in glob("static/eastereggs/*.js")]
JS_EGGS_RE = re.compile(r"({})\b".format("|".join(JS_EGGS)), re.IGNORECASE)


def matchEgg(content):
    if match := JS_EGGS_RE.search(content.lower()):
        return match.group()
    return None
