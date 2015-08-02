/**
 * Created by sojharo on 8/1/2015.
 */
'use strict';


angular.module('cloudKiboApp')
  .controller('ConferenceController', function ($sce, VideoStream, $location, $routeParams, $scope, Room, $timeout, logger) {

    if (!window.RTCPeerConnection || !navigator.getUserMedia) {
      $scope.error = 'WebRTC is not supported by your browser. You can try the app with Chrome and Firefox.';
      return;
    }

    $scope.user = $scope.getCurrentUser();
    $scope.isUserNameDefined = function () {
      return (typeof $scope.user.username != 'undefined') && (typeof $scope.user.email != 'undefined');
    };

    $timeout(function(){
      if ($scope.isUserNameDefined()) {
        $scope.connect();
      } else {
        var sampleName = "user_" + Math.random().toString(36).substring(10);
        $scope.user.username = window.prompt("Please write your username", sampleName);
        if ($scope.user.username == null)
          $scope.user.username = sampleName;
        $scope.connect();
      }
    }, 1000);

    var stream;

    $scope.connect = function(){
      logger.log($scope.user.username +' joins the meeting with room name '+ $routeParams.mname);
      VideoStream.get()
        .then(function (s) {
          stream = s;
          Room.init(stream, $scope.user.username);
          stream = URL.createObjectURL(stream);
          if (!$routeParams.mname) {
            Room.createRoom()
              .then(function (roomId) {
                $location.path('/room/' + roomId);
              });
          } else {
            Room.joinRoom($routeParams.mname);
          }
        }, function () {
          $scope.error = 'No audio/video permissions. Please refresh your browser and allow the audio/video capturing.';
        });
    };

    $scope.peers = [];
    Room.on('peer.stream', function (peer) {
      console.log('Client connected, adding new stream');
      $scope.peers.push({
        id: peer.id,
        username: peer.username,
        stream: URL.createObjectURL(peer.stream)
      });
    });
    Room.on('peer.disconnected', function (peer) {
      console.log('Client disconnected, removing stream');
      $scope.peers = $scope.peers.filter(function (p) {
        return p.id !== peer.id;
      });
    });

    $scope.getLocalVideo = function () {
      return $sce.trustAsResourceUrl(stream);
    };
  });
