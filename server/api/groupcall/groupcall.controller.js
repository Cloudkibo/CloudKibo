'use strict';

var _ = require('lodash');
var Groupcall = require('./groupcall.model');
var group_user = require('../group_user/groupuser.model');
var user = require('../user/user.model');

// Get list of groupcalls
exports.index = function(req, res) {
  Groupcall.find({groupowner: req.user.username}, function (err,groupcalls) {
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

exports.showgroupmembers = function(req, res) {
  group_user.find({groupid : req.params.id, creator_id : req.user._id}).populate('groupid user_id').exec(function (err, groupcalls) {
    if(err) { return handleError(res, err); }
    if(!groupcalls) { return res.send(404); }
    return res.json(groupcalls);
  });
};

exports.showothergroups = function(req, res) {
  group_user.find({user_id : req.user._id}).populate('groupid').exec(function (err, groupcalls) {
    if(err) { return handleError(res, err); }
    if(!groupcalls) { return res.send(404); }
    return res.json(groupcalls);
  });
};

// Creates a new groupcall in the DB.
exports.create = function(req, res) {
  Groupcall.findOne({groupname : req.body.groupname, groupowner: req.user.username}, function(err, data){
    if(data){
      res.json(200, {status: 'failed', msg: 'Group already created.'});
    }
    else {
      Groupcall.create(req.body, function(err, groupcall) {
        if(err) { return handleError(res, err); }
        Groupcall.find({groupowner: req.user.username}, function (err,groupcalls) {
          if(err) { return handleError(res, err); }
          return res.json(200, groupcalls);
        });
      });
    }
  })
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
      group_user.remove({groupid : req.params.id}, function(err, group_user_response) {
        if(err) { return handleError(res, err); }
        Groupcall.find({groupowner: req.user.username}, function (err,groupcalls) {
          if(err) { return handleError(res, err); }
          return res.json(200, groupcalls);
        });
      });
    });
  });
};

exports.addcontact = function(req, res) {
  console.log(req.body)
  user.findOne({username: req.body.contactusername}, function(err, contact){
    if(contact){
      var group_user_row = {
        creator_id : req.user._id,
        groupid : req.body.group_id,
        user_id : contact._id
      };
      group_user.findOne(group_user_row, function(err, got_row){
        if(got_row){
          res.json(200, {status: 'failed', msg: 'Already a member of this group.'});
        }
        else{
          group_user.create(group_user_row, function(err, group_user_response) {
            if(err) { return handleError(res, err); }
            group_user.find({groupid : req.body.group_id, creator_id : req.user._id}).populate('groupid user_id').exec(function (err, groupcalls) {
              if(err) { return handleError(res, err); }
              if(!groupcalls) { return res.send(404); }
              return res.json(groupcalls);
            });
          });
        }
      });
    }
  })

};



exports.removecontact = function(req, res) {
  user.findOne({username: req.body.contactusername}, function(err, contact){
    if(contact){
      var group_user_row = {
        creator_id : req.user._id,
        groupid : req.body.group_id,
        user_id : contact._id
      };
      group_user.findOne(group_user_row, function (err, group_user_response) {
        if(err) { return handleError(res, err); }
        if(!group_user_response) { return res.send(404); }
        group_user_response.remove(function(err) {
          if(err) { return handleError(res, err); }
          group_user.find({groupid : req.body.group_id, creator_id : req.user._id}).populate('groupid user_id').exec(function (err, groupcalls) {
            if(err) { return handleError(res, err); }
            if(!groupcalls) { return res.send(404); }
            return res.json(groupcalls);
          });
        });
      });
    }

  })
};

function handleError(res, err) {
  return res.send(500, err);
}
