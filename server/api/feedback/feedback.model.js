'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var feedback = new Schema({
		   userid : {type: Schema.ObjectId, ref: 'accounts'},
		   audio : Number,
		   video : Number,
		   screen : Number,
		   filetransfer : Number,
		   comment : String,
		   datetime : {type: Date, default: Date.now }
});

module.exports = mongoose.model('feedback', feedback);
