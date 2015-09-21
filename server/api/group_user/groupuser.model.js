/**
 * Created by Saba on 09/19/2015.
 */
'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var groupuser = new Schema({
  creator_id : {type: Schema.ObjectId, ref: 'accounts'},
  groupid : {type: Schema.ObjectId, ref: 'Groupcall'},
  user_id : {type: Schema.ObjectId, ref: 'accounts'}
});


module.exports = mongoose.model('groupuser', groupuser);
