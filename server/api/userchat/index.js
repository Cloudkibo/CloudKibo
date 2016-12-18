'use strict';

var express = require('express');
var controller = require('./userchat.controller');
var config = require('../../config/environment');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.post('/', auth.isAuthenticated(), controller.index); //www.cloudkibo.com/api/userchat/
router.post('/alluserchat', auth.isAuthenticated(), controller.alluserchat); //www.cloudkibo.com/api/userchat/alluserchat
router.post('/save', auth.isAuthenticated(), controller.save);//www.cloudkibo.com/api/userchat/save
router.post('/save2', auth.isAuthenticated(), controller.save2);//www.cloudkibo.com/api/userchat/save2
router.post('/updateStatus', auth.isAuthenticated(), controller.updateStatus);
router.post('/removechathistory', auth.isAuthenticated(), controller.removechathistory);
router.post('/getsinglechat', auth.isAuthenticated(), controller.getsinglechat);
router.post('/partialchatsync', auth.isAuthenticated(), controller.partialchatsync);


module.exports = router;
