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

exports.addcontacttogroup = function(req, res) {
  User.findById(req.user._id, function (err, gotUser) {
    if (err) return console.log('Error 1'+ err);

    User.findOne({username : req.body.searchusername}, function (err, gotUserSaved) {

      console.log("Add user to group")
      if(gotUserSaved == null)
        return res.send({status: 'success', msg: null});

      grouplist.count({userid : gotUser._id, contactid : gotUserSaved._id}, function(err5, gotCount){

        if(gotUser.username == gotUserSaved.username)
          res.send({status: 'danger', msg: 'You can not add your self as a group.'});
        else if(gotCount > 0)
          res.send({status: 'danger', msg: gotUserSaved.username +' is already added in your group list with name '+ gotUserSaved.firstname +' '+ gotUserSaved.lastname});
        else{

          configuration.findOne({}, function (err, gotConfig) {
            if(err) return console.log(err);

            grouplist.count({userid : gotUser._id}, function(err, gotFullCount){
              if(err) return console.log(err);

              if(gotConfig.numberofpeopleingrouplist === gotFullCount){
                logger.serverLog("warn", "groupmember list full");
                res.send({status: 'danger', msg: 'Your groupmember list is full.'});

              }
              else{
                var groupmember = new grouplist({
                  userid : gotUser._id,
                  groupid : gotUserSaved._id
                });

                groupmember.save(function(err2){
                  if (err2) return console.log('Error 2'+ err);
                  grouplist.find({userid : gotUser._id}).populate('contactid').exec(function(err3, gotGroupList){
                    res.send({status: 'success', msg: gotGroupList});
                  })
                })

              }

            });

          });


        }
        console.log("contact add by username");
      })

    })
  })
};


exports.removecontactfromgroup = function(req, res) {

  logger.serverLog('info', 'grouplist.controller : The data sent by client: '+ JSON.stringify(req.body));

  console.log("Removing from group list request")
  User.findById(req.user._id, function (err, gotUser) {
    if (err) return console.log('Error 1'+ err);

    User.findOne({username : req.body.username}, function (err, gotUserSaved) {
      grouplist.remove({userid : gotUserSaved._id, groupid : gotUser._id}, function(err6){
        console.log("Is in group list")
        grouplist.remove({userid : gotUser._id, groupid : gotUserSaved._id}, function(err6){
          console.log("Is in my list")

          userchat.remove({$or: [ { to : gotUserSaved.username, from : gotUser.username },
              { to : gotUser.username, from : gotUserSaved.username } ]},
            function(err1){
              if(err1) return console.log(err1);

              res.send({status: 'success', msg: 'Friend is removed'});

              logger.serverLog('info', 'grouplist.controller : Friend removed from grouplist');

            })

        })

      })

    })
  })
};


function handleError(res, err) {
  return res.send(500, err);
}
