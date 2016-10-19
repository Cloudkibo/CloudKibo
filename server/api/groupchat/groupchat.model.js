'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var GroupChat = new Schema({
  group_unique_id: {type: Schema.ObjectId, ref: 'groupmessagings'},
  from: String,
  type: String,
  msg : String,
  from_fullname : String,
  unique_id : String,
  date : {type: Date, default: Date.now }
});

module.exports = mongoose.model('groupchats', GroupChat);
