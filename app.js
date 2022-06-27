const express = require("express");
const app = express();
const path = require("path");
const session = require("express-session");
const bodyParser = require("body-parser");
const _PORT = 3000;
const index = require("./routes/index");

// app.get("/", (req, res) => {
//     res.send("Hello");
// });

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: "This is a test",
    resave: false,
    saveUninitialized: true
}));

app.use("/", index);

app.listen(_PORT, () => {
    console.log("The server is listening on port " + _PORT);
});