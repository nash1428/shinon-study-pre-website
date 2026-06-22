// Yjs WebSocket collaboration server
// Run: node server/yjs.js
const WebSocket = require("ws");
const { setupWSConnection } = require("y-websocket/bin/utils");

const wss = new WebSocket.Server({ port: 1234 });
console.log("Yjs WebSocket server running on ws://localhost:1234");

wss.on("connection", (conn, req) => {
  const docName = req.url.split("/").pop();
  console.log(`New connection for document: ${docName}`);
  setupWSConnection(conn, req, { docName });
});

// TODO: Add persistence (store Yjs documents to PostgreSQL or Redis)
// TODO: Add authentication for WebSocket connections
