'use strict';

var _ = require('lodash');
var GroupMessagingUsers = require('./groupmessaginguser.model');
var GroupMessaging = require('../groupmessaging/groupmessaging.model');
var user = require('../user/user.model');
var logger = require('../../components/logger/logger');
var azure = require('azure');

// Get list of GroupMessagingUserss
exports.index = function(req, res) {
  GroupMessagingUsers.find(function (err, groupmessagingusers) {
    if(err) { return handleError(res, err); }
    return res.json(200, groupmessagingusers);
  });
};

// Creates a new GroupMessagingUsers in the DB.
exports.create = function(req, res) {

  GroupMessagingUsers.findOne({member_phone : req.user.phone, group_unique_id : req.body.group_unique_id}, function(err, gotAdmin){

    GroupMessaging.findOne({unique_id : req.body.group_unique_id}, function(err, gotGroup)){

      if(gotAdmin.isAdmin === 'Yes'){
        var membersArray = req.body.members;

        for (var i in clients) {
          var groupmember = {
            group_unique_id: gotGroup._id,
            member_phone: membersArray[i],
            isAdmin: 'No',
            membership_status : 'joined'
          }
          GroupMessagingUsers.create(groupmember, function(err3, groupmembersaved1){
            if(err3) { return handleError(res, err); }
            // SEND PUSH NOTIFICATION HERE
            user.findOne({phone : groupmembersaved1.member_phone}, function(err, dataUser){
          		var payload = {
          			type : 'group:you_are_added',
          			senderId : req.user.phone,
          			groupId : req.body.group_unique_id,
                isAdmin: 'No',
                membership_status : 'joined',
                group_name: req.body.group_name,
          			badge : dataUser.iOS_badge + 1
          		};

          		logger.serverLog('info', 'sending push to group member '+ groupmembersaved1.member_phone +' that you are added to group');
          		sendPushNotification(groupmembersaved1.member_phone, payload, true);

          		dataUser.iOS_badge = dataUser.iOS_badge + 1;
          		dataUser.save(function(err){

          		});
            })
          })
        }

        return res.json(201, {status: 'success', msg:'New members are added to group.'});
      } else {
        return res.json('501', {status: 'unauthorized', msg:'You are not admin of this group.'})
      }
    }

  })

  GroupMessagingUsers.create(req.body, function(err, groupmessaginguser) {
    if(err) { return handleError(res, err); }
    return res.json(201, groupmessaginguser);
  });
};

// Updates an existing GroupMessagingUsers in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  GroupMessagingUsers.findById(req.params.id, function (err, groupmessaginguser) {
    if (err) { return handleError(res, err); }
    if(!groupmessaginguser) { return res.send(404); }
    var updated = _.merge(groupmessaginguser, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.json(200, groupmessaginguser);
    });
  });
};

// Deletes a GroupMessagingUsers from the DB.
exports.destroy = function(req, res) {
  GroupMessagingUsers.findById(req.params.id, function (err, groupmessaginguser) {
    if(err) { return handleError(res, err); }
    if(!groupmessaginguser) { return res.send(404); }
    groupmessaginguser.remove(function(err) {
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
