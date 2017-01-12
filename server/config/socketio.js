/**
 * Socket.io configuration
 */

'use strict';

var azure = require('azure');
var notificationHubService = azure.createNotificationHubService('Cloudkibo','Endpoint=sb://cloudkibo.servicebus.windows.net/;SharedAccessKeyName=DefaultFullSharedAccessSignature;SharedAccessKey=arTrXZQGBUeuLYLcwTTzCVqFDN1P3a6VrxA15yvpnqE=');
var config = require('./environment');
var logger = require('../components/logger/logger');
var debuggers = require('../components/debugger/debugger');
var user = require('../api/user/user.model');


function sendPushNotification(tagname, payload, sendSound){
  tagname = tagname.substring(1);
  var iOSMessage = {
    alert : payload.msg,
    sound : 'UILocalNotificationDefaultSoundName',
    badge : payload.badge,
    payload : payload
  };
  if(!sendSound){
    iOSMessage = {
      payload : payload
    };
  }
  var androidMessage = {
    to : tagname,
    priority : 'high',
    data : {
      message : payload
    }
  }
  notificationHubService.gcm.send(tagname, androidMessage, function(error){
    if(!error){
      logger.serverLog('info', 'Azure push notification sent to Android using GCM Module, client number : '+ tagname);
    } else {
      logger.serverLog('info', 'Azure push notification error : '+ JSON.stringify(error));
    }
  });
  notificationHubService.apns.send(tagname, iOSMessage, function(error){
    if(!error){
      logger.serverLog('info', 'Azure push notification sent to iOS using GCM Module, client number : '+ tagname);
    } else {
      logger.serverLog('info', 'Azure push notification error : '+ JSON.stringify(error));
    }
  });

  // For iOS Local testing only
  var notificationHubService2 = azure.createNotificationHubService('CloudKiboIOSPush','Endpoint=sb://cloudkiboiospush.servicebus.windows.net/;SharedAccessKeyName=DefaultFullSharedAccessSignature;SharedAccessKey=0JmBCY+BNqMhuAS1g39wPBZFoZAX7M+wq4z4EWaXgCs=');

  notificationHubService2.apns.send(tagname, iOSMessage, function(error){
    if(!error){
      logger.serverLog('info', 'Azure push notification sent to iOS (local testing) using GCM Module, client number : '+ tagname);
    } else {
      logger.serverLog('info', 'Azure push notification error (iOS local testing) : '+ JSON.stringify(error));
    }
  });

}


