'use strict';

var userchat = require('./userchat.model');
var User = require('../user/user.model');
var contactslist = require('../contactslist/contactslist.model');
var config = require('../../config/environment');
var logger = require('../../components/logger/logger');
var azure = require('azure');


exports.index = function(req, res) {
	User.findById(req.user._id, function (err, gotUser) {
			if (err) return console.log('Error 1'+ err);

			if(req.body.user1 == gotUser.phone){

				  userchat.find({owneruser : gotUser.phone, $or: [ { to : req.body.user1, from : req.body.user2 },
																	  { to : req.body.user2, from : req.body.user1 } ]},
																		function(err1, gotMessages){
																			if(err1) return console.log(err1);

                                      logger.serverLog('info', 'userchat.controller : Chat data sent to client');

																			res.send({status : 'success', msg : gotMessages});

																		})

			}
	  })
};

exports.alluserchat = function(req, res) {
	logger.serverLog('info', 'userchat.controller : All Chat data is asked by '+ JSON.stringify(req.user));
	logger.serverLog('info', 'userchat.controller : All Chat data request body '+ JSON.stringify(req.body));
	User.findById(req.user._id, function (err, gotUser) {
			if (err) return console.log('Error 1'+ err);

			logger.serverLog('info', 'userchat.controller : All Chat data asker data is '+ JSON.stringify(gotUser));

			if(req.body.user1 == gotUser.phone){

				  userchat.find({owneruser : gotUser.phone},
																		function(err1, gotMessages){
																			if(err1) return console.log(err1);

                                      logger.serverLog('info', 'userchat.controller : All Chat data sent to client');

																			res.send({status : 'success', msg : gotMessages});

																		})

			} else {
				logger.serverLog('info', 'userchat.controller : NOT All Chat data sent to client. BECAUSE user was not found');
				res.send({status : 'success', msg : []});
			}
	  })
};

exports.getsinglechat = function(req, res) {
	User.findById(req.user._id, function (err, gotUser) {
			if (err) return console.log('Error 1'+ err);

			userchat.find({uniqueid : req.body.uniqueid},
																function(err1, gotMessages){
																	if(err1) return console.log(err1);

																	if(gotMessages){
																		logger.serverLog('info', 'userchat.controller : Unique Chat data sent to client');

																		res.send({status : 'success', msg : gotMessages});

																		userchat.update(
																			{uniqueid : gotMessages[0].uniqueid},
																			{status : 'delivered'}, // should have value one of 'delivered', 'seen'
																			{multi : true},
																			function (err, num){
																				logger.serverLog('info', 'Rows updated here '+ num +' for message status update in mongodb');

																				var payload = {
																					type : 'status',
																					status : 'delivered',
																					uniqueId : gotMessages[0].uniqueid
																				};

																				sendPushNotification(gotMessages[0].from, payload, false);

																			}
																		);
																	} else {
																		res.send({status : 'error', msg : 'No message with given unique id '+ req.body.uniqueid});
																	}

																})

	  })
};

exports.removechathistory = function(req, res) {
	 User.findById(req.user._id, function (err, gotUser) {
		if (err) return console.log('Error 1'+ err);

		console.log("removing chat history");

		User.findOne({phone : req.body.phone}, function (err, gotUserSaved) {
			userchat.remove({owneruser : gotUser.phone, $or: [ { to : gotUserSaved.phone, from : gotUser.phone },
										{ to : gotUser.phone, from : gotUserSaved.phone } ]},
										function(err1){
											if(err1) return console.log(err1);

                      logger.serverLog('info', 'userchat.controller : Chat data removed');

											res.send({status: 'success', msg: 'Chat is removed'});

										})
		})
	})
};


exports.save = function(req, res) {
	User.findById(req.user._id, function (err, gotUser) {
		if (err) return console.log('Error 1'+ err);

		if(req.body.from == gotUser.username){

			  var newUserChat = new userchat({
					to : req.body.to,
					from : req.body.from,
					fromFullName : req.body.fromFullName,
					msg : req.body.msg,
					owneruser : req.body.to
			  });

			  newUserChat.save(function (err2) {
					if (err2) return console.log('Error 2'+ err2);
					res.send({status : 'success', msg : 'stored the message'});

					contactslist.findOne({userid : req.body.to_id, contactid : req.body.from_id}).exec(function(err3, gotContact){

						gotContact.unreadMessage = true;

						gotContact.save(function(err){

						})

					})
			  });
      console.log("saved new user chat")

			  newUserChat = new userchat({
					to : req.body.to,
					from : req.body.from,
					fromFullName : req.body.fromFullName,
					msg : req.body.msg,
					owneruser : req.body.from
			  });

			  newUserChat.save(function (err2) {
					if (err2) return console.log('Error 2'+ err2);
			  });
		}
	})
};

