
'use strict';

var User = require('./user.model');
var passport = require('passport');
var config = require('../../config/environment');
var logger = require('../../components/logger/logger');
var jwt = require('jsonwebtoken');
var crypto = require('crypto');
var verificationtoken = require('../tokens/verificationtoken.model');
var passwordresettoken = require('../tokens/passwordresettoken.model');
var contactslist = require('../contactslist/contactslist.model');
var userchat = require('../userchat/userchat.model');
var configuration = require('../configuration/configuration.model');

var validationError = function(res, err) {
  logger.serverLog('info', 'error: '+ err);

  return res.json(422, err);
};

/**
 * Get list of users
 * restriction: 'admin'
 */
exports.index = function(req, res) {
  User.find({}, '-salt -hashedPassword', function (err, users) {
    if(err) return res.send(500, err);
    logger.serverLog('info', 'user.controller : Users data sent to client');
    res.json(200, users);
  });
};

exports.newuser = function(req, res) {
  logger.serverLog('info', req.body);
  var needle = require('needle');

  var options = {
    headers: {
      'X-Custom-Header': 'CloudKibo Web Application'
    }
  }

  needle.get('https://graph.accountkit.com/v1.0/me/?access_token='+req.headers['kibo-token'], options, function(err, resp) {
    console.log(err);
    logger.serverLog('info', 'response from facebook server');
    logger.serverLog('info', resp.body);
    if(resp.body.phone){
      logger.serverLog('info', 'there was no error in fb response');
      User.findOne({phone: resp.body.phone.number}, function(err, user){
        if(user){
          logger.serverLog('info', 'this is old user. returning the user data and not creating new one');
          logger.serverLog('info', JSON.stringify(user));
          user.display_name = req.body.display_name;
          user.save(function(err, user1){
            return res.json(200, user1)
          })
        }

        var newUser = new User({
          id : resp.body.id,
          display_name : req.body.display_name,
          phone : resp.body.phone.number,
          country_prefix : resp.body.phone.country_prefix,
          national_number : resp.body.phone.national_number
        });

        newUser.save(function(err, user) {
          if (err) return validationError(res, err);
          logger.serverLog('info', 'created new user and sending data back');
          logger.serverLog('info', JSON.stringify(user));
          res.json(200, user);
        });

      })
    }

  });

}

/**
 * Creates a new user
 */
exports.create = function (req, res, next) {
  var newUser = new User(req.body);
  logger.serverLog('info', 'user.controller '+ JSON.stringify(req.body));
  newUser.provider = 'local';
  newUser.role = 'user';
  newUser.save(function(err, user) {
    if (err) return validationError(res, err);

	  var tokenString = crypto.randomBytes(12).toString('hex');

    logger.serverLog('info', 'user.controller : Users created');

	  var newToken = new verificationtoken({
		  user : user._id,
		  token : tokenString
	  });


	  newToken.save(function(err){
		  if (err) return console.log(err);
		  //console.log('Token Saved')
	  });

    configuration.findOne({}, function(err, gotConfig) {
      if(err) logger.serverLog('error', 'user.controller (create user) : ', err);

      if(!gotConfig) logger.serverLog('error', 'user.controller (create user) : No configuration defined by super user');

      var sendgrid  = require('sendgrid')(gotConfig.sendgridusername, gotConfig.sendgridpassword);

      var email     = new sendgrid.Email({
        to:       user.email,
        from:     'support@cloudkibo.com',
        subject:  'CloudKibo: Account Verification',
        text:     'Welcome to CloudKibo'
      });

      email.setHtml('<h1>CloudKibo</h1><br><br>Use the following link to verify your account <br><br> https://api.cloudkibo.com/#/verify/'+ tokenString);

      sendgrid.send(email, function(err, json) {
        if (err) { return console.log(err); }

        logger.serverLog('info', "new user verification link sent");

      });

    });



    var token = jwt.sign({_id: user._id }, config.secrets.session, { expiresInMinutes: 60*5 });
    res.json({ token: token });
  });
  console.log("created new user")
};

/**
 * Get a single user
 */
exports.show = function (req, res, next) {
  var userId = req.params.id;

  User.findById(userId, function (err, user) {
    if (err) return next(err);
    if (!user) return res.send(401);
    res.json(user.profile);
  });
};


/**
 * Get my info
 */