// When the user disconnects.. perform this
function onDisconnect(socketio, socket) {

  var clients = findClientsSocket('globalchatroom'); //socketio.nsps['/'].adapter.rooms[room.room];//var clients = socketio.sockets.clients(room.room);
  var socketid = '';
  var user = require('./../api/user/user.model.js');

  logger.serverLog('info', 'socketio.js on : ' + socket.phone + ' has disconnected.');

  user.findOne({
    phone: socket.phone
  }, function(err, gotuser) {
    if (err) logger.serverLog('error', 'socketio.js onDisconnect : ' + err);

    //logger.serverLog('info', 'socketio.js on : Data of user going offline : '+ JSON.stringify(gotuser));

    if (gotuser != null) {

      var contactslist = require('./../api/contactslist/contactslist.model.js');

      contactslist.find({
        userid: gotuser._id
      }).populate('contactid').exec(function(err3, gotContactList) {

        if (gotContactList != null) {

          for (var i in clients) {
            for (var j in gotContactList) {
              if (gotContactList[j].contactid != null) {
                if (clients[i].phone == gotContactList[j].contactid.phone) {
                  socketid = clients[i].id;
                  //logger.serverLog('info', 'socketio.js on : Informing '+ clients[i].phone +' of user going offline : '+ socket.phone);
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
    var res = [],
      ns = socketio.of(namespace || "/"); // the default namespace is "/"

    if (ns) {
      for (var id in ns.connected) {
        if (roomId) {
          try {
            var index = ns.connected[id].rooms.indexOf(roomId);
            if (index !== -1) {
              res.push(ns.connected[id]);
            }
          } catch (e) {
            console.log(e);
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

  // convenience function to log server messages on the client
  function log() {
    var array = [">>> Message from server: "];
    for (var i = 0; i < arguments.length; i++) {
      array.push(arguments[i]);
    }
    socket.emit('log', array);
  }

  socket.on('message', function(message) {
    console.log('Got message:', message.msg);

    try {
      message.msg.from = socket.id;
    } catch (e) {
      if (e) logger.serverLog('warn', 'socketio.js on(message) : ' + e);
    }

    var clients = findClientsSocket('globalchatroom'); //socketio.nsps['/'].adapter.rooms[room.room];//var clients = socketio.sockets.clients(room.room);

    var socketid = '';

    for (var i in clients) {
      if (clients[i].phone == message.to) {
        socketid = clients[i].id;
      }
    }

    logger.serverLog('info', 'sending socket.io "message" to other client');

    if (socketid == '') {
      //socket.emit('disconnected', message.mycaller);
    } else {
      socketio.to(socketid).emit('message', message.msg);
      //socketio.sockets.socket(socketid).emit('message', message.msg);
    }
  });

  socket.on('group_call_message', function(message) {
    console.log('Got message:', message.msg);

    try {
      message.msg.from = socket.id;
    } catch (e) {
      if (e) logger.serverLog('warn', 'socketio.js on(message) : ' + e);
    }

    var clients = findClientsSocket('globalchatroom'); //socketio.nsps['/'].adapter.rooms[room.room];//var clients = socketio.sockets.clients(room.room);

    var socketid = '';

    for (var i in clients) {
      if (clients[i].phone == message.to) {
        socketid = clients[i].id;
      }
    }

    logger.serverLog('info', 'sending socket.io group call "message" to other client');

    if (socketid == '') {
      //socket.emit('disconnected', message.mycaller);
    } else {
      socketio.to(socketid).emit('group_call_message', message.msg);
      //socketio.sockets.socket(socketid).emit('message', message.msg);
    }
  });


  socket.on('messagefordatachannel', function(message) {
    //console.log('Got message:', message);

    //socket.broadcast.emit('message', message);

    try {
      message.msg.from = socket.id;
    } catch (e) {
      if (e) logger.serverLog('warn', 'socketio.js on(messagefordatachannel) : ' + e);
    }

    var clients = findClientsSocket('globalchatroom'); //socketio.nsps['/'].adapter.rooms[room.room];//var clients = socketio.sockets.clients(room.room);

    var socketid = '';

    for (var i in clients) {
      if (clients[i].phone == message.to) {
        socketid = clients[i].id;
      }
    }

    var msgToSend = message.msg;

    try {
      if (typeof msgToSend != 'object')
        msgToSend = JSON.parse(msgToSend);
    } catch (e) {
      if (e) logger.serverLog('error', 'socketio.js on(messagefordatachannel) : ' + e);
    }

    try {
      msgToSend.from = message.from;
    } catch (e) {
      if (e) logger.serverLog('warn', 'socketio.js on(messagefordatachannel) : ' + e);
    }

    socketio.to(socketid).emit('messagefordatachannel', msgToSend);
    //socketio.sockets.socket(socketid).emit('messagefordatachannel', msgToSend);

  });

  socket.on('join global chatroom', function(room) {

    socket.join(room.room);

    user.findOne({phone : room.user.phone}, function(err, dataUser){
      var payload = {
        data: {
          msg: 'Hello '+ room.user.phone +'! You joined the room.'
        },
        badge: 0
      };
      sendPushNotification(room.user.phone, payload, false);
      dataUser.iOS_badge = 0;
      dataUser.last_seen = Date.now();

      logger.serverLog('info', 'join global chat room update last seen: ' + JSON.stringify(dataUser));

      dataUser.save(function(err){
        if(err) logger.serverLog('info', 'join global chat room update last seen ERROR: ' + JSON.stringify(err));
      });
    });

    socket.phone = room.user.phone;

    logger.serverLog('info', 'Data Sent to global chat room handler: ' + JSON.stringify(room));

    //console.log(room.user.username +' has joined the room.')
    var myOnlineContacts = [];

    var clients = findClientsSocket('globalchatroom'); //socketio.nsps['/'].adapter.rooms[room.room];//var clients = socketio.sockets.clients(room.room);

    var socketid = '';

    var contactslist = require('./../api/contactslist/contactslist.model.js');

    contactslist.find({
      userid: room.user._id
    }).populate('contactid').exec(function(err3, gotContactList) {
      if (err3) logger.serverLog('error', 'socketio.js on(join global chatroom) : ' + err3);

      if (gotContactList != null) {

        for (var i in clients) {
          for (var j in gotContactList) {
            if (gotContactList[j].contactid != null) {
              if (clients[i].phone == gotContactList[j].contactid.phone) {
                socketid = clients[i].id;
                socketio.to(socketid).emit('online', room.user);
                //socketio.sockets.socket(socketid).emit('online', room.user);
                myOnlineContacts.push(gotContactList[j].contactid);
              }
            }
          }
        }

        socket.emit('youareonline', myOnlineContacts);

        logger.serverLog('info', 'socketio.js on : ' + room.user.phone + ' logged in. Global chat room was joined.');

      }

    });

    //console.log(socketio.sockets.manager.rooms);
    //console.log(room.user.username)

  });

  socket.on('whozonline', function(room) {
    var myOnlineContacts = [];

    var clients = findClientsSocket('globalchatroom'); //socketio.nsps['/'].adapter.rooms[room.room];//var clients = socketio.sockets.clients(room.room);

    var socketid = '';

    logger.serverLog('info', 'socketio.js on(whozonline) : client asks about online peers');

    var contactslist = require('./../api/contactslist/contactslist.model.js');

    contactslist.find({
      userid: room.user._id
    }).populate('contactid').exec(function(err3, gotContactList) {
      if (err3) logger.serverLog('error', 'socketio.js on(whozonline) : ' + err3);

      if (gotContactList != null) {

        for (var i in clients) {
          for (var j in gotContactList) {
            if (gotContactList[j].contactid != null) {
              if (clients[i].phone == gotContactList[j].contactid.phone) {
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

  socket.on('callthisperson', function(message, fn) {
    try {

      fn({status : 'ok', calleephone : message.calleephone});

      var socketidSender = socket.id;

      var clients = findClientsSocket('globalchatroom'); //socketio.nsps['/'].adapter.rooms[room.room];//var clients = socketio.sockets.clients(room.room);

      var socketid = '';

      for (var i in clients) {
        if (clients[i].phone == message.calleephone) {
          socketid = clients[i].id;
        }
      }

      if (socketid == '') {
        socket.emit('message', {calleephone : message.calleephone, callerphone : message.callerphone, status : "calleeoffline", type : "call"} );
      } else {
        socketio.to(socketid).emit('areyoufreeforcall', {
          callerphone : message.callerphone,
          calleephone : message.calleephone,
          sendersocket: socketidSender
        });
        logger.serverLog('info', 'socketio.js on(callthisperson) : see if callee is free to call');

      }

    } catch (e) {
      logger.serverLog('error', 'socketio.js on(callthisperson) : ' + e);
    }

  });

  socket.on('callthisgroup', function(message) {
    try {

      console.log(message);

      var socketidSender = socket.id;

      var clients = findClientsSocket('globalchatroom'); //socketio.nsps['/'].adapter.rooms[room.room];//var clients = socketio.sockets.clients(room.room);

      var socketid = '';

      for (var i in clients) {
        for (var j in message.callees) {
          if (clients[i].phone == message.callees[j].user_id.phone) {
            socketid = clients[i].id;
            if (socketid == '') {
              socket.emit('groupmemberisoffline', message.callee);
            } else {
              if (clients[i].phone != message.caller) {
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

    } catch (e) {
      logger.serverLog('error', 'socketio.js on(callthisperson) : ' + e);
    }

  });

  socket.on('noiambusyforgroupcall', function(message) {

    try {
      var clients = findClientsSocket('globalchatroom'); //socketio.nsps['/'].adapter.rooms[room.room];//var clients = socketio.sockets.clients(room.room);

      var socketid = '';

      for (var i in clients) {
        if (clients[i].phone == message.mycaller) {
          socketid = clients[i].id;
        }
      }

      if (socketid == '') {
        //socket.emit('calleeisoffline', message.callee);
        logger.serverLog('info', 'socketio.js on(noiambusy) : callee is offline');
      } else {
        socketio.to(socketid).emit('groupmemberisbusy', {
          callee: message.me
        });
        //socketio.sockets.socket(socketid).emit('calleeisbusy', {callee : message.me});
      }
    } catch (e) {
      logger.serverLog('error', 'socketio.js on(noiambusyforgroupcall) : ' + e);
    }

  });

  socket.on('yesiamfreeforgroupcall', function(message) {

    try {
      var clients = findClientsSocket('globalchatroom'); //socketio.nsps['/'].adapter.rooms[room.room];//var clients = socketio.sockets.clients(room.room);

      var socketid = '';

      for (var i in clients) {
        if (clients[i].phone == message.mycaller) {
          socketid = clients[i].id;
        }
      }

      if (socketid == '') {
        socket.emit('disconnected', message.mycaller);
      } else {
        socketio.to(socketid).emit('groupmembersideringing', {
          callee: message.me
        });
        //socketio.sockets.socket(socketid).emit('othersideringing', {callee : message.me});
      }
    } catch (e) {
      logger.serverLog('error', 'socketio.js on(yesiamfreeforgroupcall) : ' + e);
    }

  });

  socket.on('im', function(im, fn) {

    logger.serverLog('info', 'chat message -> ' + JSON.stringify(im));

    try {

      var clients = findClientsSocket('globalchatroom'); //socketio.nsps['/'].adapter.rooms[room.room];//var clients = socketio.sockets.clients(room.room);

      var socketid = '';

      for (var i in clients) {
        if (clients[i].phone == im.stanza.to) {
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
        owneruser: im.stanza.to,
        status: 'sent',
        uniqueid : im.stanza.uniqueid,
        type : im.stanza.type,
        file_type : im.stanza.file_type
      });

      newUserChat.save(function(err2) {
        if (err2) return console.log('Error 2' + err2);

        /*contactslist.findOne({
          userid: im.stanza.to_id,
          contactid: im.stanza.from_id
        }).exec(function(err3, gotContact) {

          gotContact.unreadMessage = true;

          gotContact.save(function(err) {

          })
        })*/

      });


      newUserChat = new userchat({
        to: im.stanza.to,
        from: im.stanza.from,
        fromFullName: im.stanza.fromFullName,
        msg: im.stanza.msg,
        owneruser: im.stanza.from,
        status: 'sent',
        uniqueid : im.stanza.uniqueid,
        type : im.stanza.type,
        file_type : im.stanza.file_type // 'image', 'document', 'audio', 'video'
      });

      newUserChat.save(function(err2) {
        if (err2) return console.log('Error 2' + err2);
      });

      logger.serverLog('info', 'sending chat to recipient and ack sender');
      socketio.to(socketid).emit('im', im.stanza);

      //if(socketid === '') {
        user.findOne({phone : im.stanza.to}, function(err, dataUser){
          var payload = {
            type : im.stanza.type,
            senderId : im.stanza.from,
            msg : im.stanza.msg.substring(0, 8),
            uniqueId : im.stanza.uniqueid,
            badge : dataUser.iOS_badge + 1
          };

          sendPushNotification(im.stanza.to, payload, true);

          dataUser.iOS_badge = dataUser.iOS_badge + 1;
          dataUser.save(function(err){

          });
        });
      //}

      //fn('sent', im.stanza.uniqueid);
      fn({status : 'sent', uniqueid : im.stanza.uniqueid});
      logger.serverLog('info', 'ack for incoming chat to server is sent');

      //socketio.sockets.socket(socketid).emit('im', im.stanza);
    } catch (e) {
      logger.serverLog('error', 'socketio.js on(im) : ' + e);
    }

  });

  socket.on('filedownloaded', function(data){
    logger.serverLog('info', 'server received file downloaded message from mobile '+ JSON.stringify(data));

    var clients = findClientsSocket('globalchatroom'); //socketio.nsps['/'].adapter.rooms[room.room];//var clients = socketio.sockets.clients(room.room);

    var socketid = '';

    for (var i in clients) {
      if (clients[i].phone == data.senderoffile) {
        socketid = clients[i].id;
      }
    }

    socketio.to(socketid).emit('filedownloaded', {receiver : data.receiveroffile, uniqueid : data.uniqueid});

  })

  socket.on('messageStatusUpdate', function(data, fn){

    logger.serverLog('info', 'server received message status update from mobile '+ JSON.stringify(data));

    var userchat = require('./../api/userchat/userchat.model.js');
    userchat.update(
      {uniqueid : data.uniqueid},
      {status : data.status}, // should have value one of 'delivered', 'seen'
      {multi : true},
      function (err, num){
        logger.serverLog('info', 'Rows updated here '+ num);

        var clients = findClientsSocket('globalchatroom'); //socketio.nsps['/'].adapter.rooms[room.room];//var clients = socketio.sockets.clients(room.room);

        var socketid = '';

        for (var i in clients) {
          if (clients[i].phone == data.sender) {
            socketid = clients[i].id;
          }
        }

        logger.serverLog('info', 'server sending message status update from mobile to other mobile now');

        var payload = {
          type : 'status',
          status : data.status,
          uniqueId : data.uniqueid
        };

        sendPushNotification(data.sender, payload, false);

        socketio.to(socketid).emit('messageStatusUpdate', {status : data.status, uniqueid : data.uniqueid});
        fn({status : 'statusUpdated', uniqueid : data.uniqueid});

      }
    );

  });

  socket.on('friendrequest', function(im) {
    try {

      logger.serverLog('info', 'freind request sent using socket: ' + JSON.stringify(im));

      var clients = findClientsSocket('globalchatroom'); //socketio.nsps['/'].adapter.rooms[room.room];//var clients = socketio.sockets.clients(room.room);

      var socketid = '';

      for (var i in clients) {
        if (clients[i].phone == im.contact) {
          socketid = clients[i].id;
        }
      }

      socketio.to(socketid).emit('friendrequest', im);
      //socketio.sockets.socket(socketid).emit('friendrequest', im);
    } catch (e) {
      logger.serverLog('error', 'socketio.js on(friendrequest) : ' + e);
    }

  });

  socket.on('leaveChat', function(room) {

    socketio.in(room.room).emit('left', room);
    socket.leave(room.room);
    socket.emit('offline', room);

    //console.log(socketio.sockets.manager.rooms)

  });

  socket.on('status', function(room) {
    try {

      var clients = findClientsSocket('globalchatroom'); //socketio.nsps['/'].adapter.rooms[room.room];//var clients = socketio.sockets.clients(room.room);

      var socketid = '';

      var contactslist = require('./../api/contactslist/contactslist.model.js');

      contactslist.find({
        userid: room.user._id
      }).populate('contactid').exec(function(err3, gotContactList) {

        if (gotContactList != null) {

          for (var i in clients) {
            for (var j in gotContactList) {
              if (gotContactList[j].contactid != null) {
                if (clients[i].phone == gotContactList[j].contactid.phone) {
                  socketid = clients[i].id;
                  socketio.to(socketid).emit('statusUpdate', room.user);
                }
              }
            }
          }

        }

      });

      //     socket.broadcast.to(room.room).emit('statusUpdate', room.user);
      //console.log(socketio.sockets.manager.rooms)
    } catch (e) {
      logger.serverLog('error', 'socketio.js on(status) : ' + e);
    }

  });

  socket.on('logClient', function(data) {
    logger.serverLog("info", "Client side log: " + data);
  });

  socket.on('recordError', function(data) {
    debuggers.recordError(data);
  });


  function findClientsSocket(roomId, namespace) {
    var res = [],
      ns = socketio.of(namespace || "/"); // the default namespace is "/"

    if (ns) {
      for (var id in ns.connected) {
        if (roomId) {
          var index = ns.connected[id].rooms.indexOf(roomId);
          if (index !== -1) {
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
  require('../api/companyaccount/companyaccount.socket').register(socket);
  //require('../api/thing/thing.socket').register(socket);
}



var rooms = {};
var userIds = {};
var roomlockStatus = {};
var socketlist = [];
module.exports = function(socketio) {


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

  socketio.on('connection', function(socket) {
    logger.serverLog('info', 'Client connected :' + socket.id);
    socket.address = socket.handshake.address !== null ?
      socket.handshake.address.address + ':' + socket.handshake.address.port :
      process.env.DOMAIN;

    socket.connectedAt = new Date();

    // Call onDisconnect.
    socket.on('disconnect', function() {
      onDisconnect(socketio, socket);
      conferenceDisconnect(socketio, socket);
      logger.serverLog('info', 'Client disconnected :'+ socket.id);
      //console.info('[%s] DISCONNECTED', socket.address);
    });

    // Call onConnect.
    onConnect(socketio, socket);
    //console.info('[%s] CONNECTED', socket.address);

    /**
     *
     * New Conference Code
     *
     */

    var currentRoom, id;

    socket.on('init', function(data, fn) {
      currentRoom = (data || {}).room || uuid.v4();
      socketlist.push(socket);
      var room = rooms[currentRoom];
      if (!room) {
        socket.username = data.username;
        if (data.supportcall)
          socket.supportcall = data.supportcall;
        rooms[currentRoom] = [socket];
        roomlockStatus[currentRoom] = false; // setting roomlock status to false on init
        console.log('Setting lock status of room :' + currentRoom + ' to false');
        id = userIds[currentRoom] = 0;
        fn(currentRoom, id, roomlockStatus[currentRoom]);
        //fn(currentRoom, id);

        logger.serverLog('info', 'Room created, with #', currentRoom);
      } else {
        if (!room) {
          return;
        }
        socket.username = data.username;

        if (roomlockStatus[currentRoom] === false) {
          userIds[currentRoom] += 1;
          id = userIds[currentRoom] + 10 + parseInt(Math.random().toString(8).substring(2,7));

          // fn(currentRoom, id);

          room.forEach(function(s) {
            console.log('peeer connedted ' + id);
            s.emit('peer.connected', {
              id: id,
              username: data.username
            });
          });

          room[id] = socket;
          logger.serverLog('info', 'Peer connected to room', currentRoom, 'with #', id);

        };
        fn(currentRoom, id, roomlockStatus[currentRoom]);
      }
      console.log("given id = "+ id);
    });

    socket.on('initRequestor', function(data) {

      var chk_if_already_added = false;
      var requestor_socket;
      socketlist.forEach(function(client) {
        if (client.username === data.username) {
          requestor_socket = client;
          console.log(requestor_socket.username);
        }
      });

      //adding requestor to room
      var room = rooms[data.room];
      room.forEach(function(s) {
        if (s.id == requestor_socket.id) {
          console.log('this person is already added in room');
          chk_if_already_added = true;
        }
      });
      if (chk_if_already_added == false) {
        userIds[data.room] += 1;
        id = userIds[data.room] + 10 + parseInt(Math.random().toString(8).substring(2,7));
        room.forEach(function(s) {
          console.log('peeer connedted ' + id);

          s.emit('peer.connected', {
            id: id,
            username: data.username
          });
        });
        console.log('Adding Requestor : ' + data.username);
        room[id] = requestor_socket;

        room[id].emit('initRequestor', {
          currentRoom: data.room,
          id: id,
          roomStatus: roomlockStatus[data.room]
        });
        logger.serverLog('info', 'Peer connected to room', data.room, 'with #', id);
        console.log('Peer connected to room : ' + data.room + 'with #' + id);

      }



    });


    socket.on('initRequestor_webmeeting', function(data) {

      var chk_if_already_added = false;
      var requestor_socket;
      socketlist.forEach(function(client) {
        if (client.username === data.username) {
          requestor_socket = client;
          console.log(requestor_socket.username);
        }
      });

      //adding requestor to room
      var room = rooms[data.room];
      room.forEach(function(s) {
        if (s.id == requestor_socket.id) {
          console.log('this person is already added in room');
          chk_if_already_added = true;
        }
      });
      if (chk_if_already_added == false) {
        userIds[data.room] += 1;
        id = userIds[data.room] +10 + parseInt(Math.random().toString(8).substring(2,7));
        room.forEach(function(s) {
          console.log('peeer connedted ' + id);

          s.emit('peer.connected.new', {
            id: id,
            username: data.username
          });
        });
        console.log('Adding Requestor : ' + data.username);
        room[id] = requestor_socket;

        room[id].emit('initRequestor_webmeeting', {
          currentRoom: data.room,
          id: id,
          roomStatus: roomlockStatus[data.room]
        });
        logger.serverLog('info', 'Peer connected to room', data.room, 'with #', id);
        console.log('Peer connected to room : ' + data.room + 'with #' + id);

      }



    });

    socket.on('knock.request', function(data) {

      rooms[data.room].forEach(function(s) {
        s.emit('knock.request', {
          room: data.room,
          requestor: data.username,
          supportcall: data.supportCallData
        });
      });
    });

    socket.on('getRoomStatus', function(data, fn) {
      console.log('getRoomStatus ... ');
      fn(roomlockStatus[currentRoom]);
    });

    socket.on('msg', function(data) {
      var to = parseInt(data.to, 10);
      if (rooms[currentRoom] && rooms[currentRoom][to]) {
        //logger.serverLog('info', 'Redirecting message to', to, 'by', data.by);
        rooms[currentRoom][to].emit('msg', data);
      } else {
        //logger.serverLog('warn', 'Invalid user');
      }
    });

    socket.on('room.lock', function(data) {
      console.log('data.status : ' + data.status);
      roomlockStatus[data.currentRoom] = data.status;
      rooms[currentRoom].forEach(function(s) {
        s.emit('room.lock', {
          status: data.status
        });
      });
    });

    socket.on('conference.chat', function(data) {
      console.log('conference.chat is called.');
      rooms[currentRoom].forEach(function(s) {
        console.log('sending message !!!!');
        s.emit('conference.chat', {
          username: data.username,
          message: data.message
        });
      });

      if (data.support_call) {
        if (data.support_call.companyid) {
          var meetingchat = require('./../api/meetingchat/meetingchat.model.js');

          var newUserChat = new meetingchat({
            to: data.support_call.to,
            from: data.support_call.from,
            visitoremail: data.support_call.visitoremail,
            agentemail: data.support_call.agentemail,
            msg: data.message,
            request_id: data.support_call.request_id,
            companyid: data.support_call.companyid
          });

          newUserChat.save(function(err2) {
            if (err2) return console.log('Error 2' + err2);
          });
          sendToCloudKibo(data.support_call);
        }
      }
    });

    socket.on('conference.stream', function(data) {
      rooms[currentRoom].forEach(function(s) {
        s.emit('conference.stream', {
          username: data.username,
          type: data.type,
          action: data.action,
          id: data.id
        });
      });
    });

    var ice;


    socket.on('turnServers', function(data, fn) {

      // Asking the XirSys the addresses of TURN servers from server side
      var needle = require('needle');

      var options = {
        headers: {
          'X-Custom-Header': 'CloudKibo Web Application'
        }
      }

      needle.post('https://service.xirsys.com/ice', {
        ident: "testcloudkibo",
        secret: "9846fdca-ec48-11e5-9e57-6d5d0b63fdb1",
        domain: "api.cloudkibo.com",
        application: "default",
        room: "default",
        secure: 0
      }, options, function(err, resp) {
        //console.log(err);
        console.log(resp.body);

        ice = resp.body.d;

        var accountSid = 'ACdeb74ff803b2e44e127d0570e6248b3b';
        var authToken = "5c13521c7655811076a9c04d88fac395";
        var client = require('twilio')(accountSid, authToken);

        client.tokens.create({}, function(err, token) {
          console.log("");
          console.log(token.iceServers);

          ice.iceServers = ice.iceServers.concat(token.iceServers);

          console.log("")

          console.log(ice);
          fn(ice);

        });

      });

    });

    socket.on('init.new', function(data, fn) {
      currentRoom = (data || {}).room || uuid.v4();
      socketlist.push(socket);

      var room = rooms[currentRoom];
      if (!room) {
        socket.username = data.username;
        if (data.supportcall) socket.supportcall = data.supportcall;
        rooms[currentRoom] = [socket];
        id = userIds[currentRoom] = 0;
        roomlockStatus[currentRoom] = false; // setting roomlock status to false on init
        console.log('Setting lock status of room :' + currentRoom + ' to false');
        fn(currentRoom, id, roomlockStatus[currentRoom]);

        //   fn(currentRoom, id);
        logger.serverLog('info', 'Room created, with #', currentRoom);
      } else {
        if (!room) {
          return;
        }
        socket.username = data.username;

        if (roomlockStatus[currentRoom] === false) {
          userIds[currentRoom] += 1;
          id = userIds[currentRoom] + 10 + parseInt(Math.random().toString(8).substring(2,7));
          //  fn(currentRoom, id);
          room.forEach(function(s) {
            s.emit('peer.connected.new', {
              id: id,
              username: data.username
            });
          });
          socket.username = data.username;
          room[id] = socket;
          logger.serverLog('info', 'Peer connected to room', currentRoom, 'with #', id);

        }
        fn(currentRoom, id, roomlockStatus[currentRoom]);
      }
    });


    socket.on('msgAudio', function(data) {
      var to = parseInt(data.to, 10);
      if (rooms[currentRoom] && rooms[currentRoom][to]) {
        //logger.serverLog('info', 'Redirecting message to', to, 'by', data.by);
        rooms[currentRoom][to].emit('msgAudio', data);
      } else {
        //logger.serverLog('warn', 'Invalid user');
      }
    });

    socket.on('msgVideo', function(data) {
      var to = parseInt(data.to, 10);
      if (rooms[currentRoom] && rooms[currentRoom][to]) {
        //console.log('info', 'Redirecting message to', to, 'by', data.by);
        rooms[currentRoom][to].emit('msgVideo', data);
      } else {
        //logger.serverLog('warn', 'Invalid user');
      }
    });

    socket.on('msgScreen', function(data) {
      var to = parseInt(data.to, 10);
      if (rooms[currentRoom] && rooms[currentRoom][to]) {
        //console.log('info', 'Redirecting message to', to, 'by', data.by);
        rooms[currentRoom][to].emit('msgScreen', data);
      } else {
        //logger.serverLog('warn', 'Invalid user');
      }
    });

    socket.on('msgData', function(data) {
      var to = parseInt(data.to, 10);
      if (rooms[currentRoom] && rooms[currentRoom][to]) {
        //console.log('info', 'Redirecting message to', to, 'by', data.by);
        rooms[currentRoom][to].emit('msgData', data);
      } else {
        //logger.serverLog('warn', 'Invalid user');
      }
    });

    socket.on('conference.streamVideo', function(data) {
      rooms[currentRoom].forEach(function(s) {
        s.emit('conference.streamVideo', {
          username: data.username,
          type: data.type,
          action: data.action,
          id: data.id
        });
      });
    });

    socket.on('conference.streamScreen', function(data) {
      rooms[currentRoom].forEach(function(s) {
        s.emit('conference.streamScreen', {
          username: data.username,
          type: data.type,
          action: data.action,
          id: data.id
        });
      });
    });

    function conferenceDisconnect(socketio, socket) {


      if (!currentRoom || !rooms[currentRoom]) {
        return;

      }

      id = rooms[currentRoom].indexOf(socket);

      delete socketlist[socketlist.indexOf(socket)];
      delete rooms[currentRoom][rooms[currentRoom].indexOf(socket)];
      console.log('id is :' + id);
      rooms[currentRoom].forEach(function(socket) {
        if (socket) {
          socket.emit('peer.disconnected', {
            id: id
          });
          socket.emit('peer.disconnected.new', {
            id: id
          });
        }
      });
      /*userIds[currentRoom] -= 1;
      if(userIds[currentRoom] < 0){
        delete userIds[currentRoom];
        delete rooms[currentRoom];
      }*/


      /** to add ***/
      console.log('length of userIds is :' + userIds[currentRoom]);
      userIds[currentRoom] = userIds[currentRoom] - 1;
      console.log('length of userIds is :' + userIds[currentRoom]);
      if (userIds[currentRoom] < 1) {
        roomlockStatus[currentRoom] = false;
        rooms[currentRoom].forEach(function(s) {
          s.emit('room.unlock.meetingend', {
            status: false
          });
        });
      }

    }

    /**
     *
     * End New Conference Code
     *
     */

  });
};

function sendToCloudKibo(myJSONObject) {
  /*var request = require('request');
  console.log(myJSONObject)

  var fs = require('fs');
  var path = require('path');

  var options = {
    url: "https://api.kibosupport.com/api/userchats/",
    method: "POST",
    json: true,   // <--Very important!!!
    body: myJSONObject,
    ca: fs.readFileSync(path.resolve(__dirname, '../security/gd_bundle-g2-g1.crt')),
    key: fs.readFileSync(path.resolve(__dirname, '../security/server.key')),
    cert: fs.readFileSync(path.resolve(__dirname, '../security/d499736eb44cc97a.crt'))
  };

  console.log(fs.readFileSync(path.resolve(__dirname, '../security/d499736eb44cc97a.crt')));

  request(options,
    function (error, response, body){
    console.log(error)
    console.log(response);
    console.log(body);
  });*/

  var needle = require('needle');

  var options = {
    headers: {
      'X-Custom-Header': 'CloudKibo Web Application'
    }
  }

  needle.post('https://api.kibosupport.com/api/userchats/', myJSONObject, options, function(err, resp) {
    console.log(err);
    console.log(resp);
  });
}
