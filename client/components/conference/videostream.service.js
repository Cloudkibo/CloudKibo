'use strict';

angular.module('cloudKiboApp')
  .factory('Stream', function ($q) {
    var stream;
    return {
      get: function () {
        if (stream) {
          return $q.when(stream);
        } else {
          var d = $q.defer();
          navigator.getUserMedia({
            video: true,
            audio: true
          }, function (s) {
            stream = s;
            d.resolve(stream);
          }, function (e) {
            d.reject(e);
          });
          return d.promise;
        }
      },
      reset: function () {
        console.log('going to stop local stream')
        if(stream || stream.getTracks()[0]) {

          console.log('stopping local stream now')
          stream.getTracks()[0].stop();
          stream = null;

        }
      }
    };
  });