exports.me = function(req, res, next) {
  var userId = req.user._id;
  User.findOne({
    _id: userId
  }, '-salt -hashedPassword', function(err, user) { // don't ever give out the password or salt
    if (err) return next(err);
    if (!user) return res.json(401);
    res.json(user);
  });
};

/**
 * Get User Image
 */
exports.userimage = function(req, res, next) {
  res.sendfile(req.params.image, {root: './userpictures'});
};

/**
 * Change user profile
 */
exports.update = function(req, res, next) {
  var userId = req.user._id;
  User.findById(userId, function (err, gotUser) {
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
		User.findById(gotUser, function (err, gotUserSaved) {
			res.json(gotUserSaved);
		})
	});
  });

  logger.serverLog('info', "update new user profile");
};

/**
 * Update User Image
 */
exports.updateimage = function(req, res, next){
	console.log(req.files);
	User.findById(req.user._id, function (err, gotUser) {
		if (err) return console.log('Error 1'+ err);

		if(gotUser.picture == null)
		{
			  var today = new Date();
			  var uid = crypto.randomBytes(5).toString('hex');
			  var serverPath = '/' + 'f' + uid + '' + today.getFullYear() + '' + (today.getMonth()+1) + '' + today.getDate();
			  serverPath += '' + today.getHours() + '' + today.getMinutes() + '' + today.getSeconds();
			  serverPath += '.' + req.files.file.type.split('/')[1];

      console.log(__dirname);

			  var dir = "./userpictures";

			  if(req.files.file.size == 0) return res.send('No file submitted');

			  require('fs').rename(
				 req.files.file.path,
				 dir + "/" + serverPath,
				  function(error) {
					   if(error) {
               logger.serverLog('error', 'user.controller (update image) : '+ error);
						  res.send({
							  error: 'Server Error: Could not upload the file'
						  });
						  return 0;
					   }
				   }

			  );

			  gotUser.picture = serverPath;

				gotUser.save(function (err2) {
					if (err2) return console.log('Error 2'+ err2);

					User.findById(gotUser, function (err, gotUserSaved) {

						res.json(gotUserSaved);
						//res.redirect('/home');

					})

				});
      console.log("saved image")

		  }
		  else
		  {
			  var dir = './userpictures';
			  dir += gotUser.picture;

				if(gotUser.picture)
				{
					require('fs').unlink(dir, function (err) {
						  if (err) {
                logger.serverLog('error', 'user.controller (update image) : '+ err);
                //throw err;
              }


						  var today = new Date();
						  var uid = crypto.randomBytes(5).toString('hex');
						  var serverPath = '/' + 'f' + uid + '' + today.getFullYear() + '' + (today.getMonth()+1) + '' + today.getDate();
						  serverPath += '' + today.getHours() + '' + today.getMinutes() + '' + today.getSeconds();
              serverPath += '.' + req.files.file.type.split('/')[1];

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
							   }
						  );

						  gotUser.picture = serverPath;

							gotUser.save(function (err2) {
								if (err2) return console.log('Error 2'+ err2);

								User.findById(gotUser, function (err, gotUserSaved) {

									res.json(gotUserSaved);
									//res.redirect('/home');

								})

							});


					})
				}
		  }


	})
};

/**
 * Search by username
 */
exports.searchbyusername = function(req, res, next){
	console.log('user name is :' + req.body.searchusername);
	User.findOne({username : req.body.searchusername}, function (err, gotUser) {
		res.json(gotUser);
	})

};



/**
 * Search by email
 */
exports.searchbyemail = function(req, res, next){
	User.findOne({email : req.body.searchemail}, function (err, gotUser) {
		res.json(gotUser);
	})
};


