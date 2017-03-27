"use strict";

const socketio = require("socket.io"),
	socketioJwt = require("socketio-jwt"),
	config = require("../config/config.js");

module.exports.listen = function(server) {

	let io = socketio.listen(server);

	io.use(socketioJwt.authorize({
		secret: config.publicKey,
		handshake: true
	}));

	io.on("connection", (socket) => {

		socket.on("shareLocation", (data) => {

			socket.broadcast.emit("mapLocation", {id: socket.decoded_token.userId, lat: data.latitude, lon: data.longitude});

		});

	});

	return io;

};
