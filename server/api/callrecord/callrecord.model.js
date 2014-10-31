'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var callrecord = new Schema({
		   caller : String,
		   callee : String,
		   starttime : {type: Date, default: Date.now },
		   endtime : {type: Date, default: Date.now }
});


module.exports = mongoose.model('callrecord', callrecord);
