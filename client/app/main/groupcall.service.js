'use strict';


angular.module('cloudKiboApp')
  .factory('GroupCallService', function ($rootScope, $q, socket, $log, logger) {

    function addHandlers(socket) {
      socket.on('groupmemberisoffline', function (nickname) {
        $log.info('Member is OFFLINE');
        api.trigger('groupmemberisoffline', [nickname]);
      });
      socket.on('groupmemberisbusy', function (data) {
        $log.info('Group member is BUSY');
        api.trigger('groupmemberisbusy', [data]);
      });
      socket.on('groupmembersideringing', function (data) {
        $log.info('Callee is ringing on other side');
        api.trigger('groupmembersideringing', [data]);
      });
      socket.on('areyoufreeforgroupcall', function (data) {
        api.trigger('areyoufreeforgroupcall', [data]);
      });
      socket.on('group_call_message', function (data) {
        api.trigger('group_call_message', [data]);
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
