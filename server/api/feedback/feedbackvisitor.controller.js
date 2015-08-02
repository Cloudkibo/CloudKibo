/**
 * Created by Saba on 02/23/2015.
 */

'use strict';

var FeedbackVisitor = require('./feedbackvisitor.model');

exports.saveVisitorFeedback = function(req, res) {

    var feedback = new FeedbackVisitor({
        name : req.body.name,
        email : req.body.email,
        message : req.body.message,
        datetime : {type: Date, default: Date.now }
    });

  console.log("saved visitors feedback")

    feedback.save(function(err2){
        if (err2) return console.log('Error 2'+ err);

        res.send({status: 'success', msg: 'Thank you for your feedback.'});
    })


};
