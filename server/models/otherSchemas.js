/**
 * CloudKibo Official APP
 * 
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

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

var contactslist = new Schema({
			userid : {type: Schema.ObjectId, ref: 'Account'},
			contactid : {type: Schema.ObjectId, ref: 'Account'},
			unreadMessage : {type: Boolean, default: false },
			detailsshared: {type : String, default :'No'}
});

var userchat = new Schema({
			to : String,
			from : String,
			fromFullName : String,
			msg : String,
			date : {type: Date, default: Date.now }
});


exports.news = mongoose.model('news', news);
exports.feedback = mongoose.model('feedback', feedback);
exports.callrecord = mongoose.model('callrecord', callrecord);
exports.meetingrecord = mongoose.model('meetingrecord', meetingrecord);
exports.contactslist = mongoose.model('contactslist', contactslist);
exports.userchat = mongoose.model('userchat', userchat);
