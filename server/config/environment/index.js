'use strict';

var path = require('path');
var _ = require('lodash');
var configuration = require('../../api/configuration/configuration.model');

function requiredProcessEnv(name) {
  if(!process.env[name]) {
    throw new Error('You must set the ' + name + ' environment variable');
  }
  return process.env[name];
}

// All configurations will extend these options
// ============================================
var all = {
  env: process.env.NODE_ENV,

  // Root path of server
  root: path.normalize(__dirname + '/../../..'),

  // Server port
  port: process.env.PORT || 3000,

  // Secure Server port
  secure_port: process.env.SECURE_PORT || 8443,

  // Should we populate the DB with sample data?
  seedDB: false,

  // Secret for session, you will want to change this and make it an environment variable
  secrets: {
    session: 'f83b0cd6ccb20142185616dsf54dsf4'
  },

  // List of user roles
  userRoles: ['guest', 'user', 'admin'],

  // MongoDB connection options
  mongo: {
    options: {
      db: {
        safe: true
      }
    }
  },

  facebook: {
    clientID:     process.env.FACEBOOK_ID || '456637644436523',
    clientSecret: process.env.FACEBOOK_SECRET || 'f46495b908b408bc8e4f5b259b18e952',
    callbackURL:  (process.env.DOMAIN || '') + 'https://api.cloudkibo.com/auth/facebook/callback'
  },

  twitter: {
    clientID:     process.env.TWITTER_ID || 'id',
    clientSecret: process.env.TWITTER_SECRET || 'secret',
    callbackURL:  (process.env.DOMAIN || '') + '/auth/twitter/callback'
  },

  google: {
    clientID:     process.env.GOOGLE_ID || '23885365928-lhtk02c2ljokrfl0d53cba9aid4o26rj.apps.googleusercontent.com',
    clientSecret: process.env.GOOGLE_SECRET || 'O1mECTnazsVvysBxRNmZ2hvG',
    callbackURL:  (process.env.DOMAIN || '') + 'https://api.cloudkibo.com/auth/google/callback',
    scope: 'https://www.google.com/m8/feeds https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile'
  },

  windowslive: {
    clientID:     process.env.GOOGLE_ID || '000000004C10C835',
    clientSecret: process.env.GOOGLE_SECRET || 'Nyyk7O4vZtn6ExbSJLamrtL5BtRadd96',
    callbackURL:  (process.env.DOMAIN || '') + 'https://api.cloudkibo.com/auth/windowslive/callback'
  }
};

(function(){
  configuration.findOne({}, function(err, result){
    // console.log(result);

    if(result){
      all.facebook.clientID = result.facebookid;
      all.facebook.clientSecret = result.facebooksecret;

      all.google.clientID = result.googleid;
      all.google.clientSecret = result.googlesecret;

      all.windowslive.clientID = result.windowsid;
      all.windowslive.clientSecret = result.windowssecret;
    }

    //console.log(all)
  })
})();

// Export the config object based on the NODE_ENV
// ==============================================
module.exports = _.merge(
  all,
  require('./' + process.env.NODE_ENV + '.js') || {});