exports.searchAccountByPhone = function(req, res, next){
  logger.serverLog('info', "Phone numbers sent to server: "+JSON.stringify(req.body));
  User.find({phone : { $in : req.body.phonenumbers}}, function (err, gotUsers) {

    var notAvailable = req.body.phonenumbers;
    var available = [];
    var availableUserList = [];
    for(var i in gotUsers){
      if(notAvailable.indexOf(gotUsers[i].phone) > -1){
        notAvailable.splice(notAvailable.indexOf(gotUsers[i].phone), 1);
        available.push(gotUsers[i].phone);
        availableUserList.push(gotUsers[i]);
      }
    }
    logger.serverLog('info', "Sending response to client : "+ JSON.stringify({available : available, notAvailable : notAvailable}));
    logger.serverLog('info', 'checking which of contacts are on cloudkibo but not friends');
    User.findById(req.user._id, function (err, gotUser) {
      logger.serverLog('info', 'This is user information '+ JSON.stringify(gotUser));
      contactslist.find({userid : gotUser._id}).populate('contactid').exec(function(err5, gotContacts){
        availableUserList.forEach(function(availablePerson) {
            var foundInContacts = false;
            for(var i in gotContacts){
              if(availablePerson.phone === gotContacts[i].contactid.phone){
                foundInContacts = true;
              }
            }
            if(availablePerson.phone === gotUser.phone)
              foundInContacts = true;
            if(!foundInContacts){
              var contact = new contactslist({
                userid : gotUser._id,
                contactid : availablePerson._id,
                detailsshared : 'Yes'
              });

              contact.save(function(err2){

                contactslist.findOne({userid : availablePerson._id, contactid : gotUser._id}, function(err6, gotOtherPerson){

                  if(gotOtherPerson){
                    gotOtherPerson.detailsshared = 'Yes';
                    gotOtherPerson.save(function(err){});
                  } else {
                    var contact2 = new contactslist({
                      userid : availablePerson._id,
                      contactid : gotUser._id,
                      detailsshared : 'Yes'
                    });

                    contact2.save(function(err2){
                    })
                  }

                })

              })
            }
        });
      })
    });

    res.json({available : available, notAvailable : notAvailable});
  })
};

exports.searchAccountByEmail = function(req, res, next){
  logger.serverLog('info', "Email Addresses sent to server: "+JSON.stringify(req.body));
  User.find({email : { $in : req.body.emails}}, function (err, gotUsers) {

    var notAvailable = req.body.emails;
    var available = [];
    var availableUserList = [];
    for(var i in gotUsers){
      if(notAvailable.indexOf(gotUsers[i].email) > -1){
        notAvailable.splice(notAvailable.indexOf(gotUsers[i].email), 1);
        available.push(gotUsers[i].email);
        availableUserList.push(gotUsers[i]);
      }
    }

    logger.serverLog('info', "Sending response to client : "+ JSON.stringify({available : available, notAvailable : notAvailable}));

    User.findById(req.user._id, function (err, gotUser) {
      contactslist.find({userid : gotUser._id}, function(err5, gotContacts){
        availableUserList.forEach(function(availablePerson) {
            var foundInContacts = false;
            for(var i in gotContacts){
              if(availablePerson.email === gotContacts[i].email){
                foundInContacts = true;
              }
            }
            if(availablePerson.email === gotUser.email || availablePerson.username === gotUser.username)
              foundInContacts = true;
            if(!foundInContacts){
              var contact = new contactslist({
                userid : gotUser._id,
                contactid : availablePerson._id,
                detailsshared : 'Yes'
              });

              contact.save(function(err2){

                contactslist.findOne({userid : availablePerson._id, contactid : gotUser._id}, function(err6, gotOtherPerson){

                  if(gotOtherPerson){
                    gotOtherPerson.detailsshared = 'Yes';
                    gotOtherPerson.save(function(err){});
                  } else {
                    var contact2 = new contactslist({
                      userid : availablePerson._id,
                      contactid : gotUser._id,
                      detailsshared : 'Yes'
                    });

                    contact2.save(function(err2){
                    })
                  }

                })

              })
            }
        });
      })
    });

    res.json({available : available, notAvailable : notAvailable});
  })
};

/**
 * Invite by email
 */
exports.inviteMultipleByEmail = function(req, res, next){

  console.log(req.body)

  configuration.findOne({}, function(err, gotConfig) {

    var sendgrid = require('sendgrid')(gotConfig.sendgridusername, gotConfig.sendgridpassword);

    console.log(req.body)

    var emails = req.body.emails;

    for(var i in emails){
      var email     = new sendgrid.Email({
        to:       emails[i],
        from:     'support@cloudkibo.com',
        subject:  ''+ req.user.firstname +' via CloudKibo: Join me on CloudKibo, a secure video conferencing app',
        text:     ''
      });


      email.setHtml('<h1>CloudKibo</h1><br><br>'+req.user.firstname+' has invited you to connect on CloudKibo.<br><br>'+
      'Follow the following URL to make an account on CloudKibo and start Video Conference in real time.'+
      ' <br><br><a href="https://api.cloudkibo.com/" target=_blank>http://api.cloudkibo.com/</a><br><br><br>' +
      '<p><b>With CloudKibo<b> you can do</b></p><br><ul><li>Video Call</li><li>Audio Call</li><li>File Transfering'+
      '</li><li>Screen Sharing</li><li>Instant Messaging</li></ul><br><br> Join CloudKibo and talk your dearest ones.');

      sendgrid.send(email, function(err, json) {
        if (err) { return console.error(err); }

        logger.serverLog('info', "sending email for invitation for mobile client");

      });
    }

    res.json({status: 'success', msg: 'Email Sent Successfully'})

  });

};

