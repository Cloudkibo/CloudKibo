var passport = require('passport');
var mongoose = require('mongoose');
var Account = require('./../models/account');
var fs = require('fs');
var crypto = require("crypto");
var profileSchemas = require('./../models/profileSchemas');
var otherSchemas = require('./../models/otherSchemas');

exports.displayuser = function(req, res) {
    if (typeof req.user == 'undefined') res.redirect('/');
    else{
		
		Account.findById(req.user._id, function (err, gotUser) {
				if (err) return console.log(err);
				
				if (gotUser.isOwner == 'Yes')
				{
					var role = 'Super User';
					
					Account.findOne({_id : req.params[0]}, function (err, gotAccount) {
					  if (err) return console.log(err);
					  
					  var studentProfile = profileSchemas.studentProfile
					  
					  studentProfile.findOne({user : req.params[0]}, function(err1, gotStudentProfile){
						if (err1) return console.log(err1);
						
						var teacherProfile = profileSchemas.teacherProfile
						
						teacherProfile.findOne({user : req.params[0]}, function(err2, gotTeacherProfile){
						  if (err2) return console.log(err2);
						  
						  var adminProfile = profileSchemas.adminProfile
						  
						  adminProfile.findOne({user : req.params[0]}, function(err3, gotAdminProfile){
						    if(err3) return console.log(err3)
						    
						    var parentProfile = profileSchemas.parentProfile
						    
						    parentProfile.findOne({user : req.params[0]}, function(err4, gotParentProfile){
							    if(err4) return console.log(err4)
								
								var fileuser = otherSchemas.fileuser
								fileuser.find({userid : req.params[0]}).populate('fileid').exec(function (err5, gotFiles) {
								  
								if (err5) return console.log(err5)
								
								if(gotTeacherProfile){
									
								var courses = otherSchemas.course
								courses.find({teacherid : gotTeacherProfile._id}, function (err6, gotCourses) {
							    
							    if (err6) return console.log(err6);
									  
								if(gotStudentProfile)
								{
								
								var coursestudent = otherSchemas.coursestudent
								coursestudent.find({studentid : gotStudentProfile._id}).populate('courseid').exec(function(err7, gotCoursesSt){
								
								if (err7) return console.log(err7)
								
								res.render('displayuser', { title: 'CloudKibo', user : req.user, role : role, account : gotAccount,
						        studentProfile : gotStudentProfile, teacherProfile : gotTeacherProfile,
						        adminProfile : gotAdminProfile, parentProfile : gotParentProfile, files : gotFiles,
						        coursesCreated : gotCourses, coursesEnrolled : gotCoursesSt });
						        
								})
								}
								else
								{
								res.render('displayuser', { title: 'CloudKibo', user : req.user, role : role, account : gotAccount,
						        studentProfile : gotStudentProfile, teacherProfile : gotTeacherProfile,
						        adminProfile : gotAdminProfile, parentProfile : gotParentProfile, files : gotFiles,
						        coursesCreated : gotCourses });
								}	
								});
							    }
							    else
							    {
								if(gotStudentProfile)
								{
								
								var coursestudent = otherSchemas.coursestudent
								coursestudent.find({studentid : gotStudentProfile._id}).populate('courseid').exec(function(err7, gotCoursesSt){
								
								if (err7) return console.log(err7)
								
								res.render('displayuser', { title: 'CloudKibo', user : req.user, role : role, account : gotAccount,
						        studentProfile : gotStudentProfile, teacherProfile : gotTeacherProfile,
						        adminProfile : gotAdminProfile, parentProfile : gotParentProfile, files : gotFiles,
						        coursesEnrolled : gotCoursesSt });
								})
								
								}
								else
								{
								res.render('displayuser', { title: 'CloudKibo', user : req.user, role : role, account : gotAccount,
						        studentProfile : gotStudentProfile, teacherProfile : gotTeacherProfile,
						        adminProfile : gotAdminProfile, parentProfile : gotParentProfile, files : gotFiles });
								}
								}
								})
								
						    })
						  
						  })
						
						})
						  
					  })
					
				    })
				}
				else
				{
					res.redirect('/logout');
				}
			})
       }
  };

