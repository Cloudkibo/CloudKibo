var passport = require('passport'); var 
mongoose = require('mongoose'); var Account = 
require('./../models/account'); var fs = require('fs'); var crypto = 
require("crypto"); var otherSchemas = 
require('./../models/otherSchemas'); var tokenSchemas = 
require('./../models/tokenSchemas');

var html_dir = './public/';

exports.saveUniqueUserName = function (req, res) {
	  if (typeof req.user == 'undefined')
	      res.redirect('/')
      else{
		  Account.findOne({username : req.body.uniqueusername}, function (err, gotTestUser) {
			  
			  // If there is another username available already
			  // it might possibly means that I am federate account
			  if(gotTestUser != null && (typeof req.body.fbId != 'undefined' || typeof req.body.googleId != 'undefined' || typeof req.body.windowsId != 'undefined'))
			  {
				  res.send({status: 'danger', msg: 'This username is already taken.'})
			  }
			  else if(gotTestUser != null && typeof req.body.fbId == 'undefined' && typeof req.body.googleId == 'undefined' && typeof req.body.windowsId == 'undefined')
			  {
				  if(gotTestUser._id != req.user._id)
					res.send({status: 'danger', msg: 'This username is already taken.'})
				  else{
					  
						  Account.findById(req.user._id, function (err, gotUser) {
							if (err) return console.log('Error 1'+ err)
							
							gotUser.username = req.body.uniqueusername;
								
							gotUser.save(function (err2) {
								if (err2) return console.log('Error 2'+ err2);
								
								res.send({status: 'success', msg: req.body.uniqueusername})
								
							});
						})
				  }
			  }
			  else{
				  Account.findById(req.user._id, function (err, gotUser) {
							if (err) return console.log('Error 1'+ err)
							
							gotUser.username = req.body.uniqueusername;
								
							gotUser.save(function (err2) {
								if (err2) return console.log('Error 2'+ err2);
								
								res.send({status: 'success', msg: req.body.uniqueusername})
								
							});
						})
			  }
		  })
      }
  };

// Make this res.send({status: null, msg: null}) format in future  
exports.updateProfileRoute = function (req, res) {
	  if (typeof req.user == 'undefined')
	      res.redirect('/')
      else{

		  Account.findById(req.user._id, function (err, gotUser) {
				if (err) return console.log('Error 1'+ err)
				
				gotUser.username = req.body.username;
				gotUser.firstname = req.body.firstname;
				gotUser.lastname = req.body.lastname;
				gotUser.email = req.body.email;
				gotUser.phone = req.body.phone;
				gotUser.city = req.body.city;
				gotUser.state = req.body.state;
				gotUser.country = req.body.country;
					
				gotUser.save(function (err2) {
					if (err2) return console.log('Error 2'+ err2);
					
					Account.findById(gotUser, function (err, gotUserSaved) {
						
						res.send(gotUserSaved);
						
					})
					
				});
			})
      }
  };

