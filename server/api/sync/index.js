'use strict';

var express = require('express');
var controller = require('./sync.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.post('/downwardSync', auth.isAuthenticated(), controller.downwardSync);
router.post('/upwardSync', auth.isAuthenticated(), controller.upwardSync);


module.exports = router;
