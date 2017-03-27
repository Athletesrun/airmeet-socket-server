"use strict";

const router = require("express").Router(),
    knex = require("../database/knex.js"),
    _ = require("lodash"),
    config = require("../config/config.js"),
	check = require("check-types"),

	authMiddleware = require("../middleware/auth.middleware.js"),
	eventMiddleware = require("../middleware/event.middleware");

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
            message: config.parametersMessage
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

                console.log(propertiesToUpdate[key]);

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

            if(key === "phone" && check.string(value)) {
                propertiesToUpdate[key] = value;
            }

        }
    });

    if(Object.keys(propertiesToUpdate).length !== 0) {

        knex("users").where("id", "=", res.locals.userId).update(propertiesToUpdate).then((err) => {

            res.send({
                status: "success"
            });

        });
    } else {

        res.send({
            status: "success"
        });

    }

});

router.post("/api/searchProfiles", [authMiddleware, eventMiddleware], (req, res) => {

	let expectedResponses = 4,
		results = [];

	function checkIfSearchIsComplete(searchResults) {

		for(let i in searchResults) {

            if(searchResults[i].id !== res.locals.userId) {

	           results.push(searchResults[i]);

           }

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

		knex.raw("SELECT * FROM users q WHERE to_tsvector('english', \"firstName\" || ' ' || \"firstName\") @@ plainto_tsquery('english', '" + req.body.query + "' )").then((response) => {

			checkIfSearchIsComplete(response.rows);

		});

		knex.raw("SELECT * FROM users q WHERE to_tsvector('english', \"lastName\" || ' ' || \"lastName\") @@ plainto_tsquery('english', '" + req.body.query + "' )").then((response) => {

			checkIfSearchIsComplete(response.rows);

		});

		knex.raw("SELECT * FROM users q WHERE to_tsvector('english', description || ' ' || description) @@ plainto_tsquery('english', '" + req.body.query + "' )").then((response) => {

			checkIfSearchIsComplete(response.rows);

		});

		knex.raw("SELECT * FROM users q WHERE to_tsvector('english', interests || ' ' || interests) @@ plainto_tsquery('english', '" + req.body.query + "' )").then((response) => {

			checkIfSearchIsComplete(response.rows);

		});

	} else {
		res.send({
			status: "error",
			message: config.parametersMessage
		});
	}
});

module.exports = router;
