'use strict';

angular.module('cloudKiboApp')
  .controller('LiveHelpController', function($scope, $http, socket, pc_config, pc_constraints, audio_threshold, sdpConstraints, $timeout, RestApi, $window, ScreenShare, logger, $log, Room){

    ////////////////////////////////////////////////////////////////////////////////////////
    // Variables for WebRTC Session                                                       //
    ///////////////////////////////////////////////////////////////////////////////////////

    var isChannelReady;
    var isInitiator = false;
    var isStarted = false;
    var sendChannel;
    var receiveChannel;
    var screenSharePCIndex;
    var localStream;
    var localVideoStream;
    var localAudioStream;
    var localStreamScreen;
    $scope.videoTogglingFromOtherSide;
    var pc;
    var remoteVideoStream;
    var remoteStream1;
    var remoteStreamScreen;
    var turnReady;
    var bell = new Audio('/sounds/bells_simple.mp3');
    bell.loop = true;

    var localPeerHideBox = document.getElementById("localPeerHideBox");
    var remotePeerHideBox = document.getElementById("remotePeerHideBox");

    var remoteaudio1 = document.getElementById("remoteaudio1");
    remoteaudio1.src = null;

    var remotevideo1 = document.getElementById("remotevideo1");
    remotevideo1.src = null;

    var remotevideo2 = document.getElementById("remotevideo2");
    remotevideo2.src = null;

    var localvideo = document.getElementById("localvideo");
    localvideo.src = null;


    var roomid = '';

    /** Audio Analyser variables **/

    var audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    var analyser = audioCtx.createAnalyser();
    analyser.minDecibels = -90;
    analyser.maxDecibels = -10;
    analyser.smoothingTimeConstant = 0.85;

    var drawVisual;

    var speaking = false;

    /** Audio Analyser variables ends **/

    ////////////////////////////////////////////////////////////////////////////////////////
    // Create or Join Room Logic                                                          //
    ////////////////////////////////////////////////////////////////////////////////////////

    if(window.location.pathname.replace('/', '') != 'home'){
      roomid = window.location.pathname.replace('/', '');
      roomid = roomid.split('/')[1];
    }

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


    ////////////////////////////////////////////////////////////////////////////////////////
    // WebRTC User Interface Logic                                                        //
    ////////////////////////////////////////////////////////////////////////////////////////

    $scope.connected = false;

    $scope.roomname = '';

    $scope.isConnected = function () {
      return $scope.connected;
    };

    $scope.callEnded = false;

    $scope.hasCallEnded = function () {
      return $scope.callEnded;

      console.log("Check if Live help call ended");
      $log.info("Check if Live help call ended");
      logger.log("Check if Live help call ended");
    };

    $scope.connectTimeOut = function(){
      $scope.roomname = roomid;
      $scope.createOrJoinMeeting();
      $scope.connected = true;
      console.log("Check if Live help call time out");
      $log.info("Check if Live help call time out");
      logger.log("Check if Live help call time out");
    };

    $timeout($scope.connectTimeOut, 500);

    $scope.alertsCallStart = [];

    $scope.addAlertCallStart = function(newtype, newMsg) {
      $scope.$apply(function(){
        $scope.alertsCallStart.push({type: newtype, msg: newMsg});
        $log.info("ALERT: start call");
        logger.log("ALERT: start call");
      })
    };

    $scope.closeAlertCallStart = function(index) {
      $scope.alertsCallStart.splice(index, 1);

    };

    $scope.localCameraCaptured = function () {
      return $scope.localCameraOn;
      $log.info("set local camera captured: "+ $scope.localCameraOn);
      logger.log("set local camera captured: "+ $scope.localCameraOn);
    };

    $scope.peerSharedScreen = false;

    $scope.hasPeerSharedScreen = function(){
      return $scope.peerSharedScreen;
      $log.info("Peer shared screen: "+ $scope.peerSharedScreen);
      logger.log("Peer shared screen: "+ $scope.peerSharedScreen);
    };

    $scope.peerSharedVideo = false;

    $scope.hasPeerSharedVideo = function(){
      return $scope.peerSharedVideo;
      $log.info("peer shared video: "+$scope.peerSharedVideo)
      logger.log("peer shared video: "+$scope.peerSharedVideo)
    };

    $scope.hasChromeExtension = function(){
      return $scope.extensionAvailable;
      $log.info("has chrome extension: "+ $scope.extensionAvailable)
      logger.log("has chrome extension: "+ $scope.extensionAvailable)
    };

    $scope.isFireFox = function(){
      return typeof navigator.mozGetUserMedia !== 'undefined';
    };

    $scope.screenSharedLocal = false;

    $scope.isLocalScreenShared = function(){
      return $scope.screenSharedLocal;
      $log.info("peer shared video: "+$scope.peerSharedVideo)
      logger.log("peer shared video: "+$scope.peerSharedVideo)
    };

    $scope.localVideoCaptured = false;


    $scope.isVideoCaptured = function(){
      return $scope.localVideoCaptured;
      $log.info("Local video captured: "+$scope.localVideoCaptured)
      logger.log("Local video captured: "+$scope.localVideoCaptured)

    };

    $scope.localAudioCaptured = false;

    $scope.isAudioCaptured = function(){
      return $scope.localAudioCaptured;
      $log.info("Local Audio captured: "+$scope.localAudioCaptured)
      logger.log("Local Audio captured: "+$scope.localAudioCaptured)

    };

    ////////////////////////////////////////////////////////////////////////////////////////
    // Signaling Logic                                                                    //
    ///////////////////////////////////////////////////////////////////////////////////////

    $scope.createOrJoinMeeting = function(){
      socket.emit('create or join livehelp', {room: roomid});
      console.log("create or join livehelp call");
      logger.log("create or join livehelp call");
      $log.info("create or join livehelp call");

    };

    $scope.LeaveRoom = function(){
      console.log('Leave room', {room: roomid});
      logger.log('Leave room', {room: roomid});

      $log.info('Leave room', {room: roomid});
      $scope.callEnded = true;
      socket.emit('leave', {room: roomid});
      console.log("Leaving room: Live help call ended");
      logger.log("Leaving room: Live help call ended");

      $log.info("Leaving room: Live help call ended");
    };

    socket.on('created', function (room){
      console.log('Created room for live help ' + room);
      logger.log('Created room for live help ' + room);
      $log.info('Created room for live help ' + room);

      isInitiator = true;
    });

    socket.on('full', function (room){
      console.log('Room for livehelp ' + room + ' is full');
      logger.log('Room for livehelp ' + room + ' is full');
      $log.info('Room for livehelp ' + room + ' is full');
    });

    socket.on('left', function (room){
      console.log('Left room, call ended');
      logger.log('Left room, call ended');
      $scope.callEnded = true;
      if(remoteStream1)
      {
        remoteStream1.stop();

        $log.info('STOPPED remote stream1');
        logger.log('STOPPED remote stream1');
      }
      if(localStream) {
        localStream.stop();
        $log.info('STOPPED local remote stream');
        logger.log('STOPPED local remote stream');

      }
      if(localStreamScreen){
        localStreamScreen.stop();

        $log.info('STOPPED local remote Screen');
        logger.log('STOPPED local remote Screen');
      }
      if(remoteStreamScreen) {
        remoteStreamScreen.stop();
        $log.info('STOPPED remote screen');
        logger.log('STOPPED remote screen');

      }
      pc.close();

      $log.info("closed pc")
      pc = null;
      $scope.localCameraOn = false;
      remotevideo1.src = null;
      remoteaudio1.src = null;
      /*$timeout(function () {
       location.reload();
       }, 400)*/
      console.log("Left room: Live help call ended");
      logger.log("Left room: Live help call ended");
      $log.info("Left room: Live help call ended");

    });

    socket.on('join', function (room){
      console.log('Another peer made a request to join room ' + room);
      logger.log('Another peer made a request to join room ' + room);

      $log.info('JOIN: Another peer made a request to join room ' + room);
      logger.log('JOIN: Another peer made a request to join room ' + room);
      //console.log('This peer is the initiator of room ' + room + '!');

      isChannelReady = true;
    });

    socket.on('joined', function (room){
      console.log('This peer has joined room ' + room.room + ' '+ room.username +' '+ room.otherClients);
      logger.log('This peer has joined room ' + room.room + ' '+ room.username +' '+ room.otherClients);

      $log.info('This peer has joined room ' + room.room + ' '+ room.username +' '+ room.otherClients);
      isChannelReady = true;

      $scope.startCalling();
    });

    socket.on('log', function (array){
      console.log.apply(console, array);
      //console.log.apply(console, array);
    });

    window.onbeforeunload = function(e){
      $scope.LeaveRoom();
    };

    function sendMessage(message){
      message = {msg:message};
      message.room = roomid;

      console.log('Client sending message: ', message);
      $log.info('sendMessage: Client sending message: ', message);
      logger.log('sendMessage: Client sending message: ', message);


      socket.emit('messageformeeting', message);
    }


    ////////////////////////////////////////////////////////////////////////////////////////
    // WebRTC using sigaling logic                                                        //
    ///////////////////////////////////////////////////////////////////////////////////////

    socket.on('message', function (message) {
      console.log('Client received message: '+ JSON.stringify(message));
      $log.info('Client received message: '+ JSON.stringify(message));
      logger.log('Client received message: '+ JSON.stringify(message));

      if (message.msg === 'got user media') {
        if (isInitiator && !isStarted) {
          $scope.startCalling();//maybeStart();
          $log.info("Start call");
          logger.log("Start call");
        }
      }
      else if (message.type === 'offer') {
        console.log("msg is "+message)
        $log.info("msg is "+message)
        logger.log("msg is "+message)
        if(!isStarted){
          if (!isInitiator && !isStarted) {
            maybeStart();
          }
          pc.setRemoteDescription(new RTCSessionDescription(message));
          doAnswer();

        }
        else if(message.sharingAudio === 'open') {

          pc.setRemoteDescription(new RTCSessionDescription(message));
          console.log("Audio share open ");
          $log.info("Audio share open ");
          logger.log("Audio share open ");

          $scope.audioTogglingFromOtherSide = true;

          pc.createAnswer(function(sessionDescription){

              // Set Opus as the preferred codec in SDP if Opus is present.
              pc.setLocalDescription(sessionDescription);

              sendMessage(sessionDescription);
              console.log('Sending answer to audio share true')
              $log.info('Sending answer to audio share true')
              logger.log('Sending answer to audio share true')

            },
            function (error){console.log(error); $log.info(error)}, sdpConstraints);

        }
        else if(message.sharingAudio === 'close') {

          pc.setRemoteDescription(new RTCSessionDescription(message));

          $scope.audioTogglingFromOtherSide = true;

          pc.createAnswer(function(sessionDescription){

              // Set Opus as the preferred codec in SDP if Opus is present.
              pc.setLocalDescription(sessionDescription);

              sendMessage(sessionDescription);
              console.log('Sending answer to audio share false')
              $log.info('Sending answer to audio share false')
              logger.log('Sending answer to audio share false')

            },
            function (error){console.log(error); $log.info(error)}, sdpConstraints);
          console.log("Audio share STOPPED ");
          logger.log("Audio share STOPPED ");

        }
        else if(message.sharingVideo === 'open') {

          pc.setRemoteDescription(new RTCSessionDescription(message));

          $scope.videoTogglingFromOtherSide = true;

          pc.createAnswer(function(sessionDescription){

              // Set Opus as the preferred codec in SDP if Opus is present.
              pc.setLocalDescription(sessionDescription);

              sendMessage(sessionDescription);
              console.log('Sending answer to video share true')
              $log.info('Sending answer to video share true')
              logger.log('Sending answer to video share true')

            },

            function (error){console.log(error); $log.info(error)}, sdpConstraints);
          console.log("Video share open ");
          $log.info("Video share open ");
          logger.log("Video share open ");
        }
        else if(message.sharingVideo === 'close') {

          pc.setRemoteDescription(new RTCSessionDescription(message));

          $scope.videoTogglingFromOtherSide = true;

          pc.createAnswer(function(sessionDescription){

              // Set Opus as the preferred codec in SDP if Opus is present.
              pc.setLocalDescription(sessionDescription);

              sendMessage(sessionDescription);
              console.log('Sending answer to video share false')
              $log.info('Sending answer to video share false')
              logger.log('Sending answer to video share false')

            },
            function (error){console.log(error); $log.info(error)}, sdpConstraints);

        }
        else if(message.sharingScreen === 'open') {

          pc.setRemoteDescription(new RTCSessionDescription(message));

          $scope.switchingScreenShare = true;
          $scope.peerSharedScreen = true;

          $scope.meetingRemoteVideoWidth = '60%';

          console.log("Screen share OPEN ");
          $log.info("Screen share OPEN ");
          logger.log("Screen share OPEN ");
          pc.createAnswer(function(sessionDescription){

              // Set Opus as the preferred codec in SDP if Opus is present.
              pc.setLocalDescription(sessionDescription);

              sendMessage(sessionDescription);

            },
            function (error){console.log(error); $log.info(error)}, sdpConstraints);

        }
        else if(message.sharingScreen === 'close') {
          pc.setRemoteDescription(new RTCSessionDescription(message));
          console.log("Screen share Stopped ");
          $log.info("Screen share Stopped ");
          logger.log("Screen share Stopped ");

          $scope.peerSharedScreen = false;
          $log.info("Peer sharing screen: FALSE ");
          logger.log("Peer sharing screen: FALSE ");

          $scope.switchingScreenShare = true;
          $log.info("Switching sharing screen: TRUE ");
          logger.log("Switching sharing screen: TRUE ");

          $scope.meetingRemoteVideoWidth = '40%';

          pc.createAnswer(function(sessionDescription){

              // Set Opus as the preferred codec in SDP if Opus is present.
              pc.setLocalDescription(sessionDescription);

              sendMessage(sessionDescription);

            },
            function (error){console.log(error); $log.info(error)}, sdpConstraints);

        }
      } else if (message.type === 'answer' && isStarted) {
        pc.setRemoteDescription(new RTCSessionDescription(message));
      } else if (message.type === 'candidate' && isStarted) {
        var candidate = new RTCIceCandidate({
          sdpMLineIndex: message.label,
          candidate: message.candidate
        });
        pc.addIceCandidate(candidate);
      }
    });

    function maybeStart() {
      console.log('isStarted localstream isChannelReady ', isStarted, localStream, isChannelReady)
      $log.info('isStarted localstream isChannelReady ', isStarted, localStream, isChannelReady)
      logger.log('isStarted localstream isChannelReady ', isStarted, localStream, isChannelReady)

      if (!isStarted && typeof localStream != 'undefined' && isChannelReady) {

        createPeerConnection();
        pc.addStream(localStream);

        if($scope.role == 'agent'){
          pc.addStream(localVideoStream)
        }

        isStarted = true;

        if (isInitiator) {
          doCall();
        }
      }
    }

    ////////////////////////////////////////////////////////////////////////////////////////
    // WebRTC logic                                                                       //
    ///////////////////////////////////////////////////////////////////////////////////////

    function createPeerConnection() {

      $log.info("create peer connection")
      logger.log("create peer connection")
      try {
        //
        //Different URL way for FireFox
        //
        pc = new RTCPeerConnection(pc_config, {optional: []});//pc_constraints);
        pc.onicecandidate = handleIceCandidate;
        pc.onaddstream = handleRemoteStreamAdded;
        pc.onremovestream = handleRemoteStreamRemoved;

        //if (isInitiator) {
        try {
          // Reliable Data Channels not yet supported in Chrome
          try{
            sendChannel = pc.createDataChannel("sendDataChannel", {reliable: true});
            $log.info('RELIABLE DATA CHANNEL');
            logger.log('RELIABLE DATA CHANNEL');
          }
          catch(e){
            console.log('UNRELIABLE DATA CHANNEL');
            $log.info('UNRELIABLE DATA CHANNEL');
            logger.log('UNRELIABLE DATA CHANNEL');
            sendChannel = pc.createDataChannel("sendDataChannel", {reliable: false});
          }
          sendChannel.onmessage = handleMessage;
          trace('Created send data channel');
          $log.info('Created send data channel');
          logger.log('Created send data channel');
        } catch (e) {
          alert('Failed to create data channel. ' +
          'You need Chrome M25 or later with RtpDataChannel enabled : '+ e.message );
          trace('createDataChannel() failed with exception: ' + e.message);
          $log.info("Failed to create data channel: "+ e.message)
          logger.log("Failed to create data channel: "+ e.message)
        }
        sendChannel.onopen = handleSendChannelStateChange;
        sendChannel.onclose = handleSendChannelStateChange;
        // } else {
        pc.ondatachannel = gotReceiveChannel;
        // }
      } catch (e) {
        console.log('Failed to create PeerConnection, exception: ' + e.message);
        logger.log('Failed to create PeerConnection, exception: ' + e.message);
        $log.info('Failed to create PeerConnection, exception: ' + e.message);
        alert('Cannot create RTCPeerConnection object.');
        return 0;
      }
    }

    function handleIceCandidate(event) {
      if (event.candidate) {
        console.log('I got candidate...');
        logger.log('I got candidate...');
        $log.info('I got candidate...');
        sendMessage({
          type: 'candidate',
          label: event.candidate.sdpMLineIndex,
          id: event.candidate.sdpMid,
          candidate: event.candidate.candidate
        })
      } else {
        console.log('End of candidates.');
        $log.info('End of candidates.');
        logger.log('End of candidates.');
      }
    }

    function handleCreateOfferError(event){
      console.log('createOffer() error: ', e);
      $log.info('createOffer() error: ', e);
      logger.log('createOffer() error: ', e);
    }

    function doCall() {
      console.log('Sending offer to peer');
      $log.info('Sending offer to peer');
      logger.log('Sending offer to peer');
      pc.createOffer(setLocalAndSendMessage, handleCreateOfferError);
    }

    function doAnswer() {
      console.log('Sending answer to peer.');
      $log.info('Sending answer to peer.');
      logger.log('Sending answer to peer.');
      pc.createAnswer(setLocalAndSendMessage, function (error){console.log(error); $log.info(error)}, sdpConstraints);
    }

    function setLocalAndSendMessage(sessionDescription) {


      // Set Opus as the preferred codec in SDP if Opus is present.
      pc.setLocalDescription(sessionDescription);

      console.log('setLocalAndSendMessage sending message' , sessionDescription);
      logger.log('setLocalAndSendMessage sending message' , sessionDescription);
      $log.info('setLocalAndSendMessage sending message' , sessionDescription);

      console.log(''+ sessionDescription.FromUser +' sending Offer or Answer to ', toUserName)
      logger.log(''+ sessionDescription.FromUser +' sending Offer or Answer to ', toUserName)
      $log.info(''+ sessionDescription.FromUser +' sending Offer or Answer to ', toUserName)
      sendMessage(sessionDescription);
    }

    $scope.meetingRemoteVideoWidth = '40%';
    $scope.switchingScreenShare = false;
    function handleRemoteStreamAdded(event) {

      if(event.stream.getAudioTracks().length){
        remoteaudio1.src = URL.createObjectURL(event.stream);
        remoteStream1 = event.stream;
      }
      else if(event.stream.getVideoTracks().length){

        if($scope.videoTogglingFromOtherSide && !$scope.switchingScreenShare){

          console.log("Toggleing video");
          $log.info("Toggleing video");
          logger.log("Toggleing video");

          $scope.$apply(function(){
            remotevideo2.src = URL.createObjectURL(event.stream);
          });

          remoteVideoStream = event.stream;
          $scope.peerSharedVideo = true;
          $scope.videoTogglingFromOtherSide = false;

          return 0;
        }

        if($scope.switchingScreenShare && !$scope.videoTogglingFromOtherSide){

          $scope.$apply(function(){
            remotevideo1.src = URL.createObjectURL(event.stream);
          });

          remoteStreamScreen = event.stream;
          $scope.switchingScreenShare = false;

          return 0;
        }

        if (!remoteVideoStream) {

          $scope.$apply(function(){
            remotevideo2.src = URL.createObjectURL(event.stream);
            remoteVideoStream = event.stream;
            $scope.peerSharedVideo = true;
          })

        }
      }

    }

    function handleRemoteStreamRemoved(event) {

      if($scope.switchingScreenShare && !$scope.videoTogglingFromOtherSide){
        remotevideo1.src = null;
        $scope.switchingScreenShare = false;
        $scope.screenSharedByPeer = false;
        console.log("Removed remote stream when screen shared but video");
        $log.info("Removed remote stream when screen shared but video");
        logger.log("Removed remote stream when screen shared but video");
      }

      if($scope.videoTogglingFromOtherSide && !$scope.switchingScreenShare){
        $scope.videoTogglingFromOtherSide = false;
        remotevideo2.src = null;
        $scope.peerSharedVideo = false;
        console.log("Removed remote stream when Video shared but Screen");
        $log.info("Removed remote stream when Video shared but Screen");
        logger.log("Removed remote stream when Video shared but Screen");
      }

    }

    ////////////////////////////////////////////////////////////////////////////////////////
    // Media Stream Logic                                                                 //
    ///////////////////////////////////////////////////////////////////////////////////////

    var audio_constraints = {video: false, audio: true};
    var video_constraints = {video: true, audio: false};

    var localPeerConnection, remotePeerConnection;

    function handleUserMedia(newStream){

      localStream = newStream;

      $scope.localAudioCaptured = true;

      var source = audioCtx.createMediaStreamSource(newStream);
      source.connect(analyser);
      //analyser.connect(distortion);

      analyseAudio();

      if($scope.role == 'agent') {
        getUserMedia(video_constraints, handleUserMediaVideo, handleUserMediaError);
      }
      else {
        $scope.localCameraOn = true;

        sendMessage({msg: 'got user media'});
        console.log("got user media");
        $log.info("got user media");
        logger.log("got user media");

        if (isInitiator) {
          maybeStart();
        }
      }
    }

    function handleUserMediaVideo(newStream) {

      localVideoStream = newStream;

      localvideo.src = URL.createObjectURL(localVideoStream);

      $scope.localCameraOn = true;

      $scope.localVideoCaptured = true;

      sendMessage({msg: 'got user media'});

      console.log("got user media video");
      $log.info("got user media video");
      logger.log("got user media video");
      if (isInitiator) {
        maybeStart();
      }
    }

    function handleUserMediaError(error){
      console.log(error);
      $log.info(error);
      logger.log(error);
    }

    function analyseAudio(){

      analyser.fftSize = 256;
      var bufferLength = analyser.frequencyBinCount;
      //console.log(bufferLength);
      var dataArray = new Uint8Array(bufferLength);

      var tempSpeakingValue = false;

      function draw() {

        drawVisual = requestAnimationFrame(draw);

        analyser.getByteFrequencyData(dataArray);

        var sum = 0; // added by sojharo

        for(var i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }

        var averageFrequency = sum/bufferLength;

        if(averageFrequency > audio_threshold)
          tempSpeakingValue = true;
        else
          tempSpeakingValue = false;

        if(tempSpeakingValue !== speaking){
          speaking = tempSpeakingValue;
          //console.log(speaking ? 'Speaking' : 'Silent');

          if(speaking){
            localPeerHideBox.style.cssText = 'border : 2px solid #000000;';
            if(typeof pc != 'undefined' && sendChannel.readyState === 'open'){
              sendChannel.send(':Speaking:peer:');
              console.log("Peer is Speaking ");
              logger.log("Peer is Speaking ");
              $log.info("Peer is Speaking ");
            }
          }else{
            localPeerHideBox.style.cssText = 'border : 0px solid #000000;';
            if(typeof pc != 'undefined' && sendChannel.readyState === 'open'){
              sendChannel.send(':Silent:peer:');
              console.log("Peer is NOT Speaking ");
              logger.log("Peer is NOT Speaking ");
              $log.info("Peer is NOT Speaking ");
            }
          }

        }


      };

      draw();

    }


    $scope.toggleVideoStream = function() {
      if ($scope.localVideoCaptured) {

        localVideoStream.stop();
        pc.removeStream(localVideoStream);

        pc.createOffer(function(sessionDescription){
          console.log('INSIDE CONDITION SCREEN SHARE')
          logger.log('INSIDE CONDITION SCREEN SHARE')
          $log.info('INSIDE CONDITION SCREEN SHARE')

          var payload = {sdp : sessionDescription.sdp, type : sessionDescription.type, sharingVideo : 'close'};

          console.log('CLOSING THE VIDEO');
          logger.log('CLOSING THE VIDEO');
          $log.info('CLOSING THE VIDEO');

          console.log(payload)
          $log.info("Payload: "+payload)
          logger.log("Payload: "+payload)

          // Set Opus as the preferred codec in SDP if Opus is present.
          pc.setLocalDescription(sessionDescription);

          sendMessage(payload);

        }, handleCreateOfferError);

        //localvideo.src = null;
        $scope.localVideoCaptured = false;

      }
      else {

        getUserMedia(video_constraints, function (stream) {

          localVideoStream = stream;

          pc.addStream(localVideoStream);

          pc.createOffer(function(sessionDescription){
            //console.log('INSIDE CONDITION SCREEN SHARE')
            logger.log('INSIDE CONDITION SCREEN SHARE')

            var payload = {sdp : sessionDescription.sdp, type : sessionDescription.type, sharingVideo : 'open'};
            console.log('SHARING THE VIDEO');
            logger.log('SHARING THE VIDEO');
            logger.log("payload "+payload)
            console.log("payload "+payload)

            // Set Opus as the preferred codec in SDP if Opus is present.
            pc.setLocalDescription(sessionDescription);

            sendMessage(payload);

          }, handleCreateOfferError);

          localvideo.src = URL.createObjectURL(localVideoStream);


          $scope.localVideoCaptured = true;


        }, function(err){ alert(err); });
      }
    };

    $scope.toggleAudioStream = function() {
      if ($scope.localAudioCaptured) {

        localStream.stop();
        pc.removeStream(localStream);

        pc.createOffer(function(sessionDescription){
          //console.log('INSIDE CONDITION SCREEN SHARE')
          console.log("toggle audio ");
          $log.info("toggle audio ");
          logger.log("toggle audio ");
          var payload = {sdp : sessionDescription.sdp, type : sessionDescription.type, sharingAudio : 'close'};

          // Set Opus as the preferred codec in SDP if Opus is present.
          pc.setLocalDescription(sessionDescription);

          sendMessage(payload);

        }, handleCreateOfferError);

        //localvideo.src = null;

        $scope.localAudioCaptured = false;



      }
      else {

        getUserMedia(audio_constraints, function (stream) {

          localStream = stream;

          var source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);
          //analyser.connect(distortion);

          analyseAudio();

          pc.addStream(localStream);

          pc.createOffer(function(sessionDescription){
            //console.log('INSIDE CONDITION SCREEN SHARE')

            var payload = {sdp : sessionDescription.sdp, type : sessionDescription.type, sharingAudio : 'open'};

            // Set Opus as the preferred codec in SDP if Opus is present.
            pc.setLocalDescription(sessionDescription);

            sendMessage(payload);

          }, handleCreateOfferError);

          localvideo.src = URL.createObjectURL(localAudioStream);


          $scope.localAudioCaptured = true;


        }, function(err){ alert(err); });
      }
    };


    $scope.startCalling = function(){
      getUserMedia(audio_constraints, handleUserMedia, handleUserMediaError);
    };

    ////////////////////////////////////////////////////////////////////////////////////////
    // Screen Sharing Logic                                                               //
    ///////////////////////////////////////////////////////////////////////////////////////

    // todo: need to check exact chrome browser because opera also uses chromium framework
    var isChrome = !!navigator.webkitGetUserMedia;

    // DetectRTC.js - https://github.com/muaz-khan/WebRTC-Experiment/tree/master/DetectRTC
    // Below code is taken from RTCMultiConnection-v1.8.js (http://www.rtcmulticonnection.org/changes-log/#v1.8)
    var DetectRTC = {};

    (function () {
      var screenCallback;

      DetectRTC.screen = {
        chromeMediaSource: 'screen',
        getSourceId: function (callback) {
          if (!callback) throw '"callback" parameter is mandatory.';
          screenCallback = callback;
          window.postMessage('get-sourceId', '*');
        },
        isChromeExtensionAvailable: function (callback) {
          if (!callback) return;

          if (DetectRTC.screen.chromeMediaSource == 'desktop') callback(true);

          $log.info(" extension is available")
          logger.log(" extension is available")
          // ask extension if it is available
          window.postMessage('are-you-there', '*');

          setTimeout(function () {
            if (DetectRTC.screen.chromeMediaSource == 'screen') {
              callback(false);
            } else callback(true);
          }, 2000);
        },
        onMessageCallback: function (data) {
          console.log('chrome message', data);
          logger.log('chrome message', data);
          $log.info('chrome message', data);

          // "cancel" button is clicked
          if (data == 'PermissionDeniedError') {
            DetectRTC.screen.chromeMediaSource = 'PermissionDeniedError';

            console.log("cancel extension button clicked ");
            $log.info("cancel extension button clicked ");
            logger.log("cancel extension button clicked ");

            if (screenCallback) return screenCallback('PermissionDeniedError');
            else throw new Error('PermissionDeniedError');
          }

          // extension notified his presence
          if (data == 'kiboconnection-extension-loaded') {
            DetectRTC.screen.chromeMediaSource = 'desktop';
          }

          // extension shared temp sourceId
          if (data.sourceId) {

            console.log("extension shared temp sourceId ");
            $log.info("extension shared temp sourceId ");
            logger.log("extension shared temp sourceId ");

            DetectRTC.screen.sourceId = data.sourceId;
            if (screenCallback) screenCallback(DetectRTC.screen.sourceId);
          }
        }
      };

      // check if desktop-capture extension installed.
      if (window.postMessage && isChrome) {
        DetectRTC.screen.isChromeExtensionAvailable(function(status){
          $scope.$apply(function(){
            $scope.extensionAvailable = status;
            console.log("is extension installed "+ $scope.extensionAvailable )
            $log.info("is extension installed "+ $scope.extensionAvailable )
            logger.log("is extension installed "+ $scope.extensionAvailable )
          })

        });
      }
    })();


    window.addEventListener('message', function (event) {
      if (event.origin != window.location.origin) {
        return;
      }

      console.log('THIS IS THE EVENT'+ event)
      $log.info('THIS IS THE EVENT'+ event)
      logger.log('THIS IS THE EVENT'+ event)
      //console.log(event)

      DetectRTC.screen.onMessageCallback(event.data);
    });

    //-----------------//

    function captureUserMedia(onStreamApproved) {
      // this statement defines getUserMedia constraints
      // that will be used to capture content of screen
      var screen_constraints = {
        mandatory: {
          chromeMediaSource: DetectRTC.screen.chromeMediaSource,
          maxWidth: 1920,
          maxHeight: 1080,
          minAspectRatio: 1.77
        },
        optional: []
      };

      // this statement verifies chrome extension availability
      // if installed and available then it will invoke extension API
      // otherwise it will fallback to command-line based screen capturing API
      if (DetectRTC.screen.chromeMediaSource == 'desktop' && !DetectRTC.screen.sourceId) {
        DetectRTC.screen.getSourceId(function (error) {
          // if exception occurred or access denied
          if (error && error == 'PermissionDeniedError') {
            alert('PermissionDeniedError: User denied to share content of his screen.');
            console.log("PermissionDeniedError: User denied to share content of his screen");
            $log.info("PermissionDeniedError: User denied to share content of his screen");
            logger.log("PermissionDeniedError: User denied to share content of his screen");
          }

          captureUserMedia(onStreamApproved);
        });
        return;
      }

      console.log(DetectRTC.screen.chromeMediaSource);
      $log.info("Detecting chrome media source "+DetectRTC.screen.chromeMediaSource);
      logger.log("Detecting chrome media source "+DetectRTC.screen.chromeMediaSource);

      // this statement sets gets 'sourceId" and sets "chromeMediaSourceId"
      if (DetectRTC.screen.chromeMediaSource == 'desktop') {
        screen_constraints.mandatory.chromeMediaSourceId = DetectRTC.screen.sourceId;
        console.log("get source id and set chrome media source id")
        $log.info("get source id and set chrome media source id")
        logger.log("get source id and set chrome media source id")
      }

      // it is the session that we want to be captured
      // audio must be false
      var session = {
        audio: false,
        video: screen_constraints
      };

      // now invoking native getUserMedia API
      navigator.webkitGetUserMedia(session, onStreamApproved, OnStreamDenied);

    }


    //--------//

    //var screen_constraints = {video: { mandatory: { chromeMediaSource: 'screen' } }};

    $scope.showScreenText = 'Share Screen';

    $scope.showScreen = function(){

      if($scope.showScreenText == 'Share Screen'){

        consol.log("Share screen selected");
        $log.info("Share screen selected");
        logger.log("Share screen selected");
        //getUserMedia(screen_constraints, handleUserMediaShowScreen, handleUserMediaErrorShowScreen)


        if(!!navigator.webkitGetUserMedia){

          captureUserMedia(onStreamApproved);

        }
        else if(!!navigator.mozGetUserMedia){
          getUserMedia({
            video : {
              mozMediaSource: 'window',
              mediaSource: 'window'
            }}, function(stream){

            onStreamApproved(stream);

          }, function(err){
            alert(err)
          });
        }

      }
      else{
        if(localStreamScreen){
          localStreamScreen.stop();
          DetectRTC.screen.sourceId = null;

          localvideo.src = URL.createObjectURL(localVideoStream);

          $scope.closingScreenShare = true;
          console.log("Sharing screen set TRUE");
          $log.info("Sharing screen set TRUE");
          logger.log("Sharing screen set TRUE");

          if(typeof pc != 'undefined'){
            pc.removeStream(localStreamScreen);
            pc.createOffer(function(sessionDescription){
              console.log('INSIDE CONDITION SCREEN SHARE')
              $log.info('INSIDE CONDITION SCREEN SHARE')
              logger.log('INSIDE CONDITION SCREEN SHARE')
              var payload;
              if($scope.closingScreenShare == false){
                payload = {sdp : sessionDescription.sdp, type : sessionDescription.type, sharingScreen : 'open'};
                console.log('SHARING THE SCREEN')
                $log.info('SHARING THE SCREEN')
                logger.log('SHARING THE SCREEN')
              }
              else{
                payload = {sdp : sessionDescription.sdp, type : sessionDescription.type, sharingScreen : 'close'};
                console.log('CLOSING THE SCREEN');
                $log.info('CLOSING THE SCREEN');
                logger.log('CLOSING THE SCREEN');
                $scope.screenSharedLocal = false;
              }

              // Set Opus as the preferred codec in SDP if Opus is present.
              pc.setLocalDescription(sessionDescription);

              sendMessage(payload);

            }, handleCreateOfferError);
          }
        }

        $scope.screenSharedLocal = false;

        $scope.showScreenText = 'Share Screen';
      }

    };

    function onStreamApproved(newStream){

      localStreamScreen = newStream;

      $scope.$apply(function(){
        $scope.showScreenText = 'Hide Screen';
        $scope.screenSharedLocal = true;
        $scope.closingScreenShare = false;
      })

      $scope.localCameraOn = true;

      screenSharePCIndex = 0;
      if(typeof pc != 'undefined'){
        pc.addStream(localStreamScreen);

        localvideo.src = URL.createObjectURL(localStreamScreen);

        pc.createOffer(function(sessionDescription){

          //console.log('INSIDE CONDITION SCREEN SHARE')

          var payload;
          if($scope.closingScreenShare == false){
            payload = {sdp : sessionDescription.sdp, type : sessionDescription.type, sharingScreen : 'open'};
            console.log('SHARING THE SCREEN')
            $log.info('SHARING THE SCREEN')
            logger.log('SHARING THE SCREEN')
          }
          else{
            payload = {sdp : sessionDescription.sdp, type : sessionDescription.type, sharingScreen : 'close'};
            console.log('CLOSING THE SCREEN');
            $log.info('CLOSING THE SCREEN');
            logger.log('CLOSING THE SCREEN');
            $scope.screenSharedLocal = false;
          }

          // Set Opus as the preferred codec in SDP if Opus is present.
          pc.setLocalDescription(sessionDescription);

          sendMessage(payload);

        }, handleCreateOfferError);
      }


    }

    function OnStreamDenied(error){
      console.log(error);
      logger.log(error);
      $log.info(error);
      $scope.addAlertCallStart('danger', error);

    }


    $scope.installExtension= function(){

      ScreenShare.installChromeExtension();

    };


    ////////////////////////////////////////////////////////////////////////////////////////
    // WebRTC DataChannel logic (Text Messages)                                           //
    ///////////////////////////////////////////////////////////////////////////////////////

    $scope.userMessages = [];

    $scope.sendData = function() {

      var data = $scope.dataChannelSend;

      if(typeof pc != 'undefined'){
        sendChannel.send('Agent: '+ data);
      }

      $scope.userMessages.push('Me: '+ data);
      $scope.dataChannelSend = '';

      var chatBox = document.getElementById('chatBox');
      chatBox.scrollTop = 300 + 8 + ($scope.userMessages.length * 240);

    };

    function handleMessage(event) {
      //trace('Received message: ' + event.data);
      //document.getElementById("dataChannelReceive").value = event.data;

      var message = event.data;

      if(message.byteLength) {
        process_binary(0,message,0);
      }
      else if (message.charAt(0) == '{' && message.charAt(message.length-1) == '}') {
        process_data(message);
      }
      else if (message.charAt(0) == ':' && message.charAt(message.length - 1) == ':'){
        if(message.split(':')[1] === 'Silent'){
          remotePeerHideBox.style.cssText = 'border : 0px solid #000000;';
        }
        else if(message.split(':')[1] === 'Speaking'){
          remotePeerHideBox.style.cssText = 'border : 2px solid #000000;';
        }
      }
      else {
        $scope.$apply(function(){

          $scope.userMessages.push(event.data)

        });
        var chatBox = document.getElementById('chatBox');
        chatBox.scrollTop = 300 + 8 + ($scope.userMessages.length * 240);
      }
    }

    function handleSendChannelStateChange() {
      var readyState = sendChannel.readyState;
      //trace('Send channel state is: ' + readyState);
      enableMessageInterface(readyState == "open");
    }

    function gotReceiveChannel(event) {
      console.log('Receive Channel Callback');
      $log.info('Receive Channel Callback');
      logger.log('Receive Channel Callback');
      sendChannel = event.channel;
      sendChannel.onmessage = handleMessage;
      sendChannel.onopen = handleReceiveChannelStateChange;
      sendChannel.onclose = handleReceiveChannelStateChange;

      if(isStarted){
        maybeStart();
      }
    }

    function handleReceiveChannelStateChange() {
      var readyState = sendChannel.readyState;
      //trace('Receive channel state is: ' + readyState);
      enableMessageInterface(readyState == "open");
    }

    function enableMessageInterface(shouldEnable) {
      if (shouldEnable) {
        //dataChannelSend.disabled = false;
        //dataChannelSend.focus();
        //dataChannelSend.placeholder = "";
        //sendButton.disabled = false;
      } else {
        //dataChannelSend.disabled = true;
        //sendButton.disabled = true;
      }
    }

    ////////////////////////////////////////////////////////////////////////////////////////
    // File Sharing Logic                                                                 //
    ///////////////////////////////////////////////////////////////////////////////////////

    window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
    window.URL = window.URL || window.webkitURL;
    accept_inbound_files();

    /* event delegation
     * -we need to do this to form a chrome app - see https://developer.chrome.com/extensions/contentSecurityPolicy#H2-3
     * -huge thanks to http://stackoverflow.com/questions/13142664/are-multiple-elements-each-with-an-addeventlistener-allowed
     */

    function fileEventHandler(e)
    {
      e = e || window.event;
      var target = e.target || e.srcElement;
      if (target.id.search('-download') != -1) {
        download_file(target.id.replace("-download", ""));
      } else if (target.id.search('-cancel') != -1) {
        cancel_file(target.id.replace("-cancel", ""));
      } else if (target.id == 'upload_stop') {
        upload_stop();
      }
    }
    document.body.addEventListener('click',fileEventHandler,false);

    /* sending functionality, only allow 1 file to be sent out at a time */
    var chunks = {};
    var meta = {};
    var filesysteminuse = false;
    var FSdebug = false;
    var chunksPerACK = 16; /* 16k * 16 = 256k (buffer size in Chrome & seems to work 100% of the time) */

    function get_chunk_size(me, peer) {

      return 16000;//64000;//36000;

    }

    /* Used in Chrome to handle larger files (and firefox with idb.filesystem.js) */
    window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
    var file_to_upload;    /* "pointer" to external file */

    /* recieving functionality, values stored per user id */
    var fs = [];  /* hold our filesystems for download files */
    var saved_fileEntry = []; /* holds temporary fileEntry's during last encryption hash check */
    var downloading = []; /* downloading or not */
    var recieved_meta = []; /* the file meta data other users send over */
    var recievedChunks = []; /* store the chunks in memory before writing them to filesystem */
    var recievedChunksWritePointer = []; /* stores the # of the next chunk to be written to the filesystem */
    var createdChunksWritePointer = []; /* true if the file has been created*/
    var requestedChunksWritePointer = []; /* stores the value of the next chunk to be requested */

    /* stop the uploading! */
    function upload_stop() {
      /* remove data */
      chunks = {};
      meta = {};

      /* also clear the container */
      create_or_clear_container(0);

      /* firefox and chrome specific I think, but clear the file input */
      document.getElementById('file').value='';
    }

    /* write a peice of a file to a file on the filesystem... allows for unlimited file size!
     * FF does have a limitation in that we cannot load files directly out of idb.filesystem.js, we must first load them into memory :(
     */
    function write_to_file(user_id, chunk_data, chunk_num, hash) {

      console.log('got Chunks : ', chunk_data)
      $log.info('got Chunks : ', chunk_data)
      logger.log('got Chunks : ', chunk_data)

      /* store our chunk temporarily in memory */
      recievedChunks[user_id][chunk_num % chunksPerACK] = chunk_data;

      /* once done recieving all chunks for this ack, start writing to memory */
      if (chunk_num %chunksPerACK == (chunksPerACK-1) || recieved_meta[user_id].numOfChunksInFile == (chunk_num+1)) {
        store_in_fs(user_id, hash);
      }
    }

    /* only called by write_to_file */
    function store_in_fs(user_id, hash) {
      var options = null;
      /* massive thanks to http://stackoverflow.com/questions/10720704/filesystem-api-upload-from-local-drive-to-local-filesystem */
      if (createdChunksWritePointer[user_id] == false) {
        options = { create: true };
        createdChunksWritePointer[user_id] = true;
      } else {
        options = { create: false };
      }

      fs[user_id].root.getFile(
        recieved_meta[user_id].name,
        options,
        function(fileEntry) {
          /* create a writer that can put data in the file */
          fileEntry.createWriter(function(writer) {

            /* once we have written all chunks per ack */
            writer.onwriteend = function() {

              /* request the next chunk */
              recievedChunks[user_id] = [];
              requestedChunksWritePointer[user_id] += chunksPerACK;

              if (recieved_meta[user_id].numOfChunksInFile > recievedChunksWritePointer[user_id]) {
                request_chunk(user_id, recievedChunksWritePointer[user_id], hash);
              }
            };

            writer.onerror = FSerrorHandler;

            /* build the blob based on the binary array this.recievedChunks[user_id] */
            var builder = new Blob(recievedChunks[user_id], [recieved_meta[user_id].type]);

            /* debug */
            if (FSdebug) {
              console.log("DEBUG: writing chunk2 "+ recievedChunksWritePointer[user_id]);
              $log.info("DEBUG: writing chunk2 "+ recievedChunksWritePointer[user_id]);
              logger.log("DEBUG: writing chunk2 "+ recievedChunksWritePointer[user_id]);

              for (var i=0;i<chunksPerACK;i++) {
                if (recievedChunks[user_id][i]) {
                  console.log('recived: '+CryptoJS.SHA256(_arrayBufferToBase64(recievedChunks[user_id][i])).toString(CryptoJS.enc.Base64));
                  $log.info('recived: '+CryptoJS.SHA256(_arrayBufferToBase64(recievedChunks[user_id][i])).toString(CryptoJS.enc.Base64));
                  logger.log('recived: '+CryptoJS.SHA256(_arrayBufferToBase64(recievedChunks[user_id][i])).toString(CryptoJS.enc.Base64));
                }
              }
            }

            /* write the blob to the file, this can only be called once! Will fail silently if called while writing! We avoid this by only writing once per ack. */
            var seek = recievedChunksWritePointer[user_id] * get_chunk_size('chrome', recieved_meta[user_id].browser); //don't hardcode
            writer.seek(seek);
            writer.write(builder);
            recievedChunksWritePointer[user_id] += chunksPerACK;

            /* EOF condition */
            if (recieved_meta[user_id].numOfChunksInFile <= (recievedChunksWritePointer[user_id])) {
              console.log("creating file link!");
              logger.log("creating file link!");
              $log.info("creating file link!");

              /* stop accepting file info */
              downloading[user_id] = false;

              /* on encrypted completion here, send hash back to other user who verifies it, then sends the OK to finish back */
              //if (encryption_type != "NONE") {
              //saved_fileEntry[user_id] = fileEntry;
              //request_chunk(user_id, recievedChunksWritePointer[user_id], hash); /* this chunk doesn't exist, but we need the hash of the last chunk to be verified */
              //} else {
              if (webrtcDetectedBrowser == "chrome") {
                create_file_link (recieved_meta[user_id], user_id, fileEntry);
              } else {
                /* one little idb.filesystem.js quirk */
                fileEntry.file(function(file) {
                  create_file_link (recieved_meta[user_id], user_id, file); /* <-- file, not fileEntry */
                });
              }
              //}
            }
          }, FSerrorHandler);
        }, FSerrorHandler);
    }

    /* process local inbound files */
    function process_inbound_files(file) {

      file_to_upload = file;

      meta.name = file.name;
      meta.size = file.size;
      meta.filetype = file.type;
      meta.browser = 'chrome';//$.browser.name; /* need browser name to set chunk size */ // should not be hardcoded
      //console.log(meta);

      send_meta();
      sendChannel.send("You have received a file. Download and Save it.");
      $log.info("You have received a file. Download and Save it.");
      logger.log("You have received a file. Download and Save it.");

      /* user 0 is this user! */
      create_upload_stop_link(file_to_upload.name, 0);//, username);
    }

    /* Document bind's to accept files copied. Don't accept until we have a connection */
    function accept_inbound_files() {

      document.getElementById('file').addEventListener('change', function(e) {
        if (e.target.files.length == 1) {
          var file = e.target.files[0];

          process_inbound_files(file);
        }
      }, false);
    }

    /* inbound - recieve binary data (from a file)
     * we are going to have an expectation that these packets arrive in order (requires reliable datachannel)
     */
    function process_binary(id,message,hash) {
      if (!downloading[id]) {
        return;
      }

      if (FSdebug) {
        console.log("processing chunk # " + recieved_meta[id].chunks_recieved);
        $log.info("processing chunk # " + recieved_meta[id].chunks_recieved);
        logger.log("processing chunk # " + recieved_meta[id].chunks_recieved);
      }

      /* We can write to a file using FileSystem! Chrome has native support, FF uses idb.filesystem.js library */
      /* Note that decrypted file packets are passed here by file_decrypt, we don't have to do any decryption here */

      write_to_file(id, message, recieved_meta[id].chunks_recieved, hash);//id, rtc.usernames[id], message, recieved_meta[id].chunks_recieved, hash
      recieved_meta[id].chunks_recieved++;

      if (recieved_meta[id].numOfChunksInFile > recieved_meta[id].chunks_recieved) {
        update_container_percentage(id, recieved_meta[id].chunks_recieved - 1, recieved_meta[id].numOfChunksInFile, recieved_meta[id].size);
      } else {
        //console.log("done downloading file!");
        logger.log("done downloading file!");
        /* stop accepting file info */
        downloading[id] = false;
        /* creating the download link is handled by write_to_file */
      }
    }

    /* inbound - recieve data
     * note that data.chunk refers to the incoming chunk #
     */
    function process_data(data) {
      data = JSON.parse(data).data;
      console.log('process_data function: ', data)
      logger.log('process_data function: ', data)
      $log.info('process_data function: ', data)
      if (data.file_meta) {
        /* we are recieving file meta data */

        /* if it contains file_meta, must be meta data! */
        recieved_meta[0] = data.file_meta;
        recieved_meta[0].numOfChunksInFile = Math.ceil(recieved_meta[0].size / get_chunk_size(recieved_meta[0].browser, 'chrome'));// Don't hardcode
        recieved_meta[0].name = sanitize(recieved_meta[0].name);

        /* we are not downloading anymore if we just got meta data from a user
         * call to create_pre_file_link is reliant on this to not display [c] button on new file information
         */
        downloading[0] = false;
        delete_file(0);


        /* create a download link */
        create_pre_file_link(recieved_meta[0], 0, data.username);

        /* if auto-download, start the process */
        /* removed feature
         if ($("#auto_download").prop('checked')) {
         download_file(data.id);
         }
         */

        //console.log(recieved_meta[0]);
      } else if (data.kill) {
        /* if it is a kill msg, then the user on the other end has stopped uploading! */

        downloading[0] = false;
        delete_file(0);
        if (recieved_meta[0]) {
          recieved_meta[0].chunks_recieved = 0;
        }
        create_or_clear_container(0);

      } else if (data.ok_to_download) {
        /* if we recieve an ok to download message from other host, our last file hash checks out and we can now offer the file up to the user */

        if (is_chrome) {
          create_file_link (recieved_meta[0], 0, saved_fileEntry[0]);
        } else {
          /* one little idb.filesystem.js quirk */
          saved_fileEntry[0].file(function(file) {
            create_file_link (recieved_meta[0], 0, file); /* <-- file, not fileEntry */
          });
        }
      } else {

        console.log('Chunk is requested');
        $log.info('Chunk is requested');
        logger.log('Chunk is requested');

        /* Otherwise, we are going to assume that if we have reached here, this is a request to download our file */
        if (data.chunk % chunksPerACK == 0) {
          for (var i=0;i<chunksPerACK;i++) {
            send_chunk_if_queue_empty(0, data.chunk + i, data.browser, data.rand, data.hash);
          }
        }
      }
    }

    /* Use this to avoid xss
     * recommended escaped char's found here - https://www.owasp.org/index.php/XSS_(Cross_Site_Scripting)_Prevention_Cheat_Sheet#RULE_.231_-_HTML_Escape_Before_Inserting_Untrusted_Data_into_HTML_Element_Content
     */
    function sanitize(msg) {
      msg = msg.toString();
      return msg.replace(/[\<\>"'\/]/g,function(c) {  var sanitize_replace = {
        "<" : "&lt;",
        ">" : "&gt;",
        '"' : "&quot;",
        "'" : "&#x27;",
        "/" : "&#x2F;"
      };
        return sanitize_replace[c]; });
    }


    /* request chunk # chunk_num from id, at this point just used to request the first chunk */
    function request_chunk(id, chunk_num, hash) {
      if (FSdebug) {
        console.log("DEBUG: requesting chunk " + chunk_num + " from " + id);
        $log.info("DEBUG: requesting chunk " + chunk_num + " from " + id);
        logger.log("DEBUG: requesting chunk " + chunk_num + " from " + id);
      }

      console.log('Function which actually asks for chunk');
      $log.info('Function which actually asks for chunk');
      logger.log('Function which actually asks for chunk');

      sendChannel.send(JSON.stringify({ //id, JSON.stringify({
        "eventName": "request_chunk",
        "data": {
          "chunk": chunk_num,
          "browser": 'chrome'
        }
      }));

    }

    /* bootstrap alerts! */
    function boot_alert(text) {
      console.log('Boot_alert: ', text);
      $log.info('Boot_alert: ', text);
      logger.log('Boot_alert: ', text);
      //$("#alerts").append('<div class="alert alert-danger alert-dismissable">'+text+'<button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button></div>');
    }

    /* request id's file by sending request for block 0 */
    function download_file(id) {

      /* event listeners or javascript can call us, if id isn't set, must have been an event listener */
      /*if (typeof id == 'object') {
       var str = id.target.id;
       id = str.replace("-download", "");
       }*/
      console.log('Download File');
      $log.info('Download File');
      logger.log('Download File');
      /* We can't request multiple filesystems or resize it at this time. Avoiding hacking around this ATM
       * and will instead display warning that only 1 file can be downloaded at a time :(
       */
      if (filesysteminuse) {
        console.log('Sorry, but only 1 file can be downloaded or stored in browser memory at a time, please [c]ancel or [d]elete the other download and try again.')
        logger.log('Sorry, but only 1 file can be downloaded or stored in browser memory at a time, please [c]ancel or [d]elete the other download and try again.')
        boot_alert("Sorry, but only 1 file can be downloaded or stored in browser memory at a time, please [c]ancel or [d]elete the other download and try again.");
        return;
      }

      window.requestFileSystem(window.TEMPORARY, recieved_meta[id].size, function(filesystem) {
        fs[id] = filesystem;
        filesysteminuse = true;
        downloading[id] = true; /* accept file info from user */
        console.log('File System given to the program');
        logger.log('File System given to the program');
        $log.info('File System given to the program');
        request_chunk(id, 0, 0);
      });

      console.log('After File System given to the program');
      logger.log('After File System given to the program');
      $log.info('After File System given to the program');

      recieved_meta[id].chunks_recieved = 0;
      recievedChunksWritePointer[id] = 0;
      createdChunksWritePointer[id] = false;
      requestedChunksWritePointer[id] = 0;
      recievedChunks[id] = [];
    }


    /* delete a file - should be called when cancel is requested or kill is called */
    function delete_file(user_id) {
      if (fs[user_id]) {
        filesysteminuse = false;
        fs[user_id].root.getFile(recieved_meta[user_id].name, {create: false}, function(fileEntry) {
          fileEntry.remove(function() {
            console.log('File removed.');
            $log.info('File removed.');
            logger.log('File removed.');
          }, FSerrorHandler);
        }, FSerrorHandler);
      }
    }

    /* cancel incoming file */
    function cancel_file(id) {
      downloading[id] = false; /* deny file info from user */
      delete_file(id);
      recieved_meta[id].chunks_recieved = 0;
      /* create a new download link */
      create_pre_file_link(recieved_meta[id], id);
    }


    /* creates an entry in our filelist for a user, if it doesn't exist already - TODO: move this to script.js? */
    function create_or_clear_container(id) {
      var filelist = document.getElementById('filelist_cointainer');
      var filecontainer = document.getElementById(id);
      //username = sanitize(username);

      /* if the user is downloading something from this person, we should only clear the inside span to save the cancel button */
      if (downloading[id] == true) {
        var span = document.getElementById(id + "-span");
        if (!span) {
          filecontainer.innerHTML = '<span id="'+id+'-span"></span>';
          /* add cancel button */
          var a = document.createElement('a');
          a.download = meta.name;
          a.id = id + '-cancel';
          a.href = 'javascript:void(0);';
          a.style.cssText = 'color:red;';
          a.textContent = '[c]';
          a.draggable = true;
          //append link!
          filecontainer.appendChild(a);
        } else {
          span.innerHTML="";
        }
        return;
      }
      var username=''; // temporary
      if (!filecontainer) {
        /* if filecontainer doesn't exist, create it */
        var fs = '<div id="' + id + '">' + username + '</div>';
        filelist.innerHTML = filelist.innerHTML + fs;
      } else {
        /* if filecontainer does exist, clear it */
        filecontainer.innerHTML = username;
      }
    }


    /* creates an entry in our filelist for a user, if it doesn't exist already */
    function remove_container(id) {
      var filecontainer = document.getElementById(id);
      if (filecontainer) {
        filecontainer.remove();
      }
      if (fs[id]) {
        delete_file(id);
      }
    }

    /////////////
    // TODO Will see this later, commenting for now
    /////////////
    /* create a link that will let the user start the download */
    function create_upload_stop_link(filename, id){//, username) {

      //create a place to store this if it does not already
      create_or_clear_container(id);//, username);
      var filecontainer = document.getElementById(id);

      //create the link
      var span = document.createElement('span');
      span.textContent = ''+filename + ' ';

      var a = document.createElement('a');
      a.download = meta.name;
      a.id = 'upload_stop';
      a.href = 'javascript:void(0);';
      a.textContent = '[Stop Upload]';
      a.style.cssText = 'color:red;';
      a.draggable = true;

      //append link!
      filecontainer.appendChild(span);
      filecontainer.appendChild(a);

    }

    /* create a link that will let the user start the download */
    function create_pre_file_link(meta, id, username) {

      //create a place to store this if it does not already
      create_or_clear_container(id);
      var filecontainer = document.getElementById(id);

      //create the link
      var span = document.createElement('span');
      span.textContent = '';

      var a = document.createElement('a');
      a.download = meta.name;
      a.id = id + '-download';
      a.href = 'javascript:void(0);';
      a.textContent = 'Download : ' + meta.name + ' ' + getReadableFileSizeString(meta.size);
      a.draggable = true;

      //append link!
      filecontainer.appendChild(span);
      filecontainer.appendChild(a);

      //append to chat
      sendMessage("User is now offering file " + meta.name);
    }

    /* update a file container with a DL % */
    function update_container_percentage(id, chunk_num, chunk_total, total_size) {

      create_or_clear_container(id);
      var span = document.getElementById(id+'-span');

      /* create file % based on chunk # downloaded */
      var percentage = (chunk_num / chunk_total) * 100;
      span.innerHTML = percentage.toFixed(1) + "% of " + getReadableFileSizeString(total_size) + ' ';

    }

    /* -h */
    function getReadableFileSizeString(fileSizeInBytes) {
      var i = -1;
      var byteUnits = [' kB', ' MB', ' GB', ' TB', 'PB', 'EB', 'ZB', 'YB'];
      do {
        fileSizeInBytes = fileSizeInBytes / 1024;
        i++;
      } while (fileSizeInBytes > 1024);
      return Math.max(fileSizeInBytes, 0.1).toFixed(1) + byteUnits[i];
    };

    /* create a link to this file */
    function create_file_link (meta, id, fileEntry) {
      //grab the file type, should probably use a pattern match...
      var remove_base = meta.filetype.split(";");
      var remove_data = remove_base[0].split(":");
      var filetype = remove_data[1];
      var debase64_data;

      //create a place to store this if it does not already
      create_or_clear_container(id);
      var filecontainer = document.getElementById(id);

      //create the link
      var span = document.createElement('span');
      span.textContent = '';
      var a = document.createElement('a');
      a.download = meta.name;
      /* One difference with Chrome & FF :( */
      if (webrtcDetectedBrowser == "chrome") {
        /* we are going to link to our local file system */
        a.href = fileEntry.toURL();
      } else {
        /* fileEntry is actually not a FileEntry, but a blob in Chrome */
        a.href = window.URL.createObjectURL(fileEntry);
      }
      a.textContent = 'Save : ' + meta.name;
      a.dataset.downloadurl = [filetype, a.download, a.href].join(':');
      a.draggable = true;

      //append link!
      var messages = document.getElementById('messages');
      filecontainer.appendChild(span);
      filecontainer.appendChild(a);

      /* make delete button */
      filecontainer.innerHTML = filecontainer.innerHTML+ " ";
      /* add cancel button */
      var can = document.createElement('a');
      can.download = meta.name;
      can.id = id + '-cancel';
      can.href = 'javascript:void(0);';
      can.style.cssText = 'color:red;';
      can.textContent = '[d]';
      can.draggable = true;
      //append link!
      filecontainer.appendChild(can);

      //append to chat
      sendMessage("File " + meta.name + " is ready to save locally");
    }


    /* send out meta data, allow for id to be empty = broadcast */
    function send_meta(id) {
      /*if (jQuery.isEmptyObject(meta)) {
       return;
       }*/

      console.log("sending meta data");
      $log.info("sending meta data");
      logger.log("sending meta data");
      //console.log(meta);

      sendChannel.send(JSON.stringify({
        eventName: "data_msg",
        data: {
          file_meta: meta
        }
      }));

    }

    /* Please note that this works by sending one chunk per ack */

    function sendchunk(id, chunk_num, other_browser, rand, hash) {
      /* uncomment the following lines and set breakpoints on them to simulate an impaired connection */
      /* if (chunk_num == 30) { console.log("30 reached, breakpoint this line");}
       if (chunk_num == 50) { console.log("30 reached"); }*/

      var reader = new FileReader;
      var upper_limit = (chunk_num + 1) * get_chunk_size(other_browser, 'chrome'); //don't hardcode
      if (upper_limit > meta.size) { upper_limit = meta.size; }

      var seek = chunk_num * get_chunk_size(other_browser, 'chrome'); //don't hardcode
      var blob;
      if(typeof file_to_upload != 'undefined'){
        blob = file_to_upload.slice(seek, upper_limit);
      }
      reader.onload = function(event) {
        if (reader.readyState == FileReader.DONE) {

          //if (encryption_type != "NONE") {
          //	file_encrypt_and_send(id, event.target.result, rand, chunk_num);
          //} else {
          if (FSdebug) {
            console.log("DEBUG: sending chunk "+ chunk_num);
            console.log('sending: '+CryptoJS.SHA256(_arrayBufferToBase64(event.target.result)).toString(CryptoJS.enc.Base64));
            logger.log('sending: '+CryptoJS.SHA256(_arrayBufferToBase64(event.target.result)).toString(CryptoJS.enc.Base64));

            $log.info("DEBUG: sending chunk "+ chunk_num);
            $log.info('sending: '+CryptoJS.SHA256(_arrayBufferToBase64(event.target.result)).toString(CryptoJS.enc.Base64));
            logger.log('sending: '+CryptoJS.SHA256(_arrayBufferToBase64(event.target.result)).toString(CryptoJS.enc.Base64));
          }
          sendChannel.send(event.target.result);//id, event.target.result);
          //}
        }


      };
      reader.readAsArrayBuffer(blob);
    }

    /* ideally we would check the SCTP queue here to see if we could send, doesn't seem to work right now though... */
    function send_chunk_if_queue_empty(id, chunk_num, other_browser, rand, hash) {
      //if (encryption_type != "NONE") {
      //	if ( chunk_num > Math.ceil(file_to_upload.size / get_chunk_size($.browser.name, other_browser))) { /* allow numOfChunksInFile+1 in for last encrpytion hash verification */
      //		return;
      //	}
      //} else {
      if(typeof file_to_upload != 'undefined'){
        if ( chunk_num >= Math.ceil(file_to_upload.size / get_chunk_size('chrome', other_browser))) { //don't hardcode
          return;
        }
      }
      //}

      sendchunk(id, chunk_num, other_browser, rand, hash);
    }

    /***** File System Errors *****/
    //credit - http://www.html5rocks.com/en/tutorials/file/filesystem/
    function FSerrorHandler(e) {
      var msg = '';
      switch (e.code) {
        case FileError.QUOTA_EXCEEDED_ERR:
          msg = 'QUOTA_EXCEEDED_ERR';
          break;
        case FileError.NOT_FOUND_ERR:
          msg = 'NOT_FOUND_ERR';
          break;
        case FileError.SECURITY_ERR:
          msg = 'SECURITY_ERR';
          break;
        case FileError.INVALID_MODIFICATION_ERR:
          msg = 'INVALID_MODIFICATION_ERR';
          break;
        case FileError.INVALID_STATE_ERR:
          msg = 'INVALID_STATE_ERR';
          break;
        default:
          msg = 'Unknown Error';
          break;
      };
      console.error('Error: ' + msg);
      logger.error('Error: ' + msg);
      logger.log('Error: ' + msg);
    }

    //used for debugging - credit - http://stackoverflow.com/questions/9267899/arraybuffer-to-base64-encoded-string
    function _arrayBufferToBase64( buffer ) {
      var binary = '';
      var bytes = new Uint8Array( buffer );
      var len = bytes.byteLength;
      for (var i = 0; i < len; i++) {
        binary += String.fromCharCode( bytes[ i ] )
      }
      return window.btoa( binary );
    }



    ////////////////////////////////////////////////////////////////////////////////////////
    // File Sharing Logic End                                                              //
    ////////////////////////////////////////////////////////////////////////////////////////


  });
