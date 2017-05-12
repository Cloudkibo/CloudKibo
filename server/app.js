/**
 * Main application file
 */

'use strict';



// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
//process.env.NODE_ENV = process.env.NODE_ENV || 'production';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";



var express = require('express');
var mongoose = require('mongoose');
var config = require('./config/environment');

var fs = require('fs');

var logger = require('./components/logger/logger');

logger.serverLog('info', '===============SERVER STARTED===============');



// Connect to database
mongoose.connect(config.mongo.uri, config.mongo.options);



// Setup server
var httpapp = express();
var app = express();

var options = {
  ca: fs.readFileSync('server/security/gd_bundle-g2-g1.crt'),
  key: fs.readFileSync('server/security/server.key'),
  cert: fs.readFileSync('server/security/42389550a00c3669.crt')
};


var server = require('http').createServer(httpapp);
var httpsServer = require('https').createServer(options, app);



httpapp.get('*',function(req,res){
    res.redirect('https://api.cloudkibo.com'+req.url)
});


/*
var socketio = require('socket.io')(httpsServer, {
  serveClient: (config.env === 'production') ? false : true,
  path: '/socket.io-client'
});
*/

var socketio = require('socket.io').listen(httpsServer);


require('./config/socketio')(socketio, app);
require('./config/express')(app);
require('./routes')(app);



// Start server
server.listen(config.port, config.ip, function () {
  console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));
});

httpsServer.listen(config.secure_port, function(){
  console.log('Express server listening on %d, in %s mode', config.secure_port, app.get('env'));
});


// Expose app
exports = module.exports = app;
