/**
 * Main application file
 */

'use strict';



// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';




var express = require('express');
var mongoose = require('mongoose');
var config = require('./config/environment');

var fs = require('fs');

var logger = require('./components/logger/logger');

logger.serverLog('info', 'Server started');





// Connect to database
mongoose.connect(config.mongo.uri, config.mongo.options);




// Setup server
var httpapp = express();
var app = express();

var options = {
  ca: fs.readFileSync('server/security/gd_bundle-g2-g1.crt'),
  key: fs.readFileSync('server/security/server.key'),
  cert: fs.readFileSync('server/security/a89aa21eff391f1e.crt')
};


var server = require('http').createServer(httpapp);
var httpsServer = require('https').createServer(options, app);



httpapp.get('*',function(req,res){
    res.redirect('https://www.cloudkibo.com'+req.url)
});


/*
var socketio = require('socket.io')(httpsServer, {
  serveClient: (config.env === 'production') ? false : true,
  path: '/socket.io-client'
});
*/

var socketio = require('socket.io').listen(httpsServer);		// USE THE UPPER CODE IN LONG RUN, IT USES THE NEW SOCKET.IO


require('./config/socketio')(socketio);
require('./config/express')(app);
require('./routes')(app);



// Start server
server.listen(config.port, config.ip, function () {
  console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));
  //$log.info('Express server listening on %d, in %s mode '+ config.port, app.get('env'));
});

httpsServer.listen(config.secure_port, function(){
  console.log('Express server listening on %d, in %s mode', config.secure_port, app.get('env'));
  ///$log.info('Express server listening on %d, in %s mode', config.secure_port, app.get('env'));
});


// Expose app
exports = module.exports = app;
