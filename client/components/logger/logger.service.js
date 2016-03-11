angular.module('cloudKiboApp')
  .factory('logger', function (socket) {
    return {
      log: function (data) {

        console.log(data);
        socket.emit('logClient', data);

      }
    };
  });
