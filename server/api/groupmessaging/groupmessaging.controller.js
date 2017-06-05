'use strict';

var _ = require('lodash');
var GroupMessaging = require('./groupmessaging.model');
var GroupMessagingUser = require('../groupmessaginguser/groupmessaginguser.model');
var user = require('../user/user.model');
var logger = require('../../components/logger/logger');
var azure = require('azure');
var crypto = require('crypto');
var sendPushNotification = require('../../components/pushnotifications/pushnotification');

// Get list of GroupMessagings
exports.index = function(req, res) {
  GroupMessaging.find(function (err, groupmessagings) {
    if(err) { return handleError(res, err); }
    return res.json(200, groupmessagings);
  });
};

exports.specificGroup = function(req, res) {
  GroupMessaging.find({unique_id : req.body.unique_id}, function (err, groupmessaging) {
    if(err) { return handleError(res, err); }
    return res.json(200, groupmessaging);
  });
};

// Creates a new GroupMessaging in the DB.
exports.create = function(req, res) {

  logger.serverLog('info', 'create group body '+ JSON.stringify(req.body));

  var today = new Date();
  var uid = Math.random().toString(36).substring(7);
  var unique_id = 'h' + uid + '' + today.getFullYear() + '' + (today.getMonth()+1) + '' + today.getDate() + '' + today.getHours() + '' + today.getMinutes() + '' + today.getSeconds();

  var body = {
    group_name : req.body.group_name,
    unique_id : req.body.unique_id
  };

  GroupMessaging.create(body, function(err, groupmessaging) {
    if(err) { console.log('31'); console.log(err); return handleError(res, err); }

    var groupmember1 = {
      group_unique_id: groupmessaging._id,
      member_phone: req.user.phone,
      display_name: req.user.display_name,
      isAdmin: 'Yes',
      membership_status : 'joined'
    }

    GroupMessagingUser.create(groupmember1, function(err2, groupmembersaved){
      if(err2) { console.log('41'); console.log(err2); return handleError(res, err2); }

      var membersArray = req.body.members;

      membersArray.forEach(function(gotMember){
        user.findOne({phone : gotMember}, function(err, dataUser){
          var groupmember = {
            group_unique_id: groupmessaging._id,
            member_phone: gotMember,
            display_name: dataUser.display_name,
            isAdmin: 'No',
            membership_status : 'joined'
          }

          logger.serverLog('info', 'adding group member '+ gotMember +' to group '+ req.body.group_name);

          GroupMessagingUser.create(groupmember, function(err3, groupmembersaved1){
            if(err3) { console.log('53'); console.log(err3); return handleError(res, err3); }
            // SEND PUSH NOTIFICATION HERE
            logger.serverLog('info', 'added group member '+ gotMember +' to group '+ req.body.group_name);
            logger.serverLog('info', JSON.stringify(groupmembersaved1));
            var payload = {
              type : 'group:you_are_added',
              senderId : req.user.phone,
              groupId : req.body.unique_id,
              isAdmin: 'No',
              membership_status : 'joined',
              group_name: req.body.group_name,
              msg : req.user.display_name + ' added you to the group "'+ req.body.group_name +'"',
              badge : dataUser.iOS_badge + 1
            };

            logger.serverLog('info', 'sending push to group member '+ groupmembersaved1.member_phone +' that you are added to group');
            sendPushNotification(groupmembersaved1.member_phone, payload, true);

            dataUser.iOS_badge = dataUser.iOS_badge + 1;
            dataUser.save(function(err){

            });

          })
        })
      });

      return res.json(201, groupmessaging);
    })
  });
};

