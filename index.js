"use strict";

const express = require("express"),

	app = express(),

	fs = require('fs'),

	port = process.env.PORT || 9090,
	environment = process.env.NODE_ENV || "development",

	pg = require('pg'),

	server = app.listen(port, () => {
		console.log("Environment: " + environment);
		console.log(new Date() + "\nListening on port " + port);
	});

pg.defaults.ssl = true;

app.set('x-powered-by', false);

app.use((req, res, next) => {
	res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    next();
});

app.get("/", (req, res) => {
	res.send("You have reached the AirMeet socket server endpoint. Hurray!");
});

const io = require("./sockets/sockets.js").listen(server);
