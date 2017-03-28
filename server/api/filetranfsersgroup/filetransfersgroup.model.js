'use strict';

var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var file = new Schema({
      group_unique_id: String,
      total_members: Number,
      members_downloaded: { type: Number, default: 0 },
      from: String,
      date: { type: Date, default: Date.now },
      uniqueid: String,
      file_name: String,
      file_size: Number,
      path: String,
      file_type: String
});


module.exports = mongoose.model('filetransfergroup', file);
