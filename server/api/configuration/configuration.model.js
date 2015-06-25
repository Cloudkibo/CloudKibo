'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var ConfigurationSchema = new Schema({

  googleid : String,

  googlesecret : String,

  sendgridusername : String,
  sendgridpassword : String,
  selectLogo : { type: String, default: 'Logo 1' }

});

module.exports = mongoose.model('configuration', ConfigurationSchema);