exports.saveUsernameRoute = function(req, res, next) {
	User.count({username: req.body.username}, function(err, countUsername){

		if(countUsername > 0){
			res.json({status : 'danger', msg: 'This username is already taken'});
		}
		else{
			User.count({email: req.body.email}, function(err, countEmail){
				if(countEmail > 0){
					res.json({status : 'danger', msg: 'This email address is already taken'});
				}
				else{
					User.count({phone: req.body.phone}, function(err, countPhone){
						if(countPhone > 0){
							res.json({status : 'danger', msg: 'This contact number is already taken'});
						}else{

							//console.log(req.body);
							User.findById(req.body._id, function(err, gotUser){

								//console.log(gotUser);

								gotUser.username = req.body.username;
								gotUser.email = req.body.email;
								gotUser.phone = req.body.phone;

								gotUser.save(function(err2){
									if(err2) return res.json({status:'danger', msg:'Some error occurred on CloudKibo. Please contact us.'});

									User.findOne({_id : req.body._id}, function(err3, gotUser1){
										if(err3) return console.log(err3);

										res.json({status: 'success', msg: gotUser1});
									})

								})

							})

						}
					});
				}

			});
		}

	});
};


/**
 * Invite by email
 */
exports.invitebyemail = function(req, res, next){

  configuration.findOne({}, function(err, gotConfig) {

    var sendgrid = require('sendgrid')(gotConfig.sendgridusername, gotConfig.sendgridpassword);
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
    'Follow the following URL to make an account on CloudKibo and start Video Conversations in real time in your browser.'+
    ' <br><br><a href="https://api.cloudkibo.com/" target=_blank>http://api.cloudkibo.com/</a><br><br><br>' +
    '<span style="background:#22DFFF; width:100%; text-align:center;"><b><i>'+ message +'</i></b></span><br><br><br>'+
    '<p><b>With CloudKibo<b> you can do</b></p><br><ul><li>Video Call</li><li>Audio Call</li><li>File Transfering'+
    '</li><li>Screen Sharing</li><li>Instant Messaging</li></ul><br><br> Join CloudKibo and talk your dearest ones.');

    sendgrid.send(email, function(err, json) {
      if (err) { return console.error(err); }

      logger.serverLog('info', "sending email for invitation");

    });

    res.send({status: 'success', msg: 'Email Sent Successfully'})

  });

};



/**
 * Initial Testing done by user is updated here
 */
exports.initialtesting = function(req, res, next){
	User.findById(req.user._id, function (err, gotUser) {
		if (err) return console.log('Error 1'+ err);

		gotUser.initialTesting = req.body.initialTesting;

		gotUser.save(function (err2) {
			if (err2) return console.log('Error 2'+ err2);

			User.findById(req.user._id, function (err3, gotUser1) {
				if (err3) return console.log('Error 3'+ err3);
				res.send({status: 'success', msg: gotUser1})
			})


		});
	})
};



/**
 * Set the status message of the user
 */
exports.setstatusmessage = function(req, res, next){
	User.findById(req.user._id, function (err, gotUser) {
		if (err) return console.log('Error 1'+ err);

		gotUser.status = req.body.status;

		gotUser.save(function (err2) {
				if (err2) return console.log('Error 2'+ err2);
				res.send({status : 'success', msg : 'stored the message'});
		 });
    console.log("status msg set ")
	})
};



