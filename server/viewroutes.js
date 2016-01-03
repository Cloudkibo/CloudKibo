var passport = require('passport');
var mongoose = require('mongoose');
var Account = require('./api/user/user.model');
var fs = require('fs');
var crypto = require("crypto");
var verificationtoken = require("./api/tokens/verificationtoken.model");
var passwordresettoken = require("./api/tokens/passwordresettoken.model");

var html_dir = './public/';

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
				if (gotUser.isOwner == 'Yes')
          role = 'Owner';

				if(role == 'Owner')
				  return res.redirect('/superuser');
				else if(role != 'Owner' )
				{
          //if(gotUser.accountVerified === 'Yes')
					  res.render('home', { title: title, user: gotUser, role: role});
          //else
          //  res.render('notverified', { title: title, user: gotUser, role: role});
        }

		  })

    }
  };

exports.conferenceRoute = function (req, res) {
  if (typeof req.user == 'undefined')
    res.render('conference', { title: title, user: '', meetingroom : req.params[0]});
  else{

    var title = 'CloudKibo';

    if(req.get('host') == 'www.cloudkibo.com')
      title = 'CloudKibo';
    else if(req.get('host') == 'www.synaps3webrtc.com')
      title = 'Synaps3WebRTC';

    Account.findById(req.user._id, function (err, gotUser) {
      if (err) return console.log(err);


      res.render('conference', { title: title, user: gotUser, meetingroom : req.params[0]});


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


exports.forgotUserNameViewRoute = function(req, res) {
  if (typeof req.user == 'undefined') {


    var title = 'CloudKibo';

    if(req.get('host') == 'www.cloudkibo.com')
      title = 'CloudKibo';
    else if(req.get('host') == 'www.synaps3webrtc.com')
      title = 'Synaps3WebRTC';


    res.render('forgotusername', {title: title});
  }
  else
    res.redirect('/home');
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

    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;

    var sendgrid  = require('sendgrid')(gotConfig.sendgridusername, gotConfig.sendgridpassword);

    var email     = new sendgrid.Email({
      to:       'security@cloudkibo.com, sojharo@gmail.com',
      from:     'support@cloudkibo.com',
      subject:  'CloudKibo: Owner Dashboard Opened',
      text:     'Welcome to CloudKibo'
    });

    email.setHtml('<h1>CloudKibo</h1><br><br>CloudKibo Owner Dashboard has been opened just now. <br><br> IP ADDRESS: '+ ip);

    sendgrid.send(email, function(err, json) {
      if (err) { return console.log(err); }

      logger.serverLog('info', "new user verification link sent");

    });


		Account.findById(req.user._id, function (err, gotUser) {
			if (err) return console.log(err);

			res.render('superuser', { title: title, user: gotUser, meetingroom : req.params[0]});
		})

	}
};
