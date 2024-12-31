require("dotenv").config();
require("./models/connection.js");

var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var indexRouter = require("./routes/index");
var clubsRouter = require("./routes/clubs");
var playersRouter = require("./routes/players");
var tournamentsRouter = require("./routes/tournaments")
var searchRouter = require("./routes/search")

var app = express();

const cors = require("cors");
app.use(cors());

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/players", playersRouter);
app.use("/clubs", clubsRouter);
app.use("/tournaments", tournamentsRouter);
app.use("/search", searchRouter);

module.exports = app;
