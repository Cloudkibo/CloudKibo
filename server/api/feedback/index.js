/**
 * Created by Saba on 02/23/2015.
 */
'use strict';

var express = require('express');
var controller = require('./feedbackvisitor.controller');
var config = require('../../config/environment');
var auth = require('../../auth/auth.service');

var router = express.Router();


router.post("/visitor", controller.saveVisitorFeedback);
router.post("/call", controller.saveCallFeedback);
router.get('/', controller.index);

module.exports = router;
