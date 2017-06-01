'use strict';

var contactslist = require('./contactslist.model');
var User = require('../user/user.model');
var config = require('../../config/environment');
var userchat = require('../userchat/userchat.model');
var configuration = require('../configuration/configuration.model');
var logger = require('../../components/logger/logger');
var azure = require('azure');

exports.index = function(req, res) {
	contactslist.find({ userid: req.user._id }).populate('contactid').exec(function (err2, gotContactList) {
		if (err2) return next(err2);
		if (!gotContactList) return res.json(401);
    logger.serverLog('info', 'contactslist.controller : Contacts data sent to client');
		res.json(200, gotContactList);
	});
};

exports.pendingcontacts = function(req, res) {
	contactslist.find({ conatcid: req.user._id, detailsshared: 'No' }).populate('userid').exec(function(err2, gotContactList){
		if (err2) return next(err2);
		if (!gotContactList) return res.json(401);
    console.log('pending contacts ' + gotContactList);
    logger.serverLog('info', 'contactslist.controller : pending contacts data sent to client');
    res.json(200, gotContactList);
	});
};

exports.whoHaveBlockedMe = function (req, res) {
	contactslist.find({ contactid: req.user._id, detailsshared: 'No' }).populate('contactid').exec(function(err2, gotContactList){
		if (err2) return next(err2);
		if (!gotContactList) return res.json(401);
    console.log('pending contacts ' + gotContactList);
    logger.serverLog('info', 'contactslist.controller : who have blocked me, data sent to client');
    res.json(200, gotContactList);
	});
};

exports.blockedbyme = function (req, res) {
	contactslist.find({ userid: req.user._id, detailsshared: 'No' }).populate('contactid').exec(function(err2, gotContactList){
		if (err2) return next(err2);
		if (!gotContactList) return res.json(401);
    console.log('pending contacts ' + gotContactList);
    logger.serverLog('info', 'contactslist.controller : contacts i blocked, data sent to client');
    res.json(200, gotContactList);
	});
};

exports.blockContact = function (req, res) {
	User.findOne({ phone: req.body.phone }, function (err, contactToBlock) {
		if (err) return res.json(501, { status: 'Internal Server Error' });
		if (!contactToBlock) return res.json(401, { status: 'This contact is not registered.' });
		contactslist.update(
      { userid: req.user._id, contactid: contactToBlock._id },
      { detailsshared: 'No' }, // should have value one of 'delivered', 'seen'
      { multi: true },
      function (err3, num) {
				if (num>0) {
					if (err3) return res.json(501, { status: 'Internal Server Error' });
					User.findOne({ phone: req.body.phone }, function (err, dataUser) {
						var payload = {
							type : 'block:blockedyou',
							senderId : req.user.phone,
							badge : dataUser.iOS_badge
						};
						sendPushNotification(req.body.phone, payload, false);
					});
					res.json(200, { status: 'Successfully blocked.' });
				}
      }
    );
	});
};

exports.unblockContact = function (req, res) {
	User.findOne({ phone: req.body.phone }, function (err, contactToBlock) {
		if (err) return res.json(501, { status: 'Internal Server Error' });
		if (!contactToBlock) return res.json(401, { status: 'This contact is not registered.' });
		contactslist.update(
      { userid: req.user._id, contactid: contactToBlock._id },
      { detailsshared: 'Yes' }, // should have value one of 'delivered', 'seen'
      { multi: true },
      function (err3, num) {
				if (num>0) {
					if (err3) return res.json(501, { status: 'Internal Server Error' });
					User.findOne({ phone: req.body.phone }, function (err, dataUser) {
						var payload = {
							type : 'block:unblockedyou',
							senderId : req.user.phone,
							badge : dataUser.iOS_badge
						};
						sendPushNotification(req.body.phone, payload, false);
					});
					res.json(200, { status: 'Successfully blocked.' });
				}
      }
    );
	});
};

exports.muteContact = function (req, res) {
	logger.serverLog('info', 'contactslist.controller: going to mute contact '+
	JSON.stringify(req.body));
	User.findOne({ phone: req.body.phone }, function (err, contactToMute) {
		if (err) return res.json(501, { status: 'Internal Server Error' });
		if (!contactToMute) return res.json(401, { status: 'This contact is not registered.' });
		contactslist.update(
      { userid: req.user._id, contactid: contactToMute._id },
      { is_mute: 'Yes', start_mute_time: req.body.start_mute_time, end_mute_time: req.body.end_mute_time },
      { multi: true },
      function (err3, num) {
				if (num>0) {
					if (err3) return res.json(501, { status: 'Internal Server Error' });
					res.json(200, { status: 'Successfully muted.' });
				} else {
          res.json(200, { status: 'Contact not found.' });
        }
      }
    );
	});
};

