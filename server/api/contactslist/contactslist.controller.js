'use strict';

var contactslist = require('./contactslist.model');
var config = require('../../config/environment');


exports.index = function(req, res) {
	contactslist.find({userid : req.user._id}).populate('contactid').exec(function(err2, gotContactList){
		if (err2) return next(err2);
		if (!gotContactList) return res.json(401);
		res.json(200, gotContactList);
	});
};

exports.pendingcontacts = function(req, res) {
	contactslist.find({contactid : req.user._id, detailsshared : 'No'}).populate('userid').exec(function(err2, gotContactList){
		if (err2) return next(err2);
		if (!gotContactList) return res.json(401);
		res.json(200, gotContactList);
	})
};
