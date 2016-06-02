var express = require('express');
var Debugger = require('./debugger.model');
var router = express.Router();


exports.recordError = function(body) {

  Debugger.create(body, function(err, response) {
    if(err) { return console.log(res, err); }
    console.log(response);
  });

  router.get('/getAllErrors', function(req, res) {
    Debugger.find({}, function (err, errorsRecorded) {
      if(err) return res.send(500, err);
      res.json(200, errorsRecorded);
    });
  });


};
