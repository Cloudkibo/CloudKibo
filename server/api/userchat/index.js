'use strict';

var express = require('express');
var controller = require('./userchat.controller');
var config = require('../../config/environment');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.post('/', auth.isAuthenticated(), controller.index); //www.cloudkibo.com/api/userchat/
router.post('/save', auth.isAuthenticated(), controller.save);//www.cloudkibo.com/api/userchat/save
router.post('/markasread', auth.isAuthenticated(), controller.markasread);//www.cloudkibo.com/api/userchat/markasread
router.post('/removechathistory', auth.isAuthenticated(), controller.removechathistory);


module.exports = router;

