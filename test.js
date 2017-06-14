var express = require("express");
var request = require("request");
var body_parser = require("body-parser");

var app = express();
app.use(body_parser.urlencoded({extended:false}));
app.use(body_parser.json());
app.listen(3333);

//serve the index page
app.get("/", function(req, res){
	request({
		url: "http://www.theimdbapi.org/api/find/movie?title=transformers", 
		method: "GET",
	}, function(err, res, body){
		var m = JSON.parse(body);
		m = m[0];
		console.log(m.rating);
	});

	res.send("Nothing happens");
	res.sendStatus(200);
});