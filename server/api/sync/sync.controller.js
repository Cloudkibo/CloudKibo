'use strict';

var _ = require('lodash');
var group_user = require('../group_user/groupuser.model');
var user = require('../user/user.model');
var userchat = require('../userchat/userchat.model');

var User = require('../user/user.model');
var contactslist = require('../contactslist/contactslist.model');
var config = require('../../config/environment');
var logger = require('../../components/logger/logger');

var GroupChats = require('../groupchat/groupchat.model');
var groupchatstatus = require('../groupchatstatus/groupchatstatus.model');
var groupmessaginguser = require('../groupmessaginguser/groupmessaginguser.model');
var groupmessaging = require('../groupmessaging/groupmessaging.model');

var GroupChatStatus = require('../groupchatstatus/groupchatstatus.model');
var groupchat = require('../groupchat/groupchat.model');

var GroupMessaging = require('../groupmessaging/groupmessaging.model');
var GroupMessagingUser = require('../groupmessaginguser/groupmessaginguser.model');

var GroupMessagingUsers = require('../groupmessaginguser/groupmessaginguser.model');

var azure = require('azure');


// Creates a new groupcall in the DB.
exports.upwardSync = function (req, res) {

  logger.serverLog('info', 'upward SYNC request payload : ');
  logger.serverLog('info', req.body);

  try {
    var unsentMessages = req.body.unsentMessages;
    var unsentGroupMessages = req.body.unsentGroupMessages;
    var unsentChatMessageStatus = req.body.unsentChatMessageStatus;
    var unsentGroupChatMessageStatus = req.body.unsentGroupChatMessageStatus;
    var unsentGroups = req.body.unsentGroups;
    var unsentAddedGroupMembers = req.body.unsentAddedGroupMembers;
    var unsentRemovedGroupMembers = req.body.unsentRemovedGroupMembers;

    var response = {
      unsentMessages: [],
      unsentGroupMessages: [],
      unsentChatMessageStatus: [],
      unsentGroupChatMessageStatus: [],
      unsentGroups: [],
      unsentAddedGroupMembers: [],
      unsentRemovedGroupMembers: []
    };

    res.send({ status: 'success', msg: 'Received sync data' });

    unsentMessages.forEach(function(messageBody){

      var dateServerReceived = new Date();
    	var dateServerSent;

      User.findOne({ phone : messageBody.to }, function (err, dataUser){

    		contactslist.findOne({ userid: req.user._id, contactid:  dataUser._id }, function (err3, contactInfo) {

    			if (contactInfo.detailsshared === 'Yes') {
    				contactslist.findOne({ contactid: req.user._id, userid:  dataUser._id }, function (err3, contactInfo2) {
    					if (contactInfo2.detailsshared === 'Yes') {
    						var payload = {
    							type : messageBody.type,
    							senderId : messageBody.from,
    							msg : (messageBody.type === 'contact') ? 'Shared contact with you' : messageBody.msg.substring(0, 40),
    							uniqueId : messageBody.uniqueid,
    							badge : dataUser.iOS_badge + 1
    						};

    						sendPushNotification(messageBody.to, payload, true);
    						dateServerSent = new Date();


    						//res.send({status : 'sent', uniqueid : req.body.uniqueid});

                response.unsentMessages.push({status : 'sent', uniqueid : req.body.uniqueid});

    						dataUser.iOS_badge = dataUser.iOS_badge + 1;
    						dataUser.save(function(err){

    						});

    						var newUserChat = new userchat({
    							to: messageBody.to,
    							from: messageBody.from,
    							date: messageBody.date,
    							date_server_received: dateServerReceived,
    							date_server_sent: dateServerSent,
    							fromFullName: messageBody.fromFullName,
    							msg: messageBody.msg,
    							owneruser: messageBody.to,
    							status: 'sent',
    							uniqueid : messageBody.uniqueid,
    							type : messageBody.type,
    							file_type : messageBody.file_type
    						});

    						newUserChat.save(function (err2) {
    							if (err2) return console.log('Error 2'+ err2);

    						});

    						newUserChat = new userchat({
    							to: messageBody.to,
    							from: messageBody.from,
    							date: messageBody.date,
    							date_server_received: dateServerReceived,
    							date_server_sent: dateServerSent,
    							fromFullName: messageBody.fromFullName,
    							msg: messageBody.msg,
    							owneruser: messageBody.from,
    							status: 'sent',
    							uniqueid : messageBody.uniqueid,
    							type : messageBody.type,
    							file_type : messageBody.file_type // 'image', 'document', 'audio', 'video'
    						});

    						newUserChat.save(function (err2, d1) {
    							if (err2) return console.log('Error 2'+ err2);

    						});
    					} else {
    						//res.send({status : 'blocked', uniqueid : req.body.uniqueid});
                response.unsentMessages.push({status : 'sent', uniqueid : req.body.uniqueid});
    					}
    				});
    			} else {
    				//res.send({status : 'blocked', uniqueid : req.body.uniqueid});
            response.unsentMessages.push({status : 'sent', uniqueid : req.body.uniqueid});
    			}

    		});
    	});
    });

    unsentGroupMessages.forEach(function(messageBody){
      groupmessaging.findOne({unique_id : messageBody.group_unique_id}, function(err, groupFound){
        if(err) { return handleError(res, err); }
        var body = {
          group_unique_id: groupFound._id,
          from: messageBody.from,
          type: messageBody.type,
          msg : messageBody.msg,
          from_fullname : messageBody.from_fullname,
          unique_id : messageBody.unique_id,
        }
        GroupChats.create(body, function(err, groupchat) {
          if(err) { return handleError(res, err); }
          groupmessaginguser.find({group_unique_id : body.group_unique_id}, function(err2, usersingroup){
            if(err2) return handleError(res, err);
            usersingroup.forEach(function(useringroup){
              if(messageBody.from !== useringroup.member_phone){
                if(useringroup.membership_status === 'joined'){
                  user.findOne({phone : useringroup.member_phone}, function(err, dataUser){
                    var payload = {
                      type : 'group:chat_received',
                      senderId : messageBody.from,
                      groupId : messageBody.group_unique_id,
                      msg_type : messageBody.type,
                      unique_id : messageBody.unique_id,
                      msg : messageBody.msg,
                      badge : dataUser.iOS_badge + 1
                    };
                    sendPushNotification(dataUser.phone, payload, true);

                    var chatStatusBody = {
                      chat_unique_id: messageBody.unique_id,
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

          response.unsentGroupMessages.push({ unique_id: groupchat.unique_id });
        });
      })
    });

    unsentChatMessageStatus.forEach(function(messageBody){
      userchat.update(
    		{uniqueid : messageBody.uniqueid},
    		{status : messageBody.status}, // should have value one of 'delivered', 'seen'
    		{multi : true},
    		function (err, num){
    			var payload = {
    				type : 'status',
    				status : messageBody.status,
    				uniqueId : messageBody.uniqueid
    			};

    			sendPushNotification(messageBody.sender, payload, false);

          response.unsentChatMessageStatus.push({status : messageBody.status,
            uniqueid : messageBody.uniqueid});

    		}
    	);
    });

    unsentGroupChatMessageStatus.forEach(function(messageBody){
      GroupChatStatus.update(
        {chat_unique_id : messageBody.chat_unique_id, user_phone : req.user.phone},
        {status : messageBody.status}, // should have value one of 'delivered', 'seen'
        {multi : false},
        function (err, num){
          if (err) { return handleError(res, err); }
          groupchat.findOne({unique_id : messageBody.chat_unique_id}, function(err, gotChat){
            if (!gotChat) {

            } else {
              var payload = {
                type : 'group:msg_status_changed',
                status : messageBody.status,
                user_phone : messageBody.phone,
        				uniqueId : messageBody.chat_unique_id
              };
              sendPushNotification(gotChat.from, payload, false);
            }

          });

          response.unsentGroupChatMessageStatus.push({status: messageBody.status,
            uniqueid : messageBody.chat_unique_id});
        }
      );
    });

    unsentGroups.forEach(function(messageBody){
      var today = new Date();
      var uid = Math.random().toString(36).substring(7);
      var unique_id = 'h' + uid + '' + today.getFullYear() + '' + (today.getMonth()+1) + '' + today.getDate() + '' + today.getHours() + '' + today.getMinutes() + '' + today.getSeconds();

      var body = {
        group_name : messageBody.group_name,
        unique_id : messageBody.unique_id
      };

      GroupMessaging.create(body, function(err, groupmessaging) {
        if(err) { console.log('31'); console.log(err); return handleError(res, err); }

        var groupmember1 = {
          group_unique_id: groupmessaging._id,
          member_phone: messageBody.phone,
          display_name: messageBody.display_name,
          isAdmin: 'Yes',
          membership_status : 'joined'
        }

        GroupMessagingUser.create(groupmember1, function(err2, groupmembersaved){
          if(err2) { console.log('41'); console.log(err2); return handleError(res, err2); }

          var membersArray = messageBody.members;

          membersArray.forEach(function(gotMember){
            user.findOne({phone : gotMember}, function(err, dataUser){
              var groupmember = {
                group_unique_id: groupmessaging._id,
                member_phone: gotMember,
                display_name: dataUser.display_name,
                isAdmin: 'No',
                membership_status : 'joined'
              }

              GroupMessagingUser.create(groupmember, function(err3, groupmembersaved1){
                if(err3) { console.log('53'); console.log(err3); return handleError(res, err3); }
                // SEND PUSH NOTIFICATION HERE

                var payload = {
                  type : 'group:you_are_added',
                  senderId : req.user.phone,
                  groupId : messageBody.unique_id,
                  isAdmin: 'No',
                  membership_status : 'joined',
                  group_name: messageBody.group_name,
                  msg : req.user.display_name + ' added you to the group "'+ messageBody.group_name +'"',
                  badge : dataUser.iOS_badge + 1
                };

                sendPushNotification(groupmembersaved1.member_phone, payload, true);

                dataUser.iOS_badge = dataUser.iOS_badge + 1;
                dataUser.save(function(err){

                });

              })
            })
          });

          response.unsentGroups.push(groupmessaging);
        })
      });
    });

    unsentAddedGroupMembers.forEach(function(messageBody){

      GroupMessaging.findOne({unique_id : messageBody.group_unique_id}, function(err, gotGroup){
        if(err)  { return handleError(res, err); }

        GroupMessagingUsers.findOne({member_phone : req.user.phone, group_unique_id : gotGroup._id}, function(err, gotAdmin){

            if(gotAdmin.isAdmin === 'Yes'){
              GroupMessagingUsers.find({group_unique_id : gotGroup._id, membership_status : 'joined'}, function(err, gotMembers){
                if(err) { return handleError(res, err); }
                var membersArray = gotMembers;
                membersArray.forEach(function (gotMember) {
                  if(gotMember.member_phone !== req.user.phone){
                    user.findOne({phone : gotMember.member_phone}, function(err, dataUser){
                      var payload = {
                        type : 'group:added_to_group',
                        senderId : req.user.phone,
                        personsAdded : messageBody.members,
                        groupId : messageBody.group_unique_id,
                        isAdmin: 'Yes',
                        badge : dataUser.iOS_badge
                      };

                      sendPushNotification(gotMember.member_phone, payload, false);

                      dataUser.iOS_badge = dataUser.iOS_badge;
                      dataUser.save(function(err){

                      });
                    })
                  }
                })
              })
              var membersArray = messageBody.members;
              membersArray.forEach(function(gotMember){
                user.findOne({phone : gotMember}, function(err, dataUser){
                  var groupmember = {
                    group_unique_id: gotGroup._id,
                    member_phone: gotMember,
                    display_name: dataUser.display_name,
                    isAdmin: 'No',
                    membership_status : 'joined'
                  }
                  GroupMessagingUsers.findOne({member_phone : gotMember, group_unique_id : gotGroup._id}, function (err3, gotMemberEntryAlreadyExists) {
                    if(gotMemberEntryAlreadyExists){
                      gotMemberEntryAlreadyExists.membership_status = 'joined';
                      gotMemberEntryAlreadyExists.save(function(err) {
                        var payload = {
                          type : 'group:you_are_added',
                          senderId : req.user.phone,
                          groupId : messageBody.group_unique_id,
                          isAdmin: 'No',
                          membership_status : 'joined',
                          msg : req.user.display_name + ' added you to the group "'+ messageBody.group_name +'"',
                          group_name: messageBody.group_name,
                          badge : dataUser.iOS_badge + 1
                        };

                        sendPushNotification(gotMemberEntryAlreadyExists.member_phone, payload, true);

                        dataUser.iOS_badge = dataUser.iOS_badge + 1;
                        dataUser.save(function(err){

                        });
                      });
                    } else {
                      GroupMessagingUsers.create(groupmember, function(err3, groupmembersaved1){
                        if(err3) { return handleError(res, err); }
                        // SEND PUSH NOTIFICATION HERE
                        var payload = {
                          type : 'group:you_are_added',
                          senderId : req.user.phone,
                          groupId : messageBody.group_unique_id,
                          isAdmin: 'No',
                          membership_status : 'joined',
                          msg : req.user.display_name + ' added you to the group "'+ messageBody.group_name +'"',
                          group_name: messageBody.group_name,
                          badge : dataUser.iOS_badge + 1
                        };

                        sendPushNotification(groupmembersaved1.member_phone, payload, true);

                        dataUser.iOS_badge = dataUser.iOS_badge + 1;
                        dataUser.save(function(err){

                        });
                      });
                    }
                  })
                })
              })

              response.unsentAddedGroupMembers.push({status: 'success',
              msg: 'New members are added to group.'});
            } else {
              response.unsentAddedGroupMembers.push({status: 'success',
              msg: 'You are not admin of this group.'});
            }
        })
      });
    });

    unsentRemovedGroupMembers.forEach(function(messageBody){
      GroupMessaging.findOne({unique_id : messageBody.group_unique_id}, function(err, gotGroup){
        if(err)  { return handleError(res, err); }
        GroupMessagingUsers.findOne({member_phone : req.user.phone, group_unique_id : gotGroup._id}, function(err, adminData){
          if(adminData.isAdmin === 'Yes'){
            GroupMessagingUsers.find({group_unique_id : gotGroup._id, membership_status : 'joined'}, function(err, gotMembers){
              if(err) { return handleError(res, err); }
              var membersArray = gotMembers;
              membersArray.forEach(function(gotMember){
                if(gotMember.member_phone !== req.user.phone){
                  user.findOne({phone : gotMember.member_phone}, function(err, dataUser){
                    var payload = {
                      type : 'group:removed_from_group',
                      senderId : req.user.phone,
                      personRemoved : messageBody.phone,
                      groupId : messageBody.group_unique_id,
                      isAdmin: 'No',
                      membership_status : 'left',
                      badge : dataUser.iOS_badge
                    };

                    sendPushNotification(gotMember.member_phone, payload, false);

                    dataUser.iOS_badge = dataUser.iOS_badge;
                    dataUser.save(function(err){

                    });
                  })
                }
              })
              GroupMessagingUsers.findOne({group_unique_id : gotGroup._id, member_phone : messageBody.phone}, function(err2, gotUser){
                if(err2) { return handleError(res, err2); }
                gotUser.membership_status = 'left';
                gotUser.date_left = Date.now();
                gotUser.save(function(err){
                  response.unsentRemovedGroupMembers.push({status:'success'});
                })
              })
            })
          } else {
            response.unsentRemovedGroupMembers.push({status:'success'});
          }
        })
      });
    });

    // console.log('going to set timer in upward sync')
    // setTimeout(function () {
    //   console.log(req.body)
    //   console.log('Upward Sync in done');
    //   console.log(response);
    //   logger.serverLog('info', 'upward SYNC response payload : ');
    //   logger.serverLog('info', response);
    //   res.send(response);
    // }, 3000)


  } catch (err) {
    handleError(res, err);
  }
};

exports.downwardSync = function (req, res) {

  var statusOfSentMessages = req.body.statusOfSentMessages;
  var statusOfSentGroupMessages = req.body.statusOfSentGroupMessages;

  var response = {};

  userchat.find({ owneruser: req.user.phone, to: req.user.phone, status: 'sent' },
    function (err1, gotMessages) {
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

      //res.send({status : 'success', msg : gotMessages});
      response.partialChat = {status : 'success', msg : gotMessages};

      contactslist.find({ userid: req.user._id })
      .populate('contactid').exec(function (err2, gotContactList) {
    		if (err2) return next(err2);
    		//if (!gotContactList) return res.json(401);
        logger.serverLog('info', 'contactslist.controller : Contacts data sent to client');
    		//res.json(200, gotContactList);
        response.contactsUpdate = gotContactList;

        contactslist.find({ contactid: req.user._id, detailsshared: 'No' })
        .populate('contactid').exec(function(err2, gotContactList2){
      		if (err2) return next(err2);
      		//if (!gotContactList) return res.json(401);
          console.log('pending contacts ' + gotContactList);
          logger.serverLog('info', 'contactslist.controller : who have blocked me, data sent to client');
          //res.json(200, gotContactList);
          response.contactsWhoBlockedYou = gotContactList2;

          contactslist.find({ userid: req.user._id, detailsshared: 'No' })
          .populate('contactid').exec(function(err2, gotContactList3){
        		if (err2) return next(err2);
        		//if (!gotContactList) return res.json(401);
            console.log('pending contacts ' + gotContactList);
            logger.serverLog('info', 'contactslist.controller : contacts i blocked, data sent to client');
            //res.json(200, gotContactList3);
            response.contactsBlockedByMe = gotContactList3;

            GroupMessagingUsers.find({member_phone : req.user.phone, membership_status : 'joined'})
            .populate('group_unique_id').exec(function (err, mygroups) {
              if(err) { return handleError(res, err); }
              //return res.json(200, groupmessagingusers);
              response.myGroups = mygroups;

              var groupIds = [];
              for(var i in mygroups){
                groupIds[i] = mygroups[i].group_unique_id;
              }
              //logger.serverLog('info', 'these are my groups '+ groupIds);
              GroupMessagingUsers.find({group_unique_id : { $in : groupIds }})
              .populate('group_unique_id').exec(function (err, myGroupsMembers) {
                if(err) { return handleError(res, err); }
                //logger.serverLog('info', 'these are my groups members'+ JSON.stringify(groupmessagingusers));
                //return res.json(200, groupmessagingusers);
                response.myGroupsMembers = myGroupsMembers;

                GroupChatStatus.find({status:'sent', user_phone: req.user.phone})
                .populate('msg_unique_id').exec(function (err, groupchatstatus) {
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
                    response.partialGroupChat = groupchatstatusfilled;

                    userchat.find({uniqueid: { $in: statusOfSentMessages.unique_ids }}, function (err, chatstatus) {
                      if(err) { return handleError(res, err); }

                      response.statusOfSentMessages = chatstatus;

                      GroupChatStatus.find({chat_unique_id: { $in: statusOfSentGroupMessages.unique_ids }}, function (err, groupchatstatus) {
                        if(err) { return handleError(res, err); }
                        response.statusOfSentGroupMessages = groupchatstatus;

                        return res.json(200, response);
                      });

                    });

                  });

                });
              })

            });

        	});

      	});

    	});

    });
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
      //logger.serverLog('info', 'Azure push notification sent to Android using GCM Module, client number : '+ tagname);
    } else {
      logger.serverLog('info', 'Azure push notification error : '+ JSON.stringify(error));
    }
  });
  notificationHubService.apns.send(tagname, iOSMessage, function(error){
    if(!error){
      //logger.serverLog('info', 'Azure push notification sent to iOS using GCM Module, client number : '+ tagname);
    } else {
      //logger.serverLog('info', 'Azure push notification error : '+ JSON.stringify(error));
    }
  });

  // For iOS Local testing only
  var notificationHubService2 = azure.createNotificationHubService('CloudKiboIOSPush','Endpoint=sb://cloudkiboiospush.servicebus.windows.net/;SharedAccessKeyName=DefaultFullSharedAccessSignature;SharedAccessKey=0JmBCY+BNqMhuAS1g39wPBZFoZAX7M+wq4z4EWaXgCs=');

  notificationHubService2.apns.send(tagname, iOSMessage, function(error){
    if(!error){
      //logger.serverLog('info', 'Azure push notification sent to iOS (local testing) using GCM Module, client number : '+ tagname);
    } else {
      logger.serverLog('info', 'Azure push notification error (iOS local testing) : '+ JSON.stringify(error));
    }
  });

}

function handleError(res, err) {
  return res.send(500, err);
}
