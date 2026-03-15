const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');  // ← ADD THIS

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });

const players = new Map();

// 🎯 FIX 1: Serve static files properly
app.use(express.static(path.join(__dirname)));

// 🎯 FIX 2: Serve game.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'game.html'));
});

io.on('connection', (socket) => {
  console.log('👤 CONNECT:', socket.id.slice(-4));
  
  const newPlayer = {
    id: socket.id,
    x: 400,
    y: 300,
    color: `hsl(${Math.random()*360},70%,50%)`
  };
  players.set(socket.id, newPlayer);
  
  socket.emit('init', newPlayer, Array.from(players.values()));
  socket.broadcast.emit('newPlayer', newPlayer);
  
  socket.on('move', (data) => {
    const player = players.get(socket.id);
    if (player) {
      player.x = Math.max(0, Math.min(800, player.x + data.x));
      player.y = Math.max(0, Math.min(600, player.y + data.y));
      io.emit('updatePlayer', player);
    }
  });
  
  socket.on('disconnect', () => {
    players.delete(socket.id);
    io.emit('removePlayer', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('🚀 Server ready on port:', PORT);
});