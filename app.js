
/**
 * CloudKibo Official APP
 * 
 */

// dependencies
var express = require('express');
var routes = require('./routes');
var http = require('http');
var https = require('https');
var path = require('path');
var fs = require('fs');
var mongoose = require('mongoose');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var httpapp = express();
var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.bodyParser());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser('f83b0cd6ccb20142185616'));
app.use(express.session());
app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));


app.configure('development', function(){
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
    app.use(express.errorHandler());
});

// passport local authentication config
var Users = require('./models/account');
passport.use(new LocalStrategy(Users.authenticate()));

// Initializing Providers Authentication Strategy in Passport
var federateAccounts = require('./models/federateAccounts');
passport.use(federateAccounts.facebook);
passport.use(federateAccounts.google);
passport.use(federateAccounts.windows);


passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

// mongoose
mongoose.connect('mongodb://localhost/cloudkibo');

// routes
require('./routes')(app);

httpapp.get('*',function(req,res){  
    res.redirect('https://www.synap3webrtc.com'+req.url)
});

var options = {
  ca: fs.readFileSync('security/gd_bundle-g2-g1.crt'),
  key: fs.readFileSync('security/server.key'),
  cert: fs.readFileSync('security/4b8c51ff8c772a.crt')
};

var server = http.createServer(httpapp)
var httpsServer = https.createServer(options, app);

var io2 = require('socket.io').listen(httpsServer);


//io2.set('heartbeat interval', 20);
//io2.set('heartbeat timeout', 60); 
//io2.set('close timeout', 60); 

io2.enable('browser client minification');  // send minified client
io2.enable('browser client etag');          // apply etag caching logic based on version number
io2.enable('browser client gzip');          // gzip the file
io2.set('log level', 1);                    // reduce logging

// enable all transports (optional if you want flashsocket support, please note that some hosting
// providers do not allow you to create servers that listen on a port different than 80 or their
// default port)
io2.set('transports', [
    'websocket'
  , 'htmlfile'
  , 'xhr-polling'
  , 'jsonp-polling'
]);

server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

httpsServer.listen(8443, function(){
  console.log('Express server listening on secure port 8443');
});


io2.sockets.on('connection', function (socket){

  // convenience function to log server messages on the client
	function log(){
		var array = [">>> Message from server: "];
	  for (var i = 0; i < arguments.length; i++) {
	  	array.push(arguments[i]);
	  }
	    socket.emit('log', array);
	}

	socket.on('message', function (message) {
		//log('Got message:', message);
		
		//socket.broadcast.emit('message', message);
		
		//io2.sockets.in(message.room).emit('message', message.msg);
		socket.broadcast.to(message.room).emit('message', message.msg);
		
		//console.log(io2.sockets.manager.rooms)
		
	});

	socket.on('create or join', function (room) {
		var numClients = io2.sockets.clients(room.room).length;
		
		//log('Room ' + room.room + ' has ' + numClients + ' client(s)');
		//log('Request to create or join room ' + room.room + ' from '+ room.username);
		
		var clients = io2.sockets.clients(room.room)
		
		var canJoin = true;
		
		var i = 0;
		clients.forEach(function(client) {
			client.get('nickname', function(err, nickname) {
				if(nickname == room.username)
					canJoin = false;
				i++;
			})
		});

		if (numClients === 0){
			socket.join(room.room);
			socket.set('nickname', room.username);
			socket.emit('created', room);
		} else if (numClients === 1) {
			if(canJoin){
				io2.sockets.in(room.room).emit('join', room);			
				socket.join(room.room);
				socket.set('nickname', room.username);
				socket.emit('joined', room);
			}
			else{
				socket.emit('joining twice', room);
			}
		} else { // max two clients
			socket.emit('full', room.room);
		}
		
		socket.emit('emit(): client ' + socket.id + ' joined room ' + room.room);
		socket.broadcast.emit('broadcast(): client ' + socket.id + ' joined room ' + room.room);
		
		//console.log(io2.sockets.manager.rooms)
		
	});
	
	socket.on('leave', function (room) {
		
		io2.sockets.in(room.room).emit('left', room);
		socket.leave(room.room);
		socket.emit('left', room);
		
		
		//console.log(io2.sockets.manager.rooms)
		
	});
	
	socket.on('create or join meeting', function (room) {
		var numClients = io2.sockets.clients(room.room).length;
		
		//log('Room ' + room.room + ' has ' + numClients + ' client(s)');
		//log('Request to create or join room ' + room.room + ' from '+ room.username);
		
		var clientsIDs = new Array(numClients);
		var clientsIDsForOthers = new Array(numClients);
		
		var clients = io2.sockets.clients(room.room)
		
		var i = 0;
		clients.forEach(function(client) {
			client.get('nickname', function(err, nickname) {
				clientsIDs[i] = nickname;
				i++;
			})
		});
		
		if (numClients === 0){
			socket.join(room.room);
			socket.set('nickname', room.username);    
			socket.emit('created', room);
		} else if (numClients < 5) {//(numClients === 2 || numClients === 1 || numClients === 3 || numClients === 4) {
			socket.join(room.room);
			socket.set('nickname', room.username);    
			room.otherClients = clientsIDs;
			socket.emit('joined', room);
			
			clients = io2.sockets.clients(room.room)
			
			var i = 0;
			clients.forEach(function(client) {
				client.get('nickname', function(err, nickname) {
					clientsIDsForOthers[i] = nickname;
					i++;
				})
			});
			
			room.otherClients = clientsIDsForOthers;
			io2.sockets.in(room.room).emit('join', room);
			
		} else { // max three clients
			socket.emit('full', room.room);
		}
		
		//console.log(io2.sockets.manager.rooms)
		
	});

});

/*
 // send to current request socket client
 socket.emit('message', "this is a test");

 // sending to all clients, include sender
 io.sockets.emit('message', "this is a test");

 // sending to all clients except sender
 socket.broadcast.emit('message', "this is a test");

 // sending to all clients in 'game' room(channel) except sender
 socket.broadcast.to('game').emit('message', 'nice game');

  // sending to all clients in 'game' room(channel), include sender
 io.sockets.in('game').emit('message', 'cool game');

 // sending to individual socketid
 io.sockets.socket(socketid).emit('message', 'for your eyes only');
 */
