/**
 * Socket.io configuration
 */

'use strict';

var config = require('./environment');
var logger = require('../components/logger/logger');


// When the user disconnects.. perform this
function onDisconnect(socketio,socket) {

  var clients = findClientsSocket('globalchatroom');//socketio.nsps['/'].adapter.rooms[room.room];//var clients = socketio.sockets.clients(room.room);
  var socketid = '';
  var user = require('./../api/user/user.model.js');

  user.findOne({username : socket.username}, function(err, gotuser){
    if(err) logger.serverLog('error', 'socketio.js onDisconnect : '+ err);

    if(gotuser != null) {

      var contactslist = require('./../api/contactslist/contactslist.model.js');

      contactslist.find({userid : gotuser._id}).populate('contactid').exec(function(err3, gotContactList){
        console.log(gotContactList);
        if(gotContactList != null){

          for(var i in clients){
            for(var j in gotContactList){
              if(gotContactList[j].contactid != null){
                if(clients[i].username == gotContactList[j].contactid.username){
                  socketid = clients[i].id;
                  socketio.to(socketid).emit('offline', gotuser);
                }
              }
            }
          }

        }

      })

    }

  });


  function findClientsSocket(roomId, namespace) {
    var res = []
      , ns = socketio.of(namespace ||"/");    // the default namespace is "/"

    if (ns) {
      for (var id in ns.connected) {
        if(roomId) {
          var index = ns.connected[id].rooms.indexOf(roomId) ;
          if(index !== -1) {
            res.push(ns.connected[id]);
          }
        } else {
          res.push(ns.connected[id]);
        }
      }
    }

    return res;
  }

}


