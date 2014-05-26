var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var WindowsLiveStrategy = require('passport-windowslive').Strategy;
var profileSchemas = require('./../models/profileSchemas');
var otherSchemas = require('./../models/otherSchemas');
var Users = require('./account');


exports.windows = new WindowsLiveStrategy({
    clientID: "000000004411C93F",
    clientSecret: "4A00-ICRyIBDOYh640SXd5zAyDndjhIn",
    callbackURL: "http://www.synaps3webrtc.com/auth/windowslive/callback"
  },
  function(accessToken, refreshToken, profile, done) {
	  
    Users.findOne({windowsId : profile.id}, function(err, oldUser){
        if(oldUser){
            done(null,oldUser);
        }else{
			
			 Users.count({email : profile.emails[0].value}, function(err, gotCount){
					if (err) return console.log(err)
					
					//Need to do testing
					if(gotCount>0)//0
					{
						Users.findOne({email : profile.emails[0].value}, function(err, oldAccount){
							done(null, oldAccount);
						})
					}
					else
					{
						var newUser = new Users({
						   windowsId : profile.id,
						   firstname : profile.name.givenName,
						   lastname : profile.name.familyName,
						   email : profile.emails[0].value,
						   phone : profile._json.phones.personal,
						   windows_photo: profile.photos[0].value
						}).save(function(err,newUser){
							if(err) throw err;
							
							var news = otherSchemas.news
						
							var currentNews = new news({
								   label : 'Registration',
								   content : ''+ newUser.firstname +' '+ newUser.lastname +' has made an account on CloudKibo with windows live.',
								   datetime : { type: Date, default: Date.now }
							});
							
							currentNews.save(function (err) {
								if (err) console.log(err)
							})
							
							done(null, newUser);
						});
					}
					
			 })
        }
    });
  }
);

exports.facebook = new FacebookStrategy({
    clientID: "	1499615666918690",
    clientSecret: "4e5c71c53b3880de8fe9cf2450416cda",
    callbackURL: "http://www.synaps3webrtc.com/auth/facebook/callback"
  },
  function(accessToken, refreshToken, profile, done) {
	
    Users.findOne({fbId : profile.id}, function(err, oldUser){
        if(oldUser){
            done(null,oldUser);
        }else{
			
			Users.count({email : profile.emails[0].value}, function(err, gotCount){
					if (err) return console.log(err)
					
					//Need to do testing
					if(gotCount>0)//0
					{
						Users.findOne({email : profile.emails[0].value}, function(err, oldAccount){
							done(null, oldAccount);
						})
					}
					else
					{
						var newUser = new Users({
						   fbId : profile.id ,
						   email : profile.emails[0].value,
						   firstname : profile.name.givenName,
						   lastname : profile.name.familyName,
						   fb_photo: 'https://graph.facebook.com/'+ profile.id +'/picture?width=140&height=110'
						}).save(function(err,newUser){
							if(err) throw err;
							
							var news = otherSchemas.news
						
							var currentNews = new news({
								   label : 'Registration',
								   content : ''+ newUser.firstname +' '+ newUser.lastname +' has made an account on CloudKibo with Facebook.',
								   datetime : { type: Date, default: Date.now }
							});
							
							currentNews.save(function (err) {
								if (err) console.log(err)
							})
							
							done(null, newUser);
						});
					}
			})
            
        }
    });
  }
)

exports.google = new GoogleStrategy({
    clientID: '224432070325-gr4tterht51j1rhueo375n1hg4vr592e.apps.googleusercontent.com',
    clientSecret: 'bvRrg4eG-aFkDbjp6gIU067K',
    callbackURL: "http://www.synaps3webrtc.com/auth/google/callback",
    scope: 'https://www.google.com/m8/feeds https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile'
  },
  function(accessToken, refreshToken, profile, done) {
	 
     Users.findOne({googleId : profile.id}, function(err, oldUser){
        if(oldUser){
            done(null,oldUser);
        }else{
			
			Users.count({email : profile.emails[0].value}, function(err, gotCount){
					if (err) return console.log(err)
					
					//Need to do testing
					if(gotCount>0)//0
					{
						Users.findOne({email : profile.emails[0].value}, function(err, oldAccount){
							done(null, oldAccount);
						})
					}
					else
					{
						var newUser = new Users({
						   googleId : profile.id ,
						   email : profile.emails[0].value,
						   firstname : profile.name.givenName,
						   lastname : profile.name.familyName,
						   google_photo: profile._json.picture
						}).save(function(err,newUser){
							if(err) throw err;
							
							var news = otherSchemas.news
						
							var currentNews = new news({
								   label : 'Registration',
								   content : ''+ newUser.firstname +' '+ newUser.lastname +' has made an account on CloudKibo with Google.',
								   datetime : { type: Date, default: Date.now }
							});
							
							currentNews.save(function (err) {
								if (err) console.log(err)
							})
							
							done(null, newUser);
						});
					}
			})
			
            
        }
    });
  }
)
