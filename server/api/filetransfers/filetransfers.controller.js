'use strict';

var filetransfers = require('./filetransfers.model');
var User = require('../user/user.model');
var config = require('../../config/environment');
var logger = require('../../components/logger/logger');


exports.upload = function(req, res) {
	logger.serverLog('info', 'filetransfers.controller : upload file route called');

	var today = new Date();
	var uid = crypto.randomBytes(5).toString('hex');
	var serverPath = '/' + 'f' + uid + '' + today.getFullYear() + '' + (today.getMonth()+1) + '' + today.getDate();
	serverPath += '' + today.getHours() + '' + today.getMinutes() + '' + today.getSeconds();
	serverPath += '.' + req.files.file.type.split('/')[1];

	console.log(__dirname);

	var dir = "./userpictures";

	if(req.files.file.size == 0) return res.send('No file submitted');

	require('fs').rename(
	 req.files.file.path,
	 dir + "/" + serverPath,
		function(error) {
			 if(error) {
				 logger.serverLog('error', 'user.controller (update image) : '+ error);
				res.send({
					error: 'Server Error: Could not upload the file'
				});
				return 0;
			 }
		 }

	);


	console.log("saved image")


};
