'use strict';

var _ = require('lodash');
var Configuration = require('./configuration.model');
var user = require('../user/user.model');

// Get list of configurations
exports.index = function(req, res) {
  Configuration.find(function (err, configurations) {
    if(err) { return handleError(res, err); }
    return res.json(200, configurations);
  });
};

// Get the only configuration
exports.fetch = function(req, res) {
  Configuration.findOne({}, function (err, configuration) {
    if(err) { return handleError(res, err); }
    return res.json(200, configuration);
  });
};

// Get a single configuration
exports.show = function(req, res) {
  Configuration.findById(req.params.id, function (err, configuration) {
    if(err) { return handleError(res, err); }
    if(!configuration) { return res.send(404); }
    return res.json(configuration);
  });
};

// Creates or update configuration for super user in the DB.
exports.create = function(req, res) {
  user.findById(req.user._id, function (err, gotUser) {
    if (err) return console.log(err);

    if(gotUser.isOwner == 'Yes') {

      Configuration.findOne({}, function (err, gotConfig) {

        if (gotConfig == null) {

          var newData = new configuration({
            abandonedscheduleemail1 : req.body.abandonedscheduleemail1,
            abandonedscheduleemail2 : req.body.abandonedscheduleemail2,
            abandonedscheduleemail3 : req.body.abandonedscheduleemail3,
            completedscheduleemail1 : req.body.completedscheduleemail1,
            completedscheduleemail2 : req.body.completedscheduleemail2,
            completedscheduleemail3 : req.body.completedscheduleemail3,
            invitedscheduleemail1 : req.body.invitedscheduleemail1,
            invitedscheduleemail2 : req.body.invitedscheduleemail2,
            invitedscheduleemail3 : req.body.invitedscheduleemail3,
            maxnumberofdepartment : req.body.maxnumberofdepartment,
            sendgridusername : req.body.sendgridusername,
            sendgridpassword : req.body.sendgridpassword
          });

          newData.save(function (err) {
            if (err) return console.log(err);

            res.send({status : 'success', msg: newData});
          });

        } else {

          gotConfig.abandonedscheduleemail1 = req.body.abandonedscheduleemail1;
          gotConfig.abandonedscheduleemail2 = req.body.abandonedscheduleemail2;
          gotConfig.abandonedscheduleemail3 = req.body.abandonedscheduleemail3;
          gotConfig.completedscheduleemail1 = req.body.completedscheduleemail1;
          gotConfig.completedscheduleemail2 = req.body.completedscheduleemail2;
          gotConfig.completedscheduleemail3 = req.body.completedscheduleemail3;
          gotConfig.invitedscheduleemail1 = req.body.invitedscheduleemail1;
          gotConfig.invitedscheduleemail2 = req.body.invitedscheduleemail2;
          gotConfig.invitedscheduleemail3 = req.body.invitedscheduleemail3;
          gotConfig.maxnumberofdepartment = req.body.maxnumberofdepartment;
          gotConfig.sendgridusername = req.body.sendgridusername;
          gotConfig.sendgridpassword = req.body.sendgridpassword;


          gotConfig.save(function (err) {
            if (err) return console.log(err);

            res.send({status : 'success', msg: gotConfig});

          });

        }

      });

    }

  });
};

// Updates an existing configuration in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  Configuration.findById(req.params.id, function (err, configuration) {
    if (err) { return handleError(res, err); }
    if(!configuration) { return res.send(404); }
    var updated = _.merge(configuration, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.json(200, configuration);
    });
  });
};

// Deletes a configuration from the DB.
exports.destroy = function(req, res) {
  Configuration.findById(req.params.id, function (err, configuration) {
    if(err) { return handleError(res, err); }
    if(!configuration) { return res.send(404); }
    configuration.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.send(204);
    });
  });
};

function handleError(res, err) {
  return res.send(500, err);
}
