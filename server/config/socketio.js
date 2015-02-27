/**
 * Socket.io configuration
 */

'use strict';

var config = require('./environment');
var _ = require('lodash-node');  // from phonertc

var users = [];   // from phonertc


// When the user disconnects.. perform this
function onDisconnect(socketio,socket) {

	///////////////////////////////////////////////////////////
	// PHONERTC EXAMPLE SIGNALLING
	///////////////////////////////////////////////////////////

	try {
		var index = _.findIndex(users, {socket: socket.id});
		if (index !== -1) {
			socket.broadcast.emit('offline', users[index].name);
			console.log(users[index].name + ' disconnected');

			users.splice(index, 1);
		}
		return ;
	}catch(e){

	}


	var socketid = '';
		
	socket.get('nickname', function(err, nickname) {
	
		var clients = socketio.sockets.clients('globalchatroom')
		var socketid = '';
		var user = require('./../api/user/user.model.js');
		
		if(nickname != null){
		
				user.findOne({username : nickname}, function(err, gotuser){
					
					if(gotuser != null){
						
						var contactslist = require('./../api/contactslist/contactslist.model.js');
				
						contactslist.find({userid : gotuser._id}).populate('contactid').exec(function(err3, gotContactList){
						console.log(gotContactList);	
							if(gotContactList != null){
								var i = 0;
								clients.forEach(function(client) {
									client.get('nickname', function(err, nickname2) {
										for(var j in gotContactList){
											if(nickname2 == gotContactList[j].contactid.username){
												socketid = client.id;
												socketio.sockets.socket(socketid).emit('offline', gotuser);
											}
										}
										i++;
									})
								});

							}
							
						})
						
					}
				

			});
				
		}
		
	})
}


