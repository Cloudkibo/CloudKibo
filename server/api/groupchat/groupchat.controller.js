'use strict';

var _ = require('lodash');
var GroupChats = require('./groupchat.model');
var user = require('../user/user.model');
var groupchatstatus = require('../groupchatstatus/groupchatstatus.model');
var groupmessaginguser = require('../groupmessaginguser/groupmessaginguser.model');
var groupmessaging = require('../groupmessaging/groupmessaging.model');
var logger = require('../../components/logger/logger');
var azure = require('azure');
var sendPushNotification = require('../../components/pushnotifications/pushnotification');

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
  if(req.body.type === 'contact'){
		var tokenized = req.body.msg.split(":");
		User.findOne({phone: tokenized[1]}, function(err, user){
			if(user){
				req.body.msg = req.body.msg + ':true';
			} else {
				req.body.msg = req.body.msg + ':false';
			}
			sendMessage(req, res);
		});
	} else {
		sendMessage(req, res);
	}
};

function sendMessage(req, res) {
  logger.serverLog('info', 'group chat body '+ JSON.stringify(req.body));
  groupmessaging.findOne({unique_id : req.body.group_unique_id },
    function (err, groupFound) {
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

                if(useringroup.is_mute){
                  console.log(useringroup);
                  console.log(Date.now() * 0.001);
                  if(useringroup.is_mute === 'yes' && ((Date.now() * 0.001) <= useringroup.end_mute_time)) {
                    sendPushNotification(dataUser.phone, payload, false);
                  } else {
                    sendPushNotification(dataUser.phone, payload, true);
                  }
                } else {
                  sendPushNotification(dataUser.phone, payload, true);
                }

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
}

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
