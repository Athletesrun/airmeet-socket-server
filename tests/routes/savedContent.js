"use strict";

const router = require("express").Router(),
    knex = require("../database/knex.js"),
    config = require("../config/config.js"),
	check = require("check-types"),

    algorithms = require("algorithms"),

	authMiddleware = require("../middleware/auth.middleware.js"),
	eventMiddleware = require("../middleware/event.middleware");

router.post("/api/getSavedProfiles", authMiddleware, (req, res) => {

    knex.select("savedProfiles").from("users").where("id", "=", res.locals.userId).then((rows) => {

        let profiles = rows[0].savedProfiles.savedProfiles;

        const profilesToComplete = profiles.length;

        let fullProfiles = [];

        let profilesCompleted = 0;

        function complete () {

            profilesCompleted++;

            if(profilesCompleted === profilesToComplete) {
                res.send(fullProfiles);
            }

        }

        if(profiles.length === 0) {

            res.send([]);

        } else {

            for(let i in profiles) {

                knex.select("*").from("users").where("id", "=", profiles[i]).then((rows) => {

                    fullProfiles.push(rows[0]);

                    complete();

                });

            }

        }

    });

});

router.post("/api/getSavedConversations", authMiddleware, (req, res) => {

    knex.select("savedConversations").from("users").where("id", "=", res.locals.userId).then((rows) => {

        let savedConversations = rows[0].savedConversations.savedConversations;

        if(savedConversations.length === 0) {

            res.send([]);

        } else {

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

                console.log(savedConversations);

                let tempConversations = [];

                for(let b = 0; b < conversations.people.length; b++) {

                    if(savedConversations.indexOf(conversations.people[b]) >= 0) {

                        tempConversations.push(conversations.people[b]);

                    }

                }

                conversations.people = tempConversations;

                console.log(conversations.people);

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
        }
    });

});

router.post("/api/getSavedConversation", authMiddleware, (req, res) => {

    if(check.number(req.body.userId)) {

        knex.select("savedConversations").from("users").where("id", "=", res.locals.userId).then((rows) => {

            if(rows[0].savedConversations.savedConversations.indexOf(req.body.userId) != -1) {

                knex.select("*").from("messages").where("sender", "=", req.body.userId).andWhere("receiver", "=", res.locals.userId).orWhere("receiver", "=", req.body.userId).andWhere("sender", "=", res.locals.userId).then((rows) => {

        			res.send(rows);

        		});

            } else {

                res.send({
                    status: 'error',
                    message: 'Messages are not saved with this user'
                });

            }

        });

    } else {
        res.send({
            status: 'error',
            message: config.parametersMessage
        });
    }

});

router.post("/api/saveProfile", authMiddleware, (req, res) => {

    if(check.number(req.body.profileId)) {

        knex.select("savedProfiles").from("users").where("id", "=", res.locals.userId).then((rows) => {

            console.log(rows);

            let savedProfiles = rows[0].savedProfiles.savedProfiles;

            if(savedProfiles.indexOf(req.body.profileId) == -1) {

                savedProfiles.push(req.body.profileId);

                knex("users").where("id", "=", res.locals.userId).update({savedProfiles: {savedProfiles: savedProfiles}}).then((err) => {
                    res.send({
                        status: 'success'
                    });
                });

            } else {
                res.send({
                    status: "success"
                });
            }

        });
    } else {
        res.send({
            status: 'error',
            message: config.parametersMessage
        });
    }

});

router.post("/api/saveConversation", authMiddleware, (req, res) => {

    if(check.number(req.body.userId)) {

        knex.select("savedConversations").from("users").where("id", "=", res.locals.userId).then((rows) => {

            let conversations = rows[0].savedConversations.savedConversations;

            if(conversations.indexOf(req.body.userId) == -1) {

                conversations.push(req.body.userId);

                knex("users").where("id", "=", res.locals.userId).update({savedConversations: {savedConversations: conversations}}).then((err) => {

                    res.send({
                        status: 'success'
                    });

                });

            } else {

                res.send({
                    status: 'success'
                });

            }

        });

    } else {

        res.send({
            status: 'error',
            message: config.parametersMessage
        });

    }

});

module.exports = router;
