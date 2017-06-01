'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var contactslist = new Schema({
			userid: { type: Schema.ObjectId, ref: 'accounts' },
			contactid: { type: Schema.ObjectId, ref: 'accounts' },
			unreadMessage: { type: Boolean, default: false },
			detailsshared: { type: String, default: 'No' },
			is_mute: { type: String, default: 'No' }, // possible values : yes or no
			start_mute_time: Number,
			end_mute_time: Number
});

module.exports = mongoose.model('contactslist', contactslist);
