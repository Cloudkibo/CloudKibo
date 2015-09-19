/**
 * Created by Saba on 09/19/2015.
 */
'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var groupcall = new Schema({
  groupname : String,
  groupowner : String,
  createdate : {type: Date, default: Date.now }
});


module.exports = mongoose.model('Groupcall', groupcall);
