'use strict';

var _ = require('lodash');
var Userchat = require('./meetingchat.model.js');

// Get list of userchats
exports.index = function(req, res) {
  console.log(req.body)
  Userchat.find({companyid: req.body.companyid}, function (err, userchats) {
    if(err) { return handleError(res, err); }
    return res.json(200, userchats);
  });
};


function handleError(res, err) {
  return res.send(500, err);
}
