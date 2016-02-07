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

exports.specific_conference = function(req, res) {
  console.log(req.body)
  Userchat.find({companyid: req.body.companyid, request_id : req.body.request_id}, function (err, userchats) {
    if(err) { return handleError(res, err); }
    return res.json(200, userchats);
  });
};

exports.generate_url = function(req, res) {

  var today = new Date();
  var uid = Math.random().toString(36).substring(7);
  var unique_id = 'h' + uid + '' + today.getFullYear() + '' + (today.getMonth()+1) + '' + today.getDate() + '' + today.getHours() + '' + today.getMinutes() + '' + today.getSeconds();

  var meetingurl_agent = 'https://api.cloudkibo.com/#/webmeeting/'+ unique_id +'?role=agent&companyid='+ req.body.companyid +'&agentemail='+ req.body.agentemail +'&agentname='+ req.body.agentname +'&visitorname='+ req.body.visitorname +'&visitoremail='+ req.body.visitoremail+'&request_id='+req.body.request_id;

  var meetingurl_visitor = 'https://api.cloudkibo.com/#/webmeeting/'+ unique_id +'?role=visitor&companyid='+ req.body.companyid +'&agentemail='+ req.body.agentemail +'&agentname='+ req.body.agentname +'&visitorname='+ req.body.visitorname +'&visitoremail='+ req.body.visitoremail+'&request_id='+req.body.request_id;

  res.json(200, {url_agent : meetingurl_agent, url_customer : meetingurl_visitor});
};


function handleError(res, err) {
  return res.send(500, err);
}
