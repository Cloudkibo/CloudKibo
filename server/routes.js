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
var configuration = require('./api/configuration/configuration.model');

// Connect to BrainTree
var braintree = require("braintree");

var gateway = braintree.connect({
  environment: braintree.Environment.Sandbox,
  merchantId: "dcmt47r72j9fj7r7",
  publicKey: "qdpwymhgxrxtz5j3",
  privateKey: "00ddc61c89fedf69496eaef559f0e11b"
});

module.exports = function(app) {

  app.use('/api/things', require('./api/thing'));
  app.use('/api/users', require('./api/user'));
  app.use('/api/contactslist', require('./api/contactslist'));
  app.use('/api/userchat', require('./api/userchat'));
  app.use('/api/meetingchat', require('./api/meetingchat'));
  app.use('/api/feedback', require('./api/feedback'));
  app.use('/api/configurations', require('./api/configuration'));
  app.use('/api/groupcall', require('./api/groupcall'));
  app.use('/api/companyaccounts', require('./api/companyaccount'));

  app.use('/auth', require('./auth'));

  app.route('/client_token_braintree')
    .get(function(req,res){
      gateway.clientToken.generate({}, function (err, response) {
        if (err) return console.log(err);
        //console.log(response);
        res.send(response.clientToken);
      });
    });

  app.route('/checkout_braintree')
    .post(function(req, res){
      console.log(req.body)
      gateway.transaction.sale({
        amount: '10.00',
        paymentMethodNonce: req.body.payment_method_nonce,
      }, function (err, result) {
        console.log(result);
        res.redirect('/');
      });
    });



  //**************************************************************************************************//
  //**************************************************************************************************//
  // Web Application's HTML Views generated from Jade templates                                       //
  //**************************************************************************************************//
  //**************************************************************************************************//


  app.route('/')
	.get(function(req,res){ res.sendfile(app.get('appPath') + '/index.html'); });
	//.get(viewroutes.appRoute);		// commented by sojharo 30/3/2015

  app.route('/home')
	.get(auth.isAuthenticated(), viewroutes.homeRoute);

  app.route('/app')
	.get(function(req, res){ res.redirect('/'); });

  app.route('/webrtcview')
    .get(function(req, res){ res.render('webrtc'); });

  app.route('/conference/*')
    .get(viewroutes.conferenceRoute);

  app.route('/webmeeting/*')
    .get(viewroutes.webmeetingRoute);

  app.route('/livehelp/*')
	.get(viewroutes.liveHelpRoute);

  app.route('/loginview')
	.get(viewroutes.loginViewRoute);

  app.route('/superuser')
      .get(auth.hasRole('admin'), viewroutes.superUserViewRoute);

  app.route('/registerview')
	.get(viewroutes.registerViewRoute);

  app.route('/forgotpasswordview')
	.get(viewroutes.forgotPasswordViewRoute);

  app.route('/forgotusernameview')
    .get(viewroutes.forgotUserNameViewRoute);

  app.route("/resetpasswordview/*")
	.get(viewroutes.resetPasswordViewRoute);

  app.route("/getuserview/*")
	.get(auth.isAuthenticated(), viewroutes.getUserViewRoute);

  app.route("/verifyview/*")
    .get(viewroutes.verifyViewRoute);

  // in NodeJS/Express (server)
  app.all('/*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "GET, POST","PUT");
    next();

  });


  app.route('/feedback')
    .post(function(req, res) {

      console.log('=====================================================');
      console.log('Feedback \n: ');
      console.log(req.body)
      console.log('=====================================================');

      configuration.findOne({}, function(err, gotConfig) {
        var sendgrid = require('sendgrid')(gotConfig.sendgridusername, gotConfig.sendgridpassword);

        var email     = new sendgrid.Email({
          to:       'support@cloudkibo.com',
          from:     'support@cloudkibo.com',
          subject:  req.body.subject,
          text:     'Welcome to KiboSupport'
        });

        email.setHtml('<body style="min-width: 80%;-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;margin: 0;padding: 0;direction: ltr;background: #f6f8f1;width: 80% !important;"><table class="body", style="width:100%"> ' +
        '<tr> <td class="center" align="center" valign="top"> <!-- BEGIN: Header --> <table class="page-header" align="center" style="width: 100%;background: #1f1f1f;"> <tr> <td class="center" align="center"> ' +
        '<!-- BEGIN: Header Container --> <table class="container" align="center"> <tr> <td> <table class="row "> <tr>  </tr> </table> <!-- END: Logo --> </td> <td class="wrapper vertical-middle last" style="padding-top: 0;padding-bottom: 0;vertical-align: middle;"> <!-- BEGIN: Social Icons --> <table class="six columns"> ' +
        '<tr> <td> <table class="wrapper social-icons" align="right" style="float: right;"> <tr> <td class="vertical-middle" style="padding-top: 0;padding-bottom: 0;vertical-align: middle;padding: 0 2px !important;width: auto !important;"> ' +
        '<p style="color: #ffffff">Feedback from a visitor</p> </td></tr> </table> </td> </tr> </table> ' +
        '<!-- END: Social Icons --> </td> </tr> </table> </td> </tr> </table> ' +
        '<!-- END: Header Container --> </td> </tr> </table> <!-- END: Header --> <!-- BEGIN: Content --> <table class="container content" align="center"> <tr> <td> <table class="row note"> ' +
        '<tr> <td class="wrapper last"> <p> Hello Owner, <br> '+ req.body.name +' has sent you a feedback.<p> <ul> <li>Visitor Name: '+req.body.name+'</li> ' +
        '<li>Visitor Email: '+ req.body.email+' </li><li>Visitor Feedback: '+ req.body.message+' </li> </ul> </p>  <!-- BEGIN: Note Panel --> <table class="twelve columns" style="margin-bottom: 10px"> ' +
        '<tr> <td class="panel" style="background: #ECF8FF;border: 0;padding: 10px !important;"> </td> <td class="expander"> </td> </tr> </table>  <!-- END: Note Panel --> </td> </tr> </table><span class="devider" style="border-bottom: 1px solid #eee;margin: 15px -15px;display: block;"></span> <!-- END: Disscount Content --> </td> </tr> </table> </td> </tr> </table> <!-- END: Content --> <!-- BEGIN: Footer --> <table class="page-footer" align="center" style="width: 100%;background: #2f2f2f;"> <tr> <td class="center" align="center" style="vertical-align: middle;color: #fff;"> <table class="container" align="center"> <tr> <td style="vertical-align: middle;color: #fff;"> <!-- BEGIN: Unsubscribet --> <table class="row"> <tr> <td class="wrapper last" style="vertical-align: middle;color: #fff;"><span style="font-size:12px;"><i>This ia a system generated email and reply is not required.</i></span> </td> </tr> </table> <!-- END: Unsubscribe --> ' +
        '<!-- END: Footer Panel List --> </td> </tr> </table> </td> </tr> </table> <!-- END: Footer --> </td> </tr></table></body>')
        sendgrid.send(email, function(err, json) {
          if (err) { return console.log(err); }

          return res.send({status: 'success', msg: 'Email has been sent'});

        });
      })

    });




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
