var passport = require('passport');
var mongoose = require('mongoose');
var Account = require('./api/user/user.model');
var fs = require('fs');
var crypto = require("crypto");
var verificationtoken = require("./api/tokens/verificationtoken.model");
var passwordresettoken = require("./api/tokens/passwordresettoken.model");

var html_dir = './public/';

exports.indexRoute = function (req, res) {

	var title = 'CloudKibo';

	if(req.get('host') == 'www.cloudkibo.com')
		title = 'CloudKibo';
	else if(req.get('host') == 'www.synaps3webrtc.com')
		title = 'Synaps3WebRTC';

	  if (typeof req.user == 'undefined')
	      res.render('index', { title: title});
      else{
		res.render('index', { title: title});
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
	      res.redirect('/');
      else{

		  var title = 'CloudKibo';

		  if(req.get('host') == 'www.cloudkibo.com')
			  title = 'CloudKibo';
		  else if(req.get('host') == 'www.synaps3webrtc.com')
			  title = 'Synaps3WebRTC';

			Account.findById(req.user._id, function (err, gotUser) {
				if (err) return console.log(err);

				var role;
				if (gotUser.isOwner == 'Yes') role = 'Owner';

				if(role == 'Owner')
				  return res.redirect('/superuser');
				else
				{
					res.render('home', { title: title, user: gotUser, role: role});
			    }

		  })

      }
  };

exports.meetingRoute = function (req, res) {
	  if (typeof req.user == 'undefined')
      res.render('meetingroom', { title: title, user: '', meetingroom : req.params[0]});
      else{

		  var title = 'CloudKibo';

		  if(req.get('host') == 'www.cloudkibo.com')
			  title = 'CloudKibo';
		  else if(req.get('host') == 'www.synaps3webrtc.com')
			  title = 'Synaps3WebRTC';

			Account.findById(req.user._id, function (err, gotUser) {
				if (err) return console.log(err);


				res.render('meetingroom', { title: title, user: gotUser, meetingroom : req.params[0]});


		  })

      }
  };

  // Make the following route good, see if the person demanding this data is friend or not.. should he be
  // given that data or not? and what if data is not available, and one should not chat with himself
  // Links of names, click to go to home

exports.getUserViewRoute = function (req, res) {
	  if (typeof req.user == 'undefined')
	      res.redirect('/');
      else{

		  var title = 'CloudKibo';

		  if(req.get('host') == 'www.cloudkibo.com')
			  title = 'CloudKibo';
		  else if(req.get('host') == 'www.synaps3webrtc.com')
			  title = 'Synaps3WebRTC';

			Account.findOne({username : req.params[0]}, function (err, gotUser) {
				if (err) return console.log(err);

				if(gotUser != null)
					res.render('home', { title: title, otherUser: gotUser, user: req.user});
				else
					res.render('404', { title: title});
		    })

      }
  };

exports.liveHelpRoute = function (req, res) {

	var title = 'CloudKibo';

	if(req.get('host') == 'www.cloudkibo.com')
		title = 'CloudKibo';
	else if(req.get('host') == 'www.synaps3webrtc.com')
		title = 'Synaps3WebRTC';

		res.render('livehelp', { title: title, meetingroom : req.params[0], role : req.query['role']});
  };

exports.videoCallRoute = function (req, res) {

	var title = 'CloudKibo';

	if(req.get('host') == 'www.cloudkibo.com')
		title = 'CloudKibo';
	else if(req.get('host') == 'www.synaps3webrtc.com')
		title = 'Synaps3WebRTC';

		res.render('videocall', { title: title, meetingroom : req.params[0]});
  };

exports.welcomeScreenViewRoute = function (req, res) {
	  if (typeof req.user == 'undefined')
          res.redirect('/');
      else{

		  var title = 'CloudKibo';

		  if(req.get('host') == 'www.cloudkibo.com')
			  title = 'CloudKibo';
		  else if(req.get('host') == 'www.synaps3webrtc.com')
			  title = 'Synaps3WebRTC';

        res.render('welcomescreen', { title: title});
      }
  };

exports.resetPasswordViewRoute = function(req, res){
	  if (typeof req.user != 'undefined') res.redirect('/');
      else{

	  var title = 'CloudKibo';

	  if(req.get('host') == 'www.cloudkibo.com')
		  title = 'CloudKibo';
	  else if(req.get('host') == 'www.synaps3webrtc.com')
		  title = 'Synaps3WebRTC';

	    var token = req.params[0];

		passwordresettoken.findOne({token: token}, function (err, doc){
			if (err) return done(err);
			if(!doc) return res.render("passwordreset-failure", { title: title, token : token });

			res.render('newpassword', { title: title, token : token });

		})

	  }
  };

exports.verifyViewRoute = function (req, res, next) {


	var title = 'CloudKibo';

	if(req.get('host') == 'www.cloudkibo.com')
		title = 'CloudKibo';
	else if(req.get('host') == 'www.synaps3webrtc.com')
		title = 'Synaps3WebRTC';


	var token = req.params[0];

	verifyUser(token, req, res, function(err) {
		if (err) return res.render("verification-failure", { title: title, token : token });
		res.render("verification-success", { title: title, token : token });

	});
};

function verifyUser(token, req, res, done) {


	var title = 'CloudKibo';

	if(req.get('host') == 'www.cloudkibo.com')
		title = 'CloudKibo';
	else if(req.get('host') == 'www.synaps3webrtc.com')
		title = 'Synaps3WebRTC';


	verificationtoken.findOne({token: token}, function (err, doc){
		if (err) return done(err);
		if(!doc) return res.render("verification-failure", { title: title, token : token });

		Account.findOne({_id: doc.user}, function (err, user) {
			if (err) return done(err);
			if (!user) return res.render("verification-failure", { title: title, token : token });

			user["accountVerified"] = 'Yes';
			user.save(function(err) {
				done(err);
			})
		})
	})
}

exports.loginViewRoute = function(req, res) {
	if (typeof req.user == 'undefined') {

		var title = 'CloudKibo';

		if(req.get('host') == 'www.cloudkibo.com')
			title = 'CloudKibo';
		else if(req.get('host') == 'www.synaps3webrtc.com')
			title = 'Synaps3WebRTC';

		res.render('login', {title: title});
	}
	else
		res.redirect('/home');
  };

exports.registerViewRoute = function(req, res) {
	if (typeof req.user == 'undefined') {


		var title = 'CloudKibo';

		if(req.get('host') == 'www.cloudkibo.com')
			title = 'CloudKibo';
		else if(req.get('host') == 'www.synaps3webrtc.com')
			title = 'Synaps3WebRTC';


		res.render('register', {title: title});
	}
	else
		res.redirect('/home');
  };

exports.forgotPasswordViewRoute = function(req, res) {
	if (typeof req.user == 'undefined') {


		var title = 'CloudKibo';

		if(req.get('host') == 'www.cloudkibo.com')
			title = 'CloudKibo';
		else if(req.get('host') == 'www.synaps3webrtc.com')
			title = 'Synaps3WebRTC';


		res.render('forgotpassword', {title: title});
	}
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


exports.contactViewRoute = function(req, res) {

	var title = 'CloudKibo';

	if(req.get('host') == 'www.cloudkibo.com')
		title = 'CloudKibo';
	else if(req.get('host') == 'www.synaps3webrtc.com')
		title = 'Synaps3WebRTC';

	res.render('contact', { title: title});

  };


exports.aboutusViewRoute = function(req, res) {

	var title = 'CloudKibo';

	if(req.get('host') == 'www.cloudkibo.com')
		title = 'CloudKibo';
	else if(req.get('host') == 'www.synaps3webrtc.com')
		title = 'Synaps3WebRTC';

	res.render('aboutus', { title: title});
  };
exports.superUserViewRoute = function(req, res) {
	if (typeof req.user == 'undefined')
		res.redirect('/');
	else{


		var title = 'CloudKibo';

		if(req.get('host') == 'www.cloudkibo.com')
			title = 'CloudKibo';
		else if(req.get('host') == 'www.synaps3webrtc.com')
			title = 'Synaps3WebRTC';


		Account.findById(req.user._id, function (err, gotUser) {
			if (err) return console.log(err);

			res.render('superuser', { title: title, user: gotUser, meetingroom : req.params[0]});
		})

	}
};
