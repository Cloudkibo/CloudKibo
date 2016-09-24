'use strict';

var express = require('express');
var controller = require('./user.controller');
var config = require('../../config/environment');
var auth = require('../../auth/auth.service');
var multiparty = require('connect-multiparty');
var multipartyMiddleware = multiparty();
var Debugger = require('../../components/debugger/debugger.model');

var router = express.Router();

router.get('/', auth.hasRole('admin'), controller.index); // www.cloudkibo.com/api/users/ (GET)
router.delete('/:id', auth.hasRole('admin'), controller.destroy);
router.get('/getAllErrors', function(req, res, next) {
  Debugger.find({}, function (err, errorsRecorded) {
    if(err) return res.send(500, err);
    res.json(200, errorsRecorded);
  });
});
router.get('/me', auth.isAuthenticated(), controller.me); // www.cloudkibo.com/api/users/me
router.put('/:id/password', auth.isAuthenticated(), controller.changePassword);
router.get('/:id', auth.isAuthenticated(), controller.show);
router.post('/', controller.create); // www.cloudkibo.com/api/users/ (POST)
router.post('/userimage/update', auth.isAuthenticated(), multipartyMiddleware, controller.updateimage);
router.get('/userimage/:image', controller.userimage); // www.cloudkibo.com/api/users/userimage/:image
router.put('/update', auth.isAuthenticated(), controller.update);
router.post('/searchbyusername', auth.isAuthenticated(), controller.searchbyusername);
router.post('/searchbyemail', auth.isAuthenticated(), controller.searchbyemail);
router.post('/invitebyemail', auth.isAuthenticated(), controller.invitebyemail);
router.post('/invitebymultipleemail', auth.isAuthenticated(), controller.inviteMultipleByEmail);
router.post('/initialtestingdone', auth.isAuthenticated(), controller.initialtesting);
router.post('/setstatusmessage', auth.isAuthenticated(), controller.setstatusmessage);
router.post('/resetpasswordrequest', controller.resetpasswordrequest);
router.post('/resetusernamerequest', controller.resetusernamerequest);
router.post("/changepassword", controller.changePasswordRoute);
router.post("/saveusername", controller.saveUsernameRoute);
router.post("/searchaccountsbyphone", auth.isAuthenticated(), controller.searchAccountByPhone);
router.post("/searchaccountsbyemail", auth.isAuthenticated(), controller.searchAccountByEmail);

router.post("/log", controller.log);

router.post("/newuser", controller.newuser);

module.exports = router;
