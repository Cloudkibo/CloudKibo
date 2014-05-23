var passport = require('passport');
var mongoose = require('mongoose');
var Account = require('./../models/account');
var fs = require('fs');
var crypto = require("crypto");
var profileSchemas = require('./../models/profileSchemas');
var otherSchemas = require('./../models/otherSchemas');
var tokenSchemas = require('./../models/tokenSchemas');


exports.registerPostReq = function(req, res) {
	  //console.log(req.body.role)
	  Account.count({email : req.body.email}, function(err, gotCount){
	    if (err) return console.log(err)
	    
	    if(gotCount>0)
	    {
			res.send({status: 'danger', msg: 'Email already registered'})
		}
		else
		{
		    
		    Account.count({phone : req.body.phone}, function(err, gotCount2){
				
				if(gotCount2 > 0)
				{
					return res.send({status: 'danger', msg: 'Phone number belongs to someone else'});
				}
				else
				{
					/*
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
					  */
					  
					 var accountData;
					 
					 
					  accountData = new Account({
						   firstname : req.body.fname,
						   lastname : req.body.lname,
						   username : req.body.username, 
						   email : req.body.email, 
						   phone : req.body.phone
					  })
					 
					  
					  Account.register(accountData, req.body.password, function(err, account) {
						  if (err) {
							  console.log(err)
							return res.send({status: 'danger', msg: 'Username already exists!'});
						  }
				  
						  passport.authenticate('local')(req, res, function () {
							
							var news = otherSchemas.news
							
							var currentNews = new news({
								   label : 'Registration',
								   content : ''+ req.user.username +' has made an account on CloudKibo.',
								   userid : req.user._id,
								   datetime : { type: Date, default: Date.now }
							});
							
							currentNews.save(function (err) {
								if (err) console.log(err)
							})
							
							var tokenString = crypto.randomBytes(12).toString('hex');
							
							var verificationtoken = tokenSchemas.verificationtoken
							
							var newToken = new verificationtoken({
										user : req.user._id,
										token : tokenString,
							});
							
							
							newToken.save(function(err){
								if (err) return console.log(err)
								console.log('Token Saved')
							})
							
							
							var sendgrid  = require('sendgrid')('cloudkibo', 'cl0udk1b0');
							
							var email     = new sendgrid.Email({
							  to:       req.user.email,
							  from:     'support@cloudkibo.com',
							  subject:  'CloudKibo: Account Verification',
							  text:     'Welcome to CloudKibo'
							});
							
							email.setHtml('<h1>CloudKibo</h1><br><br>Use the following link to verify your account <br><br> http://www.cloudkibo.com/verify/'+ tokenString);
							
							sendgrid.send(email, function(err, json) {
							  if (err) { return console.error(err); }
							  
							  console.log(json);
							  
							});
							return res.send({status: 'success', msg: 'Created'});

						  });
					  });
				}
			})
			
			
			
		}
	  
	  })
	  
	  
  };

exports.verify = function (req, res, next) {
    var token = req.params[0];
    
    console.log(token)
    
    verifyUser(token, res, function(err) {
        if (err) return res.render("verification-failure");
        res.render("verification-success");
    
    });
};

function verifyUser(token, res, done) {
	
	var verificationtoken = tokenSchemas.verificationtoken
	
    verificationtoken.findOne({token: token}, function (err, doc){
        if (err) return done(err);
        if(!doc) return res.render("verification-failure");
        
        Account.findOne({_id: doc.user}, function (err, user) {
            if (err) return done(err);
            if (!user) return res.render("verification-failure");
            
            user["accountVerified"] = 'Yes';
            user.save(function(err) {
                done(err);
            })
        })
    })
}
