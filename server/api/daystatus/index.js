'use strict';

var express = require('express');
var controller = require('./daystatus.controller');
var config = require('../../config/environment');
var auth = require('../../auth/auth.service');
var multiparty = require('connect-multiparty');

var multipartyMiddleware = multiparty();

var router = express.Router();

 router.post('/create', auth.isAuthenticated(), multipartyMiddleware, controller.create);
 router.post('/delete', auth.isAuthenticated(), controller.delete);
 router.post('/getInfo', auth.isAuthenticated(), controller.getInfo);
 router.post('/getMedia', auth.isAuthenticated(), controller.getMedia);

module.exports = router;
