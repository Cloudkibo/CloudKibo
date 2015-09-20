'use strict';

var _ = require('lodash');
var Groupcall = require('./groupcall.model');

// Get list of groupcalls
exports.index = function(req, res) {
  Groupcall.find(function (err,groupcalls) {
    if(err) { return handleError(res, err); }
    return res.json(200, groupcalls);
  });
};

// Get a single groupcall
exports.show = function(req, res) {
  Groupcall.findOne({token: req.params.id}, function (err, groupcall) {
    if(err) { return handleError(res, err); }
    if(!groupcall) { return res.send(404); }
    return res.json(groupcall);
  });
};

// Creates a new groupcall in the DB.
exports.create = function(req, res) {
  Groupcall.create(req.body, function(err, groupcall) {
    if(err) { return handleError(res, err); }
    return res.json(201, groupcall);
  });
};

// Updates an existing groupcall in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  Groupcall.findById(req.params.id, function (err, groupcall) {
    if (err) { return handleError(res, err); }
    if(!groupcall) { return res.send(404); }
    var updated = _.merge(groupcall, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.json(200, groupcall);
    });
  });
};

// Deletes a groupcall from the DB.
exports.destroy = function(req, res) {
  Groupcall.findById(req.params.id, function (err, groupcall) {
    if(err) { return handleError(res, err); }
    if(!groupcall) { return res.send(404); }
    groupcall.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.send(204);
    });
  });
};

function handleError(res, err) {
  return res.send(500, err);
}
