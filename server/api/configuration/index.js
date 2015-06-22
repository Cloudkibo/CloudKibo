'use strict';

var express = require('express');
var controller = require('./configuration.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.get('/', auth.hasRole('owner'), controller.index);
router.get('/fetch', auth.hasRole('owner'), controller.fetch);
router.get('/:id', auth.hasRole('owner'), controller.show);
router.post('/', auth.hasRole('owner'), controller.create);
router.put('/:id', auth.hasRole('owner'), controller.update);
router.patch('/:id', auth.hasRole('owner'), controller.update);
router.delete('/:id', auth.hasRole('owner'), controller.destroy);

module.exports = router;
