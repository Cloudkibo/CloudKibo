'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var crypto = require('crypto');
var authTypes = ['github', 'twitter', 'facebook', 'google', 'windowslive'];

var UserSchema = new Schema({
  id : String,
  username : String,
  firstname : String,
  lastname : String,
  display_name : String,
  email: { type: String, lowercase: true },
  phone : String,
  country_prefix : String,
  national_number : String,
  country : String,
  city : String,
  state : String,
  gender : String,
  role: {
    type: String,
    default: 'user'
  },

  fb_photo: String,
  google_photo: String,
  windows_photo: String,

  iOS_badge: Number,

  isOwner : String,
  picture: String,
  accountVerified : {type: String, default: 'Yes' },
  date  :  { type: Date, default: Date.now },
  initialTesting : String,
  status : {type: String, default: 'I am on CloudKibo' },

  hashedPassword: String,
  provider: String,
  salt: String,

  facebook: {},
  twitter: {},
  google: {},
  windowslive: {},
  github: {}
});

/**
 * Virtuals
 */
UserSchema
  .virtual('password')
  .set(function(password) {
    this._password = password;
    this.salt = this.makeSalt();
    this.hashedPassword = this.encryptPassword(password);
  })
  .get(function() {
    return this._password;
  });

// Public profile information
UserSchema
  .virtual('profile')
  .get(function() {
    return {
      'name': this.username,
      'role': this.role
    };
  });

// Non-sensitive info we'll be putting in the token
UserSchema
  .virtual('token')
  .get(function() {
    return {
      '_id': this._id,
      'role': this.role
    };
  });

/**
 * Validations
 */

// Validate empty username
UserSchema
  .path('phone')
  .validate(function(phone) {
    if (authTypes.indexOf(this.provider) !== -1) return true;
    return phone.length;
  }, 'Phone number cannot be blank');

// Validate phone is not taken
UserSchema
  .path('phone')
  .validate(function(value, respond) {
    var self = this;
    this.constructor.findOne({phone: value}, function(err, user) {
      if(err) throw err;
      if(user) {
        if(self.id === user.id) return respond(true);
        return respond(false);
      }
      respond(true);
    });
}, 'The specified phone number is already in use.');



var validatePresenceOf = function(value) {
  return value && value.length;
};

/**
 * Methods
 */
UserSchema.methods = {
  /**
   * Authenticate - check if the passwords are the same
   *
   * @param {String} plainText
   * @return {Boolean}
   * @api public
   */
  authenticate: function(plainText) {
    return this.encryptPassword(plainText) === this.hashedPassword;
  },

  /**
   * Make salt
   *
   * @return {String}
   * @api public
   */
  makeSalt: function() {
    return crypto.randomBytes(16).toString('base64');
  },

  /**
   * Encrypt password
   *
   * @param {String} password
   * @return {String}
   * @api public
   */
  encryptPassword: function(password) {
    if (!password || !this.salt) return '';
    var salt = new Buffer(this.salt, 'base64');
    return crypto.pbkdf2Sync(password, salt, 10000, 64).toString('base64');
  }
};

module.exports = mongoose.model('accounts', UserSchema);
