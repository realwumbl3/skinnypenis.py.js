#!/bin/bash 

source venv/bin/activate

python3.9 -m gunicorn -k eventlet -w 1 app:app --bind unix:"/tmp/chat.pipp.social.sock" --error-logfile ./log.log --log-level info --capture-output --reload --timeout 3
