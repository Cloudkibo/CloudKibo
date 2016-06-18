var express = require('express');
var Debugger = require('./debugger.model');
var router = express.Router();


exports.recordError = function(body) {

  var newReport = new Debugger(body);

  newReport.save(function(err, response) {
    if(err) { return console.log(res, err); }
    console.log(response);
  });




};
