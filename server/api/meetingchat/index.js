'use strict';

var express = require('express');
var controller = require('./meetingchat.controller.js');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.post('/', auth.isAuthenticated(), controller.index);
router.post('/specific_conference', auth.isAuthenticated(), controller.specific_conference);
router.post('/generate_url_agent', auth.isAuthenticated(), controller.generate_url_agent);
router.post('/generate_url_visitor', auth.isAuthenticated(), controller.generate_url_visitor);

module.exports = router;
