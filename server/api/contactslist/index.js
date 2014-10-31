'use strict';

var express = require('express');
var controller = require('./contactslist.controller');
var config = require('../../config/environment');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.get('/', auth.isAuthenticated(), controller.index);
router.get('/pendingcontacts', auth.isAuthenticated(), controller.pendingcontacts);

module.exports = router;
