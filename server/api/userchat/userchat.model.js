'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userchat = new Schema({
      to : String,
      from : String,
      fromFullName : String,
      msg : String,
      date : {type: Date, default: Date.now },
      owneruser : String,
      uniqueid : String,
      status : String,
      type : String, // values : 'chat' or 'file'
      file_type : String
});



module.exports = mongoose.model('userchat', userchat);
