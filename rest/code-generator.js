const express = require("express");
const router = express.Router();
const randomStringGenerator = require("@supercharge/strings");
const db = require("../db");

router.get("/", (req, res) => {
  if (db.length > 10) {
    res.json({ error: "Túl sok szoba aktív!" });
    return;
  }
  const code = randomStringGenerator.random(8);
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
  // db.collection("rooms").doc(code).set(data);     ---- FIRESTORE WAY
  res.json({ code: code });
  db.push(data);
});

module.exports = router;
