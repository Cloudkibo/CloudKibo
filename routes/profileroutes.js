var passport = require('passport');
var mongoose = require('mongoose');
var Account = require('./../models/account');
var fs = require('fs');
var crypto = require("crypto");
var profileSchemas = require('./../models/profileSchemas');
var otherSchemas = require('./../models/otherSchemas');
  
exports.teacherFormPostReq = function(req, res) {
    var teacherProfile = profileSchemas.teacherProfile
    
    var newTeacher = new teacherProfile({
		   user: req.user._id,
		   teachername : {
							firstname : req.body.firstname,
							lastname : req.body.lastname,
						 },
		   undergradschool : req.body.undergradschool,
		   undergradyear : req.body.undergradyear,
		   undergradarea : req.body.undergradarea,
		   gradschool : req.body.gradschool,
		   gradyear : req.body.gradyear,
		   gradarea : req.body.gradarea,
		   phdschool : req.body.phdschool,
		   phdyear : req.body.phdyear,
		   phdarea : req.body.phdarea
		   });
		   
	newTeacher.save(function (err) {
		if (err) console.log(err)
		
		Account.findById(req.user._id, function (err3, gotUser) {
			if (err3) return console.log('Error 3'+ err3);
			
			gotUser.isTeacher = 'Yes';
			
			gotUser.save(function(err4){
				
				if (err4) return console.log('Error 2'+ err4);
				
				Account.findById(req.user._id, function (err3, gotUser1) {
					res.send({status: 'success', msg: gotUser1})
				})
				
			})

		})
		
		var news = otherSchemas.news
			
		var currentNews = new news({
			   label : 'Registration',
			   content : ''+ req.user.username +' has created Teacher profile.',
			   userid : req.user._id,
			   datetime : { type: Date, default: Date.now }
		});
		
		currentNews.save(function (err) {
			if (err) console.log(err)
		})
	})
	
	//res.redirect('/');
  };

exports.studentFormPostReq = function(req, res) {
    var studentProfile = profileSchemas.studentProfile
    
    var newStudent = new studentProfile({
		   user: req.user._id,
		   studentname : {
							firstname : req.body.firstname,
							lastname : req.body.lastname,
						 },
		   degree : req.body.degree,
		   batch : req.body.batch
		   });
    
	newStudent.save(function (err) {
		if (err) console.log(err)
		
		Account.findById(req.user._id, function (err3, gotUser) {
			if (err3) return console.log('Error 3'+ err3);
			
			gotUser.isStudent = 'Yes';
			
			gotUser.save(function(err4){
				
				if (err4) return console.log('Error 2'+ err4);
				
				Account.findById(req.user._id, function (err3, gotUser1) {
					res.send({status: 'success', msg: gotUser1})
				})
				
			})

		})
		
		var news = otherSchemas.news
			console.log(req.user.username)
		var currentNews = new news({
			   label : 'Registration',
			   content : ''+ req.user.username +' has created Student profile.',
			   userid : req.user._id,
			   datetime : { type: Date, default: Date.now }
		});
		
		currentNews.save(function (err) {
			if (err) console.log(err)
		})
		
	})
	
	//res.redirect('/');
  };

exports.adminFormPostReq = function(req, res) {
    var adminProfile = profileSchemas.adminProfile
    
    var newAdmin = new adminProfile({
		   user: req.user._id,
		   adminname : {
							firstname : req.body.fname,
							lastname : req.body.lname,
						}
		   });
    
	newAdmin.save(function (err) {
		if (err) console.log(err)
		
		var news = otherSchemas.news
			
		var currentNews = new news({
			   label : 'Registration',
			   content : ''+ req.user.username +' has created Admin profile.',
			   userid : req.user._id,
			   datetime : { type: Date, default: Date.now }
		});
		
		currentNews.save(function (err) {
			if (err) console.log(err)
		})
		
	})
	
	res.redirect('/');
  };
  