// Make this API route, it sends the partial view and not data
// Make new one for this when needed  
exports.updateProfilePicRoute = function (req, res) {
	  if (typeof req.user == 'undefined')
	      res.redirect('/')
      else{

		  Account.findById(req.user._id, function (err, gotUser) {
				if (err) return console.log('Error 1'+ err)
				
				if(gotUser.picture == null)
				{
					  var today = new Date();
					  var uid = crypto.randomBytes(5).toString('hex');
					  var serverPath = '/' + 'f' + uid + '' + today.getFullYear() + '' + (today.getMonth()+1) + '' + today.getDate();
					  serverPath += '' + today.getHours() + '' + today.getMinutes() + '' + today.getSeconds();
					  serverPath += '' + req.files.fileUploaded.name;
					  
					  var dir = __dirname + "/../userpictures";
					  
					  if(req.files.fileUploaded.size == 0) return res.send('No file submitted')
					  
					  require('fs').rename(
						 req.files.fileUploaded.path,
						 dir + "/" + serverPath,
						  function(error) {
							   if(error) {
								  res.send({
									  error: 'Server Error: Could not upload the file'
								  });
								  return;
							   }
						   }
					  );
					  
					  gotUser.picture = serverPath;
					
						gotUser.save(function (err2) {
							if (err2) return console.log('Error 2'+ err2);
							
							Account.findById(gotUser, function (err, gotUserSaved) {
								
								//res.send(gotUserSaved);
								res.redirect('/home');
								
							})
							
						});
					  
				  }
				  else
				  {
					  var dir = './userpictures';
					  dir += gotUser.picture;
						
						if(gotUser.picture)
						{
							require('fs').unlink(dir, function (err) {
								  if (err) throw err;
								
								
								  var today = new Date();
								  var uid = crypto.randomBytes(5).toString('hex');
								  var serverPath = '/' + 'f' + uid + '' + today.getFullYear() + '' + (today.getMonth()+1) + '' + today.getDate();
								  serverPath += '' + today.getHours() + '' + today.getMinutes() + '' + today.getSeconds();
								  serverPath += '' + req.files.fileUploaded.name;
								  
								  var dir = __dirname + "/../userpictures";
								  
								  if(req.files.fileUploaded.size == 0) return res.send('No file submitted')
								  
								  require('fs').rename(
									 req.files.fileUploaded.path,
									 dir + "/" + serverPath,
									  function(error) {
										   if(error) {
											  res.send({
												  error: 'Server Error: Could not upload the file'
											  });
											  return;
										   }
									   }
								  );
								  
								  gotUser.picture = serverPath;
								
									gotUser.save(function (err2) {
										if (err2) return console.log('Error 2'+ err2);
										
										Account.findById(gotUser, function (err, gotUserSaved) {
											
											//res.send(gotUserSaved);
											res.redirect('/home');
											
										})
										
									});
								
								
							})  
						}
				  }
				
				
			})
      }
  };
  
exports.searchUserNameRoute = function (req, res) {
	  if (typeof req.user == 'undefined')
	      res.redirect('/')
      else{

		  Account.findById(req.user._id, function (err, gotUser) {
				if (err) return console.log('Error 1'+ err)
				
				Account.findOne({username : req.body.searchusername}, function (err, gotUserSaved) {
					
					res.send({status: 'success', msg: gotUserSaved});
					
				})
				
			})
      }
  };
  
exports.searchEmailRoute = function (req, res) {
	  if (typeof req.user == 'undefined')
	      res.redirect('/')
      else{

		  Account.findById(req.user._id, function (err, gotUser) {
				if (err) return console.log('Error 1'+ err)
								
				Account.findOne({email : req.body.searchemail}, function (err, gotUserSaved) {
					
					res.send({status: 'success', msg: gotUserSaved});
					
				})
			})
      }
  };
  
exports.addUserNameRoute = function (req, res) {
	  if (typeof req.user == 'undefined')
	      res.redirect('/')
      else{

		  Account.findById(req.user._id, function (err, gotUser) {
				if (err) return console.log('Error 1'+ err)
								
				Account.findOne({username : req.body.searchusername}, function (err, gotUserSaved) {
					
					if(gotUserSaved == null)
						return res.send({status: 'success', msg: null});
					
					var contactslist = otherSchemas.contactslist;
					
					contactslist.count({userid : gotUser._id, contactid : gotUserSaved._id}, function(err5, gotCount){
						
						if(gotUser.username == gotUserSaved.username)
							res.send({status: 'danger', msg: 'You can not add your self as a contact.'});
						else if(gotCount > 0)
							res.send({status: 'danger', msg: gotUserSaved.username +' is already added in your contact list with name '+ gotUserSaved.firstname +' '+ gotUserSaved.lastname});
						else{
							
							var contact = new contactslist({
								userid : gotUser._id,
								contactid : gotUserSaved._id
							});
							
							contact.save(function(err2){
								if (err2) return console.log('Error 2'+ err)
								
								contactslist.find({userid : gotUser._id}).populate('contactid').exec(function(err3, gotContactList){
									
									res.send({status: 'success', msg: gotContactList});
									
								})
							})
							
						}
						
					})
					
				})
			})
      }
  };
  
