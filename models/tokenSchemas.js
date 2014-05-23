

var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var verificationTokenSchema = new Schema({
			user : {type: Schema.ObjectId, required: true, ref: 'Account'},
			token : {type: String, required: true},
			createdAt : {type: Date, required: true, default: Date.now, expires: '4h'}
});

var passwordResetTokenSchema = new Schema({
			user : {type: Schema.ObjectId, required: true, ref: 'Account'},
			token : {type: String, required: true},
			createdAt : {type: Date, required: true, default: Date.now, expires: '4h'}
});

exports.verificationtoken = mongoose.model('verificationtoken', verificationTokenSchema);
exports.passwordresettoken = mongoose.model('passwordresettoken', passwordResetTokenSchema);
