const express = require("express");
const app = express();
const _PORT = 3000;

app.get("/", (req, res) => {
    res.send("Hello");
});

app.listen(_PORT, () => {
    console.log("The server is listening on port " + _PORT);
});