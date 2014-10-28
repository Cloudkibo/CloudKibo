/**
 * CloudKibo Official APP
 * 
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
//var passportLocalMongoose = require('passport-local-mongoose');

var Account = new Schema({
		   username : String,
		   firstname : String,
		   lastname : String,
		   email : { type : String , lowercase : true},
		   phone : String, 
		   country : String,
		   city : String,
		   state : String,
		   gender : String,
		   fbId : String,
		   fb_photo: String,
		   googleId : String,
		   google_photo: String,
		   windowsId : String,
		   windows_photo: String,
		   isTeacher : String,
		   isStudent : String,
		   isAdmin : String,
		   isParent : String,
		   isOwner : String,
		   picture: String,
		   accountVerified : {type: String, default: 'No' },
		   date  :  { type: Date, default: Date.now },
		   initialTesting : String,
		   status : {type: String, default: 'I am on CloudKibo' }
		   });

//Account.plugin(passportLocalMongoose);

module.exports = mongoose.model('Account', Account);


