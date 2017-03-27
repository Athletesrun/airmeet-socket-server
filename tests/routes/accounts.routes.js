"use strict";

const router = require("express").Router(),

    knex = require("../database/knex.js"),

    jwt = require("jsonwebtoken"),

	saltRounds = 12,

	check = require("check-types"),

	config = require("../config/config.js");

let bcrypt;

if(process.platform === 'win32') {

    bcrypt = require('bcryptjs');

} else {

    bcrypt = require('bcrypt');

}

function generateToken(userId, callback) {

	jwt.sign({userId: userId}, config.privateKey, { algorithm: 'RS256' }, (err, token) => {

		if(err) {
			console.log("Error: " + err);
		} else {
			callback(token);
		}

	});

}
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
								token: token,
                                id: rows[0].id
							});
						});

					} else {

						res.send({
							status: "error",
							message: config.authorizedMessage
						});

					}

				});
			} else {
				res.send({
					status: "error",
					message: config.authorizedMessage
				});
			}
		});
	} else {
		req.send({
			status: "error",
			message: config.parametersMessage
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
							lastName: req.body.lastName,
                            savedConversations: {
                                savedConversations: []
                            },
                            savedProfiles: {
                                savedProfiles: []
                            },
                            interests: {
                                interests: []
                            }
						}).returning("id").into("users").then((userId) => {

							generateToken(userId[0], (token) => {
								res.send({
									status: "success",
									token: token,
                                    id: userId
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
			message: config.parametersMessage
		});
	}

});

module.exports = router;