exports.parentFormPostReq = function(req, res) {
    var parentProfile = profileSchemas.parentProfile
    
    var newParent = new parentProfile({
		   user: req.user._id,
		   parentname : {
							firstname : req.body.fname,
							lastname : req.body.lname,
						},
		   parentrole : req.body.role
		   });
    
	newParent.save(function (err) {
		if (err) console.log(err)
		
		var news = otherSchemas.news
			
		var currentNews = new news({
			   label : 'Registration',
			   content : ''+ req.user.username +' has created Parent profile.',
			   userid : req.user._id,
			   datetime : { type: Date, default: Date.now }
		});
		
		currentNews.save(function (err) {
			if (err) console.log(err)
		})
		
	})
	
	res.redirect('/');
  };  
  
  exports.myteacherprofile = function(req, res) {
	  if (typeof req.user == 'undefined') res.redirect('/login');
      else{
		  
		  Account.findById(req.user._id, function (err, gotUser) {
			if (err) return console.log(err);
			
			var role;
    		if (gotUser.isTeacher == 'Yes') role = 'Teacher';
			if (gotUser.isStudent == 'Yes') role = 'Student';
			if (gotUser.isAdmin == 'Yes') role = 'Admin';
			if (gotUser.isParent == 'Yes') role = 'Parent';
			
		    if(role == 'Teacher')
			{
				var teacherProfile = profileSchemas.teacherProfile
				
				teacherProfile.findOne({user : gotUser._id}, function(err2, gotTeacherProfile){
					if(err2) return console.log(err2)
					
					if(gotTeacherProfile)
					{
					    res.render('myprofile', { title: 'CloudKibo', user : req.user, role : role, page : '/myprofile',
						teacherProfile : gotTeacherProfile });
				    }
					else
					{
					  res.redirect('/teacherForm');
				    }
				})
			}
			else{
				res.redirect('/');
			}
		  });		 
	  }
  };
  
  exports.mystudentprofile = function(req, res) {
	  if (typeof req.user == 'undefined') res.redirect('/login');
      else{
		  
		  Account.findById(req.user._id, function (err, gotUser) {
			if (err) return console.log(err);
			
			var role;
    		if (gotUser.isTeacher == 'Yes') role = 'Teacher';
			if (gotUser.isStudent == 'Yes') role = 'Student';
			if (gotUser.isAdmin == 'Yes') role = 'Admin';
			if (gotUser.isParent == 'Yes') role = 'Parent';
			
		    if(role == 'Student')
			{
				var studentProfile = profileSchemas.studentProfile
				
				studentProfile.findOne({user : gotUser._id}, function(err2, gotStudentProfile){
					if(err2) return console.log(err2)
					
					if(gotStudentProfile)
					{
					    res.render('myprofile', { title: 'CloudKibo', user : req.user, role : role, page : '/myprofile',
						studentProfile : gotStudentProfile });
				    }
					else
					{
					  res.redirect('/studentForm');
				    }
				})
			}
			else{
				res.redirect('/');
			}
		  });		 
	  }
  };
  
  exports.myadminprofile = function(req, res) {
	  if (typeof req.user == 'undefined') res.redirect('/login');
      else{
		  
		  Account.findById(req.user._id, function (err, gotUser) {
			if (err) return console.log(err);
			
			var role;
    		if (gotUser.isTeacher == 'Yes') role = 'Teacher';
			if (gotUser.isStudent == 'Yes') role = 'Student';
			if (gotUser.isAdmin == 'Yes') role = 'Admin';
			if (gotUser.isParent == 'Yes') role = 'Parent';
			
		    if(role == 'Admin')
			{
				var adminProfile = profileSchemas.adminProfile
				
				adminProfile.findOne({user : gotUser._id}, function(err2, gotAdminProfile){
					if(err2) return console.log(err2)
					
					if(gotAdminProfile)
					{
					    res.render('myprofile', { title: 'CloudKibo', user : req.user, role : role, page : '/myprofile',
						adminProfile : gotAdminProfile });
				    }
					else
					{
					  res.redirect('/adminForm');
				    }
				})
			}
			else{
				res.redirect('/');
			}
		  });		 
	  }
  };
  
  exports.myparentprofile = function(req, res) {
	  if (typeof req.user == 'undefined') res.redirect('/login');
      else{
		  
		  Account.findById(req.user._id, function (err, gotUser) {
			if (err) return console.log(err);
			
			var role;
    		if (gotUser.isTeacher == 'Yes') role = 'Teacher';
			if (gotUser.isStudent == 'Yes') role = 'Student';
			if (gotUser.isAdmin == 'Yes') role = 'Admin';
			if (gotUser.isParent == 'Yes') role = 'Parent';
			
		    if(role == 'Parent')
			{
				var parentProfile = profileSchemas.parentProfile
				
				parentProfile.findOne({user : gotUser._id}, function(err2, gotParentProfile){
					if(err2) return console.log(err2)
					
					if(gotParentProfile)
					{
					    res.render('myprofile', { title: 'CloudKibo', user : req.user, role : role, page : '/myprofile',
						parentProfile : gotParentProfile });
				    }
					else
					{
					  res.redirect('/parentForm');
				    }
				})
			}
			else{
				res.redirect('/');
			}
		  });		 
	  }
  };
