'use strict';

var express = require('express');
var controller = require('./userchat.controller');
var config = require('../../config/environment');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.post('/', auth.isAuthenticated(), controller.index);
router.post('/save', auth.isAuthenticated(), controller.save);
router.post('/markasread', auth.isAuthenticated(), controller.markasread);


module.exports = router;
