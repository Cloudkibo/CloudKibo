'use strict';

var express = require('express');
var controller = require('./contactslist.controller');
var config = require('../../config/environment');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.get('/', auth.isAuthenticated(), controller.index);
router.get('/pendingcontacts', auth.isAuthenticated(), controller.pendingcontacts);//www.cloudkibo.com/api/contactslist/pendingcontacts
router.get('/blockedby', auth.isAuthenticated(), controller.whoHaveBlockedMe);
router.get('/blockedbyme', auth.isAuthenticated(), controller.blockedbyme);
router.post('/blockContact', auth.isAuthenticated(), controller.blockContact);
router.post('/unblockContact', auth.isAuthenticated(), controller.unblockContact);
router.post('/addbyusername', auth.isAuthenticated(), controller.addbyusername);
router.post('/addbyemail', auth.isAuthenticated(), controller.addbyemail);
router.post('/approvefriendrequest', auth.isAuthenticated(), controller.approvefriendrequest);
router.post('/rejectfriendrequest', auth.isAuthenticated(), controller.rejectfriendrequest);
router.post('/removefriend', auth.isAuthenticated(), controller.removefriend);

module.exports = router;
