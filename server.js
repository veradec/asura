// server.js
const express = require('express');
const { WebSocketServer } = require('ws');
const http = require('http');

const app = express();
app.use(express.static('public'));

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

let clients = [];

wss.on('connection', (ws) => {
  clients.push(ws);
  const role = clients.length === 1 ? 'initiator' : 'receiver';
  ws.send(JSON.stringify({ type: 'role', role }));

  console.log(`Client connected as ${role}. Total clients: ${clients.length}`);

  // Notify initiator when receiver connects
  if (clients.length === 2) {
    const initiator = clients[0];
    if (initiator.readyState === WebSocket.OPEN) {
      initiator.send(JSON.stringify({ type: 'ready' }));
    }
  }

  ws.on('message', (msg) => {
    console.log('Server received message:', msg); // Log received message
    for (const client of clients) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        // Ensure msg is a string before sending
        client.send(typeof msg === 'string' ? msg : msg.toString());
        console.log('Server forwarded message to a client'); // Log forwarding
      }
    }
  });

  ws.on('close', () => {
    clients = clients.filter((client) => client !== ws);
    console.log('Client disconnected. Remaining:', clients.length);
  });
});

server.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});

