'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var MeetingChatSchema = new Schema({

  to : String,
  from : String,

  visitoremail : String,
  agentemail : String,

  msg : String,

  datetime : {type: Date, default: Date.now },
  request_id : String,

  companyid: String

});

module.exports = mongoose.model('meetingchat', MeetingChatSchema);
