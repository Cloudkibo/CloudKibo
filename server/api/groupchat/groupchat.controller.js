'use strict';

var _ = require('lodash');
var GroupChats = require('./groupchat.model');
var user = require('../user/user.model');
var groupchatstatus = require('../groupchatstatus/groupchatstatus.model');
var groupmessaginguser = require('../groupmessaginguser/groupmessaginguser.model');
var logger = require('../../components/logger/logger');
var azure = require('azure');

// Get list of GroupChatss
exports.index = function(req, res) {
  GroupChats.find(function (err, groupchats) {
    if(err) { return handleError(res, err); }
    return res.json(200, groupchats);
  });
};

exports.fetchSingleChat = function(req, res){
  GroupChats.findOne({unique_id : req.body.unique_id}, function (err, groupchat) {
    if(err) { return handleError(res, err); }
    return res.json(200, groupchat);
  });
};

// Creates a new GroupChats in the DB.
exports.create = function(req, res) {
  GroupChats.create(req.body, function(err, groupchat) {
    if(err) { return handleError(res, err); }
    groupmessaginguser.find({group_unique_id : req.body.group_unique_id}, function(err2, usersingroup){
      if(err2) return handleError(res, err);
      for(var i in usersingroup){
        user.findOne({phone : usersingroup[i].member_phone}, function(err, dataUser){
          if(req.body.from === usersingroup[i].member_phone) continue;
          var payload = {
            type : 'group:chat_received',
            senderId : req.body.from,
            groupId : req.body.group_unique_id,
            msg_type : req.body.type,
            unique_id : req.body.unique_id,
            badge : dataUser.iOS_badge + 1
          };

          logger.serverLog('info', 'sending push to group member '+ usersingroup[i].member_phone +' that you are added to group');
          sendPushNotification(usersingroup[i].member_phone, payload, true);

          var chatStatusBody = {
            msg_unique_id: req.body.group_unique_id,
            status : 'sent',
            user_phone : usersingroup[i].member_phone,
          }
          groupchatstatus.save(chatStatusBody, function(err, groupChatStatus){

          })

          dataUser.iOS_badge = dataUser.iOS_badge + 1;
          dataUser.save(function(err){

          });
        })
      }
    })
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

var notificationHubService = azure.createNotificationHubService('Cloudkibo','Endpoint=sb://cloudkibo.servicebus.windows.net/;SharedAccessKeyName=DefaultFullSharedAccessSignature;SharedAccessKey=arTrXZQGBUeuLYLcwTTzCVqFDN1P3a6VrxA15yvpnqE=');
function sendPushNotification(tagname, payload, sendSound){
  tagname = tagname.substring(1);
  var iOSMessage = {
    alert : payload.msg,
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
