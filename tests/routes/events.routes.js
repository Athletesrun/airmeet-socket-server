"use strict";

const router = require("express").Router(),

    check = require("check-types"),

    knex = require("../database/knex.js"),

    config = require("../config/config.js"),

	authMiddleware = require("../middleware/auth.middleware.js"),
	eventMiddleware = require("../middleware/event.middleware");

router.post("/api/joinEvent", [authMiddleware], (req, res) => {

    if(check.string(req.body.eventCode)) {

        knex.select("*").from("events").where("accessCode", "=", req.body.eventCode).then((rows) => {

            if(check.nonEmptyArray(rows)) {

                knex("users").where("id", "=", res.locals.userId).update({
                    event: rows[0].id
                }).then((err) => {

                    res.send({
                        status: "success",
                        eventId: rows[0].id
                    });

                });
            } else {
                res.send({
                    status: "error",
                    message: "Invalid event code"
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

router.post("/api/getEventInfo", [authMiddleware, eventMiddleware], (req, res) => {

    knex.select("event").from("users").where("id", "=", res.locals.userId).then((rows) => {

        knex.select("*").from("events").where("id", "=", rows[0].event).then((rows) => {

            res.send(rows[0]);

        });

    });

});

router.post("/api/leaveEvent", [authMiddleware, eventMiddleware], (req, res) => {

    knex("users").where("id", "=", res.locals.userId).update({
        event: null
    }).then(() => {

        res.send({
            status: "success"
        });

    });

});

module.exports = router;
