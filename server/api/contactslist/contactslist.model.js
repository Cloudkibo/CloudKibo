'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var contactslist = new Schema({
			userid : {type: Schema.ObjectId, ref: 'Account'},
			contactid : {type: Schema.ObjectId, ref: 'Account'},
			unreadMessage : {type: Boolean, default: false },
			detailsshared: {type : String, default :'No'}
});


module.exports = mongoose.model('contactslist', contactslist);
