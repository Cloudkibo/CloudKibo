'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var ConfigurationSchema = new Schema({

  googleid : String,
  googlesecret : String,
  facebookid : String,
  facebooksecret : String,
  windowsid : String,
  windowssecret : String,
  sendgridusername : String,
  sendgridpassword : String,
  selectLogo : { type: String, default: 'Logo 1' },
  numberofpeopleincontactlist: Number,
  numberofpeopleinconference: Number

});

module.exports = mongoose.model('configuration', ConfigurationSchema);
