'use strict';

var express = require('express');
var passport = require('passport');
var auth = require('../auth.service');

var router = express.Router();

router
  .get('/', passport.authenticate('windowslive', {
    failureRedirect: '/register',
    scope: [ 'wl.signin', 'wl.basic', 'wl.emails', 'wl.phone_numbers',
			 'wl.photos', 'wl.postal_addresses', 'wl.offline_access'
    ],
    session: false
  }))

  .get('/callback', passport.authenticate('windowslive', {
    failureRedirect: '/register',
    session: false
  }), auth.setTokenCookie);

module.exports = router;
