'use strict';

var filetransfers = require('./filetransfers.model');
var User = require('../user/user.model');
var config = require('../../config/environment');
var logger = require('../../components/logger/logger');
var crypto = require('crypto');

exports.upload = function(req, res) {
	logger.serverLog('info', 'filetransfers.controller : upload file route called. file is: '+ JSON.stringify(req.files));

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
      console.log(req.body);
			 var fileData = new filetransfers({
				 to : req.body.to,
	       from : req.body.from,
	       uniqueid: req.body.uniqueid,
	       file_name : req.body.filename,
	       file_size : req.body.filesize,
	       path : serverPath,
	       file_type : req.body.filetype
			 })

			 fileData.save(function(err){
				 if(err) return res.send({error: 'Database Error'});

				 res.send({status:'success'});

			 });

		 }

	);



};

exports.download = function(req, res, next) {
console.log('this is id when downloading file');
console.log(req.body.uniqueid);
	filetransfers.findOne({uniqueid : req.body.uniqueid}, function(err, data){
		if(err) return res.send({status : 'database error'});
		res.sendfile(data.path, {root: './userpictures'});
	});
};

exports.confirmdownload = function(req, res, next) {
  console.log('this is id sent when confirming download');
  console.log(req.body.uniqueid);
	filetransfers.findOne({uniqueid : req.body.uniqueid}, function(err, data){
		if(err) return res.send({status : 'database error'});

		var dir = './userpictures';
		dir += data.path;

		require('fs').unlink(dir, function (err) {
				if (err) {
					return logger.serverLog('error', 'user.controller (delete file image) : '+ err);
					//throw err;
				}

				filetransfers.remove({uniqueid : req.body.uniqueid}, function(err){
					if(err) return res.send({status : 'database error'});

					res.send({status : 'success'});

				})
			})



	});

};

exports.pendingfile = function(req, res, next){
  console.log(req.body.uniqueid);
	filetransfers.findOne({uniqueid : req.body.uniqueid}, function(err, data){
		if(err) return res.send({status : 'database error'});

		res.send({filepending : data});

	})
};