exports.uploadIcon = function(req, res) {
	logger.serverLog('info', 'groupmessaging.controller : upload file route called for GROUP ICON file is: '+ JSON.stringify(req.files));

  GroupMessaging.findOne({ unique_id: req.body.unique_id}, function (err, groupmessaging) {
    if (err) { return handleError(res, err); }

    logger.serverLog('info', 'groupmessaging.controller : upload file for GROUP ICON : group data ' + JSON.stringify(groupmessaging));

    if (groupmessaging.group_icon == null) {
      logger.serverLog('info', 'groupmessaging.controller : upload file for GROUP ICON : group has NO ICON before. Uploading first time for this group');
      var today = new Date();
    	var uid = crypto.randomBytes(5).toString('hex');
    	var serverPath = '/' + 'f' + uid + '' + today.getFullYear() + '' + (today.getMonth()+1) + '' + today.getDate();
    	serverPath += '' + today.getHours() + '' + today.getMinutes() + '' + today.getSeconds();
    	serverPath += '' + req.files.file.type;

    	console.log(__dirname);

      // todo delete the previously stored icon for a group
    	var dir = "./userpictures";

    	if(req.files.file.size == 0) return res.send('No file submitted');

    	require('fs').rename(
    	 req.files.file.path,
    	 dir + "/" + serverPath,
    		function(error) {
    			 if(error) {
    				 logger.serverLog('error', 'user.controller (update icon) : '+ error);
    				res.send({
    					error: 'Server Error: Could not upload the file'
    				});
    				return 0;
    			 }
          console.log(req.body);
          groupmessaging.group_icon = serverPath;
          logger.serverLog('info', 'file icon uploaded and path calculated is '+ serverPath);
          logger.serverLog('info', 'file icon uploaded and address given is '+ JSON.stringify(groupmessaging));
          groupmessaging.save(function(err){
            GroupMessagingUser.find({ group_unique_id: groupmessaging._id },
              function (err2, usersingroup) {
              logger.serverLog('info', 'members in group which will get icon update '+ JSON.stringify(usersingroup));
              if(err2) return handleError(res, err);
              usersingroup.forEach(function(useringroup){
                logger.serverLog('info', 'member in group is being checked '+ JSON.stringify(useringroup));
                if(req.user.phone !== useringroup.member_phone){
                  if(useringroup.membership_status === 'joined'){
                    user.findOne({phone : useringroup.member_phone}, function(err, dataUser){
                      logger.serverLog('info', 'member in group which will get icon update '+ JSON.stringify(dataUser));
                      var payload = {
                        type : 'group:icon_update',
                        senderId : req.user.phone,
                        groupId : req.body.unique_id,
                        badge : dataUser.iOS_badge
                      };

                      logger.serverLog('info', 'sending push to group member ' +
                      useringroup.member_phone + ' that group icon is changed');

                      sendPushNotification(dataUser.phone, payload, true);
                    });
                  }
                }
              });
            });
            return res.json(200, { status: 'success' });
          });
        }
      );
    } else {
      var dir = './userpictures';
      dir += groupmessaging.group_icon;

      logger.serverLog('info', 'groupmessaging.controller : upload file for GROUP ICON : group has ICON before. Uploading again for this group');

      require('fs').unlink(dir, function (err) {
          if (err) {
            logger.serverLog('error', 'user.controller (update icon) : '+ err);
          }

          var today = new Date();
          var uid = crypto.randomBytes(5).toString('hex');
          var serverPath = '/' + 'f' + uid + '' + today.getFullYear() + '' + (today.getMonth()+1) + '' + today.getDate();
          serverPath += '' + today.getHours() + '' + today.getMinutes() + '' + today.getSeconds();
          serverPath += '' + req.files.file.type;

          var dir = "./userpictures";

          if(req.files.file.size == 0) return res.send('No file submitted');

          require('fs').rename(
           req.files.file.path,
           dir + "/" + serverPath,
            function(error) {
               if(error) {
                 logger.serverLog('error', 'user.controller (update image 2) : '+ error);
                res.send({
                  error: 'Server Error: Could not upload the file'
                });
                return 0;
               }
               console.log(req.body);
               if(err) { return handleError(res, err); }
               groupmessaging.group_icon = serverPath;
               logger.serverLog('info', 'file icon uploaded and path calculated is '+ serverPath);
               logger.serverLog('info', 'file icon uploaded and address given is '+ JSON.stringify(groupmessaging));
               groupmessaging.save(function(err){
                 GroupMessagingUser.find({ group_unique_id: groupmessaging._id },
                   function (err2, usersingroup) {
                   logger.serverLog('info', 'members in group which will get icon update '+ JSON.stringify(usersingroup));
                   if(err2) return handleError(res, err);
                   usersingroup.forEach(function(useringroup){
                     logger.serverLog('info', 'member in group is being checked '+ JSON.stringify(useringroup));
                     if(req.user.phone !== useringroup.member_phone){
                       if(useringroup.membership_status === 'joined'){
                         user.findOne({phone : useringroup.member_phone}, function(err, dataUser){
                           logger.serverLog('info', 'member in group which will get icon update '+ JSON.stringify(dataUser));
                           var payload = {
                             type : 'group:icon_update',
                             senderId : req.user.phone,
                             groupId : req.body.unique_id,
                             badge : dataUser.iOS_badge
                           };

                           logger.serverLog('info', 'sending push to group member ' +
                           useringroup.member_phone + ' that group icon is changed');

                           sendPushNotification(dataUser.phone, payload, true);
                         });
                       }
                     }
                   });
                 });
                 return res.json(200, { status: 'success' });
               });
             }
          );
      });
    }
  });
};

