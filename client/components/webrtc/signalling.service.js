/**
 * Created by sojharo on 2/4/2015.
 */

/**
 * Created by sojharo on 2/3/2015.
 */

'use strict';

angular.module('cloudKiboApp')
    .factory('Signalling', function Signalling($rootScope, socket) {

        var peer;
        var username;
        var roomName;

        return {

            /**
             * Initialize the variables
             *
             * @param to
             * @param from
             * @param roomname
             */
            initialize: function(to, from, roomname){
                peer = to;
                username = from;
                roomName = roomname;
            },

            /**
             * Send message to other peer
             *
             * @param message
             */
            sendMessage: function(message){
                message = {msg:message};
                message.room = roomName;
                message.to = peer;
                message.username = username;
                //console.log('Client sending message: ', message);
                socket.emit('message', message);
            },

            sendMessageForDataChannel: function(message){
                message = {msg:message};
                message.room = roomName;
                message.to = peer;
                message.from = username;
                //console.log('Client sending message: ', message);
                socket.emit('messagefordatachannel', message);
            },

            sendMessageForMeeting: function (message) {
                message = {msg: message};
                message.room = roomName;
                message.username = username;
                //console.log('Client sending message: ', message);
                socket.emit('messageformeeting', message);
            },

            destroy: function () {
                peer = null;
                username = null;
                roomName = null;
            }

        };

    });
