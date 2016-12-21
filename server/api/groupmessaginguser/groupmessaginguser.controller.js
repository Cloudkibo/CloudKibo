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

exports.mygroups = function(req, res) {
  GroupMessagingUsers.find({member_phone : req.user.phone, membership_status : 'joined'}).populate('group_unique_id').exec(function (err, groupmessagingusers) {
    if(err) { return handleError(res, err); }
    return res.json(200, groupmessagingusers);
  });
};

exports.mygroupsmembers = function(req, res) {
  GroupMessagingUsers.find({member_phone : req.user.phone, membership_status : 'joined'}, function (err, mygroups) {
    if(err) { return handleError(res, err); }
    var groupIds = [];
    for(var i in mygroups){
      groupIds[i] = mygroups[i].group_unique_id;
    }
    //logger.serverLog('info', 'these are my groups '+ groupIds);
    GroupMessagingUsers.find({group_unique_id : { $in : groupIds }}).populate('group_unique_id').exec(function(err, groupmessagingusers){
      if(err) { return handleError(res, err); }
      //logger.serverLog('info', 'these are my groups members'+ JSON.stringify(groupmessagingusers));
      return res.json(200, groupmessagingusers);
    })
  });
};

exports.myspecificgroupsmembers = function(req, res) {
  GroupMessaging.findOne({unique_id : req.body.unique_id}, function(err, gotGroup){
    if(err)  { return handleError(res, err); }
    GroupMessagingUsers.find({group_unique_id : gotGroup._id}).populate('group_unique_id').exec(function(err, groupmessagingusers){
      if(err) { return handleError(res, err); }
      logger.serverLog('info', 'these are my specific group members'+ JSON.stringify(groupmessagingusers));
      return res.json(200, groupmessagingusers);
    })
  })
};

exports.updateRole = function(req, res) {
  logger.serverLog('info', 'body for updating group member role '+ JSON.stringify(req.body));
  GroupMessaging.findOne({unique_id : req.body.group_unique_id}, function(err, gotGroup){
    if(err)  { return handleError(res, err); }
    GroupMessagingUsers.findOne({member_phone : req.user.phone, group_unique_id : gotGroup._id}, function (err, gotUser) {
      if(err) { return handleError(res, err); }
      if(gotUser.isAdmin === 'No') { return res.json(401, {error: 'Only admin can change the role of other group member.'})}
      GroupMessagingUsers.update(
        {member_phone: req.body.member_phone, group_unique_id: gotGroup._id},
        {isAdmin : req.body.makeAdmin}, // should have value one of 'Yes', 'No'
        {multi : false},
        function (err, num){
          res.json(200, {status : 'success'})
          GroupMessagingUsers.find({group_unique_id : gotGroup._id, membership_status : 'joined'}, function(err, gotMembers){
            if(err) { return handleError(res, err); }
            var membersArray = gotMembers;
            membersArray.forEach(function(gotMember){
              if(gotMember.member_phone !== req.user.phone){
                user.findOne({phone : gotMember.member_phone}, function(err, dataUser){
                  var payload = {
                    type : 'group:role_updated',
                    senderId : req.user.phone,
                    personUpdated : req.body.member_phone,
                    groupId : req.body.group_unique_id,
                    isAdmin: req.body.makeAdmin,
                    badge : dataUser.iOS_badge
                  };

                  logger.serverLog('info', 'updated role of member: sending push to group members '+ gotMember.member_phone +' that someones role was updated');
                  sendPushNotification(gotMember.member_phone, payload, false);

                  dataUser.iOS_badge = dataUser.iOS_badge;
                  dataUser.save(function(err){

                  });
                })
              }
            })
          })
        }
      );
    });
  })

};

