/**
 * Created by sojharo on 9/1/2015.
 */
'use strict';


angular.module('cloudKiboApp')
  .factory('MainService', function ($rootScope, $q, socket, $log, logger) {

    socket.emit('join global chatroom', {room: 'globalchatroom', user: 'sojharo'});

    socket.on('youareonline', function (friends) {
      console.log('you are online')
    });

    socket.on('online', function (friend) {
      for (i in $scope.contactslist) {
        if ($scope.contactslist[i].contactid.username == friend.username) {
          $scope.contactslist[i].online = true;
          console.log("show online friends " + $scope.contactslist[i].online)
          logger.log("show online friends " + $scope.contactslist[i].online)
          $log.info("show online friends " + $scope.contactslist[i].online)
        }
      }
    });

    socket.on('offline', function (friend) {
      for (i in $scope.contactslist) {
        if ($scope.contactslist[i].contactid.username == friend.username) {
          $scope.contactslist[i].online = false;
          console.log("show Offline friends " + $scope.contactslist[i].online)
          logger.log("show Offline friends " + $scope.contactslist[i].online)
          $log.info("show Offline friends " + $scope.contactslist[i].online)
        }
      }
    });

    socket.on('youareonline', function (friends) {
      for (i in friends) {
        for (var j in $scope.contactslist) {
          if ($scope.contactslist[j].contactid.username == friends[i].username) {
            $scope.contactslist[j].online = true;
            console.log("show online to " + $scope.contactslist[j].online)
            $log.info("show online to " + $scope.contactslist[j].online)
            logger.log("show online to " + $scope.contactslist[j].online)
            break;
          }
        }
      }
    });

    socket.on('theseareonline', function (friends) {
      for (i in friends) {
        for (var j in $scope.contactslist) {
          if ($scope.contactslist[j].contactid.username == friends[i].username) {
            $scope.contactslist[j].online = true;

            break;
          }
        }
      }
    });

    socket.on('disconnected', function (data) {

      Sound.load();
      Sound.pause();

      $scope.ringing = false;
      $scope.amInCall = false;
      $scope.amInCallWith = '';
    });



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