exports.superuser = function(req, res) {
	  if (typeof req.user == 'undefined') res.redirect('/login');
      else{
		  
			   Account.findById(req.user._id, function (err, gotUser) {
				if (err) return console.log(err);
				
				if (gotUser.isOwner == 'Yes')
				{
					  var role = 'Super User';
					
					  var dir = __dirname + "/../configuration";
					  var file = dir + '/config.json';
					  
					  fs.readFile(file, 'utf8', function (err, configdata) {
					  if (err) {
						console.log('Error: ' + err);
						return;
					  }

					  configdata = JSON.parse(configdata);
					  
					  Account.find({isOwner : null}, function (err, gotAccounts) {
					  if (err) return console.log(err);
					  
					  Account.count({isTeacher : 'Yes'}, function (err3, teacherCount ){
						if (err3) return console.log(err3);
						Account.count({isStudent : 'Yes'}, function (err4, studentCount ){
						  if (err4) return console.log(err4);
						  Account.count({isAdmin : 'Yes'}, function (err5, adminCount ){
							if (err5) return console.log(err5);
							Account.count({isParent : 'Yes'}, function (err6, parentCount ){
							   if (err6) return console.log(err6);
							   
							   var courses = otherSchemas.course
			
								courses.find().populate('teacherid').exec(function (err, gotCourses) {
									if (err) return console.log(err);
									
									var news = otherSchemas.news
									
									news.find().sort({datetime : -1}).exec(function(err12, gotNews){
										if (err12) return console.log(err12);
										
										var fileuser = otherSchemas.fileuser
										
										fileuser.find().populate('userid fileid').exec(function(err13, gotFileUser){
											if(err13) return console.log(err13);
											
											var filecourse = otherSchemas.filecourse
										
											filecourse.find().populate('courseid fileid').exec(function(err13, gotFileCourse){
												if(err13) return console.log(err13);
												
											var feedback = otherSchemas.feedback
										
											feedback.find().populate('userid').exec(function(err13, gotFeedBack){
												if(err13) return console.log(err13);
												
											var callrecord = otherSchemas.callrecord
										
											callrecord.find().exec(function(err14, gotCallRecord){
												if(err13) return console.log(err14);
												
												res.render('superuser', { title: 'CloudKibo', user : req.user, role : role,
											accounts : gotAccounts,	teacherCount : teacherCount, studentCount: studentCount,
											news : gotNews,	adminCount: adminCount, parentCount : parentCount, courses : gotCourses,
											configData : configdata, fileusers : gotFileUser, filecourses : gotFileCourse,
											feedback : gotFeedBack, callrecord: gotCallRecord });
												
											})
											
											})
											
											})
											
										})
										
									})
								});
							})
						  })
						})  
					  
					  })					
				    })

					});
				}
				else
				{
					res.redirect('/logout');
				}
				
			  });		 		 
	      }
  };
  
