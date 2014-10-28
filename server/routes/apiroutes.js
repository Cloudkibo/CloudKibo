var passport = require('passport');
var mongoose = require('mongoose');
var Account = require('./../models/account');
var fs = require('fs');
var crypto = require("crypto");
var otherSchemas = require('./../models/otherSchemas');
var tokenSchemas = require('./../models/tokenSchemas');

var html_dir = './public/';

exports.getUserImageRoute = function(req, res) {
    if (typeof req.user == 'undefined') res.send({status: 'danger', msg: 'Unauthorized Access!'});
    else{
	    res.sendfile(req.params, {root: './userpictures'})
    }
  };
  
exports.logoutRoute = function(req, res) {
      req.logout();
      res.redirect('/');
  };
  
exports.getUserData = function(req, res) {
    if (typeof req.user == 'undefined') res.send({status: 'danger', msg: 'Unauthorized Access!'});
    else{
		Account.findById(req.user._id, function (err, gotUser) {
			if (err) return console.log(err);
			
			res.send({status: 'success', msg: gotUser});
			
			
		})
      }
  };
  
exports.getContactsListRoute = function(req, res) {
    console.log(req)
    if (typeof req.user == 'undefined') res.send({status: 'danger', msg: 'Unauthorized Access!'});
    else{
		
		Account.findById(req.user._id, function (err, gotUser) {
			if (err) return console.log(err);
			
			var contactslist = otherSchemas.contactslist;
			
			contactslist.find({userid : gotUser._id}).populate('contactid').exec(function(err3, gotContactList){
				
				res.send({status: 'success', msg: gotContactList});
				
			})
			
			
		})
      }
  };
  
exports.getAddRequestsListRoute = function(req, res) {
    if (typeof req.user == 'undefined') res.send({status: 'danger', msg: 'Unauthorized Access!'});
    else{
		
		Account.findById(req.user._id, function (err, gotUser) {
			if (err) return console.log(err);
			
			var contactslist = otherSchemas.contactslist;
			
			contactslist.find({contactid : gotUser._id, detailsshared : 'No'}).populate('userid').exec(function(err3, gotContactList){
				
				res.send({status: 'success', msg: gotContactList});
				
			})
			
			
		})
      }
  };
