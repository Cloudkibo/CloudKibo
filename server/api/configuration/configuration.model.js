'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var ConfigurationSchema = new Schema({

  googleid : String,

  googlesecret : String,

  sendgridusername : String,
  sendgridpassword : String

});

module.exports = mongoose.model('configuration', ConfigurationSchema);
