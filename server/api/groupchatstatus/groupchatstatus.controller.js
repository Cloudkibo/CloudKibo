'use strict';

var _ = require('lodash');
var GroupChatStatus = require('./groupchatstatus.model');
var groupchat = require('../groupchat/groupchat.model');
var user = require('../user/user.model');
var azure = require('azure');
var logger = require('../../components/logger/logger');

// Get list of GroupChatStatuss
exports.index = function(req, res) {
  GroupChatStatus.find({status:'sent', user_phone: req.user.phone}).populate('msg_unique_id').exec(function (err, groupchatstatus) {
    if(err) { return handleError(res, err); }
    GroupChatStatus.update(
      {status:'sent', user_phone: req.user.phone},
      {status : 'delivered'}, // should have value one of 'delivered', 'seen'
      {multi : true},
      function (err, num){

      }
    );
    GroupChatStatus.populate(groupchatstatus, {
      path: 'msg_unique_id.group_unique_id',
      model: 'groupmessagings'
    },
    function(err, groupchatstatusfilled) {
      if(err) return handleError(res, err);
      return res.json(200, groupchatstatusfilled); // This object should now be populated accordingly.
    });

  });
};

exports.updateStatus = function (req, res){
  GroupChatStatus.update(
    {chat_unique_id : req.body.chat_unique_id, user_phone : req.user.phone},
    {status : req.body.status}, // should have value one of 'delivered', 'seen'
    {multi : false},
    function (err, num){
      if(err) { return handleError(res, err); }
      groupchat.findOne({unique_id : req.body.chat_unique_id}, function(err, gotChat){
        var payload = {
          type : 'group:msg_status_changed',
          status : req.body.status,
          user_phone : req.user.phone,
  				uniqueId : req.body.chat_unique_id
        };

        sendPushNotification(gotChat.from, payload, false);

      })
      return res.json(200, {status : 'success'});
    }
  );
}

exports.checkStatus = function (req, res){
  GroupChatStatus.find({chat_unique_id: { $in: req.body.unique_ids }}, function (err, groupchatstatus) {
    if(err) { return handleError(res, err); }
    return res.json(200, groupchatstatus);
  });
}

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

var notificationHubService = azure.createNotificationHubService('Cloudkibo','Endpoint=sb://cloudkibo.servicebus.windows.net/;SharedAccessKeyName=DefaultFullSharedAccessSignature;SharedAccessKey=arTrXZQGBUeuLYLcwTTzCVqFDN1P3a6VrxA15yvpnqE=');
function sendPushNotification(tagname, payload, sendSound){
  tagname = tagname.substring(1);
  var iOSMessage = {
    alert : payload.msg,
    'content-available':true,
    sound : 'UILocalNotificationDefaultSoundName',
    badge : payload.badge,
    payload : payload
  };
  if(!sendSound){
    iOSMessage = {
      payload : payload
    };
  }
  var androidMessage = {
    to : tagname,
    priority : 'high',
    data : {
      message : payload
    }
  }
  notificationHubService.gcm.send(tagname, androidMessage, function(error){
    if(!error){
      logger.serverLog('info', 'Azure push notification sent to Android using GCM Module, client number : '+ tagname);
    } else {
      logger.serverLog('info', 'Azure push notification error : '+ JSON.stringify(error));
    }
  });
  notificationHubService.apns.send(tagname, iOSMessage, function(error){
    if(!error){
      logger.serverLog('info', 'Azure push notification sent to iOS using GCM Module, client number : '+ tagname);
    } else {
      logger.serverLog('info', 'Azure push notification error : '+ JSON.stringify(error));
    }
  });

  // For iOS Local testing only
  var notificationHubService2 = azure.createNotificationHubService('CloudKiboIOSPush','Endpoint=sb://cloudkiboiospush.servicebus.windows.net/;SharedAccessKeyName=DefaultFullSharedAccessSignature;SharedAccessKey=0JmBCY+BNqMhuAS1g39wPBZFoZAX7M+wq4z4EWaXgCs=');

  notificationHubService2.apns.send(tagname, iOSMessage, function(error){
    if(!error){
      logger.serverLog('info', 'Azure push notification sent to iOS (local testing) using GCM Module, client number : '+ tagname);
    } else {
      logger.serverLog('info', 'Azure push notification error (iOS local testing) : '+ JSON.stringify(error));
    }
  });

}
