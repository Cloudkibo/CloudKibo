'use strict';

var _ = require('lodash');
var Groupcall = require('./groupcall.model');
var group_user = require('../group_user/groupuser.model');

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
exports.destroy = function(req, res) { // todo, this group remove needs more work
  Groupcall.findById(req.params.id, function (err, groupcall) {
    if(err) { return handleError(res, err); }
    if(!groupcall) { return res.send(404); }
    groupcall.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.send(204);
    });
  });
};

exports.addcontact = function(req, res) {
  var group_user_row = {
    creator_id : req.user._id,
    groupid : req.body.group_id,
    user_id : req.body.contact_id
  };
  group_user.find(group_user_row, function(err, got_row){
    if(got_row){
      res.json(200, {status: 'failed', msg: 'Already a member of this group.'});
    }
    else{
      group_user.create(group_user_row, function(err, group_user_response) {
        if(err) { return handleError(res, err); }
        return res.json(201, group_user_response);
      });
    }
  });
};


exports.removecontact = function(req, res) {
  var group_user_row = {
    creator_id : req.user._id,
    groupid : req.body.group_id,
    user_id : req.body.contact_id
  };
  group_user.find(group_user_row, function (err, group_user_response) {
    if(err) { return handleError(res, err); }
    if(!groupcall) { return res.send(404); }
    group_user_response.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.send(204);
    });
  });
};

function handleError(res, err) {
  return res.send(500, err);
}
