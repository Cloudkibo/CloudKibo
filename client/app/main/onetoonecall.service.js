/**
 * Created by sojharo on 9/1/2015.
 */
/* global RTCIceCandidate, RTCSessionDescription, RTCPeerConnection, EventEmitter */
'use strict';


angular.module('cloudKiboApp')
  .factory('OneToOneCallService', function ($rootScope, $q, socket, $log, logger) {

    socket.on('calleeisoffline', function (nickname) {
      $log.info('Callee is OFFLINE');
      $rootScope.$broadcast('calleeisoffline', nickname);
      //api.trigger('calleeisoffline', [nickname]);
    });
    socket.on('calleeisbusy', function (data) {
      $log.info('Callee is BUSY');
      $rootScope.$broadcast('calleeisbusy', data);
      //api.trigger('calleeisbusy', [data]);
    });
    socket.on('othersideringing', function (data) {
      $log.info('Callee is ringing on other side')
      $rootScope.$broadcast('othersideringing', data);
      //api.trigger('othersideringing', [data]);
    });
    socket.on('areyoufreeforcall', function (data) {
      $rootScope.$broadcast('areyoufreeforcall', data);
      //api.trigger('areyoufreeforcall', [data]);
    });
    socket.on('message', function (data) {
      $log.info('Client received message ON SERVICE: '+ data);
      $rootScope.$broadcast('message', data);
      //api.trigger('message', [data]);
    });
    socket.on('disconnected', function (data) {
      $rootScope.$broadcast('disconnected', data);
      //api.trigger('disconnected');
    });

    function addHandlers(socket) {

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
