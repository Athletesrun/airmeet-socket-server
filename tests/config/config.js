const fs = require("fs");

module.exports = {

    privateKey: fs.readFileSync("./keys/jwt.private.key"),
	publicKey: fs.readFileSync("./keys/jwt.public.key"),

	saltRounds: 12,

    parametersMessage: "Missing required parameters",
	unauthorizedMessage: "Incorrect email and/or password",
};
