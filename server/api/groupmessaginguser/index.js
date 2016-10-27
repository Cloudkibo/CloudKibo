'use strict';

var express = require('express');
var controller = require('./groupmessaginguser.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.get('/', auth.isAuthenticated(), controller.index);
router.get('/mygroups', auth.isAuthenticated(), controller.mygroups);
router.get('/mygroupsmembers', auth.isAuthenticated(), controller.mygroupsmembers);
router.post('/myspecificgroupsmembers', auth.isAuthenticated(), controller.myspecificgroupsmembers);
router.post('/updateRole', auth.isAuthenticated(), controller.updateRole);
router.post('/', auth.isAuthenticated(), controller.create);
router.post('/leaveGroup', auth.isAuthenticated(), controller.leaveGroup);
router.post('/removeFromGroup', auth.isAuthenticated(), controller.removeFromGroup);
router.put('/:id', auth.isAuthenticated(), controller.update);
router.patch('/:id', auth.isAuthenticated(), controller.update);
router.delete('/:id', auth.isAuthenticated(), controller.destroy);

module.exports = router;
