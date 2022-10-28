const express = require("express");
const generatecode = require("./rest/code-generator");
const app = express();
const server = require("http").Server(app);
const db = require("./db");
const io = require("socket.io")(server);

app.use(express.static("./public"));

io.on("connection", (socket) => {
  socket.on("click", (data) => {
    const actualRoom = getRoom(data.room);
    if (actualRoom.message) {
      socket.emit("no-room");
      return;
    }
    if (data.preConnect == true) {
      socket.join(actualRoom.code);
      return;
    }
    if (actualRoom.user1name === data.username)
      actualRoom.user1fields.push(data.cell);
    if (actualRoom.user2name === data.username)
      actualRoom.user2fields.push(data.cell);
    socket.to(actualRoom.code).emit("opponent-click", data.cell);
  });
  socket.on("win", (data) => {
    const actualRoom = getRoom(data.room);
    if (actualRoom.message) {
      socket.emit("no-room");
      return;
    }
    if (actualRoom.user1symbol == data.player) actualRoom.user1wins++;
    if (actualRoom.user2symbol == data.player) actualRoom.user2wins++;
    socket.to(actualRoom.code).emit("lose", data.player);
  });
  socket.on("set-user", (data) => {
    const actualRoom = getRoom(data.room);
    if (actualRoom.message) {
      socket.emit("no-room");
      return;
    }
    if (actualRoom.user1name === data.username) {
      actualRoom.user1symbol = "X";
      actualRoom.user2symbol = "O";
    }
    if (actualRoom.user2name === data.username) {
      actualRoom.user1symbol = "O";
      actualRoom.user2symbol = "X";
    }
    socket.to(actualRoom.code).emit("set-opponent", "O");
  });
  socket.on("tie", (data) => {
    const actualRoom = getRoom(data.room); //TODO when refactoring: bring this code into the getRoom method
    if (actualRoom.message) {
      socket.emit("no-room");
      return;
    }
    actualRoom.ties++;
    socket.to(actualRoom.code).emit("tie");
  });
  socket.on("user-data", (data) => handleConnect(data, socket));
  socket.on("check-room", (data) => {
    const actualRoom = getRoom(data.room);
    if (actualRoom.message) {
      socket.emit("no-room");
      return;
    }
    if (
      data.username != actualRoom.user1name &&
      actualRoom.user1name != "" &&
      data.username != actualRoom.user2name &&
      actualRoom.user2name != ""
    ) {
      socket.emit("full-room");
      return;
    }
    socket.join(actualRoom.code);
    socket.emit("room-data", actualRoom);
  });
  socket.on("next-round", (data) => {
    const actualRoom = getRoom(data.room);
    if (actualRoom.message) {
      socket.emit("no-room");
      return;
    }
    if (data.preConnect) {
      socket.join(actualRoom.code);
      return;
    }
    resetRoom(actualRoom);
    socket.to(actualRoom.code).emit("reseted");
  });
  socket.on("exit", (room) => {
    socket.leave(room);
    const actualRoom = getRoom(room);
    if (actualRoom.message) {
      socket.emit("no-room");
      return;
    }
    const deleteIndex = db.findIndex((room) => room.code == actualRoom.code);
    db.splice(deleteIndex, 1);
    socket.to(actualRoom.code).emit("deleted");
  });
});
function resetRoom(room) {
  room.user1symbol = "";
  room.user2symbol = "";
  room.user1fields = [];
  room.user2fields = [];
}

function handleConnect(data, socket) {
  const username = data.username;
  const code = data.code;
  const actualRoom = getRoom(code);
  if (actualRoom.message) return;
  if (actualRoom.user1name == "") {
    actualRoom.user1name = username;
    socket.join(actualRoom.code);
    return;
  }
  if (actualRoom.user2name == "") {
    actualRoom.user2name = username;
    socket.join(actualRoom.code);
    return;
  }
  socket.emit("full-room");
}

function getRoom(room) {
  const actualRoom = db.find((collection) => collection.code === room);
  if (actualRoom == null) {
    const error = { message: "Room does not exist" };
    return error;
  }
  return actualRoom;
}

app.use("/generatecode", generatecode);

server.listen(process.env.PORT || 3000, () => console.log("Server started."));
