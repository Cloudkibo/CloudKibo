'use strict';

var contactslist = require('./contactslist.model');
var User = require('../user/user.model');
var config = require('../../config/environment');
var userchat = require('../userchat/userchat.model');
var configuration = require('../configuration/configuration.model');
var logger = require('../../components/logger/logger');

exports.index = function(req, res) {
	contactslist.find({userid : req.user._id}).populate('contactid').exec(function(err2, gotContactList){
		if (err2) return next(err2);
		if (!gotContactList) return res.json(401);
    logger.serverLog('info', 'contactslist.controller : Contacts data sent to client');
		res.json(200, gotContactList);
	});
};

exports.pendingcontacts = function(req, res) {
	contactslist.find({contactid : req.user._id, detailsshared : 'No'}).populate('userid').exec(function(err2, gotContactList){
		if (err2) return next(err2);
		if (!gotContactList) return res.json(401);
    console.log("pending contacts "+ gotContactList);
    logger.serverLog('info', 'contactslist.controller : Pending contacts data sent to client');
    res.json(200, gotContactList);

	})


};

exports.addbyusername = function(req, res) {
	User.findById(req.user._id, function (err, gotUser) {
		if (err) return console.log('Error 1'+ err);

		User.findOne({username : req.body.searchusername}, function (err, gotUserSaved) {

      console.log("Add contact by user")
			if(gotUserSaved == null)
				return res.send({status: 'success', msg: null});

			contactslist.count({userid : gotUser._id, contactid : gotUserSaved._id}, function(err5, gotCount){

				if(gotUser.username == gotUserSaved.username)
					res.send({status: 'danger', msg: 'You can not add your self as a contact.'});
				else if(gotCount > 0)
					res.send({status: 'danger', msg: gotUserSaved.username +' is already added in your contact list with name '+ gotUserSaved.firstname +' '+ gotUserSaved.lastname});
				else{

          configuration.findOne({}, function (err, gotConfig) {
            if(err) return console.log(err);

            contactslist.count({userid : gotUser._id}, function(err, gotFullCount){
              if(err) return console.log(err);

              if(gotConfig.numberofpeopleincontactlist === gotFullCount){
                logger.serverLog("warn", "contact list full");
                res.send({status: 'danger', msg: 'Your contact list is full.'});

              }
              else{
                var contact = new contactslist({
                  userid : gotUser._id,
                  contactid : gotUserSaved._id
                });

                contact.save(function(err2){
                  if (err2) return console.log('Error 2'+ err);
                  contactslist.find({userid : gotUser._id}).populate('contactid').exec(function(err3, gotContactList){
                    res.send({status: 'success', msg: gotContactList});
                  })
                })

              }

            });

          });


				}
        console.log("contact add by username");
			})

		})
	})
};

exports.addbyemail = function(req, res) {
	User.findById(req.user._id, function (err, gotUser) {
		if (err) return console.log('Error 1'+ err);
    console.log("contact add by email")
		User.findOne({email : req.body.searchemail}, function (err, gotUserSaved) {

			if(gotUserSaved == null)
				return res.send({status: 'success', msg: null});

			contactslist.count({userid : gotUser._id, contactid : gotUserSaved._id}, function(err5, gotCount){

				if(gotUser.username == gotUserSaved.username)
					res.send({status: 'danger', msg: 'You can not add your self as a contact.'});
				else if(gotCount > 0)
					res.send({status: 'danger', msg: gotUserSaved.username +' is already added in your contact list with name '+ gotUserSaved.firstname +' '+ gotUserSaved.lastname})
				else{

          configuration.findOne({}, function (err, gotConfig) {
            if(err) return console.log(err);

            contactslist.count({userid : gotUser._id}, function(err, gotFullCount){
              if(err) return console.log(err);

              if(gotConfig.numberofpeopleincontactlist === gotFullCount){
                res.send({status: 'danger', msg: 'Your contact list is full.'});
                logger.serverLog('warn',"contact list full")
              }
              else{
                var contact = new contactslist({
                  userid : gotUser._id,
                  contactid : gotUserSaved._id
                });

                contact.save(function(err2){
                  if (err2) return console.log('Error 2'+ err);

                  contactslist.find({userid : gotUser._id}).populate('contactid').exec(function(err3, gotContactList){

                    res.send({status: 'success', msg: gotContactList});

                  })
                })
                console.log("contact add by email ")
              }
            })
          })


				}

			})

		})
	})
};


