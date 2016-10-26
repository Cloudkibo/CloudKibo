'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var GroupChatStatus = new Schema({
  msg_unique_id: {type: Schema.ObjectId, ref: 'groupchats'},
  chat_unique_id : String,
  status : String,
  user_phone : String,
  read_date : {type: Date, default: Date.now },
  delivered_date : {type: Date, default: Date.now }
});

module.exports = mongoose.model('groupchatstatuses', GroupChatStatus);
