/**
 * CloudKibo Official APP
 * 
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var course = new Schema({
		   coursename : String,
		   coursedescription : String,
		   coursecode : String,
		   prerequisite : String,
		   workload : String,
		   startdate : Date,
		   enddate : Date,
		   days : String,
		   time : String,
		   timecountry: String,
		   registrationOpen : String,
		   teacherid: {type: Schema.ObjectId, ref: 'teacher'}
});

var coursestudent = new Schema({
		   studentid: {type: Schema.ObjectId, ref: 'student'},
		   courseid: {type: Schema.ObjectId, ref: 'course'},
		   enrollmentdate: {type: Date, default: Date.now }
});

var files =  new Schema({
		   filename : String,
		   filephysicalpath : String,
		   isprivate : String,
		   size : Number,
		   uploaddate : {type: Date, default: Date.now }
});

var fileuser = new Schema({
		   userid: {type: Schema.ObjectId, ref: 'Account'},
		   fileid: {type: Schema.ObjectId, ref: 'file'}
});

var filecourse = new Schema({
		   fileid: {type: Schema.ObjectId, ref: 'file'},
		   courseid: {type: Schema.ObjectId, ref: 'course'}
});

var news = new Schema({
		   label : String,
		   content : String,
		   userid : {type: Schema.ObjectId, ref: 'Account'},
		   fileid: {type: Schema.ObjectId, ref: 'file'},
		   teacherid: {type: Schema.ObjectId, ref: 'teacher'},
		   studentid: {type: Schema.ObjectId, ref: 'student'},
		   adminid: {type: Schema.ObjectId, ref: 'admin'},
		   parentid: {type: Schema.ObjectId, ref: 'parent'},
		   courseid: {type: Schema.ObjectId, ref: 'course'},
		   datetime : {type: Date, default: Date.now }
});

var announcement = new Schema({
		   label : String,
		   subject : String,
		   content : String,
		   teacherid: {type: Schema.ObjectId, ref: 'teacher'},
		   courseid: {type: Schema.ObjectId, ref: 'course'},
		   datetime : {type: Date, default: Date.now }
});

var rating = new Schema({
		   rate : Number,
		   teacherid: {type: Schema.ObjectId, ref: 'teacher'},
		   courseid: {type: Schema.ObjectId, ref: 'course'},
		   studentid: {type: Schema.ObjectId, ref: 'student'},
		   datetime : {type: Date, default: Date.now }
});

var grading = new Schema({
		   grade : {type: String, default: 'N/A' },
		   teacherid: {type: Schema.ObjectId, ref: 'teacher'},
		   courseid: {type: Schema.ObjectId, ref: 'course'},
		   studentid: {type: Schema.ObjectId, ref: 'student'},
		   datetime : {type: Date, default: Date.now }
});

var feedback = new Schema({
		   userid : {type: Schema.ObjectId, ref: 'Account'},
		   audio : Number,
		   video : Number,
		   screen : Number,
		   filetransfer : Number,
		   comment : String,
		   datetime : {type: Date, default: Date.now }
});

var callrecord = new Schema({
		   caller : String,
		   callee : String,
		   starttime : {type: Date, default: Date.now },
		   endtime : {type: Date, default: Date.now }
});

var meetingrecord = new Schema({
		   creator : String,
		   roomname : String,
		   members : [String],
		   starttime : {type: Date, default: Date.now },
		   endtime : {type: Date, default: Date.now }
});

exports.course = mongoose.model('course', course);
exports.coursestudent = mongoose.model('coursestudent', coursestudent);
exports.files = mongoose.model('file', files);
exports.fileuser = mongoose.model('fileuser', fileuser);
exports.filecourse = mongoose.model('filecourse', filecourse);
exports.news = mongoose.model('news', news);
exports.announcement = mongoose.model('announcement', announcement);
exports.rating = mongoose.model('rating', rating);
exports.grading = mongoose.model('grading', grading);
exports.feedback = mongoose.model('feedback', feedback);
exports.callrecord = mongoose.model('callrecord', callrecord);
exports.meetingrecord = mongoose.model('meetingrecord', meetingrecord);