exports.addEmailRoute = function (req, res) {
	  if (typeof req.user == 'undefined')
	      res.redirect('/')
      else{

		  Account.findById(req.user._id, function (err, gotUser) {
				if (err) return console.log('Error 1'+ err)
								
				Account.findOne({email : req.body.searchemail}, function (err, gotUserSaved) {
					
					if(gotUserSaved == null)
						return res.send({status: 'success', msg: null});
					
					var contactslist = otherSchemas.contactslist;
					
					contactslist.count({userid : gotUser._id, contactid : gotUserSaved._id}, function(err5, gotCount){
						
						if(gotUser.username == gotUserSaved.username)
							res.send({status: 'danger', msg: 'You can not add your self as a contact.'});
						else if(gotCount > 0)
							res.send({status: 'danger', msg: gotUserSaved.username +' is already added in your contact list with name '+ gotUserSaved.firstname +' '+ gotUserSaved.lastname});
						else{
							
							var contact = new contactslist({
								userid : gotUser._id,
								contactid : gotUserSaved._id
							});
							
							contact.save(function(err2){
								if (err2) return console.log('Error 2'+ err)
								
								contactslist.find({userid : gotUser._id}).populate('contactid').exec(function(err3, gotContactList){
									
									res.send({status: 'success', msg: gotContactList});
									
								})
							})
							
						}
						
					})
					
				})
			})
      }
  };
  
  // Testing required
exports.emailInviteRoute = function (req, res) {
	  if (typeof req.user == 'undefined')
	      res.redirect('/')
      else{
			Account.findById(req.user._id, function (err, gotUser) {
				if (err) return console.log('Error 1'+ err)
				
				var sendgrid  = require('sendgrid')('cloudkibo', 'cl0udk1b0');

				var email     = new sendgrid.Email({
				  to:       req.body.recipientEmail,
				  from:     'support@cloudkibo.com',
				  subject:  ''+ req.user.firstname +' via CloudKibo: Join my Video Call',
				  text:     ''
				});
				
				var message = req.body.shortmessage;
				if(req.body.shortmessage == null || req.body.shortmessage == 'undefined')
				   message = 'Hello, I am available on CloudKibo for Video Chat.';

				email.setHtml('<h1>CloudKibo</h1><br><br>'+req.user.firstname+' has invited you to connect on CloudKibo.<br><br>'+
				'Follow the following URL to make an account on CloudKibo and Starting Video Conversations in real time in your browser.'+
				' <br><br><a href="https://www.cloudkibo.com/" target=_blank>http://www.cloudkibo.com/</a><br><br><br>' +
				'<span style="background:#22DFFF; width:100%; text-align:center;"><b><i>'+ message +'</i></b></span><br><br><br>'+
				'<p><b>With CloudKibo<b> you can do</b></p><br><ul><li>Video Call</li><li>Audio Call</li><li>File Transfering'+
				'</li><li>Screen Sharing</li><li>Instant Messaging</li></ul><br><br> Join CloudKibo and talk your dearest ones.');

				sendgrid.send(email, function(err, json) {
				  if (err) { return console.error(err); }

				  console.log(json);

				});
				
				res.send({status: 'success', msg: 'Email Sent Successfully'})
				
			})
		
      }
  };
  
exports.initialTestingDoneRoute = function (req, res) {
	  if (typeof req.user == 'undefined')
	      res.redirect('/')
      else{
			Account.findById(req.user._id, function (err, gotUser) {
				if (err) return console.log('Error 1'+ err)
				
				gotUser.initialTesting = req.body.initialTesting;
					
				gotUser.save(function (err2) {
					if (err2) return console.log('Error 2'+ err2);
					
					Account.findById(req.user._id, function (err3, gotUser1) {
						if (err3) return console.log('Error 3'+ err3);
						res.send({status: 'success', msg: gotUser1})
					})
					
					
				});
			})
		
      }
  };
  
exports.feedBackOnCallRoute = function (req, res) {
	  if (typeof req.user == 'undefined')
	      res.redirect('/')
      else{
			Account.findById(req.user._id, function (err, gotUser) {
				if (err) return console.log('Error 1'+ err)
				
				var news = otherSchemas.news
				
				var oneNews = new news({
					   		   label : 'FeedBack',
							   content : 'CloudKibo has got new feedback by '+ gotUser.username,
							   userid : gotUser._id
			    });
			   
				oneNews.save(function (err) {
					if (err) console.log(err)
				})
				
				var feedback = otherSchemas.feedback
				
				var newFeedback = new feedback({
					userid : gotUser._id,
				    audio : parseInt(req.body.audio),
				    video : parseInt(req.body.video),
				    screen : parseInt(req.body.screen),
				    filetransfer : parseInt(req.body.filetransfer),
				    comment : req.body.comments
				})
				
				newFeedback.save(function (err){
					if(err) console.log(err)
				})
				
				res.send({status: 'success', msg: req.body});
				
			})
		
      }
  };

