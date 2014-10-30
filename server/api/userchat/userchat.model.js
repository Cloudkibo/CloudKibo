'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userchat = new Schema({
      to : String,
      from : String,
      fromFullName : String,
      msg : String,
      date : {type: Date, default: Date.now }
});


module.exports = mongoose.model('userchat', userchat);