exports.removeuser = function(req, res) {
    if (typeof req.user == 'undefined') res.redirect('/');
    else{
		
		Account.findById(req.user._id, function (err, gotUser) {
				if (err) return console.log(err);
				
				if (gotUser.isOwner == 'Yes')
				{
					var role = 'Super User';
					Account.findById(req.params[0], function (err, gotAccount) {
					  if (err) return console.log(err);
					  
						dir = './userpictures';
						dir += gotAccount.picture;
						
						if(gotAccount.picture)
						{
							require('fs').unlink(dir, function (err) {
								if (err) throw err;
								console.log('successfully deleted '+ dir);
							})  
						}
					  
					  var gotUserID = gotAccount._id;
					  var gotUserName = gotAccount.username;
					  
					  var studentProfile = profileSchemas.studentProfile
					  var teacherProfile = profileSchemas.teacherProfile
					  var adminProfile = profileSchemas.adminProfile
					  var parentProfile = profileSchemas.parentProfile
					  
					  if(gotAccount.isTeacher == 'Yes'){
						  teacherProfile.findOne({user: gotUserID}, function(err, gotTeacherProfile){
							  if(err) return console.log(err)
							  
							  if(gotTeacherProfile != null)
							  {
								  var courses = otherSchemas.course
								  var gotTeacher
								  courses.find({teacherid : gotTeacherProfile._id}, function(err4, gotCourses){
									  if (err4) return console.log(err4);
									  
									  var courseArray = new Array()
									  var i = 0;
									  for(gotCourse in gotCourses)
									  {
										  courseArray[i] = gotCourses[gotCourse]._id;
										  i++;
										  
										  var filecourse = otherSchemas.filecourse
										  filecourse.find({courseid : gotCourses[gotCourse]._id}, function(err4, gotFiles){
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
														 filecourse.remove({courseid : gotCourses[gotCourse]._id}, function (err7){
															if(err7) return console.log(err7);
															console.log('Removed from filecourse table')
														 })   
													  })
													  
													});
													
												  })
											  }
										  })
									  }
									  
									  var coursestudent = otherSchemas.coursestudent
									  coursestudent.remove({courseid : {$in : courseArray}}, function(err5){
										if (err5) return console.log(err5);
										
										var grading = otherSchemas.grading
										grading.remove({courseid : {$in : courseArray}}, function(err99){
											if(err99) return console.log(err99);

											var announcements = otherSchemas.announcement
											  
											  announcements.remove({courseid : {$in : courseArray}}, function(err11){
												if (err11) return console.log(err11) 
											  
												courses.remove({_id : {$in : courseArray}}, function(err11){
												if (err11) return console.log(err11) 
												})
											  
											  
											  })

										})										  
									})								  
							      })
						      }
					     })
					 } 
					  else if(gotAccount.isStudent == 'Yes'){
					      studentProfile.findOne({user: gotUserID}, function(err, gotStudentProfile){
							  if(err) return console.log(err)
							  if(gotStudentProfile != null)
							  {
								  var coursestudent = otherSchemas.coursestudent
								  coursestudent.remove({studentid : gotStudentProfile._id}, function(err){})
								  var grading = otherSchemas.grading
								  grading.remove({studentid : gotStudentProfile._id}, function(err99){})
							  }
						  })
					  }
					  
					  studentProfile.remove({user : gotUserID}, function(err){
						  if (err) return console.log(err);
					  teacherProfile.remove({user : gotUserID}, function(err1){
						  if (err1) return console.log(err1);
					  adminProfile.remove({user : gotUserID}, function(err2){
						  if (err2) return console.log(err2);
					  parentProfile.remove({user : gotUserID}, function(err3){
						  if (err3) return console.log(err3);
						  
						  var fileuser = otherSchemas.fileuser
						  fileuser.find({userid : gotUserID}, function(err4, gotFiles){
							  if (err4) return console.log(err4);
							  var gotFile;
							  for(gotFile in gotFiles)
							  {
								  var files = otherSchemas.files
								  files.find({_id : gotFiles[gotFile].fileid}, function(err5, gotFilesDetailed){
									  if (err5) return console.log(err5);
									
									dir = './useruploads';
									dir += gotFilesDetailed[0].filephysicalpath;

									require('fs').unlink(dir, function (err) {
									  if (err) throw err;
									  console.log('successfully deleted '+ dir);
									  
									  files.remove({filephysicalpath : gotFilesDetailed[0].filephysicalpath}, function (err6){
									     if(err6) return console.log(err6);
									     console.log('Removed from file table')
									     fileuser.remove({userid : gotUserID}, function (err7){
											if(err7) return console.log(err7);
											console.log('Removed from fileuser table')
										 })   
									  })
									  
									});
									
								  })
							  }
							  
								var news = otherSchemas.news
			
								var currentNews = new news({
									   label : 'Registration',
									   content : 'Account of '+ gotUserName +' has been removed by Super User',
									   datetime : { type: Date, default: Date.now }
								}); 
								
								currentNews.save(function (err) {
									if (err) console.log(err)
									
									Account.remove({_id : gotUserID}, function (err8) {
										  if(err8) return console.log(err8)
										  console.log('removed the account info finally')
										  res.redirect('/superuser');   
									  })
								})
						  })
					  })
					  })
					  })
					  })
				    })
				}
				else
				{
					res.redirect('/logout');
				}
		})
     }
  };
  
exports.adminregisterPostReq = function(req, res) {
	  //console.log(req.body.role)
	  var accountData;

	  accountData = new Account({
		   username : req.body.username, 
		   isOwner : 'Yes'
	  })
		  
      Account.register(accountData, req.body.password, function(err, account) {
          if (err) {
			  console.log(err)
            return res.send("Username already exists!", 200);
          }
  
          passport.authenticate('local')(req, res, function () {
			var role = 'Super User';
			res.render('superuser', { title: 'CloudKibo', user : req.user, role : role });
          });
      });
  };
  
exports.configPost = function(req, res) {
	
    if (typeof req.user == 'undefined') res.redirect('/');
    else{
		
		Account.findById(req.user._id, function (err, gotUser) {
				if (err) return console.log(err);
				
				if (gotUser.isOwner == 'Yes')
				{
					var role = 'Super User';
					
					var myData = {
						"fileUploadSizeLimit": req.body.fileUploadSizeLimit,
						"numberOfUsersPerMeeting": req.body.numberOfUsersPerMeeting,
						"totalSizeForUser": req.body.totalSizeForUser,
						"totalSizeForClass": req.body.totalSizeForClass
					}
					
					var dir = __dirname + "/../configuration";
				  
				    var file = dir + '/config.json';
				  
					fs.writeFile(file, JSON.stringify(myData, null, 4), function(err) {
						if(err) {
						  console.log(err);
						} else {
						  console.log("JSON saved to ");
						  res.redirect('/superuser')
						}
					}); 
				}
				else
				{
					res.redirect('/logout');
				}
		})
     }
  };

