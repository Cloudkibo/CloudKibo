'use strict';


angular.module('cloudKiboApp')
  .factory('GroupCallService', function ($rootScope, $q, socket, $log, logger) {

    function addHandlers(socket) {
      socket.on('groupmemberisoffline', function (nickname) {
        $log.info('Member is OFFLINE');
        api.trigger('groupmemberisoffline', [nickname]);
      });
      socket.on('groupmemeberisbusy', function (data) {
        $log.info('Group member is BUSY');
        api.trigger('groupmemeberisbusy', [data]);
      });
      socket.on('groupmembersideringing', function (data) {
        $log.info('Callee is ringing on other side');
        api.trigger('groupmemebersideringing', [data]);
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
