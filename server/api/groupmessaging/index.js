'use strict';

var express = require('express');
var controller = require('./groupmessaging.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.get('/', auth.isAuthenticated(), controller.index);
router.post('/specificGroup', auth.isAuthenticated(), controller.specificGroup);
router.post('/uploadIcon', auth.isAuthenticated(), controller.uploadIcon);
router.post('/downloadIcon', auth.isAuthenticated(), controller.downloadIcon);
router.post('/', auth.isAuthenticated(), controller.create);
router.put('/:id', auth.isAuthenticated(), controller.update);
router.patch('/:id', auth.isAuthenticated(), controller.update);
router.delete('/:id', auth.isAuthenticated(), controller.destroy);

module.exports = router;
