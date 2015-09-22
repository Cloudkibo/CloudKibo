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



socket.on('message', function (message) {
  console.log('Client received message: '+ JSON.stringify(message));
  $log.info('Client received message: '+ JSON.stringify(message));
  logger.log('Client received message: '+ JSON.stringify(message));

  if (message.msg === 'got user media') {
    if (isInitiator && !isStarted) {
      $scope.startCalling();//maybeStart();
      $log.info("Start call");
      logger.log("Start call");
    }
  }
  else if (message.type === 'offer') {
    console.log("msg is "+message)
    $log.info("msg is "+message)
    logger.log("msg is "+message)
    if(!isStarted){
      if (!isInitiator && !isStarted) {
        maybeStart();
      }
      pc.setRemoteDescription(new RTCSessionDescription(message));
      doAnswer();

    }

    else if(message.sharingAudio === 'close') {

      pc.setRemoteDescription(new RTCSessionDescription(message));

      $scope.audioTogglingFromOtherSide = true;

      pc.createAnswer(function(sessionDescription){

          // Set Opus as the preferred codec in SDP if Opus is present.
          pc.setLocalDescription(sessionDescription);

          sendMessage(sessionDescription);
          console.log('Sending answer to audio share false')
          $log.info('Sending answer to audio share false')
          logger.log('Sending answer to audio share false')

        },
        function (error){console.log(error); $log.info(error)}, sdpConstraints);
      console.log("Audio share STOPPED ");
      logger.log("Audio share STOPPED ");

    }
    else if(message.sharingVideo === 'open') {

      pc.setRemoteDescription(new RTCSessionDescription(message));

      $scope.videoTogglingFromOtherSide = true;

      pc.createAnswer(function(sessionDescription){

          // Set Opus as the preferred codec in SDP if Opus is present.
          pc.setLocalDescription(sessionDescription);

          sendMessage(sessionDescription);
          console.log('Sending answer to video share true')
          $log.info('Sending answer to video share true')
          logger.log('Sending answer to video share true')

        },

        function (error){console.log(error); $log.info(error)}, sdpConstraints);
      console.log("Video share open ");
      $log.info("Video share open ");
      logger.log("Video share open ");
    }
    else if(message.sharingVideo === 'close') {

      pc.setRemoteDescription(new RTCSessionDescription(message));

      $scope.videoTogglingFromOtherSide = true;

      pc.createAnswer(function(sessionDescription){

          // Set Opus as the preferred codec in SDP if Opus is present.
          pc.setLocalDescription(sessionDescription);

          sendMessage(sessionDescription);
          console.log('Sending answer to video share false')
          $log.info('Sending answer to video share false')
          logger.log('Sending answer to video share false')

        },
        function (error){console.log(error); $log.info(error)}, sdpConstraints);

    }
  } else if (message.type === 'answer' && isStarted) {
    pc.setRemoteDescription(new RTCSessionDescription(message));
  } else if (message.type === 'candidate' && isStarted) {
    var candidate = new RTCIceCandidate({
      sdpMLineIndex: message.label,
      candidate: message.candidate
    });
    pc.addIceCandidate(candidate);
  }
});


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
