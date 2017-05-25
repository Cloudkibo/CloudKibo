'use strict';

var daystatusupdate = require('./daystatusupdate.model');
var Contactslist = require('../contactslist/contactslist.model');
var User = require('../user/user.model');
var config = require('../../config/environment');
var logger = require('../../components/logger/logger');
var crypto = require('crypto');
var azure = require('azure');

exports.create = function(req, res) {
	logger.serverLog('info', 'daystatusupdate.controller: seen update route: '
	+ JSON.stringify(req.body));

	var fileData = new daystatusupdate({
		uniqueid: req.body.uniqueid,
		time: req.body.time,
		uploadedBy: req.body.uploadedBy,
		contact: req.user.phone
	});

	fileData.save(function(err){
		if(err) return res.send({error: 'Database Error'});
		var payload = {
			type: 'status:new_status_added',
			senderId: req.user.phone,
			uniqueid: req.body.uniqueid,
			time: req.body.time
		};
		sendPushNotification(req.body.uploadedBy, payload, false);
		res.send({status:'success'});
	});
};


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
      'content-available':true,
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
      logger.serverLog('info', 'In DAY STATUS Azure push notification sent to Android using GCM Module, client number : '+ tagname);
    } else {
      logger.serverLog('info', 'In DAY STATUS AzureAzure push notification error : '+ JSON.stringify(error));
    }
  });
  notificationHubService.apns.send(tagname, iOSMessage, function(error){
    if(!error){
      logger.serverLog('info', 'In DAY STATUS AzureAzure push notification sent to iOS using GCM Module, client number : '+ tagname);
    } else {
      logger.serverLog('info', 'In DAY STATUS AzureAzure push notification error : '+ JSON.stringify(error));
    }
  });

  // For iOS Local testing only
  var notificationHubService2 = azure.createNotificationHubService('CloudKiboIOSPush','Endpoint=sb://cloudkiboiospush.servicebus.windows.net/;SharedAccessKeyName=DefaultFullSharedAccessSignature;SharedAccessKey=0JmBCY+BNqMhuAS1g39wPBZFoZAX7M+wq4z4EWaXgCs=');

  notificationHubService2.apns.send(tagname, iOSMessage, function(error){
    if (!error) {
			logger.serverLog('info', 'In DAY STATUS AzureAzure push notification sent to iOS (local testing) using GCM Module, client number : '+ tagname);
    } else {
      logger.serverLog('info', 'In DAY STATUS AzureAzure push notification error (iOS local testing) : '+ JSON.stringify(error));
    }
  });

}