exports.resetpasswordrequest = function(req, res, next){

  console.log("reset password request sent")
	User.findOne({email : req.body.email}, function(err, gotUser){
	  if(err) return console.log(err);
	  if(!gotUser) return res.send({status:'danger', msg:'Sorry! No such account exists in our database.'});

	  var tokenString = crypto.randomBytes(15).toString('hex');

		var newToken = new passwordresettoken({
					user : gotUser._id,
					token : tokenString
		});

		newToken.save(function(err){
			if (err) return console.log(err)
		});

    configuration.findOne({}, function(err, gotConfig) {

      var sendgrid = require('sendgrid')(gotConfig.sendgridusername, gotConfig.sendgridpassword);


      var email     = new sendgrid.Email({
        to:       gotUser.email,
        from:     'support@cloudkibo.com',
        subject:  'CloudKibo: Password Reset',
        text:     'Password Reset'
      });

      email.setHtml('<h1>CloudKibo</h1><br><br>Use the following link to change your password <br><br> https://api.cloudkibo.com/#resetpassword/'+ tokenString);

      sendgrid.send(email, function(err, json) {
        if (err) { return console.error(err); }

        console.log("sending link for reset password as in email");

        res.send({status:'success', msg:'Password Reset Link has been sent to your email address. Check your spam or junk folder if you have not received our email.'});

      });

    })


  })
};


exports.resetusernamerequest = function(req, res, next){

  console.log("username request sent")
  User.findOne({email : req.body.email}, function(err, gotUser){
    if(err) return console.log(err);
    if(!gotUser) return res.send({status:'danger', msg:'Sorry! No such account exists in our database.'});

    configuration.findOne({}, function(err, gotConfig) {

      var sendgrid = require('sendgrid')(gotConfig.sendgridusername, gotConfig.sendgridpassword);


      var email     = new sendgrid.Email({
        to:       gotUser.email,
        from:     'support@cloudkibo.com',
        subject:  'CloudKibo: Username Request',
        text:     'Username Request'
      });

      email.setHtml('<h1>CloudKibo</h1><br><br>Your Cloudkibo username is:  <br><br> Cloudkibo username:  '+ gotUser.username);

      sendgrid.send(email, function(err, json) {
        if (err) { return console.error(err); }

        console.log("sending link for username in email");

        res.send({status:'success', msg:'Cloudkibo username has been sent to your email address. Check your spam or junk folder if you have not received our email.'});

      });

    })


  })
};


/**
 * Authentication callback
 */
exports.authCallback = function(req, res, next) {
  res.redirect('/');
};




/**
 * Deletes a user
 * restriction: 'admin'
 */
exports.destroy = function(req, res) {

  console.log("removing user")
	User.findById(req.params.id, function(err, gotUser) {
		if(err) return res.send(500, err);

		userchat.remove({$or: [ { to : gotUser.username}, {from : gotUser.username } ]}, function(err1) {
			if(err1) return res.send(500, err1);

			contactslist.remove({$or : [ {userid : req.params.id}, {contactid : req.params.id} ]}, function(err2) {
				if(err2) return res.send(500, err2);

				User.findByIdAndRemove(req.params.id, function(err3, user) {
					if(err3) return res.send(500, err3);
					return res.send(204);
				});

			});


		});

    console.log("removed user")

	});

};

/**
 * Change a users password
 */
exports.changePassword = function(req, res, next) {
  var userId = req.user._id;
  var oldPass = String(req.body.oldPassword);
  var newPass = String(req.body.newPassword);

  User.findById(userId, function (err, user) {
    if(user.authenticate(oldPass)) {
      user.password = newPass;
      user.save(function(err) {
        if (err) return validationError(res, err);
        res.send(200);
      });
    } else {
      res.send(403);
    }
  });
  console.log("changed password")
};

// Make this res.send({status: null, msg: null}) format in future
exports.changePasswordRoute = function(req, res){
	if (typeof req.user != 'undefined') res.redirect('/');
	else{

		var title = 'CloudKibo';

		if(req.get('host') == 'www.cloudkibo.com')
			title = 'CloudKibo';
		else if(req.get('host') == 'www.synaps3webrtc.com')
			title = 'Synaps3WebRTC';

		var token = req.body.token;

		passwordresettoken.findOne({token: token}, function (err, doc){
			if (err) return done(err);
			if(!doc) return res.render("passwordreset-failure", { title: title, token : token });

			User.findOne({_id: doc.user}, function (err, user) {
				if (err) return done(err);
				if (!user) return res.render("passwordreset-failure", { title: title, token : token });

				user.password = String(req.body.password);
				user.save(function(err) {
					if (err) return validationError(res, err);
					res.send('Password Successfully Changed. Please login with your new password');
				});
			})

		})

	}
};

exports.log = function(req, res) {
  logger.serverLog("info", "Client side log: " + req.body.data);
  res.json(200, {status : 'success'});
};
