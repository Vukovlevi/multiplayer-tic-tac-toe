//creating the server with socket.io
const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);
//code generator
const generatecode = require("./rest/code-generator");
//database
const db = require("./db");

//setting up the static site for the client
app.use(express.static("./public"));

//socket.io events
io.on("connection", (socket) => {
  //handling when the user joining a room
  socket.on("user-data", (data) => handleConnect(data, socket));
  //setting the users on the based on their actions
  socket.on("set-user", (data) => {
    const actualRoom = getRoom(data.room, socket);
    if (actualRoom == "no-room") return;
    //if tehy're both clicked early then we handle it here
    pushDatabase(actualRoom, data.username, data.cell);
    if (actualRoom.user1symbol != "") {
      //if the're both clicked the same field, the first can have it, the second has to pick another
      if (actualRoom.user1fields[0] == actualRoom.user2fields[0]) {
        socket.emit("you-are-O"); //if they clicked the same field, trigger the second user to be the "O" player
        if (actualRoom.user1name == data.username)
          actualRoom.user1fields.splice(0, 1);
        if (actualRoom.user2name == data.username)
          actualRoom.user2fields.splice(0, 1);
        return;
      } else {
        socket.emit("sync-error"); //this triggers the client who joined second
        socket.to(actualRoom.code).emit("X-sync"); //this triggers the client who joined first
        socket.to(actualRoom.code).emit("opponent-click", data.cell);
        return;
      }
    }
    //setting the symbols, the set-user only activates once - on the firs click
    if (actualRoom.user1name === data.username) {
      actualRoom.user1symbol = "X";
      actualRoom.user2symbol = "O";
    }
    if (actualRoom.user2name === data.username) {
      actualRoom.user1symbol = "O";
      actualRoom.user2symbol = "X";
    }
    socket.to(actualRoom.code).emit("opponent-click", data.cell);
    socket.to(actualRoom.code).emit("set-opponent", "O");
  });
  //in case of an existing room, the client call the server for information
  socket.on("check-room", (data) => {
    const actualRoom = getRoom(data.room, socket);
    if (actualRoom == "no-room") return;
    //if the room is full and you're not in it, return
    if (
      data.username != actualRoom.user1name &&
      actualRoom.user1name != "" &&
      data.username != actualRoom.user2name &&
      actualRoom.user2name != ""
    ) {
      socket.emit("full-room");
      return;
    }
    //else join, and send back the information
    socket.join(actualRoom.code);
    socket.emit("room-data", actualRoom);
  });
  //handling the users clicks
  socket.on("click", (data) => {
    const actualRoom = getRoom(data.room, socket);
    if (actualRoom == "no-room") return;
    //if its just for the connection to fire up, then join the room and return
    if (data.preConnect == true) {
      socket.join(actualRoom.code);
      return;
    }
    pushDatabase(actualRoom, data.username, data.cell);
    socket.to(actualRoom.code).emit("opponent-click", data.cell);
  });
  //handling the win
  socket.on("win", (data) => {
    const actualRoom = getRoom(data.room, socket);
    if (actualRoom == "no-room") return;
    //increase the wins value of the right user
    if (actualRoom.user1symbol == data.player) actualRoom.user1wins++;
    if (actualRoom.user2symbol == data.player) actualRoom.user2wins++;
    socket.to(actualRoom.code).emit("lose", data.player);
  });
  //handling the tie event
  socket.on("tie", (data) => {
    const actualRoom = getRoom(data.room, socket);
    if (actualRoom == "no-room") return;
    //increase the ties value
    actualRoom.ties++;
    socket.to(actualRoom.code).emit("tie");
  });
  //handling the next-round event
  socket.on("next-round", (data) => {
    const actualRoom = getRoom(data.room, socket);
    if (actualRoom == "no-room") return;
    //if its just for the connection to fire up, then join the room and return
    if (data.preConnect) {
      socket.join(actualRoom.code);
      return;
    }
    //call the resetRoom and send the event to the client
    resetRoom(actualRoom);
    socket.to(actualRoom.code).emit("reseted");
  });
  //handling when a user disconnect with the exit button
  socket.on("exit", (room) => {
    socket.leave(room);
    //leave the room
    const actualRoom = getRoom(room, socket);
    if (actualRoom == "no-room") return;
    //delete the room from the database and send the event to the other client
    const deleteIndex = db.findIndex((room) => room.code == actualRoom.code);
    db.splice(deleteIndex, 1);
    socket.to(actualRoom.code).emit("deleted");
  });
});

//UTILITY FUNCTIONS
//handles a room joining request
function handleConnect(data, socket) {
  const username = data.username;
  const code = data.code;
  const actualRoom = getRoom(code, socket);
  if (actualRoom == "no-room") return;
  if (actualRoom.user1name == "") {
    actualRoom.user1name = username;
    socket.join(actualRoom.code);
    socket.emit("valid-connect");
    return;
  }
  //if they have the same username, dont save it and send an error
  if (actualRoom.user1name == username) {
    socket.emit("same-username");
    return;
  }
  if (actualRoom.user2name == "") {
    actualRoom.user2name = username;
    socket.join(actualRoom.code);
    socket.emit("valid-connect");
    return;
  }
  socket.emit("full-room");
}

//register the click to the right player in the database
function pushDatabase(actualRoom, username, cell) {
  if (actualRoom.user1name === username) actualRoom.user1fields.push(cell);
  if (actualRoom.user2name === username) actualRoom.user2fields.push(cell);
}

//resets the room, so you can play more games in one room
function resetRoom(room) {
  room.user1symbol = "";
  room.user2symbol = "";
  room.user1fields = [];
  room.user2fields = [];
}

//gets the actual room from the database
function getRoom(room, socket) {
  const actualRoom = db.find((collection) => collection.code === room);
  //if the room doesn't exist then send an error
  if (actualRoom == null) {
    socket.emit("no-room");
    return "no-room";
  }
  return actualRoom;
}

//handling when /generatecode is called
app.use("/generatecode", generatecode);

//start running the server
server.listen(process.env.PORT || 3000, () => console.log("Server started."));