exports.approvefriendrequest = function(req, res) {
	 User.findById(req.user._id, function (err, gotUser) {
		if (err) return console.log('Error 1'+ err);
     console.log("accepting contact request");
		User.findOne({username : req.body.username}, function (err, gotUserSaved) {

			if(gotUserSaved == null)
				return res.send({status: 'success', msg: null});

			contactslist.count({userid : gotUser._id, contactid : gotUserSaved._id}, function(err5, gotCount){

				if(gotUser.username == gotUserSaved.username)
					res.send({status: 'danger', msg: 'You can not add your self as a contact.'});
				else if(gotCount > 0)

					res.send({status: 'danger', msg: gotUserSaved.username +' is already added in your contact list with name '+ gotUserSaved.firstname +' '+ gotUserSaved.lastname});
        else{

          configuration.findOne({}, function (err, gotConfig) {
            if(err) return console.log(err);

            contactslist.count({userid : gotUser._id}, function(err, gotFullCount){
              if(err) return console.log(err);

              if(gotConfig.numberofpeopleincontactlist === gotFullCount){
                logger.serverLog('warn', "contact can not accept. List is full");
                res.send({status: 'danger', msg: 'Your contact list is full.'});

              }
              else{
                var contact = new contactslist({
                  userid : gotUser._id,
                  contactid : gotUserSaved._id,
                  detailsshared : 'Yes'
                });

                contact.save(function(err2){
                  if (err2) return console.log('Error 2'+ err);

                  contactslist.find({userid : gotUser._id}).populate('contactid').exec(function(err3, gotContactList){

                    res.send({status: 'success', msg: gotContactList});

                    contactslist.findOne({userid : gotUserSaved._id, contactid : gotUser._id}, function(err6, gotOtherPerson){

                      gotOtherPerson.detailsshared = 'Yes';

                      logger.serverLog('info', 'contactslist.controller : Add request approved');

                      gotOtherPerson.save(function(err){});

                    })
                  })
                })

                console.log("accepted contact request")
              }
            })
          })



				}

			})

		})
	})
};

exports.rejectfriendrequest = function(req, res) {
  console.log("Rejecting contact request")
	 User.findById(req.user._id, function (err, gotUser) {
		if (err) return console.log('Error 1'+ err);

		User.findOne({username : req.body.username}, function (err, gotUserSaved) {

			contactslist.remove({userid : gotUserSaved._id, contactid : gotUser._id}, function(err6){

				res.send({status: 'success', msg: 'Request is rejected'});

        logger.serverLog('info', 'contactslist.controller : Add request rejected');

			})

		})

	})
};


exports.removefriend = function(req, res) {

  logger.serverLog('info', 'contactslist.controller : The data sent by client: '+ JSON.stringify(req.body));

  console.log("Removing contact request")
	 User.findById(req.user._id, function (err, gotUser) {
		if (err) return console.log('Error 1'+ err);

		User.findOne({username : req.body.username}, function (err, gotUserSaved) {
			contactslist.remove({userid : gotUserSaved._id, contactid : gotUser._id}, function(err6){
        console.log("Is in friend's list")
				contactslist.remove({userid : gotUser._id, contactid : gotUserSaved._id}, function(err6){
          console.log("Is in my list")

					userchat.remove({$or: [ { to : gotUserSaved.username, from : gotUser.username },
										{ to : gotUser.username, from : gotUserSaved.username } ]},
										function(err1){
											if(err1) return console.log(err1);

											res.send({status: 'success', msg: 'Friend is removed'});

                      logger.serverLog('info', 'contactslist.controller : Friend removed from contactlist');

										})

				})

			})

		})
	})
};
