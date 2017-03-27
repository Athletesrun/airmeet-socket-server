/*
 * This test is used to verify that the server is responding to all requests properly.
 *
 * ES6 arrow functions aren"t used here because mocha doesn"t like them
 *
 * To use, run `mocha` or `npm test` from the project"s root directory
 * Mocha must be installed either way.
 */

"use strict";

const request = require("request"),
	expect = require("chai").expect,
	assert = require("chai").assert,
	randomatic = require("randomatic"),
	url = "http://localhost:8080";

let user = { //This user is used in the tests when creating an account, logging in, and accessing/creating data
		email: randomatic("Aa0", 10) + "@gmail.com",
		password: "password",
		firstName: "Ben",
		lastName: "Wingerter"
	},
	authToken;

describe("Application features: ", function() {

	describe("Create and Login", function() {

		it("Create account", function(done) {

			const options = {
				url: url + "/api/accounts/register",
				method: "POST",
				json: user
			};

			request(options, function(error, response, body) {

				expect(body.status).to.equal("success");
				expect(body.token).to.be.a("string");

				authToken = body.token;

				done();

			});

		});

		it("Login", function (done) {

			const options = {
				url: url + "/api/accounts/login",
				method: "POST",
				json: {
					email: user.email,
					password: user.password
				}
			};

			request(options, function (error, response, body) {

				console.log(body.token);

				expect(body.status).to.equal("success");
				expect(body.token).to.be.a("string");

				done();

			});
		});

	});

	describe("API functionality", function() {

		it("joinEvent", function(done) {

			setTimeout(function() {
				const options = {
					url: url + "/api/joinEvent",
					method: "POST",
					json: {
						token: authToken,
						eventCode: "D3e9aC9q"
					}
				};

				request(options, function (error, response, body) {

					console.log(body);

					expect(body.status).to.equal("success");

					done();

				});
			});

		});

		it("getUserProfile", function (done) {

			const options = {
				url: url + "/api/getUserProfile",
				method: "POST",
				json: {
					userId: 1,
					token: authToken
				}
			};

			request(options, function (error, resonpse, body) {

				expect(body.firstName).to.equal("Ben");
				expect(body.lastName).to.equal("Wingerter");
				expect(body.email).to.equal("benwingerter01@gmail.com");
				expect(body.id).to.equal(1);
				done();

			});
		});

		it("getOwnProfile", function(done) {

			const options = {
				url: url + "/api/getOwnProfile",
				method: "POST",
				json: {
					token: authToken
				}
			};

			request(options, function (error, response, body) {

				expect(body.firstName).to.equal(user.firstName);
				expect(body.lastName).to.equal(user.lastName);
				expect(body.email).to.equal(user.email);

				done();

			});

		});

		it("getAllProfiles", function(done) {

			const options = {
				url: url + "/api/getAllProfiles",
				method: "POST",
				json: {
					userId: 10,
					token: authToken
				}
			};

			request(options, function (error, response, body) {

				expect(body).to.be.an('array');
				expect(body).to.not.be.empty;
				done();

			});

		});

		it("updateProfile", function(done) {

			this.timeout(3000);

			user.twitter = "Athletesrun";
			user.linkedin = "https://www.linkedin.com/";
			user.facebook = "https://www.facebook.com";
			user.firstName = "Tommy" + randomatic("Aa", 10);
			user.lastName = "Gates" + randomatic("Aa", 10);
			user.description = "An awesome person";
			user.interests = { //I know, I know. This is redundant. I'm storing the array inside of an object because databases are scared of pure arrays. Just go with it.
				interests: ["running", "programming", "engineering"]
			};
			user.picture = "base64test";
			user.email = "2018350@prep.creighton.edu";

			const options = {
				url: url + "/api/updateProfile",
				method: "POST",
				json: {
					token: authToken,
					twitter: user.twitter,
					linkedin: user.linkedin,
					facebook: user.facebook,
					firstName: user.firstName,
					lastName: user.lastName,
					description: user.description,
					interests: user.interests,
					picture: user.picture,
					email: user.email
				}
			};

			request(options, function(error, response, body) {

				expect(body.status).to.equal("success");

				const options = {
					url: url + "/api/getOwnProfile",
					method: "POST",
					json: {
						token: authToken
					}
				};

				request(options, function(error, response, body) {

					expect(body.twitter).to.equal(user.twitter);
					expect(body.linkedin).to.equal(user.linkedin);
					expect(body.facebook).to.equal(user.facebook);
					expect(body.firstName).to.equal(user.firstName);
					expect(body.lastName).to.equal(user.lastName);
					expect(body.description).to.equal(user.description);
					//expect(body.interests).to.equal(user.interests); I think this works. Comparing arrays in javascript is messy
					expect(body.picture).to.equal(user.picture);
					expect(body.email).to.equal(user.email);

					done();

				});

			});
		});

		it("sendMessage", function(done) {

			const options = {
				url: url + "/api/sendMessage",
				method: "POST",
				json: {
					token: authToken,
					receiver: 10,
					message: "My new message",

				}
			};

			request(options, function(error, response, body) {

				expect(body.status).to.equal("success");

				done();

			});

		});

		it("getMessages", function(done) {

			const options = {
				url: url + "/api/getMessages",
				method: "POST",
				json: {
					token: authToken
				}
			};

			request(options, function(error, response, body) {

				expect(body).to.not.be.empty;
				expect(body).to.be.an("object");

				done();

			});

		});

		it("searchUsers", function(done) {
			const options = {
				url: url + "/api/searchUsers",
				method: "POST",
				json: {
					token: authToken,
					query: user.firstName
				}
			};

			request(options, function(error, response, body) {

				expect(body.status).to.equal("success");
				expect(body.results).to.be.an("array");
				expect(body.results).to.not.be.empty;

				done();
			});
		});

		it("leaveEvent", function(done) {

			const options = {
				url: url + "/api/leaveEvent",
				method: "POST",
				json: {
					token: authToken
				}
			};

			request(options, function(error, response, body) {

				expect(body.status).to.equal("success");

				done();
			});

		});

	});
});
