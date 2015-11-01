/**
 * Created by sojharo on 8/1/2015.
 */
'use strict';


angular.module('cloudKiboApp')
  .controller('ConferenceController', function ($sce, Stream, $location, $routeParams, $scope, Room, $timeout, logger, ScreenShare, FileHangout, $log) {

    if (!window.RTCPeerConnection || !navigator.getUserMedia) {
      $scope.error = 'WebRTC is not supported by your browser. You can try the app with Chrome and Firefox.';
      $log.error('WebRTC is not supported by your browser. You can try the app with Chrome and Firefox.');
      logger.log('WebRTC is not supported by your browser. You can try the app with Chrome and Firefox.');
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
        logger.log("username is already defined as : ", sampleName);
        $scope.connect();
      } else {
        var sampleName = "user " + Math.floor((Math.random() * 100) + 1);;
        $scope.user.username = window.prompt("Please write your username", sampleName);
        logger.log("user gave the following username : ", sampleName);

        if ($scope.user.username == null)
          $scope.user.username = sampleName;
        $scope.connect();
      }
    }, 1000);

    var stream;

    $scope.connect = function(){
      $log.info($scope.user.username +' joins the meeting with room name '+ $routeParams.mname);
      logger.log($scope.user.username +' joins the meeting with room name '+ $routeParams.mname);
      Stream.get()
        .then(function (s) {
          stream = s;
          Room.init(stream, $scope.user.username);
          stream = URL.createObjectURL(stream);
          Room.joinRoom($routeParams.mname);
          logger.log('Accesss to audio and video is given to the application, username : '+ $scope.user.username)
        }, function (err) {
          console.error(err);
          logger.log("audio video stream access was denied: error "+err+", username : "+ $scope.user.username);
          $scope.error = 'No audio/video permissions. Please refresh your browser and allow the audio/video capturing.';
        });
    };

    $scope.screenSharerId;
    $scope.peers = [];
    Room.on('peer.stream', function (peer) {
      $log.debug('Client connected, adding new stream, username : '+ $scope.user.username +' and peer name : '+ peer.username);
      logger.log('Client connected, adding new stream, username : '+ $scope.user.username +' and peer name : '+ peer.username);
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
      logger.log('Client shared screen, adding stream, username : '+ $scope.user.username +' and peer name : '+ peer.username);
      peerScreenStream = URL.createObjectURL(peer.stream);
    });
    Room.on('conference.stream', function (peer) {
      $log.debug('hiding / showing video or screen');
      logger.log('hiding / showing video or screen, username : '+ $scope.user.username +' and peer name : '+ peer.username);
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
          else if(peer.type === 'screenAndroid'){
            $scope.screenSharerId = peer.id;
            if(peer.action)
              $scope.androidPeerSharedScreen = true;
            else
              $scope.androidPeerSharedScreen = false;
          }
        }
      });
    });
    Room.on('peer.disconnected', function (peer) {
      $log.debug('Client disconnected, removing stream');
      logger.log('Client disconnected, removing stream, username : '+ $scope.user.username +' and peer name : '+ peer.username);
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
      logger.log("chat message sent by "+ $scope.user.username)
    };
    Room.on('conference.chat', function(data){
      if(data.username !== $scope.user.username) {
        $scope.$apply(function () {
          $scope.userMessages.push(data.username +': '+ data.message);
          logger.log("chat messsage received by "+data.username);
        });
      }
    });

    $scope.toggleAudioText = 'Mute Audio';
    $scope.audioToggle = function () {
      if ($scope.toggleAudioText === 'Share Audio') {
        $scope.toggleAudioText = 'Mute Audio';
        logger.log(""+ $scope.user.username +" has unmuted");
        Room.toggleAudio();
      }
      else {
        logger.log(""+ $scope.user.username +" has muted");
        $scope.toggleAudioText = 'Share Audio';
        Room.toggleAudio();
      }
    };
    $scope.toggleVideoText = 'Share Video';
    $scope.videoToggle = function () {
      if ($scope.toggleVideoText === 'Share Video') {
        $scope.toggleVideoText = 'Hide Video';
        logger.log(""+ $scope.user.username +" has shared the video");
        Room.toggleVideo(true);
      }
      else {
        $scope.toggleVideoText = 'Share Video';
        Room.toggleVideo(false);
        logger.log(""+ $scope.user.username +" has hidden the video");
      }
    };

    ScreenShare.initialize();
    var screenStream;
    var peerScreenStream;
    var androidPeerScreenStream;

    $scope.peerSharedScreen = false;
    $scope.hasPeerSharedScreen = function () {
      return $scope.peerSharedScreen;
    };
    $scope.androidPeerSharedScreen = false;
    $scope.hasAndroidPeerSharedScreen = function () {
      return $scope.androidPeerSharedScreen;
    };
    $scope.isLocalScreenShared = function () {
      return $scope.screenSharedLocal;
    };
    $scope.getPeerScreen = function () {
      return $sce.trustAsResourceUrl(peerScreenStream);
    };
    $scope.getAndroidPeerScreen = function () {
      return $sce.trustAsResourceUrl(androidPeerScreenStream);
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
        logger.log(''+ $scope.user.username +' tried sharing screen while other was already sharing the screen');
      } else {
        if ($scope.showScreenText === 'Share Screen') {
          if (!!navigator.webkitGetUserMedia) {
            shareScreenUsingChromeExtension(function (err, stream) {
              if (err) {
                alert('Permission denied or could not capture the screen.');
                logger.log('ERROR: Permission denied or could not capture the screen. Shown to: '+ $scope.user.username);
              }
              else {
                screenStream = stream;
                $scope.$apply(function(){
                  $scope.showScreenText = 'Hide Screen';
                  $scope.screenSharedLocal = true;
                });
                Room.toggleScreen(stream, true);
                logger.log("Screen captured by "+$scope.user.username+", now informing other participants. (Chrome browser)");
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
              logger.log("Screen captured by "+$scope.user.username+", now informing other participants. (Firefox browser)");
            }, function (err) {
              alert('Permission denied or could not capture the screen.');
              logger.log('ERROR: Permission denied or could not capture the screen. Shown to: '+ $scope.user.username);
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
      logger.log('ERROR: Permission denied or could not capture the screen. Shown to: '+ $scope.user.username);
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
            logger.log('PermissionDeniedError: User denied to share content of his/her screen. Shown to: '+ $scope.user.username);
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

    var imageData = '';
    FileHangout.accept_inbound_files();
    Room.on('dataChannel.message', function(data){
      if(data.type === 'screenData'){
        if (data.data == "\n") {
          androidPeerScreenStream = imageData;
          imageData = '';
          trace("Received all data. Setting image.");
        } else {
          imageData += data.data;
          //trace("Data chunk received");
        }
        return ;
      }
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

    $scope.shareScreenToTest = function () {
      if($scope.peerSharedScreenTest){
        alert('Other person is already sharing screen');
        logger.log(''+ $scope.user.username +' tried sharing screen while other was already sharing the screen');
      } else {
        if ($scope.showScreenText === 'Share Screen') {
          if (!!navigator.webkitGetUserMedia) {
            shareScreenUsingChromeExtension(function (err, stream) {
              if (err) {
                alert('Permission denied or could not capture the screen.');
                logger.log('ERROR: Permission denied or could not capture the screen. Shown to: '+ $scope.user.username);
              }
              else {
                screenStream = stream;
                $scope.$apply(function(){
                  $scope.showScreenText = 'Hide Screen';
                  $scope.screenSharedLocal = true;
                });
                Room.toggleScreen(stream, true);
                logger.log("Screen captured by "+$scope.user.username+", now informing other participants. (Chrome browser)");
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
              logger.log("Screen captured by "+$scope.user.username+", now informing other participants. (Firefox browser)");
            }, function (err) {
              alert('Permission denied or could not capture the screen.');
              logger.log('ERROR: Permission denied or could not capture the screen. Shown to: '+ $scope.user.username);
            });
          }
        }
        else {
          removeLocalScreen();
        }
      }
    };



  });
