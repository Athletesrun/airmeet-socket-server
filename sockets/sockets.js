"use strict";

const socketio = require("socket.io"),
	socketioJwt = require("socketio-jwt"),

	fs = require('fs'),

	knex = require('../database/knex.js'),

	publicKey = fs.readFileSync("./keys/jwt.public.key");

module.exports.listen = function(server) {

	let io = socketio.listen(server);

	io.use(socketioJwt.authorize({
		secret: publicKey,
		handshake: true
	}));

	io.on("connection", (socket) => {

		socket.on("shareLocation", (data) => {

			socket.broadcast.emit("mapLocation", {id: socket.decoded_token.userId, lat: data.lat, lng: data.lng});

		});

	});

	return io;

};
