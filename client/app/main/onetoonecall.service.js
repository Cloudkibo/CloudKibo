/**
 * Created by sojharo on 9/1/2015.
 */
/* global RTCIceCandidate, RTCSessionDescription, RTCPeerConnection, EventEmitter */
'use strict';


angular.module('cloudKiboApp')
  .factory('OneToOneCallService', function ($rootScope, $q, socket, $log) {

    function addHandlers(socket) {
      socket.on('calleeisoffline', function (nickname) {
        $log.info('Callee is OFFLINE');
        api.trigger('calleeisoffline', [nickname]);
      });
      socket.on('calleeisbusy', function (data) {
        $log.info('Callee is BUSY');
        api.trigger('calleeisbusy', [data]);
      });
      socket.on('othersideringing', function (data) {
        $log.info('Callee is ringing on other side');
        api.trigger('othersideringing', [data]);
      });
      socket.on('areyoufreeforcall', function (data) {
        api.trigger('areyoufreeforcall', [data]);
      });
      socket.on('message', function (data) {
        api.trigger('message', [data]);
      });
    }

    var api = {
      sendMessage: function (m, d) {
        socket.emit(m, d);
      }
    };
    EventEmitter.call(api);
    Object.setPrototypeOf(api, EventEmitter.prototype);

    addHandlers(socket);
    return api;
  });
