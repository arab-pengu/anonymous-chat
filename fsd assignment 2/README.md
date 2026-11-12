# AfterHours – Basic Assignment Version

A small anonymous, interest-based real-time chat application built with:
- HTML, CSS and JavaScript
- Node.js and Express
- Socket.IO for real-time messaging

No Firebase, database, login or account creation is required.

## Run the project

1. Install Node.js if it is not already installed.
2. Extract the ZIP file.
3. Open the extracted `afterhours_assignment` folder in VS Code.
4. Open the VS Code terminal.
5. Run:

   npm install

6. Then run:

   npm start

7. Open this address in your browser:

   http://localhost:3000

## How to test matching

The app needs two users online to create a match.

1. Open `http://localhost:3000` in one browser tab.
2. Open the same address in an incognito window, another browser, or another device on the same network.
3. Select at least one common interest in both windows.
4. Click **Find a conversation** in both.
5. The server matches users who share the highest number of interests.
6. Send messages from either window. Messages appear in the other window instantly.
7. Click **End chat** to close the conversation.

If testing on another device, use your computer's local network IP address instead of `localhost`, and make sure both devices are on the same Wi-Fi network.

## Important assignment limitation

This is a basic demonstration. Waiting users and conversations are kept in server memory, so they are cleared when the server restarts. It is not designed for public deployment or sensitive conversations. For a classroom assignment, test with two browser sessions.
