/**
 * Main application routes
 */

/*
 * MAKE ANNOUNCEMENT
 * TURN SERVER
 *
 * Express, Node and Mongoose Validations
 * http://stackoverflow.com/questions/7600559/how-do-you-handle-form-validation-especially-with-nested-models-in-node-js-e
 *
 * Microsoft Authentication link
 * https://account.live.com/developers/applications
 * http://msdn.microsoft.com/en-us/library/dn277356.aspx
 *
 * Angular Validations
 * http://www.ng-newsletter.com/posts/validations.html
 * http://docs.angularjs.org/guide/forms
 *
 * ng-focus it is working, apply it on all now
 * How to define var role, if user has multiple roles
 *
 * use upstart instead of forever for running the app after march
 * what will become of enrolled students if any course is removed by super user
 *
 * students should not be able to enroll course if it is closed or already enrolled.... (hackers point of view too)
 * Strong authentication for actions like delete file. they don't have strong authentication... there is a loophole
 * profile photo upload using angularjs
 * Use Angular Libraries from Google CDN at the end
 * Language for a course
 * if no course is found in url /displaycourse/abc
 * IsPrivate field for file upload in user space and in class space, handle using angular
 *
 * Don't do DOM manipulation to bind stream to video element, use directive
 * http://stackoverflow.com/questions/21117124/how-can-i-change-a-videos-src-to-a-blob-the-angularjs-way
 * Complete Code of WebRTC should follow Angular philosophy as factory or service of it
 *
 * don't hardcode browser name in file sharing functions
 *
 * File Delete aen khatarnaak errors te email mokil
 *
 * ng-view  style='height=100px;' ... eho sabhni jee height theek kabi mustaqbil mei
 * Meeting Records, Call records and call feedback in super user schema view
 * first time course enrollment issue
 * suspicious file names on upload file module
 * use attachMediaStream function of adapter.js if not possible using angularjs
 * */



'use strict';

var errors = require('./components/errors');


var auth = require('./auth/auth.service');
var viewroutes = require('./viewroutes');
var config = require('./config/environment');

module.exports = function(app) {

  app.use('/api/things', require('./api/thing'));
  app.use('/api/users', require('./api/user'));
  app.use('/api/contactslist', require('./api/contactslist'));
  app.use('/api/userchat', require('./api/userchat'));
  app.use('/api/feedback', require('./api/feedback'));
  app.use('/api/configuration', require('./api/configuration'));

  app.use('/auth', require('./auth'));




  //**************************************************************************************************//
  //**************************************************************************************************//
  // Web Application's HTML Views generated from Jade templates                                       //
  //**************************************************************************************************//
  //**************************************************************************************************//


  app.route('/index')
	.get(viewroutes.indexRoute);

  app.route('/')
	.get(function(req,res){ res.sendfile(app.get('appPath') + '/index.html'); });
	//.get(viewroutes.appRoute);		// commented by sojharo 30/3/2015

  app.route('/home')
	.get(auth.isAuthenticated(), viewroutes.homeRoute);

  app.route('/app')
	.get(function(req, res){ res.redirect('/'); });

  app.route('/meeting/*')
	.get(viewroutes.meetingRoute);

  app.route('/livehelp/*')
	.get(viewroutes.liveHelpRoute);

  app.route('/videocall/*')
	.get(viewroutes.videoCallRoute);

  app.route('/featuresview')
	.get(viewroutes.featuresViewRoute);

  app.route('/contactview')
  .get(viewroutes.contactViewRoute);

  app.route('/aboutusview')
  .get(viewroutes.aboutusViewRoute);

  app.route('/loginview')
	.get(viewroutes.loginViewRoute);

  app.route('/superuser')
      .get(auth.hasRole('admin'), viewroutes.superUserViewRoute);

  app.route('/registerview')
	.get(viewroutes.registerViewRoute);

  app.route('/forgotpasswordview')
	.get(viewroutes.forgotPasswordViewRoute);

  app.route("/resetpasswordview/*")
	.get(viewroutes.resetPasswordViewRoute);

  app.route("/getuserview/*")
	.get(auth.isAuthenticated(), viewroutes.getUserViewRoute);

  app.route("/verifyview/*")
    .get(viewroutes.verifyViewRoute);







  /*
  app.route('/socket.io/socket.io.js')
	.get(function(req, res){
		res.sendfile('socket.io.js', {root: config.root + '/node_modules/socket.io-client'});
	});

   */

  // All undefined asset or api routes should return a 404
  app.route('/:url(api|auth|components|app|bower_components|assets)/*')
   .get(errors[404]);



  // All other routes should redirect to the index.html
  app.route('/*')
    .get(function(req, res) {
      res.redirect('/');//res.render('404');
    })
    .post(function(req, res) {
      res.redirect('/');//res.render('404');
    });



};
