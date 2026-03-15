const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });

const players = new Map();

// Serve static files
app.use(express.static(path.join(__dirname)));

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
  
  // Send init to new player
  socket.emit('init', newPlayer, Array.from(players.values()));
  
  // Announce to others
  socket.broadcast.emit('newPlayer', newPlayer);
  
  socket.on('move', (data) => {
    const player = players.get(socket.id);
    if (player) {
      // Update position
      player.x = Math.max(25, Math.min(775, player.x + data.x));
      player.y = Math.max(25, Math.min(575, player.y + data.y));
      
      // 🎯 FIX: Send to EVERYONE including sender!
      io.emit('updatePlayer', player);
    }
  });
  
  socket.on('disconnect', () => {
    console.log('👋', socket.id.slice(-4));
    players.delete(socket.id);
    io.emit('removePlayer', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('🚀 Server on port:', PORT);
});