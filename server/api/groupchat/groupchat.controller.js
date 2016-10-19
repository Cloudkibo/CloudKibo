'use strict';

var _ = require('lodash');
var ChannelAssignments = require('./channelassignment.model');
var user = require('../user/user.model');
var configuration = require('../configuration/configuration.model');

// Get list of ChannelAssignmentss
exports.index = function(req, res) {
  ChannelAssignments.find(function (err, channelassignments) {
    if(err) { return handleError(res, err); }
    return res.json(200, channelassignments);
  });
};

// Creates a new ChannelAssignments in the DB.
exports.create = function(req, res) {
  ChannelAssignments.create(req.body, function(err, channelassignment) {
    if(err) { return handleError(res, err); }
    return res.json(201, channelassignment);
  });
};

// Updates an existing ChannelAssignments in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  ChannelAssignments.findById(req.params.id, function (err, channelassignment) {
    if (err) { return handleError(res, err); }
    if(!channelassignment) { return res.send(404); }
    var updated = _.merge(channelassignment, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.json(200, channelassignment);
    });
  });
};

// Deletes a ChannelAssignments from the DB.
exports.destroy = function(req, res) {
  ChannelAssignments.findById(req.params.id, function (err, channelassignment) {
    if(err) { return handleError(res, err); }
    if(!channelassignment) { return res.send(404); }
    channelassignment.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.send(204);
    });
  });
};

function handleError(res, err) {
  return res.send(500, err);
}
