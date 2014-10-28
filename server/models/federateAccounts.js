var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var WindowsLiveStrategy = require('passport-windowslive').Strategy;
var otherSchemas = require('./../models/otherSchemas');
var Users = require('./account');

exports.windows = new WindowsLiveStrategy({
    clientID: "000000004C10C835",
    clientSecret: "Nyyk7O4vZtn6ExbSJLamrtL5BtRadd96",
    callbackURL: "http://www.cloudkibo.com/auth/windowslive/callback"
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
    clientID: "	456637644436523",
    clientSecret: "f46495b908b408bc8e4f5b259b18e952",
    callbackURL: "http://www.cloudkibo.com/auth/facebook/callback"
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
    clientID: '23885365928-lhtk02c2ljokrfl0d53cba9aid4o26rj.apps.googleusercontent.com',
    clientSecret: 'O1mECTnazsVvysBxRNmZ2hvG',
    callbackURL: "http://www.cloudkibo.com/auth/google/callback",
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
