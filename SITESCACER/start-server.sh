#!/bin/bash
cd /home/z/my-project
while true; do
  echo "[$(date)] Starting SecureScope server..."
  PORT=3000 npx next start -p 3000 >> /tmp/server_output.log 2>&1
  EXIT_CODE=$?
  echo "[$(date)] Server exited with code $EXIT_CODE, restarting in 2s..."
  sleep 2
done
