'use strict';

var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var file = new Schema({
      total_members: Number,
      members_downloaded: { type: Number, default: 0 },
      from: String,
      date: { type: Date, default: Date.now },
      uniqueid: String,
      file_name: String,
      file_size: Number,
      path: String,
      label: String,
      file_type: String
});


module.exports = mongoose.model('filetransferbroadcast', file);
