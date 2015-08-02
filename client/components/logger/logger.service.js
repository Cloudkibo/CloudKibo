angular.module('cloudKiboApp')
  .factory('logger', function (socket) {
    return {
      log: function (data) {

        socket.emit('logClient', data);

      }
    };
  });
