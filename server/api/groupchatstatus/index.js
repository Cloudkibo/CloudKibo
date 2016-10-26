'use strict';

var express = require('express');
var controller = require('./groupchatstatus.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.get('/', auth.isAuthenticated(), controller.index);
router.post('/checkStatus', auth.isAuthenticated(), controller.checkStatus);
router.post('/updateStatus', auth.isAuthenticated(), controller.updateStatus);
router.post('/', auth.isAuthenticated(), controller.create);
router.put('/:id', auth.isAuthenticated(), controller.update);
router.patch('/:id', auth.isAuthenticated(), controller.update);
router.delete('/:id', auth.isAuthenticated(), controller.destroy);

module.exports = router;
