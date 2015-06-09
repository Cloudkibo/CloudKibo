'use strict';

angular.module('kiboRtc.services')
  .factory('SocketConference', function RTCConference($rootScope, socket, Signalling) {

    socket.on('full', function (room){
      alert('Room ' + room + ' is full. You can not join the meeting.');
    });

    return {

      sendMessage: function(message){
        Signalling.sendMessageForMeeting(message);
      },

      createOrJoinMeeting : function(roomname, username){
        socket.emit('create or join meeting', {room: roomname, username: username});
      },

      leaveMeeting: function(roomname, username){
        socket.emit('leave', {room: roomname, username: username});
      }


    };


  });
