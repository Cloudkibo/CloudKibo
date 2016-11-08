'use strict';

var _ = require('lodash');
var GroupChats = require('./groupchat.model');
var user = require('../user/user.model');
var groupchatstatus = require('../groupchatstatus/groupchatstatus.model');
var groupmessaginguser = require('../groupmessaginguser/groupmessaginguser.model');
var groupmessaging = require('../groupmessaging/groupmessaging.model');
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
  GroupChats.findOne({unique_id : req.body.unique_id}).populate('group_unique_id').exec(function (err, groupchat) {
    if(err) { return handleError(res, err); }
    groupchatstatus.findOne({chat_unique_id : req.body.unique_id, user_phone : req.user.phone}, function(err, status){
      if(err) { return handleError(res, err); }
      status.status = 'delivered';
      status.delivered_date = Date.now();
      status.save(function(err){

        var payload = {
          type : 'group:msg_status_changed',
          user_phone : req.user.phone,
          status : 'delivered',
          uniqueId : req.body.unique_id
        };

        sendPushNotification(groupchat.from, payload, false);

      })
    })
    return res.json(200, groupchat);
  });
};

// Creates a new GroupChats in the DB.
exports.create = function(req, res) {
  logger.serverLog('info', 'group chat body '+ JSON.stringify(req.body));
  groupmessaging.findOne({unique_id : req.body.group_unique_id}, function(err, groupFound){
    if(err) { return handleError(res, err); }
    var body = {
      group_unique_id: groupFound._id,
      from: req.body.from,
      type: req.body.type,
      msg : req.body.msg,
      from_fullname : req.body.from_fullname,
      unique_id : req.body.unique_id,
    }
    logger.serverLog('info', 'group where chat is sent '+ JSON.stringify(groupFound));
    GroupChats.create(body, function(err, groupchat) {
      if(err) { return handleError(res, err); }
      groupmessaginguser.find({group_unique_id : body.group_unique_id}, function(err2, usersingroup){
        logger.serverLog('info', 'members in group which will get chat '+ JSON.stringify(usersingroup));
        if(err2) return handleError(res, err);
        usersingroup.forEach(function(useringroup){
          logger.serverLog('info', 'member in group is being checked '+ JSON.stringify(useringroup));
          if(req.body.from !== useringroup.member_phone){
            if(useringroup.membership_status === 'joined'){
              user.findOne({phone : useringroup.member_phone}, function(err, dataUser){
                logger.serverLog('info', 'member in group which will get chat '+ JSON.stringify(dataUser));
                var payload = {
                  type : 'group:chat_received',
                  senderId : req.body.from,
                  groupId : req.body.group_unique_id,
                  msg_type : req.body.type,
                  unique_id : req.body.unique_id,
                  msg : req.body.msg,
                  badge : dataUser.iOS_badge + 1
                };

                logger.serverLog('info', 'sending push to group member '+ useringroup.member_phone +' that you are added to group');
                sendPushNotification(dataUser.phone, payload, true);

                var chatStatusBody = {
                  chat_unique_id: req.body.unique_id,
                  msg_unique_id : groupchat._id,
                  status : 'sent',
                  user_phone : dataUser.phone,
                }
                groupchatstatus.create(chatStatusBody, function(err, groupChatStatus){

                })

                dataUser.iOS_badge = dataUser.iOS_badge + 1;
                dataUser.save(function(err){

                });
              })
            }
          }
        })
      })
      return res.json(201, groupchat);
    });
  })
  logger.serverLog('info', 'create group chat body '+ JSON.stringify(req.body));
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
