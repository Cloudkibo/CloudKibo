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

    if(gotUser.role === 'admin') {

      Configuration.findOne({}, function (err, gotConfig) {


        if (gotConfig == null) {

          var newData = new configuration({
            googleid : req.body.googleid,
            googlesecret : req.body.googlesecret,
            sendgridusername : req.body.sendgridusername,
            sendgridpassword : req.body.sendgridpassword,
            selectLogo : req.body.selectLogo,
            numberofpeopleincontactlist: req.body.numberofpeopleincontactlist,
            numberofpeopleinconference: req.body.numberofpeopleinconference,
            sitedomain : req.body.sitedomain,
            kibodomain : req.body.kibodomain

          });
          console.log("update configuration for superuser")

          newData.save(function (err) {
            if (err) return console.log(err);

            res.send({status : 'success', msg: newData});
          });

        } else {

          gotConfig.googleid = req.body.googleid;
          gotConfig.googlesecret = req.body.googlesecret;
          gotConfig.sendgridusername = req.body.sendgridusername;
          gotConfig.sendgridpassword = req.body.sendgridpassword;
          gotConfig.selectLogo = req.body.selectLogo;
          gotConfig.numberofpeopleincontactlist = req.body.numberofpeopleincontactlist;
          gotConfig.numberofpeopleinconference = req.body.numberofpeopleinconference;
          gotConfig.sitedomain = req.body.sitedomain;
          gotConfig.kibodomain = req.body.kibodomain


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
  console.log("update configuration")
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

  console.log("delete configuration")
};

function handleError(res, err) {
  return res.send(500, err);
}