// When the user connects.. perform this
function onConnect(socketio, socket) {

		//console.log(socket);
  logger.serverLog('debug', 'socketio.js connected:');

	  // convenience function to log server messages on the client
	function log(){
			var array = [">>> Message from server: "];
		  for (var i = 0; i < arguments.length; i++) {
			array.push(arguments[i]);
		  }
			socket.emit('log', array);
		}

		socket.on('message', function (message) {
      console.log('Got message:', message.msg);

      try {
        message.msg.from = socket.id;
      }catch(e){
        if(e) logger.serverLog('warn', 'socketio.js on(message) : '+ e);
      }

      var clients = findClientsSocket(message.room);//socketio.nsps['/'].adapter.rooms[room.room];//var clients = socketio.sockets.clients(room.room);

			var socketid = '';

      for(var i in clients){
        if(clients[i].username == message.to){
          socketid = clients[i].id;
        }
      }

			if(socketid == ''){
				//socket.emit('disconnected', message.mycaller);
			}
			else{
        socketio.to(socketid).emit('message', message.msg);
				//socketio.sockets.socket(socketid).emit('message', message.msg);
			}
		});

  socket.on('group_call_message', function (message) {
    console.log('Got message:', message.msg);

    try {
      message.msg.from = socket.id;
    }catch(e){
      if(e) logger.serverLog('warn', 'socketio.js on(message) : '+ e);
    }

    var clients = findClientsSocket(message.room);//socketio.nsps['/'].adapter.rooms[room.room];//var clients = socketio.sockets.clients(room.room);

    var socketid = '';

    for(var i in clients){
      if(clients[i].username == message.to){
        socketid = clients[i].id;
      }
    }

    if(socketid == ''){
      //socket.emit('disconnected', message.mycaller);
    }
    else{
      socketio.to(socketid).emit('group_call_message', message.msg);
      //socketio.sockets.socket(socketid).emit('message', message.msg);
    }
  });

		socket.on('messageformeeting', function (message) {
			console.log('Got message:', message.msg);

			//socket.broadcast.emit('message', message);

      try {
        message.msg.from = socket.id;
      }catch(e){
        if(e) logger.serverLog('warn', 'socketio.js on(messageformeeting) : '+ e);
      }

			//io2.sockets.in(message.room).emit('message', message.msg);
			socket.broadcast.to(message.room).emit('message', message.msg);
			//console.log('Got message:', message.msg);
			//console.log(io2.sockets.manager.rooms)

		});

		socket.on('messagefordatachannel', function (message) {
      //console.log('Got message:', message);

      //socket.broadcast.emit('message', message);

      try {
        message.msg.from = socket.id;
      } catch (e) {
        if (e) logger.serverLog('warn', 'socketio.js on(messagefordatachannel) : ' + e);
      }

      var clients = findClientsSocket(message.room);//socketio.nsps['/'].adapter.rooms[room.room];//var clients = socketio.sockets.clients(room.room);

      var socketid = '';

      for (var i in clients) {
        if (clients[i].username == message.to) {
          socketid = clients[i].id;
        }
      }

      var msgToSend = message.msg;

      try {
        if (typeof msgToSend != 'object')
          msgToSend = JSON.parse(msgToSend);
      }catch(e){
        if(e) logger.serverLog('error', 'socketio.js on(messagefordatachannel) : '+ e);
      }

      try {
        msgToSend.from = message.from;
      }catch(e) {if(e) logger.serverLog('warn', 'socketio.js on(messagefordatachannel) : '+ e);}

      socketio.to(socketid).emit('messagefordatachannel', msgToSend);
			//socketio.sockets.socket(socketid).emit('messagefordatachannel', msgToSend);

		});

		socket.on('create or join', function (room) {

      var clients = findClientsSocket(room.room);//socketio.nsps['/'].adapter.rooms[room.room];//var clients = socketio.sockets.clients(room.room);

      var numClients = clients.length;

      var socketid = '';

			var canJoin = true;

      for(var i in clients){
        if(clients[i].username == room.username){
          socketid = clients[i].id;
          canJoin = false;
          logger.serverLog('info', 'socketio.js on(create or join) Joining twice');
        }
      }

			if (numClients === 0){
				socket.join(room.room);
        socket.username= room.username;
        logger.serverLog('info', 'socketio.js on(create or join) : '+room.username +' created the room.');
        //console.log(room.username +' joined the room.')
				socket.emit('created', room);
			} else if (numClients === 1) {
				if(canJoin){
          socketio.in(room.room).emit('join', room);
					socket.join(room.room);
          socket.username= room.sername;
					socket.emit('joined', room);
          logger.serverLog('info', 'socketio.js on(create or join) : '+room.username +' joined the room.');
				}
				else{
					//socket.join(room.room);
					//socket.emit('created', room);
					socket.emit('joining twice', room);
				}
			} else { // max two clients
				socket.emit('full', room.room);
			}

			socket.emit('emit(): client ' + socket.id + ' joined room ' + room.room);
			//socket.broadcast.emit('broadcast(): client ' + socket.id + ' joined room ' + room.room);

			//console.log(socketio.sockets.manager.rooms)

		});

		socket.on('join global chatroom', function (room) {

			socket.join(room.room);

      socket.username= room.user.username;

      logger.serverLog('info', 'Data Sent to global chat room handler: '+ room);

      logger.serverLog('info', 'you are trying to join global chat room now.');
			//console.log(room.user.username +' has joined the room.')
			var myOnlineContacts = [];

      var clients = findClientsSocket(room.room);//socketio.nsps['/'].adapter.rooms[room.room];//var clients = socketio.sockets.clients(room.room);

			var socketid = '';

			var contactslist = require('./../api/contactslist/contactslist.model.js');

			contactslist.find({userid : room.user._id}).populate('contactid').exec(function(err3, gotContactList){
        if(err3) logger.serverLog('error', 'socketio.js on(join global chatroom) : '+ err3);

				if(gotContactList != null){

          for(var i in clients){
            for(var j in gotContactList){
              if(gotContactList[j].contactid != null){
                if(clients[i].username == gotContactList[j].contactid.username){
                  socketid = clients[i].id;
                  socketio.to(socketid).emit('online', room.user);
                  //socketio.sockets.socket(socketid).emit('online', room.user);
                  myOnlineContacts.push(gotContactList[j].contactid);
                }
              }
            }
          }

					socket.emit('youareonline', myOnlineContacts);

          logger.serverLog('info', 'socketio.js on : '+room.user.username +' logged in. Global chat room was joined.');

				}

			});

			//console.log(socketio.sockets.manager.rooms);
			//console.log(room.user.username)

		});

		socket.on('whozonline', function(room){
			var myOnlineContacts = [];

      var clients = findClientsSocket(room.room);//socketio.nsps['/'].adapter.rooms[room.room];//var clients = socketio.sockets.clients(room.room);

			var socketid = '';

      logger.serverLog('info', 'socketio.js on(whozonline) : client asks about online peers');

			var contactslist = require('./../api/contactslist/contactslist.model.js');

			contactslist.find({userid : room.user._id}).populate('contactid').exec(function(err3, gotContactList){
        if(err3) logger.serverLog('error', 'socketio.js on(whozonline) : '+ err3);

				if(gotContactList != null){

          for(var i in clients){
            for(var j in gotContactList){
              if(gotContactList[j].contactid != null){
                if(clients[i].username == gotContactList[j].contactid.username){
                  socketid = clients[i].id;
                  socketio.to(socketid).emit('online', room.user);
                  //socketio.sockets.socket(socketid).emit('online', room.user);
                  myOnlineContacts.push(gotContactList[j].contactid);
                }
              }
            }
          }

					socket.emit('theseareonline', myOnlineContacts);

				}

			})
		});

		socket.on('callthisperson', function(message){
    try {

      console.log(message);

      var socketidSender = socket.id;

      var clients = findClientsSocket(message.room);//socketio.nsps['/'].adapter.rooms[room.room];//var clients = socketio.sockets.clients(room.room);

      var socketid = '';

      for (var i in clients) {
        if (clients[i].username == message.callee) {
          socketid = clients[i].id;
        }
      }

      if (socketid == '') {
        socket.emit('calleeisoffline', message.callee);
      }
      else {
        socketio.to(socketid).emit('areyoufreeforcall', {caller: message.caller, sendersocket: socketidSender});
        logger.serverLog('info', 'socketio.js on(callthisperson) : see if callee is free to call');

      }
    }catch(e){
      logger.serverLog('error', 'socketio.js on(callthisperson) : '+ e);
    }

  });

  socket.on('callthisgroup', function(message){
    try {

      console.log(message);

      var socketidSender = socket.id;

      var clients = findClientsSocket(message.room);//socketio.nsps['/'].adapter.rooms[room.room];//var clients = socketio.sockets.clients(room.room);

      var socketid = '';

      for (var i in clients) {
        for(var j in message.callees){
          if (clients[i].username == message.callees[j].user_id.username) {
            socketid = clients[i].id;
            if (socketid == '') {
              socket.emit('groupmemberisoffline', message.callee);
            }
            else {
              if(clients[i].username != message.caller) {
                socketio.to(socketid).emit('areyoufreeforgroupcall', {
                  caller: message.caller,
                  sendersocket: socketidSender
                });
                logger.serverLog('info', 'socketio.js on(callthisgroup) : see if callee is free for group call');
              }
            }
          }
        }
      }

    }catch(e){
      logger.serverLog('error', 'socketio.js on(callthisperson) : '+ e);
    }

  });

		socket.on('noiambusy', function(message){

      try {
        var clients = findClientsSocket(message.room);//socketio.nsps['/'].adapter.rooms[room.room];//var clients = socketio.sockets.clients(room.room);

        var socketid = '';

        for (var i in clients) {
          if (clients[i].username == message.mycaller) {
            socketid = clients[i].id;
          }
        }

        if (socketid == '') {
          //socket.emit('calleeisoffline', message.callee);
          logger.serverLog('info', 'socketio.js on(noiambusy) : callee is offline');
        }
        else {
          socketio.to(socketid).emit('calleeisbusy', {callee: message.me});
          //socketio.sockets.socket(socketid).emit('calleeisbusy', {callee : message.me});
        }
      }catch(e){
        logger.serverLog('error', 'socketio.js on(noiambusy) : '+ e);
      }

		});

  socket.on('noiambusyforgroupcall', function(message){

    try {
      var clients = findClientsSocket(message.room);//socketio.nsps['/'].adapter.rooms[room.room];//var clients = socketio.sockets.clients(room.room);

      var socketid = '';

      for (var i in clients) {
        if (clients[i].username == message.mycaller) {
          socketid = clients[i].id;
        }
      }

      if (socketid == '') {
        //socket.emit('calleeisoffline', message.callee);
        logger.serverLog('info', 'socketio.js on(noiambusy) : callee is offline');
      }
      else {
        socketio.to(socketid).emit('groupmemberisbusy', {callee: message.me});
        //socketio.sockets.socket(socketid).emit('calleeisbusy', {callee : message.me});
      }
    }catch(e){
      logger.serverLog('error', 'socketio.js on(noiambusyforgroupcall) : '+ e);
    }

  });

		socket.on('yesiamfreeforcall', function(message){

      try {
        var clients = findClientsSocket(message.room);//socketio.nsps['/'].adapter.rooms[room.room];//var clients = socketio.sockets.clients(room.room);

        var socketid = '';

        for (var i in clients) {
          if (clients[i].username == message.mycaller) {
            socketid = clients[i].id;
          }
        }

        if (socketid == '') {
          socket.emit('disconnected', message.mycaller);
        }
        else {
          socketio.to(socketid).emit('othersideringing', {callee: message.me});
          //socketio.sockets.socket(socketid).emit('othersideringing', {callee : message.me});
        }
      }catch(e){
        logger.serverLog('error', 'socketio.js on(yesiamfreeforcall) : '+ e);
      }

		});

  socket.on('yesiamfreeforgroupcall', function(message){

    try {
      var clients = findClientsSocket(message.room);//socketio.nsps['/'].adapter.rooms[room.room];//var clients = socketio.sockets.clients(room.room);

      var socketid = '';

      for (var i in clients) {
        if (clients[i].username == message.mycaller) {
          socketid = clients[i].id;
        }
      }

      if (socketid == '') {
        socket.emit('disconnected', message.mycaller);
      }
      else {
        socketio.to(socketid).emit('groupmembersideringing', {callee: message.me});
        //socketio.sockets.socket(socketid).emit('othersideringing', {callee : message.me});
      }
    }catch(e){
      logger.serverLog('error', 'socketio.js on(yesiamfreeforgroupcall) : '+ e);
    }

  });

		socket.on('im', function(im){

      try {

        var clients = findClientsSocket(im.room);//socketio.nsps['/'].adapter.rooms[room.room];//var clients = socketio.sockets.clients(room.room);

        var socketid = '';

        for (var i in clients) {
          if (clients[i].username == im.stanza.to) {
            socketid = clients[i].id;
          }
        }

        // saving to the database

        var contactslist = require('./../api/contactslist/contactslist.model.js');

        var userchat = require('./../api/userchat/userchat.model.js');

        var newUserChat = new userchat({
          to: im.stanza.to,
          from: im.stanza.from,
          fromFullName: im.stanza.fromFullName,
          msg: im.stanza.msg,
          owneruser: im.stanza.to
        });

        newUserChat.save(function (err2) {
          if (err2) return console.log('Error 2' + err2);

          contactslist.findOne({
            userid: im.stanza.to_id,
            contactid: im.stanza.from_id
          }).exec(function (err3, gotContact) {

            gotContact.unreadMessage = true;

            gotContact.save(function (err) {

            })

          })
        });


        newUserChat = new userchat({
          to: im.stanza.to,
          from: im.stanza.from,
          fromFullName: im.stanza.fromFullName,
          msg: im.stanza.msg,
          owneruser: im.stanza.from
        });

        newUserChat.save(function (err2) {
          if (err2) return console.log('Error 2' + err2);
        });

        socketio.to(socketid).emit('im', im.stanza);
        //socketio.sockets.socket(socketid).emit('im', im.stanza);
      }catch(e){
        logger.serverLog('error', 'socketio.js on(im) : '+ e);
      }

		});

		socket.on('friendrequest', function(im){
      try {

        logger.serverLog('info', 'freind request sent using socket: '+ JSON.stringify(im));

        var clients = findClientsSocket(im.room);//socketio.nsps['/'].adapter.rooms[room.room];//var clients = socketio.sockets.clients(room.room);

        var socketid = '';

        for (var i in clients) {
          if (clients[i].username == im.contact) {
            socketid = clients[i].id;
          }
        }

        socketio.to(socketid).emit('friendrequest', im);
        //socketio.sockets.socket(socketid).emit('friendrequest', im);
      }catch(e){
        logger.serverLog('error', 'socketio.js on(friendrequest) : '+ e);
      }

		});

		socket.on('leave', function (room) {

      socketio.in(room.room).emit('left', room);
			socket.leave(room.room);
			socket.emit('left', room);





			//console.log(socketio.sockets.manager.rooms)

		});

		socket.on('status', function (room) {
      try {

        var clients = findClientsSocket(room.room);//socketio.nsps['/'].adapter.rooms[room.room];//var clients = socketio.sockets.clients(room.room);

        var socketid = '';

        var contactslist = require('./../api/contactslist/contactslist.model.js');

        contactslist.find({userid: room.user._id}).populate('contactid').exec(function (err3, gotContactList) {

          if (gotContactList != null) {

            for (var i in clients) {
              for (var j in gotContactList) {
                if (gotContactList[j].contactid != null) {
                  if (clients[i].username == gotContactList[j].contactid.username) {
                    socketid = clients[i].id;
                    socketio.to(socketid).emit('statusUpdate', room.user);
                  }
                }
              }
            }

          }

        });

        //		 socket.broadcast.to(room.room).emit('statusUpdate', room.user);
        //console.log(socketio.sockets.manager.rooms)
      }catch(e){
        logger.serverLog('error', 'socketio.js on(status) : '+ e);
      }

		});

  /* TODO Remove this code, this is deprecated now */
		socket.on('create or join meeting', function (room) {

      //console.log(room);

      var clients = findClientsSocket(room.room);//socketio.nsps['/'].adapter.rooms[room.room];//var clients = socketio.sockets.clients(room.room);

      //console.log(clients);

      var numClients = clients.length;

      //log('Room ' + room.room + ' has ' + numClients + ' client(s)');
      //log('Request to create or join room ' + room.room + ' from '+ room.username);
      logger.serverLog('info', 'Request to create or join room ' + room.room + ' from '+ room.username);

      var clientsIDs = new Array(numClients);

      for(var i in clients){
          clientsIDs[i] = clients[i].username;
      }

      console.log('people in room: ', clientsIDs);

			if (numClients === 0){
				socket.join(room.room);
        socket.username= room.username;

        console.log('room created');
        logger.serverLog('info', 'Room created  ')

				socket.emit('created', room);
			} else if (numClients < 5) {//(numClients === 2 || numClients === 1 || numClients === 3 || numClients === 4) {
				socket.join(room.room);
        socket.username= room.username;

				room.otherClients = clientsIDs;
				socket.emit('joined', room);

        console.log('room joined');
        logger.serverLog('info', 'Room joined  ')

        clientsIDs.push(room.username);

				room.otherClients = clientsIDs;
        socketio.in(room.room).emit('join', room);

			} else { // max five clients
				socket.emit('full', room.room);
        logger.serverLog('info', 'Room is full  ')
			}

			//console.log(socketio.sockets.manager.rooms)

		});

		socket.on('create or join livehelp', function (room) {
      try {
        var clients = findClientsSocket(room.room);
        var numClients = clients.length;

        if (numClients === 0) {
          socket.join(room.room);
          socket.username = room.username;
          socket.emit('created', room);
        } else if (numClients < 2) {
          socket.join(room.room);
          socket.username = room.username;
          socket.emit('joined', room);

          socket.broadcast.to(room.room).emit('join', room);

        } else { // max three clients
          socket.emit('full', room.room);
        }

        //console.log(socketio.sockets.manager.rooms);
        //console.log(room)
      }catch(e){
        logger.serverLog('error', 'socketio.js on(create or join livehelp) : '+ e);
      }

		});

  socket.on('logClient', function(data){
    logger.serverLog("info", "Client side log: "+ data);
  });


  function findClientsSocket(roomId, namespace) {
    var res = []
      , ns = socketio.of(namespace ||"/");    // the default namespace is "/"

    if (ns) {
      for (var id in ns.connected) {
        if(roomId) {
          var index = ns.connected[id].rooms.indexOf(roomId) ;
          if(index !== -1) {
            res.push(ns.connected[id]);
          }
        } else {
          res.push(ns.connected[id]);
        }
      }
    }

    return res;
  }


	/* Socket.io 0.9.x (don't use them, they are compatible with old version)
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



var rooms = {};
var userIds = {};


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
      conferenceDisconnect(socketio, socket);
      //console.info('[%s] DISCONNECTED', socket.address);
    });

    // Call onConnect.
    onConnect(socketio, socket);
    console.info('[%s] CONNECTED', socket.address);

    /**
     *
     * New Conference Code
     *
     */

    var currentRoom, id;

    socket.on('init', function (data, fn) {
      currentRoom = (data || {}).room || uuid.v4();
      var room = rooms[currentRoom];
      if (!room) {
        socket.username = data.username;
        rooms[currentRoom] = [socket];
        id = userIds[currentRoom] = 0;
        fn(currentRoom, id);
        logger.serverLog('info', 'Room created, with #', currentRoom);
      } else {
        if (!room) {
          return;
        }
        userIds[currentRoom] += 1;
        id = userIds[currentRoom];
        fn(currentRoom, id);
        room.forEach(function (s) {
          s.emit('peer.connected', { id: id, username: data.username });
        });
        socket.username = data.username;
        room[id] = socket;
        logger.serverLog('info', 'Peer connected to room', currentRoom, 'with #', id);
      }
    });

    socket.on('msg', function (data) {
      var to = parseInt(data.to, 10);
      if (rooms[currentRoom] && rooms[currentRoom][to]) {
        //logger.serverLog('info', 'Redirecting message to', to, 'by', data.by);
        rooms[currentRoom][to].emit('msg', data);
      } else {
        //logger.serverLog('warn', 'Invalid user');
      }
    });

    socket.on('conference.chat', function(data){
      rooms[currentRoom].forEach(function (s) {
        s.emit('conference.chat', { username: data.username, message: data.message });
      });
      if(data.support_call.companyid){
        sendToCloudKibo(data.support_call);
      }
    });

    socket.on('conference.stream', function(data){
      rooms[currentRoom].forEach(function (s) {
        s.emit('conference.stream', { username: data.username, type: data.type, action: data.action, id: data.id });
      });
    });

    function conferenceDisconnect(socketio, socket){
      if (!currentRoom || !rooms[currentRoom]) {
        return;

      }
      logger.serverLog('info', rooms[currentRoom][rooms[currentRoom].indexOf(socket)].username+' is disconnected from room '+rooms[currentRoom][rooms[currentRoom].indexOf(socket)]);
      delete rooms[currentRoom][rooms[currentRoom].indexOf(socket)];
      rooms[currentRoom].forEach(function (socket) {
        if (socket) {
          socket.emit('peer.disconnected', { id: id });
        }
      });
      /*userIds[currentRoom] -= 1;
      if(userIds[currentRoom] < 0){
        delete userIds[currentRoom];
        delete rooms[currentRoom];
      }*/
    }

    /**
     *
     * End New Conference Code
     *
     */

  });
};

function sendToCloudKibo(myJSONObject) {
  var request = require('request');
  console.log(myJSONObject)

  var fs = require('fs');

  var options = {
    url: "https://api.kibosupport.com/api/userchats/",
    method: "POST",
    json: true,   // <--Very important!!!
    body: myJSONObject,
    ca: fs.readFileSync('server/security/gd_bundle-g2-g1.crt'),
    key: fs.readFileSync('server/security/server.key'),
    cert: fs.readFileSync('server/security/d499736eb44cc97a.crt')
  };
  console.log(fs.readFileSync('server/security/gd_bundle-g2-g1.crt'))

  request(options,
    function (error, response, body){
	  console.log(error)
    console.log(response);
    console.log(body);
  });
}
