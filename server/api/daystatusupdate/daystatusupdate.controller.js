'use strict';

var daystatusupdate = require('./daystatusupdate.model');
var Contactslist = require('../contactslist/contactslist.model');
var User = require('../user/user.model');
var config = require('../../config/environment');
var logger = require('../../components/logger/logger');
var crypto = require('crypto');
var azure = require('azure');
var sendPushNotification = require('../../components/pushnotifications/pushnotification');

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
    User.findOne({phone: req.body.uploadedBy}, function (err, senderUser) {
      if (err) return res.send({error: 'Database Error'});
      var payload = {
        type: 'status:new_status_added',
        senderId: req.user.phone,
        uniqueid: req.body.uniqueid,
        time: req.body.time
      };
      sendPushNotification(req.body.uploadedBy, payload, false, false, senderUser.deviceToken);
      res.send({status: 'success'});
    });
	});
};