exports.unmuteContact = function (req, res) {
	logger.serverLog('info', 'contactslist.controller: going to unmute contact '+
	JSON.stringify(req.body));
	User.findOne({ phone: req.body.phone }, function (err, contactToBlock) {
		if (err) return res.json(501, { status: 'Internal Server Error' });
		if (!contactToBlock) return res.json(401, { status: 'This contact is not registered.' });
		contactslist.update(
      { userid: req.user._id, contactid: contactToBlock._id },
      { is_mute: 'No' },
      { multi: true },
      function (err3, num) {
				if (num>0) {
					if (err3) return res.json(501, { status: 'Internal Server Error' });
					res.json(200, { status: 'Successfully unmuted.' });
				} else {
          res.json(200, { status: 'Contact not found.' });
        }
      }
    );
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

  if (!sendSound) {
    iOSMessage = {
      payload: payload
    };
  }

  var androidMessage = {
    to: tagname,
    priority: 'high',
    data: {
      message: payload
    }
  }

  notificationHubService.gcm.send(tagname, androidMessage, function (error) {
    if (!error) {
      logger.serverLog('info', 'Azure push notification sent to Android using GCM Module, client number : '+ tagname);
    } else {
      logger.serverLog('info', 'Azure push notification error : '+ JSON.stringify(error));
    }
  });
  notificationHubService.apns.send(tagname, iOSMessage, function (error) {
    if (!error) {
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

exports.addbyusername = function(req, res) {
	User.findById(req.user._id, function (err, gotUser) {
		if (err) return console.log('Error 1'+ err);

		User.findOne({username : req.body.searchusername}, function (err, gotUserSaved) {

      console.log("Add contact by user")
			if(gotUserSaved == null)
				return res.send({status: 'success', msg: null});

			contactslist.count({userid : gotUser._id, contactid : gotUserSaved._id}, function(err5, gotCount){

				if(gotUser.username == gotUserSaved.username)
					res.send({status: 'danger', msg: 'You can not add your self as a contact.'});
				else if(gotCount > 0)
					res.send({status: 'danger', msg: gotUserSaved.username +' is already added in your contact list with name '+ gotUserSaved.firstname +' '+ gotUserSaved.lastname});
				else{

          configuration.findOne({}, function (err, gotConfig) {
            if(err) return console.log(err);

            contactslist.count({userid : gotUser._id}, function(err, gotFullCount){
              if(err) return console.log(err);

              if(gotConfig.numberofpeopleincontactlist === gotFullCount){
                logger.serverLog("warn", "contact list full");
                res.send({status: 'danger', msg: 'Your contact list is full.'});

              }
              else{
                var contact = new contactslist({
                  userid : gotUser._id,
                  contactid : gotUserSaved._id
                });

                contact.save(function(err2){
                  if (err2) return console.log('Error 2'+ err);
                  contactslist.find({userid : gotUser._id}).populate('contactid').exec(function(err3, gotContactList){
                    res.send({status: 'success', msg: gotContactList});
                  })
                })

              }

            });

          });


				}
        console.log("contact add by username");
			})

		})
	})
};

exports.addbyemail = function(req, res) {
	User.findById(req.user._id, function (err, gotUser) {
		if (err) return console.log('Error 1'+ err);
    console.log("contact add by email")
		User.findOne({email : req.body.searchemail}, function (err, gotUserSaved) {

			if(gotUserSaved == null)
				return res.send({status: 'success', msg: null});

			contactslist.count({userid : gotUser._id, contactid : gotUserSaved._id}, function(err5, gotCount){

				if(gotUser.username == gotUserSaved.username)
					res.send({status: 'danger', msg: 'You can not add your self as a contact.'});
				else if(gotCount > 0)
					res.send({status: 'danger', msg: gotUserSaved.username +' is already added in your contact list with name '+ gotUserSaved.firstname +' '+ gotUserSaved.lastname})
				else{

          configuration.findOne({}, function (err, gotConfig) {
            if(err) return console.log(err);

            contactslist.count({userid : gotUser._id}, function(err, gotFullCount){
              if(err) return console.log(err);

              if(gotConfig.numberofpeopleincontactlist === gotFullCount){
                res.send({status: 'danger', msg: 'Your contact list is full.'});
                logger.serverLog('warn',"contact list full")
              }
              else{
                var contact = new contactslist({
                  userid : gotUser._id,
                  contactid : gotUserSaved._id
                });

                contact.save(function(err2){
                  if (err2) return console.log('Error 2'+ err);

                  contactslist.find({userid : gotUser._id}).populate('contactid').exec(function(err3, gotContactList){

                    res.send({status: 'success', msg: gotContactList});

                  })
                })
                console.log("contact add by email ")
              }
            })
          })


				}

			})

		})
	})
};


exports.approvefriendrequest = function(req, res) {
	 User.findById(req.user._id, function (err, gotUser) {
		if (err) return console.log('Error 1'+ err);
     console.log("accepting contact request");
		User.findOne({username : req.body.username}, function (err, gotUserSaved) {

			if(gotUserSaved == null)
				return res.send({status: 'success', msg: null});

			contactslist.count({userid : gotUser._id, contactid : gotUserSaved._id}, function(err5, gotCount){

				if(gotUser.username == gotUserSaved.username)
					res.send({status: 'danger', msg: 'You can not add your self as a contact.'});
				else if(gotCount > 0)

					res.send({status: 'danger', msg: gotUserSaved.username +' is already added in your contact list with name '+ gotUserSaved.firstname +' '+ gotUserSaved.lastname});
        else{

          configuration.findOne({}, function (err, gotConfig) {
            if(err) return console.log(err);

            contactslist.count({userid : gotUser._id}, function(err, gotFullCount){
              if(err) return console.log(err);

              if(gotConfig.numberofpeopleincontactlist === gotFullCount){
                logger.serverLog('warn', "contact can not accept. List is full");
                res.send({status: 'danger', msg: 'Your contact list is full.'});

              }
              else{
                var contact = new contactslist({
                  userid : gotUser._id,
                  contactid : gotUserSaved._id,
                  detailsshared : 'Yes'
                });

                contact.save(function(err2){
                  if (err2) return console.log('Error 2'+ err);

                  contactslist.find({userid : gotUser._id}).populate('contactid').exec(function(err3, gotContactList){

                    res.send({status: 'success', msg: gotContactList});

                    contactslist.findOne({userid : gotUserSaved._id, contactid : gotUser._id}, function(err6, gotOtherPerson){

                      gotOtherPerson.detailsshared = 'Yes';

                      logger.serverLog('info', 'contactslist.controller : Add request approved');

                      gotOtherPerson.save(function(err){});

                    })
                  })
                })

                console.log("accepted contact request")
              }
            })
          })



				}

			})

		})
	})
};

exports.rejectfriendrequest = function(req, res) {
  console.log("Rejecting contact request")
	 User.findById(req.user._id, function (err, gotUser) {
		if (err) return console.log('Error 1'+ err);

		User.findOne({username : req.body.username}, function (err, gotUserSaved) {

			contactslist.remove({userid : gotUserSaved._id, contactid : gotUser._id}, function(err6){

				res.send({status: 'success', msg: 'Request is rejected'});

        logger.serverLog('info', 'contactslist.controller : Add request rejected');

			})

		})

	})
};


exports.removefriend = function(req, res) {

  logger.serverLog('info', 'contactslist.controller : The data sent by client: '+ JSON.stringify(req.body));

  console.log("Removing contact request")
	 User.findById(req.user._id, function (err, gotUser) {
		if (err) return console.log('Error 1'+ err);

		User.findOne({username : req.body.username}, function (err, gotUserSaved) {
			contactslist.remove({userid : gotUserSaved._id, contactid : gotUser._id}, function(err6){
        console.log("Is in friend's list")
				contactslist.remove({userid : gotUser._id, contactid : gotUserSaved._id}, function(err6){
          console.log("Is in my list")

					userchat.remove({$or: [ { to : gotUserSaved.username, from : gotUser.username },
										{ to : gotUser.username, from : gotUserSaved.username } ]},
										function(err1){
											if(err1) return console.log(err1);

											res.send({status: 'success', msg: 'Friend is removed'});

                      logger.serverLog('info', 'contactslist.controller : Friend removed from contactlist');

										})

				})

			})

		})
	})
};
