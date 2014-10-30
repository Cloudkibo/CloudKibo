'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var meetingrecord = new Schema({
		   creator : String,
		   roomname : String,
		   members : [String],
		   starttime : {type: Date, default: Date.now },
		   endtime : {type: Date, default: Date.now }
});


module.exports = mongoose.model('meetingrecord', meetingrecord);
