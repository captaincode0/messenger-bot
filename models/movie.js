var mongoose = require("mongoose");
var mongo_schema = mongoose.Schema;

var movie_schema = new mongoose.Schema({
	user_id: {type: String},
	title: {type: String},
	date: {type: String},
	year: {type: String},
	cast: {type: String},
	rating: {type: String},
	poster_url: {type: String}
});

module.exports = mongoose.model("Movie", movie_schema);