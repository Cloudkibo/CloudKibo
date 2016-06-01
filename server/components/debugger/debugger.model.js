'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var DebuggerSchema = new Schema({
  type : String,
  description : String,
  username : String,
  room_name : String,
  device : String,
  browser : String,
  platform : String,
  createdAt : {type: Date, required: true, default: Date.now, expires: '120h'} // 5 days
});

module.exports = mongoose.model('debuggers', DebuggerSchema);
