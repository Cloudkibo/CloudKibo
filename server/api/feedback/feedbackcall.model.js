'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var feedbackcall = new Schema({
		   username : String,
		   audio : Number,
		   video : Number,
		   screen : Number,
		   filetransfer : Number,
		   datetime : {type: Date, default: Date.now }
});

module.exports = mongoose.model('feedbackcall', feedbackcall);
