'use strict';

angular.module('cloudKiboApp')
  .factory('Stream', function ($q) {
    var stream, videoStream;
    return {
      getAudioStream: function () {
        if (stream) {
          return $q.when(stream);
        } else {
          var d = $q.defer();
          navigator.getUserMedia({
            video: false,
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
      getVideoStream: function () {
        if (videoStream) {
          return $q.when(videoStream);
        } else {
          var d = $q.defer();
          navigator.getUserMedia({
            video: true,
            audio: false
          }, function (s) {
            videoStream = s;
            d.resolve(videoStream);
          }, function (e) {
            d.reject(e);
          });
          return d.promise;
        }
      }
    };
  });
