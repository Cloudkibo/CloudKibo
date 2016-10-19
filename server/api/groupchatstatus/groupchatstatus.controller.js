'use strict';

var _ = require('lodash');
var GroupChatStatus = require('./groupchatstatus.model');
var user = require('../user/user.model');

// Get list of GroupChatStatuss
exports.index = function(req, res) {
  GroupChatStatus.find(function (err, groupchatstatus) {
    if(err) { return handleError(res, err); }
    return res.json(200, groupchatstatus);
  });
};

// Creates a new GroupChatStatus in the DB.
exports.create = function(req, res) {
  GroupChatStatus.create(req.body, function(err, groupchatstatus) {
    if(err) { return handleError(res, err); }
    return res.json(201, groupchatstatus);
  });
};

// Updates an existing GroupChatStatus in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  GroupChatStatus.findById(req.params.id, function (err, groupchatstatus) {
    if (err) { return handleError(res, err); }
    if(!groupchatstatus) { return res.send(404); }
    var updated = _.merge(groupchatstatus, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.json(200, groupchatstatus);
    });
  });
};

// Deletes a GroupChatStatus from the DB.
exports.destroy = function(req, res) {
  GroupChatStatus.findById(req.params.id, function (err, groupchatstatus) {
    if(err) { return handleError(res, err); }
    if(!groupchatstatus) { return res.send(404); }
    groupchatstatus.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.send(204);
    });
  });
};

function handleError(res, err) {
  return res.send(500, err);
}
