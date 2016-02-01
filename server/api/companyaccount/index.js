'use strict';

var express = require('express');
var controller = require('./companyaccount.controller');

var router = express.Router();

router.post('/webhook', controller.webhook);

module.exports = router;
