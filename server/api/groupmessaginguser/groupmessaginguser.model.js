'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var GroupMessagingUser = new Schema({
  group_unique_id: {type: Schema.ObjectId, ref: 'groupmessagings'},
  member_phone: String,
  display_name: String,
  isAdmin: String,
  membership_status : String,
  date_join : {type: Date, default: Date.now },
  date_left : Date
});

module.exports = mongoose.model('groupmessagingusers', GroupMessagingUser);
