/*
 * registered user should not access any of profile form once their profile is created
 * Teacher does not access student profile form too
 * 
 * Express, Node and Mongoose Validations
 * http://stackoverflow.com/questions/7600559/how-do-you-handle-form-validation-especially-with-nested-models-in-node-js-e
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
 * NotTested: email address from facebook is already used with local account
 * 
 * don't hardcode browser name in file sharing functions
 * sending and receiving files needs more testing
 * 
 * Edit Course
 * Display Course jee UI
 * File Delete aen khatarnaak errors te email mokil
 *
 * ng-view  style='height=100px;' ... eho sabhni jee height theek kabi mustaqbil mei
 * view teacher profile, view student profile
 * Meeting Records, Call records and call feedback in super user schema view
 * first time course enrollment issue
 * suspicious file names on upload file module
 * use attachMediaStream function of adapter.js if not possible using angularjs
 * */
 
var FB = require('fb');
var passport = require('passport');
var mongoose = require('mongoose');
var Account = require('./../models/account');
var fs = require('fs');
var crypto = require("crypto");
var profileSchemas = require('./../models/profileSchemas');
var otherSchemas = require('./../models/otherSchemas');
var superuserroutes = require('./superuserroutes');
var profileroutes = require('./profileroutes');
var registrationroutes = require('./registrationroutes');
var tokenSchemas = require('./../models/tokenSchemas');

var html_dir = './public/';

