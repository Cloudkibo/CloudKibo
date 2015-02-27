'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var feedbackcall = new Schema({
		   userid : {type: Schema.ObjectId, ref: 'accounts'},
		   audio : Number,
		   video : Number,
		   screen : Number,
		   filetransfer : Number,
		   comment : String,
		   datetime : {type: Date, default: Date.now }
});

module.exports = mongoose.model('feedbackcall', feedbackcall);
