/**
 * Created by sojharo on 8/19/2015.
 */
/**
 * Created by sojharo on 8/1/2015.
 */
'use strict';


angular.module('cloudKiboApp')
  .controller('OneToOneCallController', function ($sce, Stream, $location, $routeParams, $scope, socket, Room, $timeout, $log, ScreenShare, FileHangout, Sound) {

    var room = 'globalchatroom';
    var callroom = '';
    if (!window.RTCPeerConnection || !navigator.getUserMedia) {
      $scope.error = 'WebRTC is not supported by your browser. You can try the app with Chrome and Firefox.';
      $log.error('WebRTC is not supported by your browser. You can try the app with Chrome and Firefox.');
      return;
    }

    $scope.getUsername = function(){
      return $scope.user.username;
    };

    var stream;

    $scope.connect = function(){
      $log.info($scope.user.username +' is connecting in call with '+ $scope.amInCallWith);
      Stream.get()
        .then(function (s) {
          stream = s;
          Room.init(stream, $scope.user.username);
          stream = URL.createObjectURL(stream);
          Room.joinRoom(callroom);
        }, function (err) {
          console.error(err);
          $log.debug(err);
          sendMessage('hangup');
          $scope.error = 'No audio/video permissions. Please refresh your browser and allow the audio/video capturing.';
        });
    };

    $scope.peers = [];
    Room.on('peer.stream', function (peer) {
      $log.debug('Client connected, adding new stream');
      // Inform the new joiner that you are sharing video
      if($scope.isLocalVideoShared()) Room.toggleVideo($scope.isLocalVideoShared());
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
          ScreenShare.setSourceIdValue(null);
          screenStream.stop();
          Room.toggleScreen(screenStream, false);
          $scope.showScreenText = 'Share Screen';
          $scope.screenSharedLocal = false;
        }
      }
    };
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
      }
    });
    $scope.callStarted = false;
    $scope.isCallStarted = function () {
      return $scope.callStarted;
    };

    $scope.callThisPerson = function (calleeusername) {
      if ($scope.areYouCallingSomeone == false && $scope.amInCall == false) {
        socket.emit('callthisperson', {
          room: room,
          callee: calleeusername,
          caller: $scope.user.username
        });
        $log.info("Calling person "+ calleeusername);
        $scope.OutgoingCallStatement = 'Outgoing Call to : ' + calleeusername;
        $scope.areYouCallingSomeone = true;
      }
    };
    $scope.StopOutgoingCall = function () {
      sendMessage('Missed Call: ' + $scope.user.username);
      $scope.areYouCallingSomeone = false;
      $scope.otherSideRinging = false;
      $scope.amInCall = false;
      $scope.amInCallWith = '';
      $scope.OutgoingCallStatement = 'Calling stopped';
      $log.info("Calling stopped")
    };
    $scope.AcceptCall = function () {
      sendMessage('Accept Call');
      $scope.isSomeOneCalling = false;
      Sound.load();
      Sound.pause();
      $scope.ringing = false;
      $log.info("Accepting call");
    };
    $scope.RejectCall = function () {
      sendMessage('Reject Call');
      $scope.isSomeOneCalling = false;
      Sound.load();
      Sound.pause();
      $scope.ringing = false;
      $scope.amInCall = false;
      $scope.amInCallWith = '';
      $log.info("Rejecting call")
    };
    $scope.endCall = function () {
      $log.info("end call selected");
      $scope.firstVideoAdded = false;
      $scope.screenSharedLocal = false;
      $scope.screenSharedByPeer = false;
      sendMessage('hangup');
      $scope.userMessages = [];
      $scope.callEnded = true;
      $scope.amInCall = false;
      $scope.amInCallWith = '';
      $scope.peers = [];
      $scope.callStarted = false;
      callroom = '';
      Stream.reset();
      Room.end();
    };

    $scope.amInCallWith = '';
    $scope.amInCall = false;
    socket.on('calleeisoffline', function (nickname) {
      $log.info('Callee is OFFLINE')
      $scope.OutgoingCallStatement = nickname + ' is offline.';
      $timeout(function () { $scope.areYouCallingSomeone = false; }, 6000);
      $scope.amInCall = false;
      $scope.amInCallWith = '';
    });
    socket.on('calleeisbusy', function (data) {
      $log.info('Callee is OFFLINE')
      $scope.OutgoingCallStatement = data.callee + ' is busy on other call.';
      $timeout(function () { $scope.areYouCallingSomeone = false; }, 6000);
      $scope.amInCall = false;
      $scope.amInCallWith = '';
    });
    socket.on('othersideringing', function (data) {
      $scope.otherSideRinging = true;
      $scope.amInCall = true;
      $scope.amInCallWith = data.callee;
    });
    socket.on('areyoufreeforcall', function (data) {
      if ($scope.amInCall == false) {
        $scope.IncomingCallStatement = data.caller + ' is calling you';
        $scope.isSomeOneCalling = true;
        Sound.load();
        Sound.play();
        $scope.ringing = true;
        socket.emit('yesiamfreeforcall', {mycaller: data.caller, me: $scope.user.username});
        $scope.amInCall = true;
        $scope.amInCallWith = data.caller;
        $log.info("checking if callee is free for call")
      }
      else {
        socket.emit('noiambusy', {mycaller: data.caller, me: $scope.user.username})
      }
    });
    socket.on('message', function (message) {
      $log.info('Client received message: ');
      if(typeof message == 'string'){
        try {
          message = JSON.parse(message);
        }catch(e){}
      }
      if(typeof message != 'string'){
        try {
          console.log(JSON.stringify(message))
        }catch(e){}
      }
      try {
        if (message.split(' ')[0] === 'Missed') {
          $scope.IncomingCallStatement = message;
          $scope.amInCall = false;
          $scope.amInCallWith = '';
          $scope.ringing = false;
          $timeout(function () { $scope.isSomeOneCalling = false; }, 6000);
          Sound.load();
          Sound.pause();
          $log.info("call missed: ' "+message+" ' ");
        }
      } catch (e) {
      }
      if (message === 'Accept Call') {
        $scope.otherSideRinging = false;
        $scope.areYouCallingSomeone = false;
        $log.info("Accepting call");
        callroom = Math.random().toString(36).substring(10);
        $scope.connect();
        $scope.callStarted = true;
        sendMessage({type : 'room_name', room: callroom});
      }
      else if (message === 'Reject Call') {
        $timeout(function () { $scope.areYouCallingSomeone = false; }, 6000);
        $scope.OutgoingCallStatement = $scope.amInCallWith + ' is Busy...';
        $scope.otherSideRinging = false;
        $scope.amInCall = false;
        $scope.amInCallWith = '';
        $log.info("Rejecting call")
      }
      else if (message === 'bye' || message === 'hangup' ) {
        $log.info("received msg to end connection /call")
        $scope.screenSharedLocal = false;
        $scope.screenSharedByPeer = false;
        $scope.firstVideoAdded = false;
        $scope.localCameraOn = false;
        $scope.userMessages = [];
        $scope.callEnded = true;
        $scope.amInCall = false;
        $scope.amInCallWith = '';
        $scope.peers = [];
        $scope.callStarted = false;
        callroom = '';
        Stream.reset();
        Room.end();
      }
      else if(message.type === 'room_name'){
        callroom = message.room;
        $scope.connect();
        $scope.callStarted = true;
      }
    });

    $scope.isOtherPeerBusy = false;
    $scope.otherScreenShared = false;
    $scope.screenSharedLocal = false;
    $scope.IncomingCallStatement = '';
    $scope.isSomeOneCalling = false;
    $scope.OutgoingCallStatement = '';
    $scope.areYouCallingSomeone = false;
    $scope.hasOtherPartySharedScreen = function () {
      return $scope.otherScreenShared;
    };
    $scope.isLocalScreenShared = function () {
      return $scope.screenSharedLocal;
    };
    $scope.isThereIncomingCall = function () {
      return $scope.isSomeOneCalling;
    };
    $scope.isThereOutgoingCall = function () {
      return $scope.areYouCallingSomeone;
    };
    $scope.isItRinging = function () {
      return $scope.ringing;
    };
    $scope.isOtherSideRinging = function () {
      return $scope.otherSideRinging;
    };

    function sendMessage(m) {
      var message = {msg: m};
      message.room = room;
      message.to = $scope.amInCallWith;
      message.username = $scope.user.username;
      $log.info('Client sending message: ', m);
      socket.emit('message', message);
    }

  });
