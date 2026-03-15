const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });

const players = new Map();

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/game.html');
});

app.use(express.static('.'));

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

server.listen(process.env.PORT || 3000, () => {
  console.log('🚀 Server ready');
});