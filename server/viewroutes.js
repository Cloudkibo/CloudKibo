var passport = require('passport');
var mongoose = require('mongoose');
var Account = require('./api/user/user.model');
var fs = require('fs');
var crypto = require("crypto");

var html_dir = './public/';

exports.indexRoute = function (req, res) {
	  if (typeof req.user == 'undefined')
	      res.render('index', { title: 'CloudKibo'});
      else{
		res.render('index', { title: 'CloudKibo'});
		//res.redirect('/home');
      }
  };

exports.appRoute = function (req, res) {

		var title = 'CloudKibo';

		if(req.get('host') == 'www.cloudkibo.com')
			title = 'CloudKibo';
		else if(req.get('host') == 'www.synaps3webrtc.com')
			title = 'Synaps3WebRTC';


		res.render('app', {title : title});
  };
  
exports.homeRoute = function (req, res) {
	
	  if (typeof req.user == 'undefined')
	      res.redirect('/')
      else{
		
			Account.findById(req.user._id, function (err, gotUser) {
				if (err) return console.log(err);
				
				var role;
				if (gotUser.isOwner == 'Yes') role = 'Owner';
				
				if(role == 'Owner')
				  return res.redirect('/superuser')
				else
				{
					res.render('home', { title: 'CloudKibo', user: gotUser, role: role});
			    }
    		  
		  })
		
      }
  };

exports.meetingRoute = function (req, res) {
	  if (typeof req.user == 'undefined')
	      res.redirect('/')
      else{
		
			Account.findById(req.user._id, function (err, gotUser) {
				if (err) return console.log(err);
				
				res.render('meetingroom', { title: 'CloudKibo', user: gotUser, meetingroom : req.params[0]});    		  
		  })
		
      }
  };
  
  // Make the following route good, see if the person demanding this data is friend or not.. should he be
  // given that data or not? and what if data is not available, and one should not chat with himself
  // Links of names, click to go to home
  
exports.getUserViewRoute = function (req, res) {
	  if (typeof req.user == 'undefined')
	      res.redirect('/')
      else{
		
			Account.findOne({username : req.params[0]}, function (err, gotUser) {
				if (err) return console.log(err);
				
				if(gotUser != null)
					res.render('home', { title: 'CloudKibo', otherUser: gotUser, user: req.user});    		  
				else
					res.render('401', { title: 'CloudKibo'});
		    })
		
      }
  };

exports.liveHelpRoute = function (req, res) {	
		res.render('livehelp', { title: 'CloudKibo', meetingroom : req.params[0]});    		  
  };

exports.videoCallRoute = function (req, res) {	
		res.render('videocall', { title: 'CloudKibo', meetingroom : req.params[0]});    		  
  };  
  
exports.welcomeScreenViewRoute = function (req, res) {	
	  if (typeof req.user == 'undefined')
          res.redirect('/');
      else{
        res.render('welcomescreen', { title: 'CloudKibo'});    		  
      }
  };  
  
exports.resetPasswordViewRoute = function(req, res){
	  if (typeof req.user != 'undefined') res.redirect('/');
      else{ 
	    
	    var token = req.params[0];
		  
		var passwordresettoken = tokenSchemas.passwordresettoken
	
		passwordresettoken.findOne({token: token}, function (err, doc){
			if (err) return done(err);
			if(!doc) return res.render("passwordreset-failure");
			
			res.render('newpassword', { title: 'CloudKibo', token : token });
		
		})

	  }
  };

exports.loginViewRoute = function(req, res) {
	if (typeof req.user == 'undefined')
		res.render('login', { title: 'CloudKibo'});
	else
		res.redirect('/home');
  };  
  
exports.registerViewRoute = function(req, res) {
	if (typeof req.user == 'undefined')
		res.render('register', { title: 'CloudKibo'});
	else
		res.redirect('/home');
  };
  
exports.forgotPasswordViewRoute = function(req, res) {
	if (typeof req.user == 'undefined')
		res.render('forgotpassword', { title: 'CloudKibo'});
	else
		res.redirect('/home');
  };
  
exports.featuresViewRoute = function(req, res) {

	var title = 'CloudKibo';

	if(req.get('host') == 'www.cloudkibo.com')
		title = 'CloudKibo';
	else if(req.get('host') == 'www.synaps3webrtc.com')
		title = 'Synaps3WebRTC';

	res.render('features', { title: title});
  };
  
exports.superUserViewRoute = function(req, res) {
	if (typeof req.user == 'undefined')
		res.redirect('/')
	else{

		Account.findById(req.user._id, function (err, gotUser) {
			if (err) return console.log(err);

			res.render('superuser', { title: 'CloudKibo', user: gotUser, meetingroom : req.params[0]});
		})

	}
};