var notificationHubService = azure.createNotificationHubService('Cloudkibo','Endpoint=sb://cloudkibo.servicebus.windows.net/;SharedAccessKeyName=DefaultFullSharedAccessSignature;SharedAccessKey=arTrXZQGBUeuLYLcwTTzCVqFDN1P3a6VrxA15yvpnqE=');
function sendPushNotification(tagname, payload, sendSound){
  tagname = tagname.substring(1);
  var iOSMessage = {
    alert : payload.msg,
    sound : 'UILocalNotificationDefaultSoundName',
    badge : payload.badge,
		'content-available':true,
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

exports.save2 = function(req, res) {

	var dateServerReceived = new Date();
	var dateServerSent;

	logger.serverLog('info', 'chat message -> ' + JSON.stringify(req.body));

	User.findOne({phone : req.body.to}, function(err, dataUser){
		var payload = {
			type : req.body.type,
			senderId : req.body.from,
			msg : req.body.msg.substring(0, 8),
			uniqueId : req.body.uniqueid,
			badge : dataUser.iOS_badge + 1
		};

		logger.serverLog('info', 'sending chat using push to recipient');
		sendPushNotification(req.body.to, payload, true);
		dateServerSent = new Date();

		logger.serverLog('info', 'sending chat message response to sender');
		res.send({status : 'sent', uniqueid : req.body.uniqueid});

		dataUser.iOS_badge = dataUser.iOS_badge + 1;
		dataUser.save(function(err){

		});

		var newUserChat = new userchat({
			to: req.body.to,
			from: req.body.from,
			date: req.body.date,
			date_server_received: dateServerReceived,
			date_server_sent: dateServerSent,
			fromFullName: req.body.fromFullName,
			msg: req.body.msg,
			owneruser: req.body.to,
			status: 'sent',
			uniqueid : req.body.uniqueid,
			type : req.body.type,
			file_type : req.body.file_type
		});

		newUserChat.save(function (err2) {
			if (err2) return console.log('Error 2'+ err2);

		});

		console.log("saved new user chat")

		newUserChat = new userchat({
			to: req.body.to,
			from: req.body.from,
			date: req.body.date,
			date_server_received: dateServerReceived,
			date_server_sent: dateServerSent,
			fromFullName: req.body.fromFullName,
			msg: req.body.msg,
			owneruser: req.body.from,
			status: 'sent',
			uniqueid : req.body.uniqueid,
			type : req.body.type,
			file_type : req.body.file_type // 'image', 'document', 'audio', 'video'
		});

		newUserChat.save(function (err2, d1) {
			if (err2) return console.log('Error 2'+ err2);
			logger.serverLog('info', 'chat saved on mongodb '+ JSON.stringify(d1));
		});
	});

};

exports.updateStatus = function(req, res) {

	logger.serverLog('info', 'server received message status update from mobile '+ JSON.stringify(req.body));

	userchat.update(
		{uniqueid : req.body.uniqueid},
		{status : req.body.status}, // should have value one of 'delivered', 'seen'
		{multi : true},
		function (err, num){
			logger.serverLog('info', 'Rows updated here '+ num +' for message status update in mongodb');

			logger.serverLog('info', 'server sending message status update from mobile to other mobile now');

			var payload = {
				type : 'status',
				status : req.body.status,
				uniqueId : req.body.uniqueid
			};

			sendPushNotification(req.body.sender, payload, false);

			res.send({status : 'statusUpdated', uniqueid : req.body.uniqueid});

		}
	);

};

exports.partialchatsync = function(req, res) {
	logger.serverLog('info', 'userchat.controller : Partial Chat data is asked by '+ JSON.stringify(req.user));
	logger.serverLog('info', 'userchat.controller : Partial Chat data request body '+ JSON.stringify(req.body));
	User.findById(req.user._id, function (err, gotUser) {
			if (err) return console.log('Error 1'+ err);

			if(req.body.user1 == gotUser.phone){

				  userchat.find({owneruser : gotUser.phone, to : gotUser.phone, status : 'sent'},
																		function(err1, gotMessages){
																			if(err1) return console.log(err1);

																			gotMessages.forEach(function(gotMessage){
																				userchat.update(
																					{uniqueid : gotMessage.uniqueid},
																					{status : 'delivered'}, // should have value one of 'delivered', 'seen'
																					{multi : true},
																					function (err, num){
																						logger.serverLog('info', 'Rows updated here '+ num +' for message status update PARTIAL SYNC in mongodb');

																						var payload = {
																							type : 'status',
																							status : 'delivered',
																							uniqueId : gotMessage.uniqueid
																						};

																						sendPushNotification(gotMessage.from, payload, false);

																					}
																				);
																			})

                                      logger.serverLog('info', 'userchat.controller : Partial Chat data sent to client');

																			res.send({status : 'success', msg : gotMessages});

																		})

			} else {
				logger.serverLog('info', 'userchat.controller : NOT Partial Chat data sent to client. BECAUSE user was not found');
				res.send({status : 'success', msg : []});
			}
	  })
};