module.exports = function (app) {

  app.get('/', function (req, res) {
	  if (typeof req.user == 'undefined')
	      res.render('index', { title: 'Synaps3WebRTC'});
      else{
		
		res.redirect('/home');
      }
  });
  
  app.get('/home', function (req, res) {
	  if (typeof req.user == 'undefined')
	      res.redirect('/')
      else{
		
			Account.findById(req.user._id, function (err, gotUser) {
				if (err) return console.log(err);
				
				var role;
				if (gotUser.isOwner == 'Yes') role = 'Owner';
				if (gotUser.isTeacher == 'Yes') role = 'Teacher';
				if (gotUser.isStudent == 'Yes') role = 'Student';
				if (gotUser.isAdmin == 'Yes') role = 'Admin';
				if (gotUser.isParent == 'Yes') role = 'Parent';
				
				if(role == 'Owner')
				  return res.redirect('/superuser')
				else if(role == 'Student')
				{
					var studentProfile = profileSchemas.studentProfile
				
					studentProfile.findOne({user : gotUser._id}, function(err2, gotStudentProfile){
						if(err2) return console.log(err2)
						
						var  teacherprofile = {};
						
						res.render('home', { title: 'Synaps3WebRTC', user: gotUser, role: role, studentprofile : gotStudentProfile, teacherprofile : teacherprofile });
						
					})
				}
				else if(role == 'Teacher')
				{
					var teacherProfile = profileSchemas.teacherProfile
				
					teacherProfile.findOne({user : gotUser._id}, function(err2, gotTeacherProfile){
						if(err2) return console.log(err2)
						
						var studentprofile = {};
						
						res.render('home', { title: 'Synaps3WebRTC', user: gotUser, role: role, teacherprofile : gotTeacherProfile, studentprofile : studentprofile});
						
					})
				}
				else
				{
					res.render('home', { title: 'Synaps3WebRTC', user: gotUser, role: role});
			    }
    		  
		  })
		
      }
  });
  
  app.get('/meeting/*', function (req, res) {
	  if (typeof req.user == 'undefined')
	      res.redirect('/')
      else{
		
			Account.findById(req.user._id, function (err, gotUser) {
				if (err) return console.log(err);
				
				res.render('meetingroom', { title: 'Synaps3WebRTC', user: gotUser, meetingroom : req.params[0]});    		  
		  })
		
      }
  });
  
  app.get('/register', function (req, res) {
	  if (typeof req.user == 'undefined')
	      res.redirect('/')
      else{
		
			res.redirect('/home')
		
      }
  });
  
  app.get('/templates/dashboard', function (req, res) {
	  if (typeof req.user == 'undefined')
	      res.redirect('/')
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
					  var courses = otherSchemas.course
					  
					  courses.find({teacherid : gotTeacherProfile._id}, function(err3, gotCourses){
						if(err3) return console.log(err3)
						
						var createdCourseString = new Array();
							
						var i=0;
						for(gotCourse in gotCourses)
						{
							createdCourseString[i] = gotCourses[gotCourse]._id;
							i++;
						}
						
						var news = otherSchemas.news
						
						news.find({label : 'Course', courseid : {$in : createdCourseString}}).sort({datetime : -1}).exec(function(err3, gotNews){
							if(err3) console.log(err3)
							
							res.render('dashboard', { title: 'CloudKibo', user : gotUser, role : role, page : '/',
							teacherProfile : gotTeacherProfile, teacherCourses : gotCourses, news : gotNews });  
							
						})
						
					  })
				    }
					else
					{
					  res.send('<h1>Unknown Error</h1>');
				    }
				})
			}
			else if(role == 'Student')
			{
				var studentProfile = profileSchemas.studentProfile
				
				studentProfile.findOne({user : gotUser._id}, function(err2, gotStudentProfile){
					if(err2) return console.log(err2)
					
					if(gotStudentProfile)
					{
						var coursestudent = otherSchemas.coursestudent
					  
						coursestudent.find({studentid : gotStudentProfile._id}).populate('courseid').exec(function(err3, gotCourses){
							if(err3) return console.log(err3)
							
							var enrolledCourseString = new Array();
							
							var i=0;
							for(gotCourse in gotCourses)
							{
								enrolledCourseString[i] = gotCourses[gotCourse].courseid._id;
								i++;
							}
							
							var news = otherSchemas.news
							
							news.find({label : 'Course', courseid : {$in : enrolledCourseString}}).sort({datetime : -1}).exec(function(err3, gotNews){
								if(err3) console.log(err3)
								
								var announcements = otherSchemas.announcement
								
								announcements.find({label : 'TeacherAnnouncingInClass', courseid : {$in : enrolledCourseString}}).populate('courseid').sort({datetime : -1}).exec(
								function(err4, gotAnnouncements){
									if(err4) return console.log(err4)
									
									res.render('dashboard', { title: 'CloudKibo', user : gotUser, role : role, page : '/',
									studentProfile : gotStudentProfile, studentCourses : gotCourses, news : gotNews,
									announcements : gotAnnouncements });
								
								})
							})
							
						})
				    }
					else
					{
					  res.send('<h1>Unknown Error</h1>');
				    }
				})
			}
			else if(role == 'Admin')
			{
				var adminProfile = profileSchemas.adminProfile
				
				adminProfile.findOne({user : gotUser._id}, function(err2, gotAdminProfile){
					if(err2) return console.log(err2)
					
					if(gotAdminProfile)
					{
					  res.render('dashboard', { title: 'CloudKibo', user : gotUser, role : role, page : '/',
					  adminProfile : gotAdminProfile });
				    }
					else
					{
					  res.send('<h1>Unknown Error</h1>');
				    }
				})
			}
			else if(role == 'Parent')
			{
				var parentProfile = profileSchemas.parentProfile
				
				parentProfile.findOne({user : gotUser._id}, function(err2, gotParentProfile){
					if(err2) return console.log(err2)
					
					if(gotParentProfile)
					{
					  res.render('dashboard', { title: 'CloudKibo', user : gotUser, role : role, page : '/',
					  parentProfile : gotParentProfile });
				    }
					else
					{
					  res.send('<h1>Unknown Error</h1>');
				    }
				})
			}
			
		  });
		
      }
  });
  
  app.get('/templates/createcourse', function(req, res) {
   if (typeof req.user == 'undefined') res.redirect('/login');
   else
   {
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
					  res.render('createcourse', { title: 'CloudKibo', user : req.user, role : role, page : '/createcourse',
					  teacherProfile : gotTeacherProfile });
				    }
					else
					{
					  res.send('<h1>Unknown Error</h1>');
				    }
				})
			}
			
		  });
   }
  });
  
  app.get('/templates/mycourses', function(req, res) {
	  if (typeof req.user == 'undefined') res.redirect('/login');
      else{
		  Account.findById(req.user._id, function (err, gotUser) {
			if (err) return console.log(err);
			
			var role;
    		if (gotUser.isTeacher == 'Yes') role = 'Teacher';
			if (gotUser.isStudent == 'Yes') role = 'Student';
			if (gotUser.isAdmin == 'Yes') role = 'Admin';
			if (gotUser.isParent == 'Yes') role = 'Parent';
			
			if (role == 'Teacher')
			{
				var teacherProfile = profileSchemas.teacherProfile
			  
				teacherProfile.findOne({user : req.user._id}, function(err, gotTeacher){
					if (err) return console.log(err)
					
					var course = otherSchemas.course
				  
					course.find({teacherid : gotTeacher._id}, function(err, gotCourses){
						if (err) return console.log(err)
							
						res.render('mycourses', { title: 'CloudKibo', user : req.user, role : role, page : '/mycourses', courses : gotCourses,
						teacherProfile : gotTeacher });
					});	
				});
			 }
			 else if(role == 'Student')
			 {
				var studentProfile = profileSchemas.studentProfile
			  
				studentProfile.findOne({user : req.user._id}, function(err, gotStudent){
					if (err) return console.log(err)
					
					var grading = otherSchemas.grading
				  
					grading.find({studentid : gotStudent._id}).populate('courseid').exec(function(err, gotCourses){
						if (err) return console.log(err)

						res.render('mycourses', { title: 'CloudKibo', user : req.user, role : role, page : '/mycourses', courses : gotCourses,
						studentProfile : gotStudent });
					});	
				});
			 }
		  });
	  }
  });
  
  app.get('/templates/myfiles', function(req, res) {
	  if (typeof req.user == 'undefined') res.redirect('/login');
      else{
		  
		  Account.findById(req.user._id, function (err, gotUser) {
			if (err) return console.log(err);
			  
			  var configdata;
			  var dir = __dirname + "/../configuration";
			  var file = dir + '/config.json';
			  
			  fs.readFile(file, 'utf8', function (err, configdatas) {
			  if (err) {
				
				return console.log('Error: ' + err);
			  }

			   configdata = JSON.parse(configdatas);
			
				var role;
				if (gotUser.isTeacher == 'Yes') role = 'Teacher';
				if (gotUser.isStudent == 'Yes') role = 'Student';
				if (gotUser.isAdmin == 'Yes') role = 'Admin';
				if (gotUser.isParent == 'Yes') role = 'Parent';
				
				var fileuser = otherSchemas.fileuser
				fileuser.find({userid : gotUser._id}).populate('fileid').exec(function (err, gotFiles) {
				  if (err) return console.log(err)
				  
				  res.render('filemanagement', { title: 'CloudKibo', user : req.user, role : role, page : '/myfiles',
				   files : gotFiles, configdata : configdata });
				  
				})
			})
		  });		 
	  }
  });
  
  app.get('/templates/searchcourses', function(req, res) {
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
				  
					studentProfile.findOne({user : req.user._id}, function(err, gotStudent){
						if (err) return console.log(err)
						
						var courses = otherSchemas.course
				
						courses.find().populate('teacherid').exec(function (err, gotCourses) {
							if (err) return console.log(err);
							  
							res.render('searchcourses', { title: 'CloudKibo', user : req.user, role : role, page : '/searchcourses', courses : gotCourses,
							studentProfile : gotStudent });
							
						});	
					});
				 }
			  });		 		 
	      }
  });
  
  app.get('/getmycourses', function(req, res) {
	  if (typeof req.user == 'undefined') res.redirect('/login');
      else{
		  Account.findById(req.user._id, function (err, gotUser) {
			if (err) return console.log(err);
			
			var role;
    		if (gotUser.isTeacher == 'Yes') role = 'Teacher';
			if (gotUser.isStudent == 'Yes') role = 'Student';
			if (gotUser.isAdmin == 'Yes') role = 'Admin';
			if (gotUser.isParent == 'Yes') role = 'Parent';
			
			if (role == 'Teacher')
			{
				var teacherProfile = profileSchemas.teacherProfile
			  
				teacherProfile.findOne({user : req.user._id}, function(err, gotTeacher){
					if (err) return console.log(err)
					
					var course = otherSchemas.course
				  
					course.find({teacherid : gotTeacher._id}, function(err, gotCourses){
						if (err) return console.log(err)
							
						res.send({status: 'success', msg: gotCourses})
					});	
				});
			 }
			 else if(role == 'Student')
			 {
				var studentProfile = profileSchemas.studentProfile
			  
				studentProfile.findOne({user : req.user._id}, function(err, gotStudent){
					if (err) return console.log(err)
					
					var grading = otherSchemas.grading
				  
					grading.find({studentid : gotStudent._id}).populate('courseid').exec(function(err, gotCourses){
						if (err) return console.log(err)

						res.send({status: 'success', msg: gotCourses})
						
					});	
				});
			 }
		  });
	  }
  });
  
  app.get('/getmyfiles', function(req, res) {
	  if (typeof req.user == 'undefined') res.redirect('/login');
      else{
		  
		  Account.findById(req.user._id, function (err, gotUser) {
			if (err) return console.log(err);
			  
			  var configdata;
			  var dir = __dirname + "/../configuration";
			  var file = dir + '/config.json';
			  
			  fs.readFile(file, 'utf8', function (err, configdatas) {
			  if (err) {
				
				return console.log('Error: ' + err);
			  }

			   configdata = JSON.parse(configdatas);
			
				var role;
				if (gotUser.isTeacher == 'Yes') role = 'Teacher';
				if (gotUser.isStudent == 'Yes') role = 'Student';
				if (gotUser.isAdmin == 'Yes') role = 'Admin';
				if (gotUser.isParent == 'Yes') role = 'Parent';
				
				var fileuser = otherSchemas.fileuser
				fileuser.find({userid : gotUser._id}).populate('fileid').exec(function (err, gotFiles) {
				  if (err) return console.log(err)
				  
				  res.send({status: 'success', msg: gotFiles});
				  
				})
			})
		  });		 
	  }
  });
  
  app.post('/sendUniqueUserName', function (req, res) {
	  if (typeof req.user == 'undefined')
	      res.redirect('/')
      else{
		  Account.findOne({username : req.body.uniqueusername}, function (err, gotTestUser) {
			  
			  // If there is another username available already
			  // it might possibly means that I am federate account
			  if(gotTestUser != null && (typeof req.body.fbId != 'undefined' || typeof req.body.googleId != 'undefined' || typeof req.body.windowsId != 'undefined'))
			  {
				  console.log('federate mei aayo aa')
				  res.send({status: 'danger', msg: 'This username is already taken.'})
			  }
			  else if(gotTestUser != null && typeof req.body.fbId == 'undefined' && typeof req.body.googleId == 'undefined' && typeof req.body.windowsId == 'undefined')
			  {
				  if(gotTestUser._id != req.user._id)
					res.send({status: 'danger', msg: 'This username is already taken.'})
				  else{
					  
						  Account.findById(req.user._id, function (err, gotUser) {
							if (err) return console.log('Error 1'+ err)
							
							gotUser.username = req.body.uniqueusername;
								
							gotUser.save(function (err2) {
								if (err2) return console.log('Error 2'+ err2);
								
								res.send({status: 'success', msg: req.body.uniqueusername})
								
							});
						})
				  }
			  }
			  else{
				  Account.findById(req.user._id, function (err, gotUser) {
							if (err) return console.log('Error 1'+ err)
							
							gotUser.username = req.body.uniqueusername;
								
							gotUser.save(function (err2) {
								if (err2) return console.log('Error 2'+ err2);
								
								res.send({status: 'success', msg: req.body.uniqueusername})
								
							});
						})
			  }
		  })
      }
  });
  
  app.post('/updateProfile', function (req, res) {
	  if (typeof req.user == 'undefined')
	      res.redirect('/')
      else{

		  Account.findById(req.user._id, function (err, gotUser) {
				if (err) return console.log('Error 1'+ err)
				
				gotUser.username = req.body.username;
				gotUser.firstname = req.body.firstname;
				gotUser.lastname = req.body.lastname;
				gotUser.email = req.body.email;
				gotUser.phone = req.body.phone;
				gotUser.city = req.body.city;
				gotUser.state = req.body.state;
				gotUser.country = req.body.country;
					
				gotUser.save(function (err2) {
					if (err2) return console.log('Error 2'+ err2);
					
					Account.findById(gotUser, function (err, gotUserSaved) {
						
						res.send(gotUserSaved);
						
					})
					
				});
			})
      }
  });
  
  app.post('/updateProfilePic', function (req, res) {
	  if (typeof req.user == 'undefined')
	      res.redirect('/')
      else{

		  Account.findById(req.user._id, function (err, gotUser) {
				if (err) return console.log('Error 1'+ err)
				
				if(gotUser.picture == null)
				{
					  var today = new Date();
					  var uid = crypto.randomBytes(5).toString('hex');
					  var serverPath = '/' + 'f' + uid + '' + today.getFullYear() + '' + (today.getMonth()+1) + '' + today.getDate();
					  serverPath += '' + today.getHours() + '' + today.getMinutes() + '' + today.getSeconds();
					  serverPath += '' + req.files.fileUploaded.name;
					  
					  var dir = __dirname + "/../userpictures";
					  
					  if(req.files.fileUploaded.size == 0) return res.send('No file submitted')
					  
					  require('fs').rename(
						 req.files.fileUploaded.path,
						 dir + "/" + serverPath,
						  function(error) {
							   if(error) {
								  res.send({
									  error: 'Server Error: Could not upload the file'
								  });
								  return;
							   }
						   }
					  );
					  
					  gotUser.picture = serverPath;
					
						gotUser.save(function (err2) {
							if (err2) return console.log('Error 2'+ err2);
							
							Account.findById(gotUser, function (err, gotUserSaved) {
								
								//res.send(gotUserSaved);
								res.redirect('/home');
								
							})
							
						});
					  
				  }
				  else
				  {
					  var dir = './userpictures';
					  dir += gotUser.picture;
						
						if(gotUser.picture)
						{
							require('fs').unlink(dir, function (err) {
								  if (err) throw err;
								
								
								  var today = new Date();
								  var uid = crypto.randomBytes(5).toString('hex');
								  var serverPath = '/' + 'f' + uid + '' + today.getFullYear() + '' + (today.getMonth()+1) + '' + today.getDate();
								  serverPath += '' + today.getHours() + '' + today.getMinutes() + '' + today.getSeconds();
								  serverPath += '' + req.files.fileUploaded.name;
								  
								  var dir = __dirname + "/../userpictures";
								  
								  if(req.files.fileUploaded.size == 0) return res.send('No file submitted')
								  
								  require('fs').rename(
									 req.files.fileUploaded.path,
									 dir + "/" + serverPath,
									  function(error) {
										   if(error) {
											  res.send({
												  error: 'Server Error: Could not upload the file'
											  });
											  return;
										   }
									   }
								  );
								  
								  gotUser.picture = serverPath;
								
									gotUser.save(function (err2) {
										if (err2) return console.log('Error 2'+ err2);
										
										Account.findById(gotUser, function (err, gotUserSaved) {
											
											//res.send(gotUserSaved);
											res.redirect('/home');
											
										})
										
									});
								
								
							})  
						}
				  }
				
				
			})
      }
  });
  
  app.post('/searchUserName', function (req, res) {
	  if (typeof req.user == 'undefined')
	      res.redirect('/')
      else{

		  Account.findById(req.user._id, function (err, gotUser) {
				if (err) return console.log('Error 1'+ err)
				
				Account.findOne({username : req.body.searchusername}, function (err, gotUserSaved) {
					
					res.send({status: 'success', msg: gotUserSaved});
					
				})
				
			})
      }
  });
  
  app.post('/searchEmail', function (req, res) {
	  if (typeof req.user == 'undefined')
	      res.redirect('/')
      else{

		  Account.findById(req.user._id, function (err, gotUser) {
				if (err) return console.log('Error 1'+ err)
								
				Account.findOne({email : req.body.searchemail}, function (err, gotUserSaved) {
					
					res.send({status: 'success', msg: gotUserSaved});
					
				})
			})
      }
  });
  
  app.post('/emailInvite', function (req, res) {
	  if (typeof req.user == 'undefined')
	      res.redirect('/')
      else{
			Account.findById(req.user._id, function (err, gotUser) {
				if (err) return console.log('Error 1'+ err)
				
				var sendgrid  = require('sendgrid')('cloudkibo', 'cl0udk1b0');

				var email     = new sendgrid.Email({
				  to:       req.body.recipientEmail,
				  from:     'support@cloudkibo.com',
				  subject:  ''+ req.user.firstname +' via CloudKibo: Join my Video Call',
				  text:     ''
				});
				
				var message = req.body.shortmessage;
				if(req.body.shortmessage == null || req.body.shortmessage == 'undefined')
				   message = 'Hello, I am available on CloudKibo for Video Chat.';

				email.setHtml('<h1>CloudKibo</h1><br><br>'+req.user.firstname+' has invited you to connect on CloudKibo.<br><br>'+
				'Follow the following URL to make an account on CloudKibo and Starting Video Conversations in real time in your browser.'+
				' <br><br><a href="https://www.cloudkibo.com/" target=_blank>http://www.cloudkibo.com/</a><br><br><br>' +
				'<span style="background:#22DFFF; width:100%; text-align:center;"><b><i>'+ message +'</i></b></span><br><br><br>'+
				'<p><b>With CloudKibo<b> you can do</b></p><br><ul><li>Video Call</li><li>Audio Call</li><li>File Transfering'+
				'</li><li>Screen Sharing</li><li>Instant Messaging</li></ul><br><br> Join CloudKibo and talk your dearest ones.');

				sendgrid.send(email, function(err, json) {
				  if (err) { return console.error(err); }

				  console.log(json);

				});
				
				res.send({status: 'success', msg: 'Email Sent Successfully'})
				
			})
		
      }
  });
  
  app.post('/initialTestingDone', function (req, res) {
	  if (typeof req.user == 'undefined')
	      res.redirect('/')
      else{
			Account.findById(req.user._id, function (err, gotUser) {
				if (err) return console.log('Error 1'+ err)
				
				gotUser.initialTesting = req.body.initialTesting;
					
				gotUser.save(function (err2) {
					if (err2) return console.log('Error 2'+ err2);
					
					Account.findById(req.user._id, function (err3, gotUser1) {
						if (err3) return console.log('Error 3'+ err3);
						res.send({status: 'success', msg: gotUser1})
					})
					
					
				});
			})
		
      }
  });
  
  app.post('/feedBackOnCall', function (req, res) {
	  if (typeof req.user == 'undefined')
	      res.redirect('/')
      else{
			Account.findById(req.user._id, function (err, gotUser) {
				if (err) return console.log('Error 1'+ err)
				
				console.log(req.body);
				
				var news = otherSchemas.news
				
				var oneNews = new news({
					   		   label : 'FeedBack',
							   content : 'CloudKibo has got new feedback by '+ gotUser.username,
							   userid : gotUser._id
			    });
			   
				oneNews.save(function (err) {
					if (err) console.log(err)
				})
				
				var feedback = otherSchemas.feedback
				
				var newFeedback = new feedback({
					userid : gotUser._id,
				    audio : parseInt(req.body.audio),
				    video : parseInt(req.body.video),
				    screen : parseInt(req.body.screen),
				    filetransfer : parseInt(req.body.filetransfer),
				    comment : req.body.comments
				})
				
				newFeedback.save(function (err){
					if(err) console.log(err)
				})
				
				res.send({status: 'success', msg: req.body});
				
			})
		
      }
  });
  
  app.post('/recordCallData', function (req, res) {
	  if (typeof req.user == 'undefined')
	      res.redirect('/')
      else{

		  Account.findById(req.user._id, function (err, gotUser) {
				if (err) return console.log('Error 1'+ err)
				
				if(req.body.Caller != null)
				{
					var callrecord = otherSchemas.callrecord
					
					var record = new callrecord({
								   caller : req.body.Caller,
								   callee : req.body.Callee,
								   starttime : req.body.StartTime,
								   endtime : req.body.EndTime
					});
				   
					record.save(function (err) {
						if (err) console.log(err)
					})
				}
				
			})
      }
  });
  
  app.post('/recordMeetingData', function (req, res) {
	  if (typeof req.user == 'undefined')
	      res.redirect('/')
      else{

		  Account.findById(req.user._id, function (err, gotUser) {
				if (err) return console.log('Error 1'+ err)
				
				if(req.body.creator != null)
				{
					var meetingrecord = otherSchemas.meetingrecord
					
					var record = new meetingrecord({
								   creator : req.body.creator,
								   roomname : req.body.roomname,
								   members : req.body.members,
								   starttime : req.body.StartTime,
								   endtime : req.body.EndTime
					});
				   
					record.save(function (err) {
						if (err) console.log(err)
					})
				}
				
			})
      }
  });
  
  app.post('/register', registrationroutes.registerPostReq);
   
  app.post('/login', passport.authenticate('local'), function(req, res) {
      res.redirect('/home');
  });
  
  app.get('/logout', function(req, res) {
      req.logout();
      res.redirect('/');
  });
  
  app.get('/login', function(req, res) {
	res.redirect('/')
  })
  
  app.get("/auth/facebook", passport.authenticate("facebook", { scope : ['public_profile', 'email']}));

  app.get("/auth/facebook/callback",
      passport.authenticate("facebook",{ failureRedirect: '/'}), 
      function(req,res){

            res.redirect('/home');
      }
  );
  
  app.get('/auth/windowslive', passport.authenticate('windowslive', { scope: ['wl.signin', 'wl.basic', 'wl.emails',
   'wl.phone_numbers', 'wl.photos', 'wl.postal_addresses', 'wl.offline_access'] }));
  
  app.get('/auth/windowslive/callback', 
  passport.authenticate('windowslive', { failureRedirect: '/' }),
  function(req, res) {
    
    
        res.redirect('/home');
		
  });
  
  app.get('/auth/google', passport.authenticate('google', {scope: ['profile', 'email',
   'https://www.googleapis.com/auth/plus.login']}));

  app.get('/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: '/' }),
    function(req,res){
		
        res.redirect('/home');
		
    }  
  );
  
  app.post('/teacherForm', profileroutes.teacherFormPostReq);
  
  app.post('/studentForm', profileroutes.studentFormPostReq);
  
  /*
  
  app.post('/adminForm', profileroutes.adminFormPostReq);
  
  app.post('/parentForm', profileroutes.parentFormPostReq);
  
  app.get('/myteacherprofile', profileroutes.myteacherprofile);
  
  app.get('/mystudentprofile', profileroutes.mystudentprofile);
  
  app.get('/myadminprofile', profileroutes.myadminprofile);
  
  app.get('/myparentprofile', profileroutes.myparentprofile);
  */
  
  app.post('/createcourse', function(req, res) {
    var teacherProfile = profileSchemas.teacherProfile
    
    teacherProfile.findOne({user : req.user._id}, function(err, gotTeacher){
		if (err) return console.log(err)
		
		var course = otherSchemas.course
    
		var newCourse = new course({
			   coursename : req.body.cname,
			   coursedescription : req.body.cdescription,
			   coursecode : req.body.ccode,
			   prerequisite : req.body.prereqs,
			   workload : req.body.workload,
			   startdate : req.body.startdate,
			   enddate : req.body.enddate,
			   days : req.body.sessiondays,
			   time : req.body.time,
			   timecountry: req.body.timeregion,
			   registrationOpen : 'Yes',
			   teacherid: gotTeacher._id
			   });
			   
		newCourse.save(function (err) {
			if (err) console.log(err)
			
			var news = otherSchemas.news
			
			var currentNews = new news({
				   label : 'Course',
				   content : ''+ gotTeacher.teachername.firstname +' '+ gotTeacher.teachername.lastname +' has created course '+ req.body.cname+ '. (Username: '+ req.user.username +')',
				   userid : req.user._id,
				   teacherid: gotTeacher._id,
				   datetime : { type: Date, default: Date.now }
			});
			
			currentNews.save(function (err) {
				if (err) console.log(err)
				res.send({status: 'success', msg: 'You have created course '+ req.body.cname +'. You will receive notification if any students enrolls. Go to My Courses'});
			})
			
		});
		
	});
  });

  app.post('/upload', function(req, res) {
	  if (typeof req.user == 'undefined') res.redirect('/login');
      else{ 

		  var today = new Date();
		  var uid = crypto.randomBytes(5).toString('hex');
		  var serverPath = '/' + 'f' + uid + '' + today.getFullYear() + '' + (today.getMonth()+1) + '' + today.getDate();
		  serverPath += '' + today.getHours() + '' + today.getMinutes() + '' + today.getSeconds();
		  serverPath += '' + req.files.fileUploaded.name;
		  
		  var dir = __dirname + "/../useruploads";
		  
		  if(req.files.fileUploaded.size == 0) return res.send('No file submitted. (Development Note: We will user angular to handle this message. For now, it is just for testing)')
		  
		  require('fs').rename(
			 req.files.fileUploaded.path,
			 dir + "/" + serverPath,
			  function(error) {
				   if(error) {
					  res.send({
						  error: 'Server Error: Could not upload the file'
					  });
					  return;
				   }
			   }
		  );
		  
		  var isPrivateValue = (req.body.privatecheckbox == 'on') ? 'No' : 'Yes';
		  
		  var file = otherSchemas.files
		
		  var newFile = new file({
				 filename : req.files.fileUploaded.name,
				 filephysicalpath : serverPath,
				 size : req.files.fileUploaded.size,
				 isprivate : isPrivateValue,
		   });
		
		  newFile.save(function (err) {
			  if (err) return console.log(err)
			  
			  file.findOne({filephysicalpath : serverPath}, function(err, gotFile){
				if (err) return console.log(err)
				
				var fileuser = otherSchemas.fileuser
			
				var newFileUser = new fileuser({
					   userid: req.user._id,
					   fileid: gotFile._id
				});
					   
				newFileUser.save(function (err) {
					if (err) console.log(err)
					
					    var fileuser = otherSchemas.fileuser
						fileuser.find({userid : req.user._id}).populate('fileid').exec(function (err, gotFiles) {
						    if (err) return console.log(err)
							
							res.send(gotFiles);
						  
						    var news = otherSchemas.news
			
							var currentNews = new news({
								   label : 'File',
								   content : ''+ req.user.username +' has uploaded file '+ gotFile.filename,
								   userid : req.user._id,
								   fileid: gotFile._id,
								   datetime : { type: Date, default: Date.now }
							});
							
							currentNews.save(function (err) {
								if (err) console.log(err)
								
								
							})
						  
						})
				});
				
			 });
		  })
	  }
  });
  

  
  app.post('/uploadInClass/*', function(req, res) {
	  if (typeof req.user == 'undefined') res.redirect('/login');
      else{ 

		  var today = new Date();
		  var uid = crypto.randomBytes(5).toString('hex');
		  var serverPath = '/' + 'f' + uid + '' + today.getFullYear() + '' + (today.getMonth()+1) + '' + today.getDate();
		  serverPath += '' + today.getHours() + '' + today.getMinutes() + '' + today.getSeconds();
		  serverPath += '' + req.files.fileUploaded.name;
		  
		  var dir = __dirname + "/../courseuploads";
		  
		  if(req.files.fileUploaded.size == 0) return res.send('No file submitted. (Development Note: We will user angular to handle this message. For now, it is just for testing)')
		  
		  require('fs').rename(
			 req.files.fileUploaded.path,
			 dir + "/" + serverPath,
			  function(error) {
				   if(error) {
					  res.send({
						  error: 'Server Error: Could not upload the file'
					  });
					  return;
				   }
			   }
		  );
		  
		  var isPrivateValue = (req.body.privatecheckbox == 'on') ? 'No' : 'Yes';
		  
		  var file = otherSchemas.files
		
		  var newFile = new file({
				 filename : req.files.fileUploaded.name,
				 filephysicalpath : serverPath,
				 size : req.files.fileUploaded.size,
				 isprivate : isPrivateValue,
		   });
		
		  newFile.save(function (err) {
			  if (err) return console.log(err)
			  
			  file.findOne({filephysicalpath : serverPath}, function(err, gotFile){
				if (err) return console.log(err)
				
				var filecourse = otherSchemas.filecourse
			
				var newFileCourse = new filecourse({
					   courseid: req.params[0],
					   fileid: gotFile._id
				});
					   
				newFileCourse.save(function (err) {
					if (err) console.log(err)
					
					var filecourse = otherSchemas.filecourse
					filecourse.find({courseid : req.params[0]}).populate('fileid').exec(function (err, gotFiles) {
					  if (err) return console.log(err)
					  
					  res.send(gotFiles);
					  
					  var course = otherSchemas.course
			
						course.findOne({_id : req.params[0]}, function(err, gotCourse){
							
							var news = otherSchemas.news
					
							var currentNews = new news({
								   label : 'Course',
								   content : ''+ req.user.username +' has uploaded file '+ gotFile.filename +' in class '+ gotCourse.coursename,
								   userid : req.user._id,
								   courseid : req.params[0],
								   fileid: gotFile._id,
								   datetime : { type: Date, default: Date.now }
							});
							
							currentNews.save(function (err) {
								if (err) console.log(err)
							})
					  
						})
					});
				
				})
				
			 });
		  })
	  }
  });
  
  
  app.get('/download/*', function(req, res) {
    if (typeof req.user == 'undefined') res.redirect('/');
    else{
	    res.sendfile(req.params, {root: './useruploads'})
    }
  });
  
  app.get('/downloadClassFile/*', function(req, res) {
    if (typeof req.user == 'undefined') res.redirect('/');
    else{
	    res.sendfile(req.params, {root: './courseuploads'})
    }
  });
  
  
  app.get('/userimage/*', function(req, res) {
    if (typeof req.user == 'undefined') res.redirect('/');
    else{
	    res.sendfile(req.params, {root: './userpictures'})
    }
  });
  
  app.get('/delete/*', function(req, res) {
    if (typeof req.user == 'undefined') res.redirect('/');
    else{
		
		var file = otherSchemas.files
		
		file.findOne({filephysicalpath : '/'+ req.params}, function(err, gotFile){
			
			var fileid = gotFile._id;
			var filename = gotFile.filename;
			
			file.remove({filephysicalpath : '/'+ req.params}, function (err) {
				if (err) console.log(err)
				
				var fileuser = otherSchemas.fileuser
					   
				fileuser.remove({fileid : fileid}, function (err) {
					if (err) console.log(err)
					
					dir = './useruploads/';
					dir += req.params;
					
					try{
						require('fs').unlink(dir, function (err99) {
							if (err99) console.log(err99)//throw err99;
							console.log('successfully deleted '+ dir);
						  
							var news = otherSchemas.news
				
							var currentNews = new news({
								   label : 'File',
								   content : ''+ req.user.username +' has deleted file '+ filename,
								   userid : req.user._id,
								   fileid: fileid,
								   datetime : { type: Date, default: Date.now }
							});
							
							currentNews.save(function (err) {
								if (err) console.log(err)
							})
						  
							var fileuser = otherSchemas.fileuser
							fileuser.find({userid : req.user._id}).populate('fileid').exec(function (err, gotFiles) {
							  if (err) return console.log(err)
							  
							  res.send(gotFiles);
							  
							})
						});
					}catch(exception){
						var fileuser = otherSchemas.fileuser
						fileuser.find({userid : req.user._id}).populate('fileid').exec(function (err, gotFiles) {
						  if (err) return console.log(err)
						  
						  res.send(gotFiles);
						  
						})
					}
				});
			});
		});
     }
  });

  app.get('/deleteClassFile/*', function(req, res) {
    if (typeof req.user == 'undefined') res.redirect('/');
    else{
		
		var file = otherSchemas.files
		
		file.findOne({filephysicalpath : '/'+ req.params}, function(err, gotFile){
			var fileid = gotFile._id;
			var filename = gotFile.filename;
			
			file.remove({filephysicalpath : '/'+ req.params}, function (err) {
				if (err) console.log(err)
				
				var filecourse = otherSchemas.filecourse
				filecourse.findOne({fileid : fileid}).populate('courseid').exec(function(err, gotFileCourse){
					if (err) console.log(err)
					
					var courseid = gotFileCourse.courseid._id;
					var coursename = gotFileCourse.courseid.coursename;
					
					filecourse.remove({fileid : fileid}, function (err) {
						if (err) console.log(err)
						
						dir = './courseuploads/';
						dir += req.params;

						try{
							require('fs').unlink(dir, function (err) {
								if (err) console.log(err); //throw err
								console.log('successfully deleted '+ dir);
							  
								var news = otherSchemas.news
					
								var currentNews = new news({
									   label : 'Course',
									   content : ''+ req.user.username +' has deleted file '+ filename +' in class '+ coursename,
									   userid : req.user._id,
									   courseid : courseid,
									   fileid: fileid,
									   datetime : { type: Date, default: Date.now }
								});
								
								currentNews.save(function (err) {
									if (err) console.log(err)
								})
							  
								var filecourse = otherSchemas.filecourse
								filecourse.find({courseid : courseid}).populate('fileid').exec(function (err, gotFiles) {
								  if (err) return console.log(err)
								  
								  res.send(gotFiles);
								  
								})
							});
						}catch(exception){
							var filecourse = otherSchemas.filecourse
							filecourse.find({courseid : courseid}).populate('fileid').exec(function (err, gotFiles) {
								  if (err) return console.log(err)
								  
								  res.send(gotFiles);
								  
							})
						}
					});
					
				})
			});
		});
     }
  });

  
  app.get('/adminlogin', function(req, res) {
      if (typeof req.user == 'undefined') res.render('adminlogin', { title : 'CloudKibo' });
      else res.redirect('/');
  });
 
  app.post('/adminlogin', passport.authenticate('local'), function(req, res) {
	  res.redirect('/superuser');
  });
  /*
  app.get('/adminregister', function(req, res) {
	  if (typeof req.user == 'undefined') res.render('adminregistration', {title: 'CloudKibo'});
      else res.redirect('/');
  });
  
  app.post('/adminregister', superuserroutes.adminregisterPostReq);
  */
  app.get('/superuser', superuserroutes.superuser);
  
  app.get('/display/*', superuserroutes.displayuser);
  
  app.get('/removeuser/*', superuserroutes.removeuser);
  
  app.post('/configPost', superuserroutes.configPost);
  
  app.get('/viewschema/*', superuserroutes.viewschema);
  
  app.get('/displaycourse/:courseid', function(req, res) {
    if (typeof req.user == 'undefined') res.redirect('/');
    else{
		Account.findById(req.user._id, function (err, gotUser) {
			if (err) return console.log(err);
			
			var role;
			if (gotUser.isTeacher == 'Yes') role = 'Teacher';
			if (gotUser.isStudent == 'Yes') role = 'Student';
			if (gotUser.isAdmin == 'Yes') role = 'Admin';
			if (gotUser.isParent == 'Yes') role = 'Parent';
			if (gotUser.isOwner == 'Yes') role = 'Owner';
			
			var courses = otherSchemas.course
			
			courses.findById(req.param('courseid')).populate('teacherid').exec(function (err9, gotCourse) {
				if(err9) return console.log(err9)
				
				var courseBelongsToTeacher = false;
				
				if(role == 'Teacher')
				{
					var teacherProfile = profileSchemas.teacherProfile
					
					teacherProfile.findOne({user : gotUser._id}, function(err2, gotTeacherProfile){
						if(err2) return console.log(err2)
						
						var teacher = gotTeacherProfile._id.toString().toUpperCase();
						var course = gotCourse.teacherid._id.toString().toUpperCase();
						
						if(teacher == course)
						  courseBelongsToTeacher = true;
						else
						  courseBelongsToTeacher = false;
						  
						var coursestudent = otherSchemas.coursestudent
				  
						coursestudent.find({courseid : gotCourse._id}).exec(function(err, gotCourseStudents){
							if (err) return console.log(err)
							
							var studentArray = new Array()
							var i = 0;
							for(gotCourseStudent in gotCourseStudents)
							{
								  studentArray[i] = gotCourseStudents[gotCourseStudent].studentid;
								  i++;
							}
							
							var students = profileSchemas.studentProfile
							
							students.find({_id : {$in : studentArray}}).populate('user').exec(function(err23, gotStudents){
							if(err23) return console.log(err23)
							var announcements = otherSchemas.announcement
							
							announcements.find({teacherid : gotTeacherProfile._id, courseid : gotCourse._id}, function(err5, gotAnnouncements){
								
								if(err5) return console.log(err5)
								
								  var configdata;
								  var dir = __dirname + "/../configuration";
								  var file = dir + '/config.json';
								  
								  fs.readFile(file, 'utf8', function (err, configdatas) {
								  if (err) {
									
									return console.log('Error: ' + err);
								  }

							      configdata = JSON.parse(configdatas);
							      
							    var filecourse = otherSchemas.filecourse
								filecourse.find({courseid : gotCourse._id}).populate('fileid').exec(function (err, gotFiles) {
								  if (err) return console.log(err)
								  
								  var grading = otherSchemas.grading
								  
								  grading.find({courseid : gotCourse._id}).populate('courseid studentid').exec(function(err, gotGrading){
									if (err) return console.log(err)  
									
 								  res.render('displaycourse', { title: 'CloudKibo', user : req.user, role : role, page : '/displaycourse',
								  course : gotCourse, courseBelongsToTeacher : courseBelongsToTeacher, coursestudents : gotStudents,
								  teacherProfile : gotTeacherProfile, announcements : gotAnnouncements, configdata : configdata,
								  files : gotFiles, gradings : gotGrading });  
								  
								  })
								  
								})
								
								})
							
							})
							
							})
							
						});
						
					})
				}
				else if(role == 'Student'){

					var studentProfile = profileSchemas.studentProfile
					
					studentProfile.findOne({user : gotUser._id}, function(err2, gotStudentProfile){
						
						var announcements = otherSchemas.announcement
						announcements.find({courseid : gotCourse._id}, function(err5, gotAnnouncements){
							if (err5) return console.log(err5)
							
							var grading = otherSchemas.grading
							grading.find({courseid : gotCourse._id, studentid : gotStudentProfile._id}).exec(function(err, gotGrading){
								if (err) return console.log(err)  
								
																var coursestudent = otherSchemas.coursestudent
					  
								coursestudent.find({courseid : gotCourse._id, studentid : {$ne : gotStudentProfile._id}}).exec(function(err, gotCourseStudents){
									if (err) return console.log(err)
									
									var studentArray = new Array()
									var i = 0;
									for(gotCourseStudent in gotCourseStudents)
									{
										  studentArray[i] = gotCourseStudents[gotCourseStudent].studentid;
										  console.log(studentArray)
										  i++;
									}
									
									coursestudent.count({courseid : gotCourse._id, studentid : gotStudentProfile._id}, function(err10, gotCount){
									  if(err10) return console.log(err10)
									  
									  var isEnrolled = false;
									  
									  if(gotCount>0)
										 isEnrolled = true;
									  
									  var students = profileSchemas.studentProfile
									
									  students.find({_id : {$in : studentArray}}).populate('user').exec(function(err23, gotStudents){
										if(err23) return console.log(err23)
										
										  var configdata;
										  var dir = __dirname + "/../configuration";
										  var file = dir + '/config.json';
										  
										  fs.readFile(file, 'utf8', function (err, configdatas) {
										  if (err) {
											
											return console.log('Error: ' + err);
										  }

										  configdata = JSON.parse(configdatas);
										  
										var filecourse = otherSchemas.filecourse
										filecourse.find({courseid : gotCourse._id}).populate('fileid').exec(function (err, gotFiles) {
										  if (err) return console.log(err)
										  
										  console.log(gotFiles)
										
										  res.render('displaycourse', { title: 'CloudKibo', user : req.user, role : role, page : '/displaycourse',
										  course : gotCourse, courseBelongsToTeacher : courseBelongsToTeacher, coursestudents : gotStudents,
										  enrolled : isEnrolled, studentProfile : gotStudentProfile, announcements : gotAnnouncements, configdata : configdata,
										  files : gotFiles, gradings : gotGrading });
										  
										})
										
										})
									  
									  })
									})
								});								
							})							
						})
					
					})
			   }
			   else{
					var coursestudent = otherSchemas.coursestudent
				  
					coursestudent.find({courseid : gotCourse._id}).exec(function(err, gotCourseStudents){
						if (err) return console.log(err)
						
						var studentArray = new Array()
						var i = 0;
						for(gotCourseStudent in gotCourseStudents)
						{
							  studentArray[i] = gotCourseStudents[gotCourseStudent].studentid;
							  console.log(studentArray)
							  i++;
						}
						
						var students = profileSchemas.studentProfile
						
						students.find({_id : {$in : studentArray}}).populate('user').exec(function(err23, gotStudents){
						  if(err23) return console.log(err23)
							
						  res.render('displaycourse', { title: 'CloudKibo', user : req.user, role : role, page : '/displaycourse',
						  course : gotCourse, courseBelongsToTeacher : courseBelongsToTeacher, coursestudents : gotStudents });
						
						})
					});
			   }
				
			});
		})
    }
  });
  
  app.get('/getdisplaycourse/:courseid', function(req, res) {
    if (typeof req.user == 'undefined') res.redirect('/');
    else{
		Account.findById(req.user._id, function (err, gotUser) {
			if (err) return console.log(err);
			
			var role;
			if (gotUser.isTeacher == 'Yes') role = 'Teacher';
			if (gotUser.isStudent == 'Yes') role = 'Student';
			if (gotUser.isAdmin == 'Yes') role = 'Admin';
			if (gotUser.isParent == 'Yes') role = 'Parent';
			if (gotUser.isOwner == 'Yes') role = 'Owner';
			
			var courses = otherSchemas.course
			
			courses.findById(req.param('courseid')).populate('teacherid').exec(function (err9, gotCourse) {
				if(err9) return console.log(err9)
				
				res.send({status: 'success', msg: gotCourse});
			});
		})
    }
  });

  app.get('/removecourse/*', function(req, res) {
    if (typeof req.user == 'undefined') res.redirect('/');
    else{
		Account.findById(req.user._id, function (err, gotUser) {
			if (err) return console.log(err);
			
			var role;
			if (gotUser.isTeacher == 'Yes') role = 'Teacher';
			if (gotUser.isStudent == 'Yes') role = 'Student';
			if (gotUser.isAdmin == 'Yes') role = 'Admin';
			if (gotUser.isParent == 'Yes') role = 'Parent';
			if (gotUser.isOwner == 'Yes') role = 'Owner';
			
			var courses = otherSchemas.course
			
			courses.findById(req.params[0]).populate('teacherid').exec(function (err, gotCourse) {
				if (err) return console.log(err);
				
				var coursename = gotCourse.coursename;
				var courseid = gotCourse._id;
				var courseBelongsToTeacher = false;
				
				if(role == 'Teacher')
				{
					var teacherProfile = profileSchemas.teacherProfile
					
					teacherProfile.findOne({user : gotUser._id}, function(err2, gotTeacherProfile){
						if(err2) return console.log(err2)
						
						var teacher = gotTeacherProfile._id.toString().toUpperCase();
						var course = gotCourse.teacherid._id.toString().toUpperCase();
						
						if(teacher == course)
						  courseBelongsToTeacher = true;
						else
						  courseBelongsToTeacher = false;
						
						if(courseBelongsToTeacher)
						{
							  var filecourse = otherSchemas.filecourse
							  filecourse.find({courseid : courseid}, function(err4, gotFiles){
								  if (err4) return console.log(err4);
								  var gotFile;
								  for(gotFile in gotFiles)
								  {
									  var files = otherSchemas.files
									  files.find({_id : gotFiles[gotFile].fileid}, function(err5, gotFilesDetailed){
										  if (err5) return console.log(err5);
										
										dir = './courseuploads';
										dir += gotFilesDetailed[0].filephysicalpath;

										require('fs').unlink(dir, function (err) {
										  if (err) throw err;
										  console.log('successfully deleted '+ dir);
										  
										  files.remove({filephysicalpath : gotFilesDetailed[0].filephysicalpath}, function (err6){
											 if(err6) return console.log(err6);
											 console.log('Removed from file table')
											 filecourse.remove({courseid : courseid}, function (err7){
												if(err7) return console.log(err7);
												console.log('Removed from fileuser table')
											 })   
										  })
										  
										});
										
									  })
								  }
							  })
							
							var coursestudent = otherSchemas.coursestudent
							coursestudent.remove({courseid : req.params[0]}, function(err){
								if(err) return console.log(err);
								
								var announcements = otherSchemas.announcement
								
								announcements.remove({courseid : req.params[0]}, function(err4){
								if(err4) return console.log(err4);
								
								var grading = otherSchemas.grading
								grading.remove({courseid : req.params[0]}, function(err99){
									if(err99) return console.log(err99);
									
									courses.remove({_id: req.params[0]}, function(err2){
									  if(err2) return console.log(err2);
									  
										var news = otherSchemas.news
				
										var currentNews = new news({
											   label : 'Course',
											   content : ''+ gotTeacherProfile.teachername.firstname +' has removed the course '+ coursename,
											   userid : req.user._id,
											   teacherid : gotTeacherProfile._id,
											   datetime : { type: Date, default: Date.now }
										});
										
										currentNews.save(function (err) {
											if (err) console.log(err)
											
											courses.find({teacherid: teacher}, function(err10, gotNewCourses){
												if(err10) return console.log(err10)
												
												res.send({status: 'success', msg: gotNewCourses});
												
											})
											
										})
									})
								
								})
								
								})
							})
						}
						else
						{
							res.redirect('/templates/mycourses')
						}
						
					})
				}
				else if(role == 'Owner')
				{
					  var filecourse = otherSchemas.filecourse
					  filecourse.find({courseid : courseid}, function(err4, gotFiles){
						  if (err4) return console.log(err4);
						  var gotFile;
						  for(gotFile in gotFiles)
						  {
							  var files = otherSchemas.files
							  files.find({_id : gotFiles[gotFile].fileid}, function(err5, gotFilesDetailed){
								  if (err5) return console.log(err5);
								
								dir = './courseuploads';
								dir += gotFilesDetailed[0].filephysicalpath;

								require('fs').unlink(dir, function (err) {
								  if (err) throw err;
								  console.log('successfully deleted '+ dir);
								  
								  files.remove({filephysicalpath : gotFilesDetailed[0].filephysicalpath}, function (err6){
									 if(err6) return console.log(err6);
									 console.log('Removed from file table')
									 filecourse.remove({courseid : courseid}, function (err7){
										if(err7) return console.log(err7);
										console.log('Removed from fileuser table')
									 })   
								  })
								  
								});
								
							  })
						  }
					  })
					
					var coursestudent = otherSchemas.coursestudent
					coursestudent.remove({courseid : req.params[0]}, function(err){
						if(err) return console.log(err);
						
						var announcements = otherSchemas.announcement
						
						announcements.remove({courseid : req.params[0]}, function(err4){
							if(err4) return console.log(err4);
						
							var grading = otherSchemas.grading
							grading.remove({courseid : req.params[0]}, function(err99){
								if(err99) return console.log(err99);
							
								courses.remove({_id : req.params[0]}, function(err){
									if(err) return console.log(err);
									
									var news = otherSchemas.news
						
									var currentNews = new news({
										   label : 'Course',
										   content : 'Super User has removed the course '+ coursename,
										   userid : req.user._id,
										   datetime : { type: Date, default: Date.now }
									});
									
									currentNews.save(function (err) {
										if (err) console.log(err)
										
										res.redirect('/superuser')
									})
											
								})
							})
						
						})
					})
				}
				else{
				   res.redirect('/logout')
			   }
				
			});
		})
      }
  });
  
  
  
  app.get('/dropcourse/*', function(req, res) {
    if (typeof req.user == 'undefined') res.redirect('/');
    else{
		Account.findById(req.user._id, function (err, gotUser) {
			if (err) return console.log(err);
			
			var role;
			if (gotUser.isTeacher == 'Yes') role = 'Teacher';
			if (gotUser.isStudent == 'Yes') role = 'Student';
			if (gotUser.isAdmin == 'Yes') role = 'Admin';
			if (gotUser.isParent == 'Yes') role = 'Parent';
			if (gotUser.isOwner == 'Yes') role = 'Owner';
			
			
			if(role == 'Student')
			{
				var studentProfile = profileSchemas.studentProfile
				
				studentProfile.findOne({user : gotUser._id}, function(err2, gotStudentProfile){
					if(err2) return console.log(err2)
					
										
					var coursestudent = otherSchemas.coursestudent
			
					coursestudent.remove({courseid : req.params[0], studentid : gotStudentProfile._id}).exec(function (err) {
						if (err) return console.log(err);
						
						var grading = otherSchemas.grading
						grading.remove({courseid : req.params[0], studentid : gotStudentProfile._id}, function(err99){
							if(err99) return console.log(err99);
						
							res.redirect('/templates/mycourses')
						})
					
					})
					
				})
			}
			else{
			   res.redirect('/logout')
		   }
		})
      }
  });
  
  
  app.get('/toggleregistration/*', function(req, res) {
    if (typeof req.user == 'undefined') res.redirect('/');
    else{
		Account.findById(req.user._id, function (err, gotUser) {
			if (err) return console.log(err);
			
			var role;
			if (gotUser.isTeacher == 'Yes') role = 'Teacher';
			if (gotUser.isStudent == 'Yes') role = 'Student';
			if (gotUser.isAdmin == 'Yes') role = 'Admin';
			if (gotUser.isParent == 'Yes') role = 'Parent';
			if (gotUser.isOwner == 'Yes') role = 'Owner';
			
			var courses = otherSchemas.course
			
			courses.findById(req.params[0]).populate('teacherid').exec(function (err, gotCourse) {
				if (err) return console.log(err);
				
				var coursename = gotCourse.coursename;
				
				var courseBelongsToTeacher = false;
				
				if(role == 'Teacher')
				{
					var teacherProfile = profileSchemas.teacherProfile
					
					teacherProfile.findOne({user : gotUser._id}, function(err2, gotTeacherProfile){
						if(err2) return console.log(err2)
						
						var teacher = gotTeacherProfile._id.toString().toUpperCase();
						var course = gotCourse.teacherid._id.toString().toUpperCase();
						
						if(teacher == course)
						  courseBelongsToTeacher = true;
						else
						  courseBelongsToTeacher = false;
						
						if(courseBelongsToTeacher)
						{
							if(gotCourse.registrationOpen == 'Yes')
							   gotCourse.registrationOpen = 'No';
							else
							   gotCourse.registrationOpen = 'Yes';
							   
							gotCourse.save(function(err12){
							   if(err12) return console.log(err12)
							   
							   res.redirect('/getdisplaycourse/'+ req.params[0])
							})
						}
						else
						{
							res.redirect('/templates/mycourses')
						}
						
					})
				}
				else{
				   res.redirect('/logout')
			   }
				
			});
		})
      }
  });

 app.get('/editcourse/*', function(req, res) {
    if (typeof req.user == 'undefined') res.redirect('/');
    else{
		Account.findById(req.user._id, function (err, gotUser) {
			if (err) return console.log(err);
			
			var role;
			if (gotUser.isTeacher == 'Yes') role = 'Teacher';
			if (gotUser.isStudent == 'Yes') role = 'Student';
			if (gotUser.isAdmin == 'Yes') role = 'Admin';
			if (gotUser.isParent == 'Yes') role = 'Parent';
			if (gotUser.isOwner == 'Yes') role = 'Owner';
			
			var courses = otherSchemas.course
			
			courses.findById(req.params[0]).populate('teacherid').exec(function (err, gotCourse) {
				if (err) return console.log(err);
				
				var courseBelongsToTeacher = false;
				
				if(role == 'Teacher')
				{
					var teacherProfile = profileSchemas.teacherProfile
					
					teacherProfile.findOne({user : gotUser._id}, function(err2, gotTeacherProfile){
						if(err2) return console.log(err2)
						
						var teacher = gotTeacherProfile._id.toString().toUpperCase();
						var course = gotCourse.teacherid._id.toString().toUpperCase();
						
						if(teacher == course)
						  courseBelongsToTeacher = true;
						else
						  courseBelongsToTeacher = false;
						
						if(courseBelongsToTeacher)
						{
							res.render('editcourse', { title: 'CloudKibo', user : req.user, role : role, page : '/searchcourses',
				            course : gotCourse, courseBelongsToTeacher : courseBelongsToTeacher, teacherProfile : gotTeacherProfile });
						}
						else
						{
							res.redirect('/templates/mycourses')
						}
						
					})
				}
				else if(role == 'Owner')
				{
					res.render('editcourse', { title: 'CloudKibo', user : req.user, role : role, page : '/searchcourses',
				    course : gotCourse, courseBelongsToTeacher : courseBelongsToTeacher});
				}
				else{
				   res.redirect('/logout')
			   }
				
			});
		})
      }
  });
  
  app.post('/editcourse', function(req, res) {
    if (typeof req.user == 'undefined') res.redirect('/');
    else{
		Account.findById(req.user._id, function (err, gotUser) {
			if (err) return console.log(err);
			
			var role;
			if (gotUser.isTeacher == 'Yes') role = 'Teacher';
			if (gotUser.isStudent == 'Yes') role = 'Student';
			if (gotUser.isAdmin == 'Yes') role = 'Admin';
			if (gotUser.isParent == 'Yes') role = 'Parent';
			if (gotUser.isOwner == 'Yes') role = 'Owner';
			
			var courses = otherSchemas.course
			
			courses.findById(req.body._id).populate('teacherid').exec(function (err, gotCourse) {
				if (err) return console.log(err);
				
				var coursename = gotCourse.coursename;
				
				var courseBelongsToTeacher = false;
				
				if(role == 'Teacher')
				{
					var teacherProfile = profileSchemas.teacherProfile
					
					teacherProfile.findOne({user : gotUser._id}, function(err2, gotTeacherProfile){
						if(err2) return console.log(err2)
						
						var teacher = gotTeacherProfile._id.toString().toUpperCase();
						var course = gotCourse.teacherid._id.toString().toUpperCase();
						
						if(teacher == course)
						  courseBelongsToTeacher = true;
						else
						  courseBelongsToTeacher = false;
						
						if(courseBelongsToTeacher)
						{
							
						    gotCourse.coursename = req.body.coursename;
						    gotCourse.coursedescription = req.body.coursedescription;
						    gotCourse.coursecode = req.body.coursecode;
						    gotCourse.prerequisite = req.body.prerequisite;
						    gotCourse.workload = req.body.workload;
						    gotCourse.startdate = req.body.startdate;
						    gotCourse.enddate = req.body.enddate;
						    gotCourse.days = req.body.days;
						    gotCourse.time = req.body.time;
						    gotCourse.timecountry = req.body.timecountry;
							   
							gotCourse.save(function(err12){
							   if(err12) return console.log(err12)
							   
							   res.redirect('/getdisplaycourse/'+ req.body._id)
							})
						}
						else
						{
							res.redirect('/templates/mycourses')
						}
						
					})
				}
				else{
				   res.redirect('/logout')
			   }
				
			});
		})
      }
  });
  
  app.get('/enrollcourse/*', function(req, res) {
    if (typeof req.user == 'undefined') res.redirect('/');
    else{
		Account.findById(req.user._id, function (err, gotUser) {
			if (err) return console.log(err);
			
			var role;
			if (gotUser.isTeacher == 'Yes') role = 'Teacher';
			if (gotUser.isStudent == 'Yes') role = 'Student';
			if (gotUser.isAdmin == 'Yes') role = 'Admin';
			if (gotUser.isParent == 'Yes') role = 'Parent';
			if (gotUser.isOwner == 'Yes') role = 'Owner';
			
			var courses = otherSchemas.course
			
			courses.findById(req.params[0], function (err, gotCourse) {
				if (err) return console.log(err);
				
				if(role == 'Student')
				{
					var studentProfile = profileSchemas.studentProfile
					
					studentProfile.findOne({user : gotUser._id}, function(err2, gotStudentProfile){
						if(err2) return console.log(err2)
						
						var coursestudent = otherSchemas.coursestudent
						
						var newCourseStudent = new coursestudent({
							studentid: gotStudentProfile._id,
						    courseid: gotCourse._id
					    });
					    
					    newCourseStudent.save(function(err3){
							if(err3) return console.log(err3)
							
							var grading = otherSchemas.grading
							
							var newGrading = new grading({
									   teacherid: gotCourse.teacherid,
									   courseid: gotCourse._id,
									   studentid: gotStudentProfile._id
							});
							
							newGrading.save(function (err) {
								if (err) console.log(err)
							})
							
							var news = otherSchemas.news
			
							var currentNews = new news({
								   label : 'Course',
								   content : ''+ gotStudentProfile.studentname.firstname +' has enrolled in the course '+ gotCourse.coursename,
								   userid : gotUser._id,
								   studentid : gotStudentProfile._id,
								   courseid : gotCourse._id,
								   datetime : { type: Date, default: Date.now }
							});
							
							currentNews.save(function (err) {
								if (err) console.log(err)
								
								res.redirect('/templates/mycourses')
							})
						})
					})
				}
				else{
				   res.redirect('/logout')
			   }
				
			});
		})
      }
  });
  
  app.post('/announce/*', function(req, res) {
    
    var course = otherSchemas.course
    
    course.findOne({_id : req.params[0]}, function(err4, gotCourse){
		if (err4) return console.log(err4)
		
		console.log(gotCourse.coursename)
		
		var teacherProfile = profileSchemas.teacherProfile
    
		teacherProfile.findOne({user : req.user._id}, function(err, gotTeacherProfile){
			
			var announcement = otherSchemas.announcement
		
			var newAnnouncement = new announcement({
				   label : 'TeacherAnnouncingInClass',
				   subject : req.body.subject,
				   content : req.body.announcement,
				   teacherid: gotTeacherProfile._id,
				   courseid: req.params[0]
			});
			   
			newAnnouncement.save(function (err) {
				if (err) console.log(err)
				
				var news = otherSchemas.news
					
				var currentNews = new news({
					   label : 'Annoucement',
					   content : ''+ gotTeacherProfile.teachername.firstname +' has made an announcement in class '+ gotCourse.coursename +'',
					   userid : req.user._id,
					   datetime : { type: Date, default: Date.now }
				});
				
				console.log(gotCourse.coursename)
				
				currentNews.save(function (err) {
					if (err) console.log(err)
					
					var announcements = otherSchemas.announcement
					announcements.find({teacherid : gotTeacherProfile._id, courseid : gotCourse._id}, function(err5, gotAnnouncements){
						if(err5) return console.log(err5)
						
						res.send({status:'success', msg: gotAnnouncements});
						
					})
					
				})
			})
		
		})
	})
	
  });
  
  
  app.post('/editannounce', function(req, res) {
	  
		var teacherProfile = profileSchemas.teacherProfile
    
		teacherProfile.findOne({user : req.user._id}, function(err, gotTeacherProfile){
			
			var announcement = otherSchemas.announcement
		
			announcement.findById(req.body._id, function (err, gotAnnouncement) {
				if (err) return console.log(err);
		  
				gotAnnouncement.subject = req.body.subject;
				gotAnnouncement.content = req.body.content;
				
				gotAnnouncement.save(function (err) {
					if (err) return console.log(err);
					
					res.send('Very Good Job');
					
				});
			  });
		})
  });
  
  app.post('/grade', function(req, res) {
	  
		var teacherProfile = profileSchemas.teacherProfile
    
		teacherProfile.findOne({user : req.user._id}, function(err, gotTeacherProfile){
			
			var grading = otherSchemas.grading
		
			grading.findOne({courseid : req.body.courseid, studentid : req.body.studentid}, function (err, gotGrading) {
				if (err) return console.log(err);
		  
				gotGrading.grade = req.body.grade;
				
				gotGrading.save(function (err) {
					if (err) return console.log(err);
					
					grading.find({courseid : req.body.courseid}).populate('courseid studentid').exec(function(err, gotGrading1){
						if (err) return console.log(err)  
						
						res.send(gotGrading1);
					})
					
				});
			  });
		})
  });
  
  app.post('/editStudentProfile', function(req, res) {
	  
		var studentProfile = profileSchemas.studentProfile
    
		studentProfile.findOne({user : req.user._id}, function(err, gotStudentProfile){
			if (err) return console.log('Error 1'+ err)
			
			gotStudentProfile.batch = req.body.batch;
			gotStudentProfile.degree = req.body.degree;
				
			gotStudentProfile.save(function (err2) {
				if (err2) return console.log('Error 2'+ err2);
				
				studentProfile.findOne({user : req.user._id}, function(err, gotStudentProfile1){
					res.send(gotStudentProfile1);
				})
				
				
			});
		})
  });  
  
  app.post('/editTeacherProfile', function(req, res) {
	  
		var teacherProfile = profileSchemas.teacherProfile
    
		teacherProfile.findOne({user : req.user._id}, function(err, gotTeacherProfile){
			if (err) return console.log('Error 1'+ err)
			
			gotTeacherProfile.undergradschool = req.body.undergradschool;
		    gotTeacherProfile.undergradyear = req.body.undergradyear;
		    gotTeacherProfile.undergradarea = req.body.undergradarea;
		    gotTeacherProfile.gradschool = req.body.gradschool;
		    gotTeacherProfile.gradyear = req.body.gradyear;
		    gotTeacherProfile.gradarea = req.body.gradarea;
		    gotTeacherProfile.phdschool = req.body.phdschool;
		    gotTeacherProfile.phdyear = req.body.phdyear;
		    gotTeacherProfile.phdarea = req.body.phdarea;
				
			gotTeacherProfile.save(function (err2) {
				if (err2) return console.log('Error 2'+ err2);
				
				teacherProfile.findOne({user : req.user._id}, function(err, gotTeacherProfile1){
					res.send(gotTeacherProfile1);
				})
				
				
			});
		})
  });
  /*
  app.post('/editAdminProfile', function(req, res) {
	  
		var adminProfile = profileSchemas.adminProfile
    
		adminProfile.findOne({user : req.user._id}, function(err, gotAdminProfile){
			if (err) return console.log('Error 1'+ err)
			
			gotAdminProfile.adminname.firstname = req.body.adminname.firstname;
			gotAdminProfile.adminname.lastname = req.body.adminname.lastname;
				
			gotAdminProfile.save(function (err2) {
				if (err2) return console.log('Error 2'+ err2);
				
				adminProfile.findOne({user : req.user._id}, function(err, gotAdminProfile1){
					res.send(gotAdminProfile1);
				})
				
				
			});
		})
  });  
  
  app.post('/editParentProfile', function(req, res) {
	  
		var parentProfile = profileSchemas.parentProfile
    
		parentProfile.findOne({user : req.user._id}, function(err, gotParentProfile){
			if (err) return console.log('Error 1'+ err)
			
			gotParentProfile.parentname.firstname = req.body.parentname.firstname;
			gotParentProfile.parentname.lastname = req.body.parentname.lastname;
				
			gotParentProfile.save(function (err2) {
				if (err2) return console.log('Error 2'+ err2);
				
				parentProfile.findOne({user : req.user._id}, function(err, gotParentProfile1){
					res.send(gotParentProfile1);
				})
				
				
			});
		})
  });  
  */
  
  app.get('/viewteacherprofile/*', function(req, res) {
   if (typeof req.user == 'undefined') res.redirect('/login');
   else
   {
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
						teacherProfile.findOne({_id : req.params[0]}).populate('user').exec(function(err2, gotViewTeacherProfile){
						if(err2) return console.log(err2)
						
						var courses = otherSchemas.course
					  
					    courses.find({teacherid : gotViewTeacherProfile._id}, function(err3, gotCourses){
						if(err3) return console.log(err3)
						
						var fileuser = otherSchemas.fileuser
						fileuser.find({userid : gotViewTeacherProfile.user._id}).populate('fileid').exec(function (err, gotFiles) {
						  if (err) return console.log(err)
					      
					      res.render('viewprofile', { title: 'CloudKibo', user : req.user, role : role, page : '/viewteacherprofile',
					      teacherProfile : gotTeacherProfile, viewedTeacherProfile : gotViewTeacherProfile,
					      teacherCourses : gotCourses, files : gotFiles });
					    
					    })
						
						})
						
						})
				    }
					else
					{
					  res.redirect('/teacherForm');
				    }
				})
			}
			else if(role == 'Student')
			{
				var studentProfile = profileSchemas.studentProfile
				
				studentProfile.findOne({user : gotUser._id}, function(err2, gotStudentProfile){
					if(err2) return console.log(err2)
					
					if(gotStudentProfile)
					{
						var teacherProfile = profileSchemas.teacherProfile
						
						teacherProfile.findOne({_id : req.params[0]}).populate('user').exec(function(err2, gotViewTeacherProfile){
						if(err2) return console.log(err2)
						
						var courses = otherSchemas.course
					  
					    courses.find({teacherid : gotViewTeacherProfile._id}, function(err3, gotCourses){
						if(err3) return console.log(err3)
						
						var fileuser = otherSchemas.fileuser
						fileuser.find({userid : gotViewTeacherProfile.user._id}).populate('fileid').exec(function (err, gotFiles) {
						  if (err) return console.log(err)
					      
					      res.render('viewprofile', { title: 'CloudKibo', user : req.user, role : role, page : '/viewteacherprofile',
					      studentProfile : gotStudentProfile, viewedTeacherProfile : gotViewTeacherProfile,
					      teacherCourses : gotCourses, files : gotFiles });
					    
					    })
					    
						})
						
						})
						
				    }
					else
					{
					  res.redirect('/studentForm');
				    }
				})
			}
			});
   }
  });
 
  app.get('/viewstudentprofile/*', function(req, res) {
   if (typeof req.user == 'undefined') res.redirect('/login');
   else
   {
	   Account.findById(req.user._id, function (err, gotUser) {
			if (err) return console.log(err);
			
			var role;
    		if (gotUser.isTeacher == 'Yes') role = 'Teacher';
			if (gotUser.isStudent == 'Yes') role = 'Student';
			if (gotUser.isAdmin == 'Yes') role = 'Admin';
			if (gotUser.isParent == 'Yes') role = 'Parent';
			
			//return res.redirect('/')
			
			if(role == 'Teacher')
			{
				var teacherProfile = profileSchemas.teacherProfile
				
				teacherProfile.findOne({user : gotUser._id}, function(err2, gotTeacherProfile){
					if(err2) return console.log(err2)
					
					if(gotTeacherProfile)
					{
						var studentProfile = profileSchemas.studentProfile
						
						studentProfile.findOne({_id : req.params[0]}).populate('user').exec(function(err2, gotViewStudentProfile){
						if(err2) return console.log(err2)
						
						var studentcourses = otherSchemas.coursestudent
					  
					    studentcourses.find({studentid : gotViewStudentProfile._id}).populate('courseid').exec(function(err3, gotCourses){
						if(err3) return console.log(err3)
						
						var fileuser = otherSchemas.fileuser
						fileuser.find({userid : gotViewStudentProfile.user._id}).populate('fileid').exec(function (err, gotFiles) {
						  if (err) return console.log(err)
						  
						  res.render('viewprofile', { title: 'CloudKibo', user : req.user, role : role, page : '/viewstudentprofile',
							teacherProfile : gotTeacherProfile, viewedStudentProfile : gotViewStudentProfile,
							studentCourses : gotCourses, files : gotFiles });
					    
					    })
					    
						})
						
						})
				    }
					else
					{
					  res.redirect('/studentForm');
				    }
				})
			}
			else if(role == 'Student')
			{
				var studentProfile = profileSchemas.studentProfile
				
				studentProfile.findOne({user : gotUser._id}, function(err2, gotStudentProfile){
					if(err2) return console.log(err2)
					
					if(gotStudentProfile)
					{
						var studentProfile = profileSchemas.studentProfile
						
						studentProfile.findOne({_id : req.params[0]}).populate('user').exec(function(err2, gotViewStudentProfile){
						if(err2) return console.log(err2)
						
						var studentcourses = otherSchemas.coursestudent
					  
					    studentcourses.find({studentid : gotViewStudentProfile._id}).populate('courseid').exec(function(err3, gotCourses){
						if(err3) return console.log(err3)
						
						var fileuser = otherSchemas.fileuser
						fileuser.find({userid : gotViewStudentProfile.user._id}).populate('fileid').exec(function (err, gotFiles) {
						  if (err) return console.log(err)
						  
						  res.render('viewprofile', { title: 'CloudKibo', user : req.user, role : role, page : '/viewstudentprofile',
							studentProfile : gotStudentProfile, viewedStudentProfile : gotViewStudentProfile,
							studentCourses : gotCourses, files : gotFiles });
					    
					    })
					    
						})
						
						})
						
				    }
					else
					{
					  res.redirect('/studentForm');
				    }
				})
			}
		  });
   }
  });
  
  app.post('/forgotPasswordRequest', function(req, res) {
	  if (typeof req.user != 'undefined') res.redirect('/');
      else{ 
		  
		  Account.findOne({username : req.body.username}, function(err, gotUser){
			  if(err) return console.log(err)
			  if(!gotUser) return res.send({status:'error', msg:'Sorry! No such username exists in our database.'})
			  
			  var tokenString = crypto.randomBytes(15).toString('hex');
					
				var passwordresettoken = tokenSchemas.passwordresettoken
				
				var newToken = new passwordresettoken({
							user : gotUser._id,
							token : tokenString
				});
				
				newToken.save(function(err){
					if (err) return console.log(err)
				})
				
				var sendgrid  = require('sendgrid')('cloudkibo', 'cl0udk1b0');
					
					var email     = new sendgrid.Email({
					  to:       gotUser.email,
					  from:     'support@cloudkibo.com',
					  subject:  'CloudKibo: Password Reset',
					  text:     'Password Reset'
					});
					
					email.setHtml('<h1>CloudKibo</h1><br><br>Use the following link to change your password <br><br> http://www.cloudkibo.com/resetpassword/'+ tokenString);
					
					sendgrid.send(email, function(err, json) {
					  if (err) { return console.error(err); }
					  
					  console.log(json);
					  
					  res.send({status:'success', msg:'Password Reset Link has been sent to your email address. Check your spam or junk folder if you have not received our email.'});
					  
					});
		  })

	  }
  });
  
  app.get("/verify/*", registrationroutes.verify);
  
  app.get("/resetpassword/*", function(req, res){
	  if (typeof req.user != 'undefined') res.redirect('/');
      else{ 
	    
	    var token = req.params[0];
		  
		var passwordresettoken = tokenSchemas.passwordresettoken
	
		passwordresettoken.findOne({token: token}, function (err, doc){
			if (err) return done(err);
			if(!doc) return res.render("passwordreset-failure");
			
			res.render('newpassword', { title: 'CloudKibo', token : token });
		
		})

	  }
  });
  
  app.post("/ChangePassword", function(req, res){
	  if (typeof req.user != 'undefined') res.redirect('/');
      else{ 
	    
	    var token = req.body.token;
		  
		var passwordresettoken = tokenSchemas.passwordresettoken
	
		passwordresettoken.findOne({token: token}, function (err, doc){
			if (err) return done(err);
			if(!doc) return res.render("passwordreset-failure");
			
			Account.findOne({_id: doc.user}, function (err, user) {
				if (err) return done(err);
				if (!user) return res.render("passwordreset-failure");
				
				Account.resetpassword(user, req.body.password, function(err, gotUser){
				   console.log(gotUser)
				   res.send('Password Successfully Changed. Please login with your new password')
			    })
			})
		
		})

	  }
  });
  
 /* app.get('*', function(req, res){ // Does not send static css files to html page, need to add public in html pages before
      res.render('404', { title: 'CloudKibo' }); // the url of css or javascript file
      * 
      * var uid = crypto.randomBytes(5).toString('hex');
      * 
  });*/
  
  /*
  app.get('/usersettings', function(req, res) {
   if (typeof req.user == 'undefined') res.redirect('/login');
   else
   {
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
					  res.render('usersettings', { title: 'CloudKibo', user : req.user, role : role, page : '/usersettings',
					  teacherProfile : gotTeacherProfile });
				    }
					else
					{
					  res.redirect('/teacherForm');
				    }
				})
			}
			else if(role == 'Student')
			{
				var studentProfile = profileSchemas.studentProfile
				
				studentProfile.findOne({user : gotUser._id}, function(err2, gotStudentProfile){
					if(err2) return console.log(err2)
					
					if(gotStudentProfile)
					{
						res.render('usersettings', { title: 'CloudKibo', user : gotUser, role : role, page : '/usersettings',
						studentProfile : gotStudentProfile });
				    }
					else
					{
					  res.redirect('/studentForm');
				    }
				})
			}
			else if(role == 'Admin')
			{
				var adminProfile = profileSchemas.adminProfile
				
				adminProfile.findOne({user : gotUser._id}, function(err2, gotAdminProfile){
					if(err2) return console.log(err2)
					
					if(gotAdminProfile)
					{
					  res.render('usersettings', { title: 'CloudKibo', user : gotUser, role : role, page : '/usersettings',
					  adminProfile : gotAdminProfile });
				    }
					else
					{
					  res.redirect('/adminForm');
				    }
				})
			}
			else if(role == 'Parent')
			{
				var parentProfile = profileSchemas.parentProfile
				
				parentProfile.findOne({user : gotUser._id}, function(err2, gotParentProfile){
					if(err2) return console.log(err2)
					
					if(gotParentProfile)
					{
					  res.render('usersettings', { title: 'CloudKibo', user : gotUser, role : role, page : '/usersettings',
					  parentProfile : gotParentProfile });
				    }
					else
					{
					  res.redirect('/parentForm');
				    }
				})
			}
		  });
   }
  });  */

};

