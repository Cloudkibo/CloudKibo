/**
 * Created by Saba on 02/23/2015.
 */

'use strict';

var FeedbackVisitor = require('./feedbackvisitor.model');
var FeedbackCall = require('./feedbackcall.model');
exports.saveVisitorFeedback = function(req, res) {

    var feedback = new FeedbackVisitor({
        name : req.body.name,
        email : req.body.email,
        message : req.body.message,
        datetime : {type: Date, default: Date.now }
    });

  console.log("saved visitors feedback")

  var sendgrid = require('sendgrid')(gotConfig.sendgridusername, gotConfig.sendgridpassword);

    var email     = new sendgrid.Email({
      to:       'support@cloudkibo.com',
      from:     req.body.email,
      subject:  'Visitor Feedback',
      text:     req.body.name+' has send feedback to you'
    });

    email.setHtml('<body style="min-width: 80%;-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;margin: 0;padding: 0;direction: ltr;background: #f6f8f1;width: 80% !important;"><table class="body", style="width:100%"> ' +
      '<tr> <td class="center" align="center" valign="top"> <!-- BEGIN: Header --> <table class="page-header" align="center" style="width: 100%;background: #1f1f1f;"> <tr> <td class="center" align="center"> ' +
      '<!-- BEGIN: Header Container --> <table class="container" align="center"> <tr> <td> <table class="row "> <tr>  </tr> </table> <!-- END: Logo --> </td> <td class="wrapper vertical-middle last" style="padding-top: 0;padding-bottom: 0;vertical-align: middle;"> <!-- BEGIN: Social Icons --> <table class="six columns"> ' +
      '<tr> <td> <table class="wrapper social-icons" align="right" style="float: right;"> <tr> <td class="vertical-middle" style="padding-top: 0;padding-bottom: 0;vertical-align: middle;padding: 0 2px !important;width: auto !important;"> ' +
      '<p style="color: #ffffff">Visitor has sent you feedback.</p> </td></tr> </table> </td> </tr> </table> ' +
      '<!-- END: Social Icons --> </td> </tr> </table> </td> </tr> </table> ' +
      '<!-- END: Header Container --> </td> </tr> </table> <!-- END: Header --> <!-- BEGIN: Content --> <table class="container content" align="center"> <tr> <td> <table class="row note"> ' +
      '<tr> <td class="wrapper last"> <p> Hello <br> '+req.body.name+' has sent following feedback: </p> <p> <ul> <li>Message: '+req.body.message+'</li> ' +
      '<li>Visitor Email: '+ req.body.email+' </li><li>Sent on: '+ Date.now +' </li> </ul> </p>  <!-- BEGIN: Note Panel --> <table class="twelve columns" style="margin-bottom: 10px"> ' +
      '<tr> <td class="panel" style="background: #ECF8FF;border: 0;padding: 10px !important;"> </td> <td class="expander"> </td> </tr> </table> <!-- END: Note Panel --> </td> </tr> </table><span class="devider" style="border-bottom: 1px solid #eee;margin: 15px -15px;display: block;"></span> <!-- END: Disscount Content --> </td> </tr> </table> </td> </tr> </table> <!-- END: Content --> <!-- BEGIN: Footer --> <table class="page-footer" align="center" style="width: 100%;background: #2f2f2f;"> <tr> <td class="center" align="center" style="vertical-align: middle;color: #fff;"> <table class="container" align="center"> <tr> <td style="vertical-align: middle;color: #fff;"> <!-- BEGIN: Unsubscribet --> <table class="row"> <tr> <td class="wrapper last" style="vertical-align: middle;color: #fff;"><span style="font-size:12px;"><i>This ia a system generated email and reply is not required.</i></span> </td> </tr> </table> <!-- END: Unsubscribe --> ' +
      '<!-- END: Footer Panel List --> </td> </tr> </table> </td> </tr> </table> <!-- END: Footer --> </td> </tr></table></body>')

    sendgrid.send(email, function(err, json) {
      if (err) { return console.log(err); }
    });

  feedback.save(function(err2){
        if (err2) return console.log('Error 2'+ err);

        res.send({status: 'success', msg: 'Thank you for your feedback.'});
    })




};

/**
 * Get list of users
 * restriction: 'admin'
 */
exports.index = function(req, res) {
  FeedbackVisitor.find({}, function (err, fb) {
    if(err) return res.send(500, err);
    //logger.serverLog('info', 'feedback.controller : Feedbacks data sent to super user');
    res.json(200, fb);
  });
};


exports.saveCallFeedback = function(req, res) {
    console.log('call saveCall feedback');
    console.log(req.body);
    var feedback = new FeedbackCall({
       username : req.body.username,
       audio : req.body.audio,
		   video : req.body.video,
		   screen : req.body.screen,
		   filetransfer : req.body.filetransfer,
       datetime : {type: Date, default: Date.now }
    });
     feedback.save(function(err2){
        if (err2) return console.log('Error 2'+ err);
        res.send({status: 'success', msg: 'Thank you for your feedback.'});
    });
}