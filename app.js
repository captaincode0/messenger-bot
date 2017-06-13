var express = require("express");
var request = require("request");
var body_parser = require("body-parser");

/**
 * Research
 * 1. body parser
 * 2. request
 */

//create the express application
var app = express();

//use the body parser in the application to make the routes
app.use(body_parser.urlencoded({extended:false}));

//use the body parser json module to encode in json
app.use(body_parser.json());

//set the application listen port, the default port 
//or the port 5000
app.listen((process.env.PORT) || 5000);

//serve the index page
app.get("/", function(req, res){
	res.send("Captaincode Messenger Bot Deployed");
});

// set the facebook web hook
app.get("/webhook", function(req, res){
	//verify the current token
	if(req.query["hub.verify_token"] === process.env.FB_TOKEN){
		console.log("[+] Verified token");
		res.status(200).send(req.query["hub.challenge"]);
	}
	else{
		console.log("[-] Invalid token, the tokens doesn't match");
		res.sendStatus(403);
	}
});