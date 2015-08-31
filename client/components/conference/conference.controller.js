/**
 * Created by sojharo on 8/1/2015.
 */
'use strict';


angular.module('cloudKiboApp')
  .controller('ConferenceController', function ($sce, Stream, $location, $routeParams, $scope, Room, $timeout, logger, ScreenShare, FileHangout, $log) {

    if (!window.RTCPeerConnection || !navigator.getUserMedia) {
      $scope.error = 'WebRTC is not supported by your browser. You can try the app with Chrome and Firefox.';
      $log.error('WebRTC is not supported by your browser. You can try the app with Chrome and Firefox.');
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
        var sampleName = "user " + Math.floor((Math.random() * 100) + 1);;
        $scope.user.username = window.prompt("Please write your username", sampleName);
        if ($scope.user.username == null)
          $scope.user.username = sampleName;
        $scope.connect();
      }
    }, 1000);

    var stream;

    $scope.connect = function(){
      $log.info($scope.user.username +' joins the meeting with room name '+ $routeParams.mname);
      Stream.get()
        .then(function (s) {
          stream = s;
          Room.init(stream, $scope.user.username);
          stream = URL.createObjectURL(stream);
          Room.joinRoom($routeParams.mname);
        }, function (err) {
          console.error(err);
          $log.debug(err);
          $scope.error = 'No audio/video permissions. Please refresh your browser and allow the audio/video capturing.';
        });
    };

    $scope.screenSharerId;
    $scope.peers = [];
    Room.on('peer.stream', function (peer) {
      $log.debug('Client connected, adding new stream');
      // Inform the new joiner that you are sharing video
      if($scope.isLocalVideoShared()) Room.toggleVideo($scope.isLocalVideoShared());
      if($scope.screenSharedLocal) Room.toggleScreen(screenStream, true);
      $scope.peers.push({
        id: peer.id,
        username: peer.username,
        sharedVideo: false,
        divClass: 'hideVideoBox',
        stream: URL.createObjectURL(peer.stream)
      });
    });
    Room.on('peer.screenStream', function (peer) {
      $log.debug('Client shared screen, adding stream');
      peerScreenStream = URL.createObjectURL(peer.stream);
    });
    Room.on('conference.stream', function (peer) {
      $log.debug('hiding / showing video or screen');
      $scope.peers.forEach(function (p) {
        if(p.id === peer.id){
          if(peer.type === 'video'){
            if(peer.action)
              p.sharedVideo = true;
            else
              p.sharedVideo = false;
          }
          else if(peer.type === 'screen'){
            $scope.screenSharerId = peer.id;
            if(peer.action)
              $scope.peerSharedScreen = true;
            else
              $scope.peerSharedScreen = false;
          }
        }
      });
    });
    Room.on('peer.disconnected', function (peer) {
      $log.debug('Client disconnected, removing stream');
      $scope.peers = $scope.peers.filter(function (p) {
        return p.id !== peer.id;
      });
      if(peer.id === $scope.screenSharerId)
        $scope.peerSharedScreen = false;
    });

    $scope.getLocalVideo = function () {
      return $sce.trustAsResourceUrl(stream);
    };
    $scope.isLocalVideoShared = function () {
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
        $scope.toggleVideoText = 'Hide Video';
        Room.toggleVideo(true);
      }
      else {
        $scope.toggleVideoText = 'Share Video';
        Room.toggleVideo(false);
      }
    };

    ScreenShare.initialize();
    var screenStream;
    var peerScreenStream;

    $scope.peerSharedScreen = false;
    $scope.hasPeerSharedScreen = function () {
      return $scope.peerSharedScreen;
    };
    $scope.isLocalScreenShared = function () {
      return $scope.screenSharedLocal;
    };
    $scope.getPeerScreen = function () {
      return $sce.trustAsResourceUrl(peerScreenStream);
    };
    $scope.installExtension = function () {
      ScreenShare.installChromeExtension();
    };
    ScreenShare.isChromeExtensionAvailable(function (status) {
      $scope.extensionAvailable = status;
    });
    $scope.showScreenText = 'Share Screen';
    $scope.showScreen = function () {
      if($scope.peerSharedScreen){
        alert('Other person is already sharing screen');
      } else {
        if ($scope.showScreenText === 'Share Screen') {
          if (!!navigator.webkitGetUserMedia) {
            shareScreenUsingChromeExtension(function (err, stream) {
              if (err) {
                alert('Permission denied or could not capture the screen.');
              }
              else {
                screenStream = stream;
                $scope.$apply(function(){
                  $scope.showScreenText = 'Hide Screen';
                  $scope.screenSharedLocal = true;
                });
                Room.toggleScreen(stream, true);
              }
            });
          }
          else if (!!navigator.mozGetUserMedia) {
            getUserMedia({
              video: {
                mozMediaSource: 'screen',
                mediaSource: 'screen'
              }
            }, function (stream) {
              screenStream = stream;
              $scope.$apply(function(){
                $scope.showScreenText = 'Hide Screen';
                $scope.screenSharedLocal = true;
              });
              Room.toggleScreen(stream, true);
            }, function (err) {
              alert('Permission denied or could not capture the screen.');
            });
          }
        }
        else {
          removeLocalScreen();
        }
      }
    };
    function removeLocalScreen(){
      ScreenShare.setSourceIdValue(null);
      screenStream.stop();
      Room.toggleScreen(screenStream, false);
      $scope.showScreenText = 'Share Screen';
      $scope.screenSharedLocal = false;
    }
    function shareScreenUsingChromeExtension(cb) {
      // this statement verifies chrome extension availability
      // if installed and available then it will invoke extension API
      // otherwise it will fallback to command-line based screen capturing API
      if (ScreenShare.getChromeMediaSource() == 'desktop' && !ScreenShare.getSourceIdValue()) {
        ScreenShare.getSourceId(function (error) {
          // if exception occurred or access denied
          if (error && error == 'PermissionDeniedError') {
            alert('PermissionDeniedError: User denied to share content of his/her screen.');
          }
          // this statement sets gets 'sourceId" and sets "chromeMediaSourceId"
          if (ScreenShare.getChromeMediaSource() == 'desktop') {
            ScreenShare.setSourceIdInConstraints();
          }
          // now invoking native getUserMedia API
          navigator.webkitGetUserMedia(ScreenShare.session(),
            function (newStream) {
              cb(null, newStream);
            }, function (err) {
              cb(err);
            });
        });
      }
    }

    FileHangout.accept_inbound_files();
    Room.on('dataChannel.message', function(data){
      //console.log(data);
      if (typeof data.data === 'string') {
        if (data.data === 'Speaking') {
          $scope.peers.forEach(function (p) {
            if(p.id === data.id){
              $scope.$apply(function(){
                p.divClass = 'hideVideoBoxSpeaking';
              });
            }
          });
        } else {
          $scope.peers.forEach(function (p) {
            if(p.id === data.id){
              $scope.$apply(function(){
                p.divClass = 'hideVideoBox';
              });
            }
          });
        }
      }
      FileHangout.dataChannelMessage(data.id, data.data);
    });
    $scope.divBoxClass = 'hideVideoBox';
    $scope.$on('Speaking', function () {
      $scope.$apply(function(){
        $scope.divBoxClass = 'hideVideoBoxSpeaking';
      });
      Room.sendDataChannelMessage('Speaking');
    });
    $scope.$on('Silent', function () {
      $scope.$apply(function(){
        $scope.divBoxClass = 'hideVideoBox';
      });
      Room.sendDataChannelMessage('Silent');
    });

    $scope.connected = true;
    $scope.isConnected = function () {
      return $scope.connected;
    };
    Room.on('connection.status', function(data){
      $scope.connected = data.status;
      if(!data.status){
        $scope.peers = [];
        if ($scope.screenSharedLocal) removeLocalScreen();
        $scope.peerSharedScreen = false;
      }
    });

    $scope.$on('$routeChangeStart', function () {
      location.reload();
    });
  });
