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
		//return one status if the tokens doesn't match
		console.log("[-] Invalid token, the tokens doesn't match");
		res.sendStatus(403);
	}
});

//post method to make a webhook of the page
app.post("/webhook", function(req, res){
	//check if the current object is one page subscription
	if(req.body.object == "page"){
		//iterate all the entries if there is more than one
		req.body.entry.forEach(function(entry){
			//iterate message events
			entry.messaging.forEach(function(event){
				if(event.postback)
					processPostBack(event);
			});
		});
	}
});

function processPostBack(event){
	var sender_id = event.sender.id;
	var data_payload = event.postback.payload;

	if(data_payload === "Greeting"){
		//make one async request
		request({
			url: "https://graph.facebook.com/v2.6/"+sender_id,
			qs: {
				access_token: process.env.PAGE_ACCESS_TOKEN,
				fields: "first_name"
			},
			method: "GET"
		}, function(error, res, body){
			let greeting = "";

			if(error)
				console.log("[-] Error getting user name"+error);
			else{
				let json_res = JSON.parse(body);
				name = json_res.first_name;
				gretting = "Hi, "+name+", ";
			}

			let message = greeting+"my name is ZZ Moviez bot, i can tell you about recent movies, actors and directors";
			sendMessage(sender_id, message);
		});
	}
}

function sendMessage(recipient_id, message){
	request({
		url: "https://graph.facebook.com/v2.6/me/messages",
		qs: {access_token: process.env.PAGE_ACCESS_TOKEN},
		method: "POST",
		json: {
			recipient: {id: recipient_id},
			message: message
		}
	}, function(error, response, body){
		if(error)
			console.log("[-] Error sending the message: "+response.error);
	})
}