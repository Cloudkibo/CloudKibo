/**
 * Created by sojharo on 8/1/2015.
 */
'use strict';


angular.module('cloudKiboApp')
  .controller('ConferenceController', function ($sce, Stream, $location, $routeParams, $scope, Room, $timeout, logger) {

    if (!window.RTCPeerConnection || !navigator.getUserMedia) {
      $scope.error = 'WebRTC is not supported by your browser. You can try the app with Chrome and Firefox.';
      return;
    }

    $scope.user = $scope.getCurrentUser();
    $scope.isUserNameDefined = function () {
      return (typeof $scope.user.username != 'undefined') && (typeof $scope.user.email != 'undefined');
    };
    $scope.getUsername = function(){
      return $scope.user.username;
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
    var videoStream;

    $scope.connect = function(){
      logger.log($scope.user.username +' joins the meeting with room name '+ $routeParams.mname);
      Stream.getAudioStream()
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
        sharedVideo: false,
        audStream: URL.createObjectURL(peer.stream)
        //stream: URL.createObjectURL(peer.stream)
      });
    });
    Room.on('peer.videoStream', function (peer) {
      console.log('Client shared Video, adding new stream');
      $scope.peers.forEach(function(p){
		  if(p.id === peer.id){
			  p.sharedVideo = true;
			  p.stream = URL.createObjectURL(peer.stream);
		  }
      });
    });
    Room.on('peer.videoStreamRemoved', function (peer) {
      console.log('Client removed Video, removing new stream');
      $scope.peers.forEach(function(p){
		  if(p.id === peer.id){
			  p.sharedVideo = false;
		  }
      });
    });
    Room.on('peer.disconnected', function (peer) {
      console.log('Client disconnected, removing stream');
      $scope.peers = $scope.peers.filter(function (p) {
        return p.id !== peer.id;
      });
    });

    $scope.getLocalVideo = function () {
      return $sce.trustAsResourceUrl(videoStream);
    };
    $scope.getLocalVideoShared = function () {
      return ($scope.toggleVideoText === 'Hide Video');
    };
    $scope.meetingStarted = function(){
      return ($scope.peers.length > 0)
    };

    $scope.extensionAvailable = false;
    $scope.hasChromeExtension = function () {
      return $scope.extensionAvailable;
    };
    $scope.isFireFox = function () {
      return typeof navigator.mozGetUserMedia !== 'undefined';
    };
    $scope.isMeetingPage = function () {
      return true;
    };

    $scope.chatBoxVisible = false;
    $scope.showChatBox = function () {
      return $scope.chatBoxVisible;
    };
    $scope.toggleChatBoxVisibility = function () {
      $scope.chatBoxVisible = !$scope.chatBoxVisible;
    };

    $scope.userMessages = [];
    $scope.sendData = function () {
      var data = $scope.dataChannelSend;
      Room.sendChat(data);
      $scope.userMessages.push('Me: ' + data);
      $scope.dataChannelSend = '';
    };
    Room.on('conference.chat', function(data){
      if(data.username !== $scope.user.username) {
        $scope.$apply(function () {
          $scope.userMessages.push(data.username +': '+ data.message);
        });
      }
    });

    $scope.toggleAudioText = 'Mute Audio';
    $scope.audioToggle = function () {
      if ($scope.toggleAudioText === 'Share Audio') {
        $scope.toggleAudioText = 'Mute Audio';
        Room.toggleAudio();
      }
      else {
        $scope.toggleAudioText = 'Share Audio';
        Room.toggleAudio();
      }
    };
    $scope.toggleVideoText = 'Share Video';
    $scope.videoToggle = function () {
      if ($scope.toggleVideoText === 'Share Video') {
        Stream.getVideoStream()
          .then(function (s) {
            videoStream = s;
            $scope.toggleVideoText = 'Hide Video';
            videoStream = URL.createObjectURL(videoStream);
            Room.toggleVideo(s, true);
          }, function () {
            $scope.error = 'No audio/video permissions. Please refresh your browser and allow the audio/video capturing.';
          });
      }
      else {
        $scope.toggleVideoText = 'Share Video';
        Room.toggleVideo(videoStream, false);
      }
    };
  });
