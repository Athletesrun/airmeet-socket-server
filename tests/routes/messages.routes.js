"use strict";

const router = require("express").Router(),
	check = require('check-types'),
	knex = require("../database/knex.js"),
	algorithms = require("algorithms"),
	config = require("../config/config.js"),

	authMiddleware = require("../middleware/auth.middleware.js"),
	eventMiddleware = require("../middleware/event.middleware");

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
			message: config.parametersMessage
		});
	}

});

router.post("/api/getMessageList", [authMiddleware, eventMiddleware], (req, res) => {

	knex.select("*").from("messages").where("sender", "=", res.locals.userId).orWhere("receiver", "=", res.locals.userId).then((rows) => {

		rows.reverse();

		let conversations = {
			people: [],
			lastMessages: [],
			date: []
		};

		for(let i in rows) {

			if(rows[i].sender == res.locals.userId) {

				if(conversations.people.indexOf(rows[i].receiver) == "-1") {

					conversations.people.push(rows[i].receiver);
					conversations.lastMessages.push(rows[i].message);
					conversations.date.push(rows[i].date);

				}

			} else if(rows[i].receiver == res.locals.userId) {

				if (conversations.people.indexOf(rows[i].sender) == "-1") {
					conversations.people.push(rows[i].sender);
					conversations.lastMessages.push(rows[i].message);
					conversations.date.push(rows[i].date);
				}

			}

		}

		let cleanConversations = [];
		let conversationsCompleted = 0;

		for(let i in conversations.people) {

			knex.select("firstName", "lastName", "id").from("users").where("id", "=", conversations.people[i]).then((rows) => {

				conversationsCompleted++;

				rows[0].lastMessage = conversations.lastMessages[i];
				rows[0].date = conversations.date[i];

				cleanConversations.push(rows[0]);

				if(conversationsCompleted == conversations.people.length) {

					let dates = [];

					for(let j in cleanConversations) {

						dates.push(cleanConversations[j].date.getTime());

					}

					dates = algorithms.Sorting.quicksort(dates);

					let sortedMessages = new Array(dates.length);

					for(let x in dates) {

						for(let y in cleanConversations) {

							if(cleanConversations[y].date.getTime() === dates[x]) {

								sortedMessages[x] = cleanConversations[y];

							}

						}

					}

					res.send(sortedMessages.reverse());

				}

			});

		}

	});

});

router.post("/api/getConversation", [authMiddleware, eventMiddleware], (req, res) => {

	if(check.integer(req.body.userId)) {

		knex.select("*").from("messages").where("sender", "=", req.body.userId).andWhere("receiver", "=", res.locals.userId).orWhere("receiver", "=", req.body.userId).andWhere("sender", "=", res.locals.userId).then((rows) => {

			res.send(rows);

		});

	} else {
		res.send({
			status: "error",
			message: config.parametersMessage
		});
	}

});

module.exports = router;
