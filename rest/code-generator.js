//setting up an express router
const express = require("express");
const router = express.Router();
//reqesting the random string generator library
const randomStringGenerator = require("@supercharge/strings");
//database
const db = require("../db");

//setting up the router
router.get("/", (req, res) => {
  //if there is more than 10 rooms, do not create one - small project
  if (db.length > 10) {
    res.json({ error: "Túl sok szoba aktív!" });
    return;
  }
  //generate a random string which is 8 characters long and will be the code
  const code = randomStringGenerator.random(8);
  //database room template and default settings
  const data = {
    code: code,
    user1name: "",
    user2name: "",
    user1symbol: "",
    user2symbol: "",
    user1fields: [],
    user2fields: [],
    user1wins: 0,
    user2wins: 0,
    ties: 0,
  };
  //send the code back to the client
  res.json({ code: code });
  //adding the room to the database
  db.push(data);
});

module.exports = router;
