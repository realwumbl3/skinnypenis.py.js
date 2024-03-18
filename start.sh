#!/bin/bash 

source venv/bin/activate

python3.9 -m gunicorn -k eventlet -w 1 app:app --bind unix:"/tmp/thingsai.B.sock" --error-logfile ./log.log --log-level debug --capture-output --reload --timeout 3