// When the user connects.. perform this
function onConnect(socketio, socket) {
  
		//console.log(socket);

	  // convenience function to log server messages on the client
	function log(){
			var array = [">>> Message from server: "];
		  for (var i = 0; i < arguments.length; i++) {
			array.push(arguments[i]);
		  }
			socket.emit('log', array);
		}

		socket.on('message', function (message) {
			
			message.msg.from = socket.id;
		
			
			var clients = socketio.sockets.clients(message.room)
			
			var socketid = '';
			
			var i = 0;
			clients.forEach(function(client) {
				client.get('nickname', function(err, nickname) {
					if(nickname == message.to)
						socketid = client.id;
					i++;
				})
			});
			
			if(socketid == ''){
				//socket.emit('disconnected', message.mycaller);
			}
			else{
			
				socketio.sockets.socket(socketid).emit('message', message.msg);

				
			}
			
		});

		socket.on('messageformeeting', function (message) {
			//console.log('Got message:', message);

			//socket.broadcast.emit('message', message);

			message.msg.from = socket.id;

			//io2.sockets.in(message.room).emit('message', message.msg);
			socket.broadcast.to(message.room).emit('message', message.msg);
			//console.log('Got message:', message.msg);
			//console.log(io2.sockets.manager.rooms)

		});

		socket.on('messagefordatachannel', function (message) {
			//console.log('Got message:', message);
			
			//socket.broadcast.emit('message', message);
			
			message.msg.from = message.from;
			
			var clients = socketio.sockets.clients(message.room)
			
			var socketid = '';
			
			var i = 0;
			clients.forEach(function(client) {
				client.get('nickname', function(err, nickname) {
					if(nickname == message.to)
						socketid = client.id;
					i++;
				})
			});			
			 
			socketio.sockets.socket(socketid).emit('messagefordatachannel', message.msg);
			
		});

		socket.on('create or join', function (room) {
			var numClients = socketio.sockets.clients(room.room).length; 
			
			//console.log(socketio.sockets.manager.rooms)
			//console.log(room)
			
			//log('Room ' + room.room + ' has ' + numClients + ' client(s)');
			//log('Request to create or join room ' + room.room + ' from '+ room.username);
			
			var clients = socketio.sockets.clients(room.room)
			
			var canJoin = true;
			
			var i = 0;
			clients.forEach(function(client) {
				client.get('nickname', function(err, nickname) {
					if(nickname == room.username){
						canJoin = false;
						//client.leave(room.room);
						console.log('CASE OF JOINING TWICE!')
					}
					i++;
				})
			});

			if (numClients === 0){
				socket.join(room.room);
				socket.set('nickname', room.username);
				socket.emit('created', room);
			} else if (numClients === 1) {
				if(canJoin){
					socketio.sockets.in(room.room).emit('join', room);			
					socket.join(room.room);
					socket.set('nickname', room.username);
					socket.emit('joined', room);
				}
				else{
					//socket.join(room.room);
					//socket.set('nickname', room.username);
					//socket.emit('created', room);
					socket.emit('joining twice', room);
				}
			} else { // max two clients
				socket.emit('full', room.room);
			}
			
			socket.emit('emit(): client ' + socket.id + ' joined room ' + room.room);
			socket.broadcast.emit('broadcast(): client ' + socket.id + ' joined room ' + room.room);
			
			//console.log(socketio.sockets.manager.rooms)
			
		});
		
		socket.on('join global chatroom', function (room) {
			
			socket.join(room.room);
			socket.set('nickname', room.user.username);
			//socket.emit('you are in global chat room', room);
			
			var myOnlineContacts = [];
			
			var clients = socketio.sockets.clients(room.room)
			
			var socketid = '';
			
			var contactslist = require('./../api/contactslist/contactslist.model.js');
				
			contactslist.find({userid : room.user._id}).populate('contactid').exec(function(err3, gotContactList){
				
				if(gotContactList != null){

					var i = 0;
					clients.forEach(function(client) {
						client.get('nickname', function(err, nickname) {
							
							for(var j in gotContactList){
								if(gotContactList[j].contactid != null){
									if(nickname == gotContactList[j].contactid.username){
										socketid = client.id;
										socketio.sockets.socket(socketid).emit('online', room.user);
										myOnlineContacts.push(gotContactList[j].contactid);
									}
								}
							}
							
							i++;
						})
					});
					
					socket.emit('youareonline', myOnlineContacts);

				}
				
			})
			
			console.log(socketio.sockets.manager.rooms)
			console.log(room.user.username)
			
		});
		
		socket.on('whozonline', function(room){
			var myOnlineContacts = [];
			
			var clients = socketio.sockets.clients(room.room)
			
			var socketid = '';
			
			var contactslist = require('./../api/contactslist/contactslist.model.js');
				
			contactslist.find({userid : room.user._id}).populate('contactid').exec(function(err3, gotContactList){
				
				if(gotContactList != null){

					var i = 0;
					clients.forEach(function(client) {
						client.get('nickname', function(err, nickname) {
							
							for(var j in gotContactList){
									if(nickname == gotContactList[j].contactid.username){
										socketid = client.id;
										socketio.sockets.socket(socketid).emit('online', room.user);
										myOnlineContacts.push(gotContactList[j].contactid);
									}
							}
							
							i++;
						})
					});
					
					socket.emit('theseareonline', myOnlineContacts);

				}
				
			})
		})
		
		socket.on('callthisperson', function(message){
			
			var socketidSender = socket.id;
			
			var clients = socketio.sockets.clients(message.room)
			
			var socketid = '';
			
			var i = 0;
			clients.forEach(function(client) {
				client.get('nickname', function(err, nickname) {
					if(nickname == message.callee)
						socketid = client.id;
					i++;
				})
			});
			
			if(socketid == ''){
				socket.emit('calleeisoffline', message.callee);
			}
			else{
				socketio.sockets.socket(socketid).emit('areyoufreeforcall', {caller : message.caller, sendersocket: socketidSender});
			}
			
		});
		
		socket.on('noiambusy', function(message){
			
			var clients = socketio.sockets.clients(message.room)
			
			var socketid = '';
			
			var i = 0;
			clients.forEach(function(client) {
				client.get('nickname', function(err, nickname) {
					if(nickname == message.mycaller)
						socketid = client.id;
					i++;
				})
			});
			
			if(socketid == ''){
				//socket.emit('calleeisoffline', message.callee);
			}
			else{
				socketio.sockets.socket(socketid).emit('calleeisbusy', {callee : message.me});
			}
			
		});
		
		socket.on('yesiamfreeforcall', function(message){
			
			var clients = socketio.sockets.clients(message.room)
			
			var socketid = '';
			
			var i = 0;
			clients.forEach(function(client) {
				client.get('nickname', function(err, nickname) {
					if(nickname == message.mycaller)
						socketid = client.id;
					i++;
				})
			});
			
			if(socketid == ''){
				socket.emit('disconnected', message.mycaller);
			}
			else{
				socketio.sockets.socket(socketid).emit('othersideringing', {callee : message.me});
			}
			
		});
		
		socket.on('im', function(im){
			
			var clients = socketio.sockets.clients(im.room)
			
			var socketid = '';
			
			var i = 0;
			clients.forEach(function(client) {
				client.get('nickname', function(err, nickname) {
					if(nickname == im.stanza.to)
						socketid = client.id;
					i++;
				})
			});
			
			 
			socketio.sockets.socket(socketid).emit('im', im.stanza);
			
		});

		socket.on('friendrequest', function(im){
			
			//console.log("GOT THIS MESSAGE", im);
			
			var clients = socketio.sockets.clients(im.room)
			
			var socketid = '';
			
			var i = 0;
			clients.forEach(function(client) {
				client.get('nickname', function(err, nickname) {
					if(nickname == im.contact)
						socketid = client.id;
					i++;
				})
			});
			
			 
			socketio.sockets.socket(socketid).emit('friendrequest', im);
			
		});
		
		socket.on('leave', function (room) {
			
			socketio.sockets.in(room.room).emit('left', room);
			socket.leave(room.room);
			socket.emit('left', room);
			
			
			
			
			//console.log(socketio.sockets.manager.rooms)
			
		});
		
		socket.on('leaveChat', function (room) {
			
			socket.leave(room.room);
			/*
			var clients = socketio.sockets.clients(room.room)
			
			var socketid = '';
			
			var contactslist = require('./../api/contactslist/contactslist.model.js');
				
			contactslist.find({userid : room.user._id}).populate('contactid').exec(function(err3, gotContactList){
				
				if(gotContactList != null){

					var i = 0;
					clients.forEach(function(client) {
						client.get('nickname', function(err, nickname) {
							
							for(var j in gotContactList){
									if(nickname == gotContactList[j].contactid.username){
										socketid = client.id;
										socketio.sockets.socket(socketid).emit('offline', room.user);
									}
							}
							
							i++;
						})
					});

				}
				
			})
			
			console.log('I LEFT CHAT')
			console.log(socketio.sockets.manager.rooms)
			*/
		});
		
		socket.on('status', function (room) {
			
			var clients = socketio.sockets.clients(room.room)
			
			var socketid = '';
			
			var contactslist = require('./../api/contactslist/contactslist.model.js');
				
			contactslist.find({userid : room.user._id}).populate('contactid').exec(function(err3, gotContactList){
				
				if(gotContactList != null){

					var i = 0;
					clients.forEach(function(client) {
						client.get('nickname', function(err, nickname) {
							
							for(var j in gotContactList){
									if(nickname == gotContactList[j].contactid.username){
										socketid = client.id;
										socketio.sockets.socket(socketid).emit('statusUpdate', room.user);
									}
							}
							
							i++;
						})
					});

				}
				
			})
			
	//		 socket.broadcast.to(room.room).emit('statusUpdate', room.user);
			//console.log(socketio.sockets.manager.rooms)
			
		});
		
		socket.on('create or join meeting', function (room) {
			var numClients = socketio.sockets.clients(room.room).length;
			
			//log('Room ' + room.room + ' has ' + numClients + ' client(s)');
			//log('Request to create or join room ' + room.room + ' from '+ room.username);
			
			var clientsIDs = new Array(numClients);
			var clientsIDsForOthers = new Array(numClients);
			
			var clients = socketio.sockets.clients(room.room)
			
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
				
				clients = socketio.sockets.clients(room.room)
				
				var i = 0;
				clients.forEach(function(client) {
					client.get('nickname', function(err, nickname) {
						clientsIDsForOthers[i] = nickname;
						i++;
					})
				});
				
				room.otherClients = clientsIDsForOthers;
				socketio.sockets.in(room.room).emit('join', room);
				
			} else { // max three clients
				socket.emit('full', room.room);
			}
			
			//console.log(socketio.sockets.manager.rooms)
			
		});

		socket.on('create or join livehelp', function (room) {
			var numClients = socketio.sockets.clients(room.room).length;
		
			if (numClients === 0){
				socket.join(room.room);
				socket.set('nickname', room.username);    
				socket.emit('created', room);
			} else if (numClients < 2) {
				socket.join(room.room);
				socket.set('nickname', room.username);    
				socket.emit('joined', room);

				socket.broadcast.to(room.room).emit('join', room);
				
			} else { // max three clients
				socket.emit('full', room.room);
			}
			
			console.log(socketio.sockets.manager.rooms)
			console.log(room)
			
		});




	////////////////////////////////////////////////////////////////////////////////////////
	// PHONERTC SERVER SIGNALLING FOR TESTING
	////////////////////////////////////////////////////////////////////////////////////////

	socket.on('login', function (name) {
		// if this socket is already connected,
		// send a failed login message
		if (_.findIndex(users, { socket: socket.id }) !== -1) {
			socket.emit('login_error', 'You are already connected.');
		}

		// if this name is already registered,
		// send a failed login message
		if (_.findIndex(users, { name: name }) !== -1) {
			socket.emit('login_error', 'This name already exists.');
			return;
		}

		users.push({
			name: name,
			socket: socket.id
		});

		socket.emit('login_successful', _.pluck(users, 'name'));
		socket.broadcast.emit('online', name);

		console.log(name + ' logged in');
	});

	socket.on('sendMessage', function (name, message) {
		var currentUser = _.find(users, { socket: socket.id });
		if (!currentUser) { return; }

		var contact = _.find(users, { name: name });
		if (!contact) { return; }

		socketio.sockets.socket(contact.socket)
			.emit('messageReceived', currentUser.name, message);
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
  

  

  // Insert sockets below
  //require('../api/thing/thing.socket').register(socket);
}






module.exports = function (socketio) {
  // socket.io (v1.x.x) is powered by debug.
  // In order to see all the debug output, set DEBUG (in server/config/local.env.js) to including the desired scope.
  //
  // ex: DEBUG: "http*,socket.io:socket"

  // We can authenticate socket.io users and access their token through socket.handshake.decoded_token
  //
  // 1. You will need to send the token in `client/components/socket/socket.service.js`
  //
  // 2. Require authentication here:
  // socketio.use(require('socketio-jwt').authorize({
  //   secret: config.secrets.session,
  //   handshake: true
  // }));

  socketio.on('connection', function (socket) {
    socket.address = socket.handshake.address !== null ?
            socket.handshake.address.address + ':' + socket.handshake.address.port :
            process.env.DOMAIN;

    socket.connectedAt = new Date();

    // Call onDisconnect.
    socket.on('disconnect', function () {
      onDisconnect(socketio, socket);
      console.info('[%s] DISCONNECTED', socket.address);
    });

    // Call onConnect.
    onConnect(socketio, socket);
    console.info('[%s] CONNECTED', socket.address);
  });
};
