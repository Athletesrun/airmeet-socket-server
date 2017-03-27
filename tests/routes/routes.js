"use strict";

const router = require("express").Router(),

	fs = require("fs"),

	npmi = require("npmi"),

	_ = require('lodash'),

	jwt = require("jsonwebtoken"),
	privateKey = fs.readFileSync("./keys/jwt.private.key"),
	publicKey = fs.readFileSync("./keys/jwt.public.key"),

	saltRounds = 12,

	check = require("check-types"),

	parametersMessage = "Missing required parameters",
	unauthorizedMessage = "Incorrect email and/or password",

	algorithms = require('algorithms');

let bcrypt = require('bcryptjs');



//@todo use npmi to programatically install bcrypt or bcryptjs based on platform

module.exports = (knex) => {

	router.post("/api/accounts/login", (req, res) => {
		if(check.string(req.body.email) && check.string(req.body.password)) {
			knex.select("email", "password", "password", "id").from("users").where("email", "=", req.body.email).then((rows) => {

				if(check.nonEmptyArray(rows)) {
					bcrypt.compare(req.body.password, rows[0].password, (err, hashResponse) => {
						if(err) {
							console.log("Error: " + err);
							res.sendStatus(503);
						}

						if(hashResponse === true) {

							generateToken(rows[0].id, (token) => {

								res.send({
									status: "success",
									token: token
								});
							});

						} else {

							res.send({
								status: "error",
								message: unauthorizedMessage
							});

						}

					});
				} else {
					res.send({
						status: "error",
						message: unauthorizedMessage
					});
				}
			});
		} else {
			req.send({
				status: "error",
				message: parametersMessage
			});
		}
	});

	router.post("/api/accounts/register", (req, res) => {

		if(check.string(req.body.email) && check.string(req.body.password) && check.string(req.body.firstName) && check.string(req.body.lastName)) {

			knex.select("email").from("users").where("email", "=", req.body.email).then((rows) => {

				if(check.emptyArray(rows)) {

					bcrypt.hash(req.body.password, saltRounds, (err, hashedPassword) => {

						if(err) {
							console.log("Error: " + err);
							res.send(403);
						} else {

							knex.insert({
								email: req.body.email,
								password: hashedPassword,
								firstName: req.body.firstName,
								lastName: req.body.lastName
							}).returning("id").into("users").then((userId) => {

								generateToken(userId[0], (token) => {
									res.send({
										status: "success",
										token: token
									});
								});

							});

						}

					});

				} else {
					res.send({
						status: "error",
						message: "User Already Exists"
					});
				}

			});

		} else {
			res.send({
				status: "error",
				message: parametersMessage
			});
		}

	});

	router.post("/api/getUserProfile", [authMiddleware, eventMiddleware], (req, res) => {

		if(check.number(req.body.userId)) {

			knex.select("*").from("users").where("id", "=", req.body.userId).then((rows) => {

				if(check.emptyArray(rows)) {

					res.send({
						count: 0
					});

				} else {

					res.send(rows[0]);

				}

			});

		} else {
			res.send({
				status: "error",
				message: parametersMessage
			});
		}

	});

	router.post("/api/getOwnProfile", [authMiddleware, eventMiddleware], (req, res) => {

		//I know, I know. This returns the password. Screw it. The password's encrypted pretty well and this app doesnt really mean anything
		knex.select("*").from("users").where("id", "=", res.locals.userId).then((rows) => {

			res.send(rows[0]);

		});

	});

	router.post("/api/getAllProfiles", [authMiddleware, eventMiddleware], (req, res) => {

		knex.select("*").from("users").where("event", "=", res.locals.event).then((rows) => {

			for(let i in rows) {

				if(rows[i].id === res.locals.userId) {

					rows.splice(i, 1);

				}
			}

			res.send(rows);

		});

	});

	router.post("/api/updateProfile", [authMiddleware, eventMiddleware], (req, res) => {

		let propertiesToUpdate = {};

		_.forEach(req.body, (value, key) => {
			if(key !== "token") {

				if(key === "firstName" && check.string(value)) {
					propertiesToUpdate[key] = value;
				}

				if(key === "lastName" && check.string(value)) {
					propertiesToUpdate[key] = value;
				}

				if(key === "description" && check.string(value)) {
					propertiesToUpdate[key] = value;
				}

				if(key === "interests" && check.array(value.interests)) {

					//@todo verify object with array of interests

					propertiesToUpdate[key] = {};
					propertiesToUpdate[key] = value;

				}

				if(key === "linkedin" && check.string(value)) {
					propertiesToUpdate[key] = value;
				}

				if(key === "facebook" && check.string(value)) {
					propertiesToUpdate[key] = value;
				}

				if(key === "twitter" && check.string(value)) {
					propertiesToUpdate[key] = value;
				}

				if(key === "picture" && check.string(value)) {
					propertiesToUpdate[key] = value;
				}

				if(key === "email" && check.string(value)) {
					propertiesToUpdate[key] = value;
				}

			}
		});

		knex("users").where("id", "=", res.locals.userId).update(propertiesToUpdate).then((err) => {

			res.send({
				status: "success"
			});

		});

	});

	router.post("/api/sendMessage", [authMiddleware, eventMiddleware], (req, res) => {

		if(check.integer(req.body.receiver) && check.string(req.body.message)) {

			knex.select("*").from("users").where("id", "=", req.body.receiver).then((rows) => {

				if(rows[0]) {

					let messageToSend = {
						date: new Date(),
						message: req.body.message,
						sender: res.locals.userId,
						receiver: req.body.receiver,
						event: res.locals.event
					};

					knex.insert(messageToSend).returning("id").into("messages").then((userId) => {

						res.send({
							status: "success"
						});

					});

				} else {

					res.send({
						status: "error",
						message: "User not found"
					});

				}

			});

		} else {
			res.send({
				status: "error",
				message: parametersMessage
			});
		}

	});

	router.post("/api/getMessages", [authMiddleware, eventMiddleware], (req, res) => { //@todo split up. make this only return conversations and last message and get conversations separately

		knex.select("*").from("messages").where("sender", "=", res.locals.userId).orWhere("receiver", "=", res.locals.userId).then((rows) => {

			let returnableObject = {};

			for(var i in rows) {

				//convert user id's to string in order to use them as object properties
				rows[i].sender = rows[i].sender.toString();
				rows[i].receiver = rows[i].receiver.toString();

				//differentiate sending and receiving
				if(rows[i].sender === res.locals.userId.toString()) {

					//see if array in returnableObject already exists
					if(returnableObject[rows[i].receiver]) {

						//push to returnableObject
						returnableObject[rows[i].receiver].push(rows[i]);

					} else {

						//create array in returnable object and push to it
						returnableObject[rows[i].receiver] = [];
						returnableObject[rows[i].receiver].push(rows[i]);

					}

				} else if(rows[i].receiver === res.locals.userId.toString()){

					//You won't be the star(name) of the conversation because you(senders) are never stars
					//so simply add

					//check to see if sender is already array of returnable object
					if(returnableObject[rows[i].sender]) {

						returnableObject[rows[i].sender].push(rows[i]);

					} else {

						returnableObject[rows[i].sender] = [];
						returnableObject[rows[i].sender].push(rows[i]);

					}
				}

			}

			//@todo oh god i need to sort these messages by date

			let messageKeys = Object.keys(returnableObject);
			let messageKeysInOrder = [];

			/*for(let x in messageKeys) {

				returnableObject[messageKeys[x]] = sortMessagesByDate(returnableObject[messageKeys[x]]);
				//messageKeysInOrder.push()

			}*/

			/*algorithms.Sorting.quicksort(messageKeysInOrder);

			console.log(returnableObject);*/


			res.send(returnableObject);

		});

	});

	router.post("/api/searchUsers", [authMiddleware, eventMiddleware], (req, res) => {

		let expectedResponses = 4,
			results = [];

		function checkIfSearchIsComplete(searchResults) {

			for(let i in searchResults) {
				results.push(searchResults[i]);
			}

			expectedResponses--;

			if(expectedResponses === 0) {
				res.send({
					status: "success",
					results: results
				});
			}

		}

		if(check.string(req.body.query)) {

			knex.raw("SELECT id, picture FROM users q WHERE to_tsvector('english', \"firstName\" || ' ' || \"firstName\") @@ plainto_tsquery('english', '" + req.body.query + "' )").then((response) => {

				checkIfSearchIsComplete(response.rows);

			});

			knex.raw("SELECT id, picture FROM users q WHERE to_tsvector('english', \"lastName\" || ' ' || \"lastName\") @@ plainto_tsquery('english', '" + req.body.query + "' )").then((response) => {

				checkIfSearchIsComplete(response.rows);

			});

			knex.raw("SELECT id, picture FROM users q WHERE to_tsvector('english', description || ' ' || description) @@ plainto_tsquery('english', '" + req.body.query + "' )").then((response) => {

				checkIfSearchIsComplete(response.rows);

			});

			knex.raw("SELECT id, picture FROM users q WHERE to_tsvector('english', interests || ' ' || interests) @@ plainto_tsquery('english', '" + req.body.query + "' )").then((response) => {

				checkIfSearchIsComplete(response.rows);

			});

		} else {
			res.send({
				status: "error",
				message: parametersMessage
			});
		}
	});


	return router;
};
