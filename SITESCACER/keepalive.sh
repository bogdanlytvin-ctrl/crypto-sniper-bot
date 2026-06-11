#!/bin/bash
while true; do
  echo "[$(date)] Starting SecureScope..." >> /tmp/keepalive.log
  cd /home/z/my-project
  PORT=3000 npx next start -p 3000 >> /tmp/keepalive.log 2>&1
  echo "[$(date)] Exited ($?), restarting in 3s..." >> /tmp/keepalive.log
  sleep 3
done
