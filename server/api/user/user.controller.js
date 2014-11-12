'use strict';

var User = require('./user.model');
var passport = require('passport');
var config = require('../../config/environment');
var jwt = require('jsonwebtoken');

var validationError = function(res, err) {
  return res.json(422, err);
};

/**
 * Get list of users
 * restriction: 'admin'
 */
exports.index = function(req, res) {
  User.find({}, '-salt -hashedPassword', function (err, users) {
    if(err) return res.send(500, err);
    res.json(200, users);
  });
};

/**
 * Creates a new user
 */
exports.create = function (req, res, next) {
  var newUser = new User(req.body);
  newUser.provider = 'local';
  newUser.role = 'user';
  newUser.save(function(err, user) {
    if (err) return validationError(res, err);
    var token = jwt.sign({_id: user._id }, config.secrets.session, { expiresInMinutes: 60*5 }); // 60*5
    res.json({ token: token });
  });
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
 * Deletes a user
 * restriction: 'admin'
 */
exports.destroy = function(req, res) {
  User.findByIdAndRemove(req.params.id, function(err, user) {
    if(err) return res.send(500, err);
    return res.send(204);
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
};

/**
 * Update User Image
 */
exports.updateimage = function(req, res, next){
	User.findById(req.user._id, function (err, gotUser) {
		if (err) return console.log('Error 1'+ err)
		
		if(gotUser.picture == null)
		{
			  var today = new Date();
			  var uid = crypto.randomBytes(5).toString('hex');
			  var serverPath = '/' + 'f' + uid + '' + today.getFullYear() + '' + (today.getMonth()+1) + '' + today.getDate();
			  serverPath += '' + today.getHours() + '' + today.getMinutes() + '' + today.getSeconds();
			  serverPath += '' + req.files.fileUploaded.name;
			  
			  var dir = __dirname + "/userpictures";
			  
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
					
					User.findById(gotUser, function (err, gotUserSaved) {
						
						res.json(gotUserSaved);
						//res.redirect('/home');
						
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
						  
						  var dir = __dirname + "/userpictures";
						  
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
								
								User.findById(gotUser, function (err, gotUserSaved) {
									
									res.json(gotUserSaved);
									//res.redirect('/home');
									
								})
								
							});
						
						
					})  
				}
		  }
		
		
	})
}

/**
 * Search by username
 */
exports.searchbyusername = function(req, res, next){
	User.findOne({username : req.body.searchusername}, function (err, gotUserSaved) {
		res.json(gotUserSaved);		
	})
}



/**
 * Authentication callback
 */
exports.authCallback = function(req, res, next) {
  res.redirect('/');
};
