'use strict';

var express = require('express');
var controller = require('./daystatusupdate.controller');
var config = require('../../config/environment');
var auth = require('../../auth/auth.service');
var multiparty = require('connect-multiparty');

var multipartyMiddleware = multiparty();

var router = express.Router();

router.post('/create', auth.isAuthenticated(), controller.create);

module.exports = router;
