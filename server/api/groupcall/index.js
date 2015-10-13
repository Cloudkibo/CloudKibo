'use strict';

var express = require('express');
var controller = require('./groupcall.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.get('/getothersgroups', auth.isAuthenticated(), controller.showothergroups);
router.get('/', auth.isAuthenticated(), controller.index); // /api/groupcall/
router.get('/:id', auth.isAuthenticated(), controller.show); // /api/groupcall/:id
router.post('/', auth.isAuthenticated(), controller.create);
router.put('/:id', auth.isAuthenticated(), controller.update);
router.patch('/:id', auth.isAuthenticated(), controller.update);
router.delete('/:id', auth.isAuthenticated(), controller.destroy);
router.post('/addcontact', auth.isAuthenticated(), controller.addcontact);
router.post('/removecontact', auth.isAuthenticated(), controller.removecontact);
router.get('/groupmembers/:id', auth.isAuthenticated(), controller.showgroupmembers);

module.exports = router;
