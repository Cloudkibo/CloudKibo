'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var news = new Schema({
		   label : String,
		   content : String,
		   userid : {type: Schema.ObjectId, ref: 'accounts'},
		   datetime : {type: Date, default: Date.now }
});

module.exports = mongoose.model('news', news);
