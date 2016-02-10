/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/companyaccounts              ->  index
 */

'use strict';

var CompanyAccount = require('./companyaccount.model.js');


exports.webhook = function (req, res){

  CompanyAccount.findOne({companyid: req.body.companyid}, function (err, company) {
    if (err) return done(err);
    if (!company) return res.json(501, {status: 'Company not registered'});

    company.webhook = req.body.webhook;
    company.save(function(err) {
      if (err) return validationError(res, err);
      res.json(200, {status: 'Updated Webhook URL'});
    });
  })

};

exports.index = function (req, res){ // put it in docs and database

  CompanyAccount.findOne({companyid: req.body.companyid}, '-appsecret -appid -_id', function (err, company) {
    if (err) return done(err);
    if (!company) return res.json(501, {status: 'Company not registered'});

    res.json(200, {company: company});

  })

};
