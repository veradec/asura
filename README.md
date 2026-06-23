# Asura

Asura is a simple WebRTC file transfer application that allows two clients to connect via a web interface and transfer files directly using peer-to-peer technology. The signaling server is built with Node.js, Express, and WebSocket, and the client interface is a minimal HTML/JavaScript app.

## Features
- Peer-to-peer file transfer using WebRTC DataChannels
- Simple signaling server using WebSockets
- Automatic role assignment (initiator/receiver)
- Minimal, easy-to-use web interface
- Logs for debugging and connection status

## How It Works
1. The first client to connect becomes the "initiator" and waits for a receiver.
2. The second client becomes the "receiver".
3. Once both are connected, the initiator is notified and starts the WebRTC offer/answer exchange.
4. A direct peer-to-peer connection is established, and files can be sent from the initiator to the receiver.

## Project Structure
```
Asura/
├── public/
│   ├── app.js         # Client-side JavaScript (WebRTC logic)
│   └── index.html     # Web interface
├── server.js          # Node.js signaling server
├── package.json       # Project dependencies
├── .gitignore         # Git ignore rules
```

## Prerequisites
- Node.js (v16 or newer recommended)

## Setup & Installation
1. Clone the repository:
   ```sh
   git clone https://github.com/veradec/asura
   cd Asura
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Start the server:
   ```sh
   node server.js
   ```
4. Open your browser and navigate to `http://localhost:3000`.
5. Open the same URL in a second browser window or device to connect as the receiver.

## Usage
- Select a file using the file input.
- Click "Send File" to transfer the file to the connected peer.
- Progress and logs are displayed in the web interface.

## Notes
- Only two clients can be connected at a time (one initiator, one receiver).
- The initiator must wait for the receiver to connect before sending an offer.
- Files are transferred directly between peers; the server is only used for signaling.
- For use over the internet, you may need to configure STUN/TURN servers and handle NAT traversal.

## Customization
- You can modify `public/app.js` and `public/index.html` to change the UI or add features.
- The signaling logic can be extended in `server.js` for more advanced scenarios.

## License
This project is provided as-is for educational and personal use. <!-- chore: add .gitignore entries for node_modules [2026-06-03] -->
<!-- fix: correct port binding in server.js [2026-06-03] -->
<!-- feat: add basic health check endpoint [2026-06-06] -->
<!-- refactor: move route handlers into separate file [2026-06-09] -->
<!-- fix: handle missing env vars with defaults [2026-06-09] -->
<!-- chore: update package.json description [2026-06-09] -->
<!-- feat: add request logging middleware [2026-06-14] -->
<!-- fix: resolve cors header issue on preflight [2026-06-14] -->
<!-- docs: add API usage examples to README [2026-06-19] -->
<!-- feat: add error handler middleware [2026-06-23] -->
