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

			console.log(data);

			//if((data.lat < 41.244590 && data.lat > 41.243811) && (data.lng < -96.011557 && data.lng > -96.012300)) {

				console.log('good coords');

				knex.select("picture", "event").from("users").where("id", "=", socket.decoded_token.userId).then((rows) => {

					if(parseInt(rows[0].event) > 0) {

						console.log('good event');

						let index;

						for(let i in locations) {

							if(locations[i].id === socket.decoded_token.userId) {

								index = i;

								break;

							} else {

								index = undefined;

							}

						}

						const userData = {
							id: socket.decoded_token.userId,
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

						console.log('emitting');

						socket.broadcast.emit("mapLocation", userData);
					} else {
						console.log('bad event');
					}
				});
			/*} else {
				console.log('bad coords');
			}*/

		});

		socket.on("getAllLocations", (data) => {

			socket.emit(locations);

		});

		socket.on("stopSharingLocation", () => {

			for(let i in locations) {

				if(locations[i].id === socket.decoded_token.userId) {

					locations.splice(socket.decoded_token.userId, 1);

					break;

				}

			}

			socket.broadcast.emit("removeLocation", {id: socket.decoded_token.userId});

		});

	});

	setInterval(() => {

		for(let i = locations.length -1; i >= 0; i--) { //start from back of array to prevent array index of becoming corrupt during loop

			if(locations[i].time + 10000 < Date.now()) {

				io.sockets.emit("removeLocation", {id: locations[i].id});
				//@todo keep in mind while building client that this sends to ALL clients;

				locations.splice(i, 1);

			}

		}

	}, 3000);

	return io;

};
