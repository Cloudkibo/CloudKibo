'use strict';

var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var file = new Schema({
      uniqueid: String,
      status: String,
      contact: String
});


module.exports = mongoose.model('daystatus', file);
