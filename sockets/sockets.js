/* jshint node: true */

"use strict";

const socketio = require("socket.io"),
	socketioJwt = require("socketio-jwt"),

	fs = require('fs'),

	knex = require('../database/knex.js'),

	publicKey = fs.readFileSync("./keys/jwt.public.key");

module.exports.listen = function(server) {

	let locations = [];

	let io = socketio.listen(server);

	io.use(socketioJwt.authorize({
		secret: publicKey,
		handshake: true
	}));

	io.on("connection", (socket) => {

		socket.on("shareLocation", (data) => {

			knex.select("firstName", "lastName", "picture").from("users").where("id", "=", socket.decoded_token.userId).then((rows) => {

				let index;

				for(let i in locations) {

					if(locations[i].id === socket.decoded_token.userId) {

						index = i;

					} else {

						index = undefined;

					}

				}

				const userData = {
					id: socket.decoded_token.userId,
					name: rows[0].firstName + " " + rows[0].lastName,
					picture: rows[0].picture,
					lat: data.lat,
					lng: data.lng,
					time: Date.now()
				};

				if(index === undefined) {

					locations.push(userData);

				} else {

					locations[index] = userData;

				}

				socket.broadcast.emit("mapLocation", userData);

			});

		});

		socket.on("getAllLocations", (data) => {

			socket.emit(locations);

		});

		socket.on("stopSharingLocation", (data) => {

			socket.broadcast.emit("removeLocation", {id: socket.decoded_token.userId});

		});

	});

	setInterval(() => {

		const currentTime = Date.now();

		for(let i = locations.length -1; i >= 0; i--) { //start from back of array to prevent array index of becoming corrupt during loop

			console.log('Old time', locations[i].time);
			console.log('New time', currentTime);

			if(locations[i].time + 20000 < currentTime) {

				io.sockets.emit("removeLocation", {id: locations[i].id});
				//@todo keep in mind while building client that this sends to ALL clients;

				locations.splice(i, 1);

			}

		}

	}, 3000);

	return io;

};
