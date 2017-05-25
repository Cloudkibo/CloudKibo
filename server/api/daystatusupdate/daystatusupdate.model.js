'use strict';

var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var file = new Schema({
      uniqueid: String,
      time: { type: Date, default: Date.now },
      uploadedBy: String,
      contact: String
});


module.exports = mongoose.model('daystatusupdate', file);
