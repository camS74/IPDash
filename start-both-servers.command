#!/bin/bash

# Kill any process running on ports 3000 and 3001
lsof -ti :3000 | xargs kill -9 2>/dev/null
lsof -ti :3001 | xargs kill -9 2>/dev/null

# Start backend server in a new Terminal window
osascript -e 'tell application "Terminal" to do script "cd \"$(pwd)/IPDash/server\" && npm start"'

# Start frontend server in a new Terminal window
osascript -e 'tell application "Terminal" to do script "cd \"$(pwd)/IPDash\" && npm start"'

exit 0 