exports.viewschema = function(req, res) {
	  if (typeof req.user == 'undefined') res.redirect('/login');
      else{
		  
			   Account.findById(req.user._id, function (err, gotUser) {
				if (err) return console.log(err);
				
				if (gotUser.isOwner == 'Yes')
				{
					  var role = 'Super User';
					
					  if(req.params[0] == 'Accounts')
					  {
						  Account.find({}, function(err, data){
							  
								res.render('viewschema', { title: 'CloudKibo', user : req.user, role : role, schema : 'Accounts',
								data : data });
						  })
					  }
					  else if(req.params[0] == 'Students')
					  {
						  var studentProfile = profileSchemas.studentProfile
						  
						  studentProfile.find({}, function(err, data){
							  
								res.render('viewschema', { title: 'CloudKibo', user : req.user, role : role, schema : 'Students',
								data : data });
						  })
					  }
					  else if(req.params[0] == 'Teachers')
					  {
						  var teacherProfile = profileSchemas.teacherProfile
						  
						  teacherProfile.find({}, function(err, data){
							  
								res.render('viewschema', { title: 'CloudKibo', user : req.user, role : role, schema : 'Teachers',
								data : data });
						  })
					  }
					  else if(req.params[0] == 'Admins')
					  {
						  var adminProfile = profileSchemas.adminProfile
						  
						  adminProfile.find({}, function(err, data){
							  
								res.render('viewschema', { title: 'CloudKibo', user : req.user, role : role, schema : 'Admins',
								data : data });
						  })
					  }
					  else if(req.params[0] == 'Parents')
					  {
						  var parentProfile = profileSchemas.parentProfile
						  
						  parentProfile.find({}, function(err, data){
							  
								res.render('viewschema', { title: 'CloudKibo', user : req.user, role : role, schema : 'Parents',
								data : data });
						  })
					  }
					  else if(req.params[0] == 'Courses')
					  {
						  var course = otherSchemas.course
						  
						  course.find({}, function(err, data){
							  
								res.render('viewschema', { title: 'CloudKibo', user : req.user, role : role, schema : 'Courses',
								data : data });
						  })
					  }
					  else if(req.params[0] == 'CourseStudents')
					  {
						  var coursestudent = otherSchemas.coursestudent
						  
						  coursestudent.find({}, function(err, data){
							  
								res.render('viewschema', { title: 'CloudKibo', user : req.user, role : role, schema : 'CourseStudents',
								data : data });
						  })
					  }
					  else if(req.params[0] == 'Files')
					  {
						  var files = otherSchemas.files
						  
						  files.find({}, function(err, data){
							  
								res.render('viewschema', { title: 'CloudKibo', user : req.user, role : role, schema : 'Files',
								data : data });
						  })
					  }
					  else if(req.params[0] == 'FileUsers')
					  {
						  var fileuser = otherSchemas.fileuser
						  
						  fileuser.find({}, function(err, data){
							  
								res.render('viewschema', { title: 'CloudKibo', user : req.user, role : role, schema : 'FileUsers',
								data : data });
						  })
					  }
					  else if(req.params[0] == 'FileCourses')
					  {
						  var filecourse = otherSchemas.filecourse
						  
						  filecourse.find({}, function(err, data){
							  
								res.render('viewschema', { title: 'CloudKibo', user : req.user, role : role, schema : 'FileCourses',
								data : data });
						  })
					  }
					  else if(req.params[0] == 'News')
					  {
						  var news = otherSchemas.news
						  
						  news.find({}, function(err, data){
							  
								res.render('viewschema', { title: 'CloudKibo', user : req.user, role : role, schema : 'News',
								data : data });
						  })
					  }
					  else if(req.params[0] == 'Announcements')
					  {
						  var announcement = otherSchemas.announcement
						  
						  announcement.find({}, function(err, data){
							  
								res.render('viewschema', { title: 'CloudKibo', user : req.user, role : role, schema : 'Announcements',
								data : data });
						  })
					  }
					  else
					  {
						  res.redirect('/');
					  }
				}
				else
				{
					res.redirect('/logout');
				}
				
			  });		 		 
	      }
  };
  
