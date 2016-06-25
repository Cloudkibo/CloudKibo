'use strict';

var userchat = require('./userchat.model');
var User = require('../user/user.model');
var contactslist = require('../contactslist/contactslist.model');
var config = require('../../config/environment');
var logger = require('../../components/logger/logger');


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
	User.findById(req.user._id, function (err, gotUser) {
			if (err) return console.log('Error 1'+ err);

			if(req.body.user1 == gotUser.phone){

				  userchat.find({owneruser : gotUser.phone},
																		function(err1, gotMessages){
																			if(err1) return console.log(err1);

                                      logger.serverLog('info', 'userchat.controller : All Chat data sent to client');

																			res.send({status : 'success', msg : gotMessages});

																		})

			}
	  })
};

exports.removechathistory = function(req, res) {
	 User.findById(req.user._id, function (err, gotUser) {
		if (err) return console.log('Error 1'+ err);

		console.log("removing chat history");

		User.findOne({username : req.body.phone}, function (err, gotUserSaved) {
			userchat.remove({owneruser : gotUser.phone, $or: [ { to : gotUserSaved.username, from : gotUser.username },
										{ to : gotUser.phone, from : gotUserSaved.username } ]},
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


exports.markasread = function(req, res) {
	User.findById(req.user._id, function (err, gotUser) {
		if (err) return console.log('Error 1'+ err);

    logger.serverLog('info', "mark chat as read called");

		contactslist.findOne({userid : req.body.user1, contactid : req.body.user2}).exec(function(err3, gotContact){

			gotContact.unreadMessage = false;

      logger.serverLog('info',req.body.user1+ " " +req.body.user2 );
			gotContact.save(function(err){
        logger.serverLog('error', err)

			})

		});

	})
};
