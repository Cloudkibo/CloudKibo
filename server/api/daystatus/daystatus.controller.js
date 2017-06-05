'use strict';

var daystatus = require('./daystatus.model');
var User = require('../user/user.model');
var Contactslist = require('../contactslist/contactslist.model');
var daystatusupdate = require('../daystatusupdate/daystatusupdate.model');
var config = require('../../config/environment');
var logger = require('../../components/logger/logger');
var crypto = require('crypto');
var azure = require('azure');
var schedule = require('node-schedule');

exports.create = function(req, res) {

	var today = new Date();
	var uid = crypto.randomBytes(5).toString('hex');
	var serverPath = '/' + 'f' + uid + '' + today.getFullYear() + ''
	+ (today.getMonth() + 1) + '' + today.getDate();
	serverPath += '' + today.getHours() + '' + today.getMinutes() + '' + today.getSeconds();
	serverPath += '.' + req.files.file.type.split('/')[1];

	logger.serverLog('info', 'daystatus.controller : create day status route ' +
	' called. file is: ' + JSON.stringify(req.files));

	var dir = "./status";

	if(req.files.file.size === 0) return res.send('No file submitted');

	require('fs').rename(
		req.files.file.path,
		dir + '/' + serverPath,
		function (error) {
			if (error) {
				logger.serverLog('error', 'daystatus.controller (update status) : '+ error);
				res.send({ error: 'Server Error: Could not upload the file' });
				return 0;
			}
			logger.serverLog('info', 'daystatus.controller : create day status route ' +
			' called. file is uploaded now going to save data');
			var fileData = new daystatus({
				date: req.body.date,
				uniqueid: req.body.uniqueid,
				file_name: req.body.file_name,
				file_size: req.body.file_size,
				path: serverPath,
				label: req.body.label,
				file_type: req.body.file_type,
				uploadedBy: req.user.phone
			});
			fileData.save(function (err) {
				if (err) return res.send({ error: 'Database Error' });
				logger.serverLog('info', 'daystatus.controller : create day status route ' +
				' called. file is uploaded now going to send push notification');
				Contactslist.find({ userid: req.user._id }, function (err23, myContacts) {
					if (err23) {
						logger.serverLog('info', 'daystatus.controller : create day status route ' +
						' called. error in finding my contacts '+ JSON.stringify(err23));
						res.send({ error: 'Server Error: Could not upload the file' });
						return 0;
					}
					logger.serverLog('info', 'daystatus.controller : create day status route ' +
					' called. number of contacts which would get push ' + myContacts.length);
					myContacts.forEach(function (myContact) {
						Contactslist.findOne({ userid: myContact.contactid,
							contactid: req.user._id, detailsshared : 'Yes' }).populate('userid').exec(function (err24, amIContact) {
								if (err24) {
									logger.serverLog('info', 'daystatus.controller : create day status route ' +
									' called. error in checking if I am his contact '+ JSON.stringify(err24));
									res.send({ error: 'Server Error: Could not send the push' });
									return 0;
								}
								logger.serverLog('info', 'daystatus.controller : create day status route ' +
								' called. checking if I am his contact '+ JSON.stringify(amIContact));
								if (amIContact) {
									var payload = {
										type: 'status:new_status_added',
										senderId: req.user.phone,
										uniqueid: req.body.uniqueid
									};
									logger.serverLog('info', 'daystatus.controller : create day status route ' +
									' called. sending push notification now '+ JSON.stringify(payload));
									sendPushNotification(amIContact.userid.phone, payload, false);
								}
							});
					})
				});
				res.send({ status: 'success' });

				var someDate = new Date();
				var newDate = new Date(someDate.setHours(someDate.getHours()+24));
				var j = schedule.scheduleJob(newDate, function(y) {
					daystatus.findOne({ uniqueid: y }, function (err, data) {
						if (err) return res.send({ status: 'database error' });
						var dir = './status';
						dir += data.path;
						require('fs').unlink(dir, function (err1) {
								if (err1) {
									logger.serverLog('error',
									'filetransfers.controller (delete file image) : '+ err1);
								}
								daystatus.remove({ uniqueid: y }, function (err12) {
									if (err12) logger.serverLog('error',
									'daystatus.controller (remove scheduled status) : '+ err12);
									daystatusupdate.remove({ uniqueid: y }, function (err13) {
										if (err13) logger.serverLog('error',
										'daystatus.controller (remove scheduled status) : '+ err13);

									});
								});

							});
					});
				}.bind(null, req.body.uniqueid));
			});
		}
	);
};

exports.delete = function (req, res, next) {
	daystatus.findOne({ uniqueid: req.body.uniqueid }, function (err, data) {
		if (err) return res.send({ status: 'database error' });

		var dir = './status';
		dir += data.path;

		require('fs').unlink(dir, function (err1) {
				if (err1) {
					return logger.serverLog('error', 'filetransfers.controller (delete file image) : '+ err1);
					//throw err;
				}

				daystatus.remove({ uniqueid: req.body.uniqueid }, function (err) {
					if (err) return res.send({ status: 'database error' });
					daystatusupdate.remove({ uniqueid: y }, function (err13) {
						if (err13) return res.send({ status: 'database error' });
						Contactslist.find({ userid: req.user._id }, function (err23, myContacts) {
							if (err23) {
								res.send({ error: 'Server Error: Could not upload the file' });
								return 0;
							}
							myContacts.forEach(function (myContact) {
								Contactslist.findOne({ userid: myContact.contactid,
									contactid: req.user._id }).populate('userid').exec(function (err24, amIContact) {
										if (err24) {
											res.send({ error: 'Server Error: Could not upload the file' });
											return 0;
										}
										if (amIContact) {
											var payload = {
												type: 'status:new_status_deleted',
												senderId: req.user.phone,
												uniqueid: req.body.uniqueid
											};
											sendPushNotification(amIContact.userid.phone, payload, false);
										}
									});
							})
						});
						res.send({ status: 'success' });
					});
				});
			});
	});
};

exports.getInfo = function (req, res, next) {
	daystatus.findOne({ uniqueid: req.body.uniqueid }, function (err, status) {
		if (err) return res.send({ status: 'database error' });
		res.send({ status: 'sucess', data: status });
	});
};

exports.getMedia = function (req, res, next) {
	daystatus.findOne({ uniqueid: req.body.uniqueid }, function (err, data) {
		if (err) return res.send({ status: 'database error' });
		res.sendfile(data.path, { root: './status' });
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