exports.downloadIcon = function (req, res, next) {
	GroupMessaging.findOne({ unique_id: req.body.unique_id }, function (err, data) {
		if (err) return res.send({ status: 'database error' });
		res.sendfile(data.group_icon, { root: './userpictures' });
	});
};

exports.updateGroupName = function (req, res) {
  GroupMessaging.findOne({ unique_id: req.body.unique_id }, function (err, groupmessaging) {
    if (err) { return handleError(res, err); }
    if (!groupmessaging) { return res.send(404); }
    groupmessaging.group_name = req.body.group_name;
    var updated = groupmessaging; //_.merge(groupmessaging, req.body);
    updated.save(function (err1) {
      if (err1) { return handleError(res, err1); }

      GroupMessagingUser.find({ group_unique_id: groupmessaging._id },
        function (err2, usersingroup) {

        logger.serverLog('info', 'members in group which will get group name ' +
          'update ' + JSON.stringify(usersingroup));

        if (err2) return handleError(res, err);

        usersingroup.forEach(function (useringroup) {

          logger.serverLog('info', 'member in group is being checked ' + JSON.stringify(useringroup));

          if (req.body.from !== useringroup.member_phone) {
            if(useringroup.membership_status === 'joined'){
              user.findOne({ phone: useringroup.member_phone }, function (err, dataUser) {
                logger.serverLog('info', 'member in group which will get icon update ' + JSON.stringify(dataUser));
                var payload = {
                  type : 'group:name_update',
                  new_name: req.body.group_name,
                  senderId : req.user.phone,
                  groupId : req.body.unique_id,
                  badge : dataUser.iOS_badge
                };

                logger.serverLog('info', 'sending push to group member ' +
                useringroup.member_phone + ' that group icon is changed');

                sendPushNotification(dataUser.phone, payload, true);
              })
            }
          }
        });
      });
      return res.json(200, groupmessaging);
    });
  });
};

// Updates an existing GroupMessaging in the DB.
exports.update = function(req, res) {
  if (req.body._id) { delete req.body._id; }
  GroupMessaging.findById(req.params.id, function (err, groupmessaging) {
    if (err) { return handleError(res, err); }
    if (!groupmessaging) { return res.send(404); }
    var updated = _.merge(groupmessaging, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.json(200, groupmessaging);
    });
  });
};

// Deletes a GroupMessaging from the DB.
exports.destroy = function(req, res) {
  GroupMessaging.findById(req.params.id, function (err, groupmessaging) {
    if(err) { return handleError(res, err); }
    if(!groupmessaging) { return res.send(404); }
    groupmessaging.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.send(204);
    });
  });
};

function handleError(res, err) {
  console.log()
  return res.send(500, err);
}
