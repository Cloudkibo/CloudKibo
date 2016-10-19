'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var GroupSchema = new Schema({
  group_name: String,
  group_icon: String,
  unique_id: String,
  date_creation : {type: Date, default: Date.now }
});

module.exports = mongoose.model('groupmessagings', GroupSchema);