exports.recordCallDataRoute = function (req, res) {
	  if (typeof req.user == 'undefined')
	      res.redirect('/')
      else{

		  Account.findById(req.user._id, function (err, gotUser) {
				if (err) return console.log('Error 1'+ err)
				
				if(req.body.Caller != null)
				{
					var callrecord = otherSchemas.callrecord
					
					var record = new callrecord({
								   caller : req.body.Caller,
								   callee : req.body.Callee,
								   starttime : req.body.StartTime,
								   endtime : req.body.EndTime
					});
				   
					record.save(function (err) {
						if (err) console.log(err)
					})
				}
				
			})
      }
  };
  
exports.recordMeetingDataRoute = function (req, res) {
	  if (typeof req.user == 'undefined')
	      res.redirect('/')
      else{

		  Account.findById(req.user._id, function (err, gotUser) {
				if (err) return console.log('Error 1'+ err)
				
				if(req.body.creator != null)
				{
					var meetingrecord = otherSchemas.meetingrecord
					
					var record = new meetingrecord({
								   creator : req.body.creator,
								   roomname : req.body.roomname,
								   members : req.body.members,
								   starttime : req.body.StartTime,
								   endtime : req.body.EndTime
					});
				   
					record.save(function (err) {
						if (err) console.log(err)
					})
				}
				
			})
      }
  };
  
exports.forgotPasswordEmailRequest = function(req, res) {
	  if (typeof req.user != 'undefined') res.redirect('/');
      else{ 
		  
		  Account.findOne({username : req.body.username}, function(err, gotUser){
			  if(err) return console.log(err)
			  if(!gotUser) return res.send({status:'error', msg:'Sorry! No such username exists in our database.'})
			  
			  var tokenString = crypto.randomBytes(15).toString('hex');
					
				var passwordresettoken = tokenSchemas.passwordresettoken
				
				var newToken = new passwordresettoken({
							user : gotUser._id,
							token : tokenString
				});
				
				newToken.save(function(err){
					if (err) return console.log(err)
				})
				
				var sendgrid  = require('sendgrid')('cloudkibo', 'cl0udk1b0');
					
					var email     = new sendgrid.Email({
					  to:       gotUser.email,
					  from:     'support@cloudkibo.com',
					  subject:  'CloudKibo: Password Reset',
					  text:     'Password Reset'
					});
					
					email.setHtml('<h1>CloudKibo</h1><br><br>Use the following link to change your password <br><br> http://www.cloudkibo.com/resetpassword/'+ tokenString);
					
					sendgrid.send(email, function(err, json) {
					  if (err) { return console.error(err); }
					  
					  console.log(json);
					  
					  res.send({status:'success', msg:'Password Reset Link has been sent to your email address. Check your spam or junk folder if you have not received our email.'});
					  
					});
		  })

	  }
  };
 
 
 
