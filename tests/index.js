"use strict";

const express = require("express"),

	app = express(),
	bodyParser = require("body-parser"),

	port = process.env.PORT || 8080,
	environment = process.env.NODE_ENV || "development",

	pg = require('pg'),

	server = app.listen(port, () => {
		console.log("Environment: " + environment);
		console.log(new Date() + "\nListening on port " + port);
	});

pg.defaults.ssl = true;

let knex;

app.set('x-powered-by', false);

app.use((req, res, next) => {
	res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    next();
});

app.get("/", (req, res) => {
	res.send("You have reached the AirMeet API endpoint. Hurray!");
});

app.use(bodyParser.json());

app.use(require("./routes/accounts.routes.js"));
app.use(require("./routes/events.routes.js"));
app.use(require("./routes/messages.routes.js"));
app.use(require("./routes/profiles.routes.js"));
app.use(require("./routes/savedContent"));

const io = require("./sockets/sockets.js").listen(server);