// Creates a new GroupMessagingUsers in the DB.
exports.create = function(req, res) {

  GroupMessaging.findOne({unique_id : req.body.group_unique_id}, function(err, gotGroup){
    if(err)  { return handleError(res, err); }

    GroupMessagingUsers.findOne({member_phone : req.user.phone, group_unique_id : gotGroup._id}, function(err, gotAdmin){

        if(gotAdmin.isAdmin === 'Yes'){
          GroupMessagingUsers.find({group_unique_id : gotGroup._id, membership_status : 'joined'}, function(err, gotMembers){
            if(err) { return handleError(res, err); }
            var membersArray = gotMembers;
            membersArray.forEach(function(gotMember){
              if(gotMember.member_phone !== req.user.phone){
                user.findOne({phone : gotMember.member_phone}, function(err, dataUser){
                  var payload = {
                    type : 'group:added_to_group',
                    senderId : req.user.phone,
                    personsAdded : req.body.members,
                    groupId : req.body.group_unique_id,
                    isAdmin: 'Yes',
                    badge : dataUser.iOS_badge
                  };

                  logger.serverLog('info', 'added members: sending push to group members '+ gotMember.member_phone +' that someone was added to existing group');
                  sendPushNotification(gotMember.member_phone, payload, false);

                  dataUser.iOS_badge = dataUser.iOS_badge;
                  dataUser.save(function(err){

                  });
                })
              }
            })
          })
          var membersArray = req.body.members;
          membersArray.forEach(function(gotMember){
            user.findOne({phone : gotMember}, function(err, dataUser){
              var groupmember = {
                group_unique_id: gotGroup._id,
                member_phone: gotMember,
                display_name: dataUser.display_name,
                isAdmin: 'No',
                membership_status : 'joined'
              }
              GroupMessagingUsers.create(groupmember, function(err3, groupmembersaved1){
                if(err3) { return handleError(res, err); }
                // SEND PUSH NOTIFICATION HERE
                var payload = {
                  type : 'group:you_are_added',
                  senderId : req.user.phone,
                  groupId : req.body.group_unique_id,
                  isAdmin: 'No',
                  membership_status : 'joined',
                  msg : req.user.display_name + ' added you to the group "'+ req.body.group_name +'"',
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
          })

          return res.json(201, {status: 'success', msg:'New members are added to group.'});
        } else {
          return res.json('501', {status: 'unauthorized', msg:'You are not admin of this group.'})
        }

    })

  })
};

exports.leaveGroup = function(req, res) {
  GroupMessaging.findOne({unique_id : req.body.group_unique_id}, function(err, gotGroup){
    if(err)  { return handleError(res, err); }

    GroupMessagingUsers.find({group_unique_id : gotGroup._id, membership_status : 'joined'}, function(err, gotMembers){
      if(err) { return handleError(res, err); }
      var membersArray = gotMembers;
      membersArray.forEach(function(gotMember){
        if(gotMember.member_phone !== req.user.phone){
          user.findOne({phone : gotMember.member_phone}, function(err, dataUser){
            var payload = {
              type : 'group:member_left_group',
              senderId : req.user.phone,
              groupId : req.body.group_unique_id,
              isAdmin: 'No',
              membership_status : 'left',
              badge : dataUser.iOS_badge
            };

            logger.serverLog('info', 'sending push to group member '+ gotMember.member_phone +' that someone has left group');
            sendPushNotification(gotMember.member_phone, payload, true);

            dataUser.iOS_badge = dataUser.iOS_badge;
            dataUser.save(function(err){

            });
          })
        }
      })
      GroupMessagingUsers.findOne({group_unique_id : gotGroup._id, member_phone : req.user.phone}, function(err2, gotUser){
        if(err2) { return handleError(res, err2); }
        gotUser.membership_status = 'left';
        gotUser.date_left = Date.now();
        gotUser.save(function(err){
          return res.json(200, {status:'success'})
        })
      })
    })

  })
};

exports.removeFromGroup = function(req, res) {
  logger.serverLog('info', 'remove member from group body '+ JSON.stringify(req.body));
  GroupMessaging.findOne({unique_id : req.body.group_unique_id}, function(err, gotGroup){
    if(err)  { return handleError(res, err); }
    logger.serverLog('info', 'remove member: group found using query '+ JSON.stringify(gotGroup));
    GroupMessagingUsers.findOne({member_phone : req.user.phone, group_unique_id : gotGroup._id}, function(err, adminData){
      logger.serverLog('info', 'remove member: admin found using query '+ JSON.stringify(adminData));
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
                  personRemoved : req.body.phone,
                  groupId : req.body.group_unique_id,
                  isAdmin: 'No',
                  membership_status : 'left',
                  badge : dataUser.iOS_badge
                };

                logger.serverLog('info', 'remove member: sending push to group member '+ gotMember.member_phone +' that someone was removed from group');
                sendPushNotification(gotMember.member_phone, payload, false);

                dataUser.iOS_badge = dataUser.iOS_badge;
                dataUser.save(function(err){

                });
              })
            }
          })
          GroupMessagingUsers.findOne({group_unique_id : gotGroup._id, member_phone : req.body.phone}, function(err2, gotUser){
            if(err2) { return handleError(res, err2); }
            gotUser.membership_status = 'left';
            gotUser.date_left = Date.now();
            gotUser.save(function(err){
              logger.serverLog('info', 'remove member: admin found using query '+ JSON.stringify(gotGroup));
              return res.json(200, {status:'success'})
            })
          })
        })
      } else {
        return res.json(501, {status:'success'})
      }
    })
  })

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