// Make this res.send({status: null, msg: null}) format in future
exports.changePasswordRoute = function(req, res){
	  if (typeof req.user != 'undefined') res.redirect('/');
      else{ 
	    
	    var token = req.body.token;
		  
		var passwordresettoken = tokenSchemas.passwordresettoken
	
		passwordresettoken.findOne({token: token}, function (err, doc){
			if (err) return done(err);
			if(!doc) return res.render("passwordreset-failure");
			
			Account.findOne({_id: doc.user}, function (err, user) {
				if (err) return done(err);
				if (!user) return res.render("passwordreset-failure");
				
				Account.resetpassword(user, req.body.password, function(err, gotUser){
				   console.log(gotUser)
				   res.send('Password Successfully Changed. Please login with your new password')
			    })
			})
		
		})

	  }
  };
  
  exports.saveChatMessageRoute = function (req, res) {
	  if (typeof req.user == 'undefined')
	      res.redirect('/')
      else{
		  
		    Account.findById(req.user._id, function (err, gotUser) {
				if (err) return console.log('Error 1'+ err)
				
				if(req.body.from == gotUser.username){
					
					  var userchat = otherSchemas.userchat;
		  
					  var newUserChat = new userchat({
							to : req.body.to,
							from : req.body.from,
							fromFullName : req.body.fromFullName,
							msg : req.body.msg
					  })
					  
					  newUserChat.save(function (err2) {
							if (err2) return console.log('Error 2'+ err2);
							res.send({status : 'success', msg : 'stored the message'});
							
							var contactslist = otherSchemas.contactslist;
			
							contactslist.findOne({userid : req.body.to_id, contactid : req.body.from_id}).exec(function(err3, gotContact){
								
								gotContact.unreadMessage = true;
								
								gotContact.save(function(err){
									
								})
								
							})
					  });
					
				}
			})
      }
  };
  
  exports.markMessageReadRoute = function (req, res) {
	  if (typeof req.user == 'undefined')
	      res.redirect('/')
      else{
		  
		    Account.findById(req.user._id, function (err, gotUser) {
				if (err) return console.log('Error 1'+ err)
				
				var contactslist = otherSchemas.contactslist;
			
				contactslist.findOne({userid : req.body.user1, contactid : req.body.user2}).exec(function(err3, gotContact){
					
					gotContact.unreadMessage = false;
					
					gotContact.save(function(err){
						
					})
					
				})
			})
      }
  };
  
  exports.setStatusStatementRoute = function (req, res) {
	  if (typeof req.user == 'undefined')
	      res.redirect('/')
      else{
		  
		    Account.findById(req.user._id, function (err, gotUser) {
				if (err) return console.log('Error 1'+ err)
							
				 gotUser.status = req.body.status;
				 
				 gotUser.save(function (err2) {
						if (err2) return console.log('Error 2'+ err2);
						res.send({status : 'success', msg : 'stored the message'});
				  });
			})
      }
  };
  
  exports.getChatMessagesRoute = function (req, res) {
	  if (typeof req.user == 'undefined')
	      res.redirect('/')
      else{
		  
		  Account.findById(req.user._id, function (err, gotUser) {
				if (err) return console.log('Error 1'+ err)
				
				if(req.body.user1 == gotUser.username){
					
					  var userchat = otherSchemas.userchat;
		  
					  userchat.find({$or: [ { to : req.body.user1, from : req.body.user2 }, 
											{ to : req.body.user2, from : req.body.user1 } ]}, 
											function(err1, gotMessages){
												if(err1) return console.log(err1);
												
												res.send({status : 'success', msg : gotMessages});
												
											})
					
				}
		  })
      }
  };
  
  exports.approveFriendRequestRoute = function (req, res) {
	  if (typeof req.user == 'undefined')
	      res.redirect('/')
      else{

		  Account.findById(req.user._id, function (err, gotUser) {
				if (err) return console.log('Error 1'+ err)
								
				Account.findOne({username : req.body.username}, function (err, gotUserSaved) {
					
					if(gotUserSaved == null)
						return res.send({status: 'success', msg: null});
					
					var contactslist = otherSchemas.contactslist;
					
					contactslist.count({userid : gotUser._id, contactid : gotUserSaved._id}, function(err5, gotCount){
						
						if(gotUser.username == gotUserSaved.username)
							res.send({status: 'danger', msg: 'You can not add your self as a contact.'});
						else if(gotCount > 0)
							res.send({status: 'danger', msg: gotUserSaved.username +' is already added in your contact list with name '+ gotUserSaved.firstname +' '+ gotUserSaved.lastname});
						else{
							
							var contact = new contactslist({
								userid : gotUser._id,
								contactid : gotUserSaved._id,
								detailsshared : 'Yes'
							});
							
							contact.save(function(err2){
								if (err2) return console.log('Error 2'+ err)
								
								contactslist.find({userid : gotUser._id}).populate('contactid').exec(function(err3, gotContactList){
									
									res.send({status: 'success', msg: gotContactList});
									
									contactslist.findOne({userid : gotUserSaved._id, contactid : gotUser._id}, function(err6, gotOtherPerson){
										
										gotOtherPerson.detailsshared = 'Yes';
										
										gotOtherPerson.save(function(err){});
										
									})
								})
							})
							
						}
						
					})
					
				})
			})
      }
  };
  
  exports.rejectFriendRequestRoute = function (req, res) {
	  if (typeof req.user == 'undefined')
	      res.redirect('/')
      else{

		  Account.findById(req.user._id, function (err, gotUser) {
				if (err) return console.log('Error 1'+ err)
								
				Account.findOne({username : req.body.username}, function (err, gotUserSaved) {
					
					var contactslist = otherSchemas.contactslist;
					
					contactslist.remove({userid : gotUserSaved._id, contactid : gotUser._id}, function(err6){
						
						res.send({status: 'success', msg: 'Request is rejected'});
						
					})
					
				})
			})
      }
  };
