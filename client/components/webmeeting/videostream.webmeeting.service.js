'use strict';

angular.module('cloudKiboApp')
  .factory('MeetingStream', function ($q, logger) {
    var audioStream;
    var videoStream;
    return {
      getAudio: function () {
        if (audioStream) {
          return $q.when(audioStream);
        } else {
          var d = $q.defer();
          navigator.getUserMedia({
            video: false,
            audio: true
          }, function (s) {
            logger.log('given audio stream');
            audioStream = s;
            d.resolve(audioStream);
          }, function (e) {
            d.reject(e);
          });
          return d.promise;
        }
      },
      resetAudio: function () {
        logger.log('going to stop audio local stream');
        if(audioStream || audioStream.getTracks()[0]) {

          logger.log('stopping local audio stream now');
          audioStream.getTracks()[0].stop();
          audioStream = null;

        }
      },
      getVideo: function () {
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
      },
      resetVideo: function () {
        logger.log('going to stop local video stream')
        if(videoStream || videoStream.getTracks()[0]) {

          logger.log('stopping local video stream now')
          videoStream.getTracks()[0].stop();
          videoStream = null;

        }
      }
    };
  });
