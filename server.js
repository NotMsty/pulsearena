const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(express.static("public"));

let rooms = {};

io.on("connection", (socket) => {
  console.log("Player connected:", socket.id);

  socket.on("getRooms", () => {
    socket.emit("roomList", rooms);
  });

  socket.on("createRoom", ({ name, maxPlayers }) => {
    const id = "room_" + Math.floor(Math.random() * 9999);

    rooms[id] = {
      name,
      maxPlayers,
      players: {}
    };

    joinRoom(socket, id);
  });

  socket.on("joinRoom", (id) => {
    if (rooms[id]) joinRoom(socket, id);
  });

  socket.on("input", (data) => {
    const room = getRoom(socket.id);
    if (!room) return;

    const player = room.players[socket.id];
    if (!player) return;

    player.x += data.dx * 5;
    player.y += data.dy * 5;
  });

  socket.on("disconnect", () => {
    removePlayer(socket.id);
  });
});

function joinRoom(socket, id) {
  socket.join(id);

  rooms[id].players[socket.id] = {
    x: 400,
    y: 200
  };

  socket.emit("joinedRoom", id);
}

function getRoom(id) {
  for (let r in rooms) {
    if (rooms[r].players[id]) return rooms[r];
  }
  return null;
}

function removePlayer(id) {
  for (let r in rooms) {
    if (rooms[r].players[id]) {
      delete rooms[r].players[id];
    }
  }
}

setInterval(() => {
  for (let id in rooms) {
    io.to(id).emit("gameState", rooms[id].players);
  }
}, 50);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Running on port " + PORT);
});
