/**
 * CloudKibo Official APP
 * 
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var teacher = new Schema({
		   user: {type: Schema.ObjectId, ref: 'Account'},
		   teachername : {
							firstname : String,
							lastname : String,
						 },
		   undergradschool : String,
		   undergradyear : String,
		   undergradarea : String,
		   gradschool : String,
		   gradyear : String,
		   gradarea : String,
		   phdschool : String,
		   phdyear : String,
		   phdarea : String
});
		   
var student = new Schema({
		   user: {type: Schema.ObjectId, ref: 'Account'},
		   studentname : {
							firstname : String,
							lastname : String,
						 },
		   degree : String,
		   batch : String,
		   parent : {type: Schema.ObjectId, ref: 'parents'}
		   
});

var admin = new Schema({
		   user: {type: Schema.ObjectId, ref: 'Account'},
		   adminname : {
							firstname : String,
							lastname : String,
					   }
		   
});

var parent = new Schema({
		   user: {type: Schema.ObjectId, ref: 'Account'},
		   parentname : {
							firstname : String,
							lastname : String,
					    },
		   parentrole : String
		   
});

exports.teacherProfile = mongoose.model('teacher', teacher);

exports.studentProfile = mongoose.model('student', student);

exports.adminProfile = mongoose.model('admin', admin);

exports.parentProfile = mongoose.model('parent', parent);
