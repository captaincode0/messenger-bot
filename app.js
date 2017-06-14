var express = require("express");
var request = require("request");
var body_parser = require("body-parser");
var mongoose = require("mongoose");

var db = mongoose.connect(process.env.MONGODB_URI);
var movie_model = require("./models/movie");

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
				else if(event.message)
					processMessage(event);
			});
		});
	}

	res.sendStatus(200);
});

/**
 * [processPostBack description]
 * @param  {[type]} event [description]
 * @return {[type]}       [description]
 */
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
			var greeting = "";

			if(error)
				console.log("[-] Error getting user name: "+error);
			else{
				var json_res = JSON.parse(body);
				var name = json_res.first_name;
				gretting = "Hi, "+name+", ";
			}

			var message = greeting+"My name is ZZ Moviez bot, i can tell you about recent movies, what do you want to know?";
			sendMessage(sender_id, {text:message});
		});
	}
}

/**
 * [sendMessage description]
 * @param  {[type]} recipient_id [description]
 * @param  {[type]} message      [description]
 * @return {[type]}              [description]
 */
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
	});
}

/**
 * [processMessage process the sended message by the user]
 * @param  {[type]} event [description]
 * @return {[type]}       [description]
 */
function processMessage(event){
	//check if the message is not one echo
	if(!event.message.is_echo){
		var message = event.message;
		var sender_id = event.sender.id;

		console.log("[+] Received message from facebook sender id: "+sender_id);
		console.log("[+] The message is: "+JSON.stringify(message));

		//check if the message has content
		if(message.text){
			//format the message
			var fmt_msg = message.text.toLowerCase().trim();

			//if the message was received then check if match with special keywords
			//the keywords correspond to movie details
			//but when doesn't match look for other movie
			switch(fmt_msg){
				case "release_date":
				case "year":
				case "cast":
				case "rating":
					getMovieDetail(sender_id, fmt_msg);
					break;
				default:
					findMovie(sender_id, fmt_msg);
					break;
			}
		}
		else if(message.attachments)
			sendMessage(sender_id, {text: "Sorry, I can't receive files, i don't understand your request."});
	}
}

/**
 * [getMovieDetail description]
 * @param  {[type]} userId [description]
 * @param  {[type]} field  [description]
 * @return {[type]}        [description]
 */
function getMovieDetail(userId, field){
	movie_model.findOne({user_id: userId}, function(err, movie){
		if(err)
			sendMessage(userId, {text: "Sorry, i can't find your movie, try again :)"});
		else
			sendMessage(user_id, {text:movie[field]});
	});
}

/**
 * [findMovie description]
 * @param  {[type]} userId     [description]
 * @param  {[type]} movieTitle [description]
 * @return {[type]}            [description]
 */
function findMovie(userId, movieTitle){
	request({
		url: "http://www.theimdbapi.org/api/find/movie?title=" + movieTitle, 
		method: "GET"
	}, function(err, res, body){
			if(err){
				sendMessage(userId, "Sorry i can't get the movie that you are looking for, try again");
				return;
			}

			//parse the body content
			var movie_object = JSON.parse(body);

			if(typeof movie_object == "undefined"){
				sendMessage(userId, {text: "Sorry i can't look for your movie"});
				return;
			}

			//get the first result
			movie_object = movie_object[0];

			//define the update for the collection
			var collection_update = {
				user_id: userId,
				title: movieTitle,
				date: movie_object.release_date,
				year: movie_object.year,
				cast: movie_object.cast,
				rating: movie_object.rating,
				poster_url: movie_object.poster.large
			};

			movie_model.findOneAndUpdate({user_id:userId}, collection_update, {upsert: true}, function(err, mov){
					if(err)
						console.log("[-] MongoDB Error: "+err);
					else{
						var message = {
							attachment: {
								type: "template",
								payload: {
									template_type: "generic",
									elements: [{
										title: movie_object.title,
										subtitle: "Is this the movie that are you looking for?",
										image_url: movie_object.poster.large,
										buttons: [{
											type: "postback",
											title: "Yes",
											payload: "Correct"
										},{
											type: "postback",
											title: "No",
											payload: "Incorrect"
										}]
									}]
								}
							}
						};
						sendMessage(userId, message);
					}
				}
			);
		}
	);
}