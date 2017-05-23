'use strict';

var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var file = new Schema({
      date: { type: Date, default: Date.now },
      uniqueid: String,
      file_name: String,
      file_size: Number,
      path: String,
      label: String,
      file_type: String,
      uploadedBy: String
});


module.exports = mongoose.model('daystatus', file);
