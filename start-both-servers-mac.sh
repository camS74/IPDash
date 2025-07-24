#!/bin/bash

# Start backend server in a new Terminal window
oterminal_backend='tell application "Terminal" to do script "cd \"$(pwd)/IPDash/server\" && npm start"'
osascript -e "$oterminal_backend"

# Start frontend server in a new Terminal window
oterminal_frontend='tell application "Terminal" to do script "cd \"$(pwd)/IPDash\" && npm start"'
osascript -e "$oterminal_frontend"

echo "Backend and frontend servers are starting in new Terminal windows." 