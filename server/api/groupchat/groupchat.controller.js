'use strict';

var _ = require('lodash');
var GroupChats = require('./groupchat.model');
var user = require('../user/user.model');

// Get list of GroupChatss
exports.index = function(req, res) {
  GroupChats.find(function (err, groupchats) {
    if(err) { return handleError(res, err); }
    return res.json(200, groupchats);
  });
};

// Creates a new GroupChats in the DB.
exports.create = function(req, res) {
  GroupChats.create(req.body, function(err, groupchat) {
    if(err) { return handleError(res, err); }
    return res.json(201, groupchat);
  });
};

// Updates an existing GroupChats in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  GroupChats.findById(req.params.id, function (err, groupchat) {
    if (err) { return handleError(res, err); }
    if(!groupchat) { return res.send(404); }
    var updated = _.merge(groupchat, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.json(200, groupchat);
    });
  });
};

// Deletes a GroupChats from the DB.
exports.destroy = function(req, res) {
  GroupChats.findById(req.params.id, function (err, groupchat) {
    if(err) { return handleError(res, err); }
    if(!groupchat) { return res.send(404); }
    groupchat.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.send(204);
    });
  });
};

function handleError(res, err) {
  return res.send(500, err);
}
