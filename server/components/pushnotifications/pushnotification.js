/**
 * Created by sojharo on 05/06/2017.
 */
var needle = require('needle');
var azure = require('azure');
var notificationHubService = azure.createNotificationHubService('Cloudkibo', 'Endpoint=sb://kibochathub.servicebus.windows.net/;SharedAccessKeyName=DefaultFullSharedAccessSignature;SharedAccessKey=we1QGyWhgsJLXLT1CrqBgggnsBLS+R/MovR2Av6MmXs=');
var logger = require('../logger/logger');


module.exports = function (tagName, payload, sendSound, isItCall, devToken) {
  tagName = tagName.substring(1);

  logger.serverLog('info', 'Push notification data '+ JSON.stringify(payload));

  sendAndroidPushNotification(tagName, payload);
  sendiOSPushNotification(tagName, payload, sendSound, isItCall);
  sendVoipPush(devToken, payload.badge, sendSound, payload.msg, payload);
};

function sendAndroidPushNotification(tagname, payload) {
  var androidMessage = {
    to: tagname,
    priority: 'high',
    data: {
      message: payload
    }
  };
  notificationHubService.gcm.send(tagname, androidMessage, function (error) {
    if (!error) {
      logger.serverLog('info', 'Azure push notification sent to Android using GCM Module, client number : ' + tagname);
    } else {
      logger.serverLog('info', 'Azure push notification error : ' + JSON.stringify(error));
    }
  });
}

function sendiOSPushNotification(tagname, payload, sendSound, isItCall) {
  var iOSMessage = {
    alert: payload.msg,
    sound: 'UILocalNotificationDefaultSoundName',
    badge: payload.badge,
    payload: payload
  };
  if (!sendSound) {
    iOSMessage = {
      payload: payload
    };
  }
  if (isItCall) {
    iOSMessage = {
      alert: payload.msg,
      sound: 'UILocalNotificationDefaultSoundName',
      badge: payload.badge,
      payload: payload,
      category: 'areyoufreeforcall'
    };
  }
  notificationHubService.apns.send(tagname, iOSMessage, function (error) {
    if (!error) {
      logger.serverLog('info', 'Azure push notification sent to iOS using GCM Module, client number : ' + tagname);
    } else {
      logger.serverLog('info', 'Azure push notification error : ' + JSON.stringify(error));
    }
  });

  // For iOS Local testing only
  var notificationHubService2 = azure.createNotificationHubService('CloudKiboIOSPush', 'Endpoint=sb://cloudkiboiospush.servicebus.windows.net/;SharedAccessKeyName=DefaultFullSharedAccessSignature;SharedAccessKey=0JmBCY+BNqMhuAS1g39wPBZFoZAX7M+wq4z4EWaXgCs=');

  notificationHubService2.apns.send(tagname, iOSMessage, function (error) {
    if (!error) {
      logger.serverLog('info', 'Azure push notification sent to iOS (local testing) using GCM Module, client number : ' + tagname);
    } else {
      logger.serverLog('info', 'Azure push notification error (iOS local testing) : ' + JSON.stringify(error));
    }
  });
}

function sendVoipPush(devToken, badge, sound, alert, payload) {
  var myJSONObject = {
    deviceToken: devToken || '',
    badge: badge || 3,
    sound: sound || true,
    alert: alert || 'This is good by sojharo',
    payload: payload || {
      msg: 'Hi'
    }
  };

  logger.serverLog('info', 'going to send VOIP Push with payload: ' + JSON.stringify(myJSONObject));

  var options = {
    headers: {
      'X-Custom-Header': 'CloudKibo Web Application'
    }
  };

  needle.post('http://192.241.242.5:3000/sendVoipNotification', myJSONObject, options, function (err, resp) {
    if (err) {
      logger.serverLog('info', 'Error in sending VOIP Push: ' + JSON.stringify(err));
      console.log(err);
    } else {
      logger.serverLog('info', 'Successfully sent VOIP Push');
      console.log(resp);
    }
  });
}
