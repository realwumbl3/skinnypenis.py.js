#!/bin/bash 

source venv/bin/activate

gunicorn -k eventlet -w 1 app:app --bind unix:"/tmp/thingsai.B.sock" --error-logfile ./log.log --log-level debug --capture-output --reload 
