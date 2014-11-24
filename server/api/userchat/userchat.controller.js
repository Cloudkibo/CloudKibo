'use strict';

var userchat = require('./userchat.model');
var User = require('../user/user.model');
var contactslist = require('../contactslist/contactslist.model');
var config = require('../../config/environment');


exports.index = function(req, res) {
	User.findById(req.user._id, function (err, gotUser) {
			if (err) return console.log('Error 1'+ err)
			
			if(req.body.user1 == gotUser.username){
	  
				  userchat.find({$or: [ { to : req.body.user1, from : req.body.user2 }, 
										{ to : req.body.user2, from : req.body.user1 } ]}, 
										function(err1, gotMessages){
											if(err1) return console.log(err1);
											
											res.send({status : 'success', msg : gotMessages});
											
										})
				
			}
	  })
};

exports.save = function(req, res) {
	User.findById(req.user._id, function (err, gotUser) {
		if (err) return console.log('Error 1'+ err)
		
		if(req.body.from == gotUser.username){
  
			  var newUserChat = new userchat({
					to : req.body.to,
					from : req.body.from,
					fromFullName : req.body.fromFullName,
					msg : req.body.msg
			  })
			  
			  newUserChat.save(function (err2) {
					if (err2) return console.log('Error 2'+ err2);
					res.send({status : 'success', msg : 'stored the message'});
	
					contactslist.findOne({userid : req.body.to_id, contactid : req.body.from_id}).exec(function(err3, gotContact){
						
						gotContact.unreadMessage = true;
						
						gotContact.save(function(err){
							
						})
						
					})
			  });
			
		}
	})
};


exports.markasread = function(req, res) {
	User.findById(req.user._id, function (err, gotUser) {
		if (err) return console.log('Error 1'+ err)
	
		contactslist.findOne({userid : req.body.user1, contactid : req.body.user2}).exec(function(err3, gotContact){
			
			gotContact.unreadMessage = false;
			
			gotContact.save(function(err){
				
			})
			
		})
	})
};
