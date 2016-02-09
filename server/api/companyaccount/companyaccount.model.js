'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var CompanyAccountSchema = new Schema({

  appid : String,
  appsecret : String,
  companyid: String,
  webhook: String,
  companyname: String

});

// Note: company id is same as kibo client id

module.exports = mongoose.model('companyaccounts', CompanyAccountSchema);
