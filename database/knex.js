let knex = require('knex');

if(process.env.NODE_ENV === "production") {

	console.log("WARNING WARNING WARNING");
	console.log("You are running in production mode. This can cause things to break! Get out of production mode!");

	knex = require("knex")({
		client: "pg",
		//connection: "postgres://airmeet:!beliEVEthAtwEW!LLuuin9876@airmeet.cnanojewxddp.us-east-2.rds.amazonaws.com:5432/airmeet",
		connection: {
			host: 'airmeet.cnanojewxddp.us-east-2.rds.amazonaws.com',
			user: 'airmeet',
			password: '!beliEVEthAtwEW!LLuuin9876',
			database: 'airmeet'
		},
		pool: {
			min: 2,
			max: 50
		}
	});

} else {

	console.log("Database: development");

	knex = require("knex")({
		client: "pg",
		connection: "postgres://nlghwvfayvoifk:af3da8521ddd4a222cf85f36c84f68af569e169387479ed40fff6dd15dd82d91@ec2-107-20-163-238.compute-1.amazonaws.com:5432/dfic3203som2bm"
	});
}

module.exports = knex;
