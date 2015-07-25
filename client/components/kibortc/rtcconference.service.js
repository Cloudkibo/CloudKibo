'use strict';

/**
 * This module was intended to make conference call code more modular. This is not used for now and is also
 * incomplete, as rewriting of conference code was delayed.
 */

angular.module('kiboRtc.services')
  .factory('RTCConference', function RTCConference($rootScope, socket, Signalling, RTCConferenceCore, ScreenShare, $timeout) {

    var username;
    var room;
    var toUserName;

    var isInitiator = false;
    var isChannelReady = false;
    var isStarted = false;
    var pcIndex = 0;
    var pcLength = 4;
    var switchPCIndex = 0;
    var otherPeers = [];
    var localScreenShared = false;

    var switchingScreenShare = false;
    var switchingAudio = false;

    var iJoinLate = false;

    ScreenShare.initialize();



    socket.on('full', function (room) {
      alert('Room ' + room + ' is full. You can not join the meeting.');
    });

    socket.on('created', function (room) {
      console.log('Created room ' + room);
      /*
       $scope.meetingData.creator = $scope.user.username;
       $scope.meetingData.roomname = room;
       var startTime = new Date();
       $scope.meetingData.StartTime = startTime.toUTCString();
       */
      isInitiator = true;
    });

    socket.on('join', function (room) {
      //console.log('Another peer made a request to join room ' + room);
      //console.log('This peer is the initiator of room ' + room + '!');
      if (isStarted) {
        pcIndex++;
      }

      //$scope.meetingData.members = room.otherClients.slice();
      otherPeers = room.otherClients.slice();

      console.log(otherPeers)
      //$scope.meetingData.members.splice( $scope.meetingData.members.indexOf($scope.user.username), 1 );
      var tempInd = otherPeers.indexOf(username);

      if(tempInd > -1) {
        console.log('inside the splice with value '+ tempInd +' and name '+ otherPeers[tempInd])
        otherPeers.splice(tempInd, 1);
        console.log(otherPeers)
      }

      isChannelReady = true;
    });

    socket.on('joined', function (room) {
      console.log('This peer has joined room ' + room.room + ' ' + room.username + ' ' + room.otherClients);
      isChannelReady = true;

      if (room.otherClients.length > 1) {
        iJoinLate = true;
      }

      otherPeers = room.otherClients.slice();
      //console.log(otherPeers);


      startCalling();
    });

    // todo complete todo here
    socket.on('message', function (message) {
      //console.log('Client received message: '+ JSON.stringify(message));

      //console.log(message)
      if (message.payload.msg === 'got user media') {
        if (isInitiator && !isStarted) {
          toUserName = message.FromUser;
          startCalling();//maybeStart();
        }
      }

      else if (message.payload.msg === 'bye' ){

        //console.log(otherPeers.indexOf(message.FromUser));
        //console.log(message);

        $rootScope.$broadcast('peer'+ (otherPeers.indexOf(message.FromUser)+1) +'Leaves');

        RTCConferenceCore.endConnection(otherPeers.indexOf(message.FromUser));

        otherPeers.splice(otherPeers.indexOf(message.FromUser), 1);
        pcIndex--;

        if(pcIndex < 0) {
          isStarted = false;
          pcIndex = 0;
        }

      }

      else if (message.payload === 'got screen' && message.ToUser == username) {

        if(RTCConferenceCore.getSwitchingScreenShare()){
          switchPCIndex++;
          if (switchPCIndex <= pcIndex) {
            RTCConferenceCore.shareScreenToNext(switchPCIndex, username, otherPeers[switchPCIndex]);
          }
          else {
            RTCConferenceCore.setSwitchingScreenShare(false);
          }
        }


      }

      else if (message.payload === 'screen close' && message.ToUser == username) {

        if(RTCConferenceCore.getSwitchingScreenShare()){
          switchPCIndex++;
          if (switchPCIndex <= pcIndex) {
            RTCConferenceCore.hideScreenToNext(switchPCIndex, username, otherPeers[switchPCIndex]);
          }
          else {
            RTCConferenceCore.setSwitchingScreenShare(false);
          }
        }


      }

      else if (message.payload === 'got video' && message.ToUser == username) {

        if(RTCConferenceCore.getSwitchingVideo()){
          switchPCIndex++;
          if (switchPCIndex <= pcIndex) {
            RTCConferenceCore.shareVideo(switchPCIndex, username, otherPeers[switchPCIndex]);
          }
          else {
            RTCConferenceCore.setSwitchingVideo(false);
          }
        }


      }

      else if (message.payload === 'video close' && message.ToUser == username) {

        if(RTCConferenceCore.getSwitchingVideo()){
          switchPCIndex++;
          if (switchPCIndex <= pcIndex) {
            RTCConferenceCore.hideVideoToNext(switchPCIndex, username, otherPeers[switchPCIndex]);
          }
          else {
            RTCConferenceCore.setSwitchingVideo(false);
          }
        }


      }

      else if (message.payload === 'got audio' && message.ToUser == username) {

        if(RTCConferenceCore.getSwitchingAudio()){
          switchPCIndex++;
          if (switchPCIndex <= pcIndex) {
            RTCConferenceCore.shareAudio(switchPCIndex, username, otherPeers[switchPCIndex]);
          }
          else {
            RTCConferenceCore.setSwitchingAudio(false);
          }
        }

      }

      else if (message.payload === 'audio close' && message.ToUser == username) {

        if(RTCConferenceCore.getSwitchingAudio()){
          switchPCIndex++;
          if (switchPCIndex <= pcIndex) {
            RTCConferenceCore.hideAudioToNext(switchPCIndex, username, otherPeers[switchPCIndex]);
          }
          else {
            RTCConferenceCore.setSwitchingAudio(false);
          }
        }

      }

      else if (message.payload.type === 'offer') {
        //console.log(message);
        toUserName = message.FromUser;
        if (!iJoinLate && !isStarted) {
          if (!isInitiator && !isStarted) {
            maybeStart();
          }
          RTCConferenceCore.setRemoteDescription(message.payload, pcIndex);
          RTCConferenceCore.createAndSendAnswer(pcIndex, toUserName);
        }
        else if (message.payload.sharingScreen === 'open') {
          toUserName = message.FromUser;
          if (message.ToUser == username) {

            RTCConferenceCore.setRemoteDescription(message.payload, otherPeers.indexOf(message.FromUser));

            console.log('I am in the open condition and offerer number is ', otherPeers.indexOf(message.FromUser));

            RTCConferenceCore.setSwitchingScreenShare(true);
            $rootScope.$broadcast("ScreenShared");

            RTCConferenceCore.createAndSendAnswer(otherPeers.indexOf(message.FromUser), toUserName);

          }
        }
        else if (message.payload.sharingScreen === 'close') {
          toUserName = message.FromUser;
          if (message.ToUser == username) {

            RTCConferenceCore.setRemoteDescription(message.payload, otherPeers.indexOf(message.FromUser));

            console.log('I am in the close condition and offerer number is ', otherPeers.indexOf(message.FromUser));

            RTCConferenceCore.setSwitchingScreenShare(true);
            $rootScope.$broadcast("ScreenSharedRemoved");

            RTCConferenceCore.createAndSendAnswer(otherPeers.indexOf(message.FromUser), toUserName);

          }
        }
        else if (message.payload.sharingVideo === 'open') {
          toUserName = message.FromUser;
          if (message.ToUser == username) {

            RTCConferenceCore.setRemoteDescription(message.payload, otherPeers.indexOf(message.FromUser));

            console.log('I am in the open condition and offerer number is ', otherPeers.indexOf(message.FromUser));

            RTCConferenceCore.setSwitchingVideo(true);
            $rootScope.$broadcast("VideoShared");

            RTCConferenceCore.createAndSendAnswer(otherPeers.indexOf(message.FromUser), toUserName);

          }
        }
        else if (message.payload.sharingVideo === 'close') {
          toUserName = message.FromUser;
          if (message.ToUser == username) {

            RTCConferenceCore.setRemoteDescription(message.payload, otherPeers.indexOf(message.FromUser));

            console.log('I am in the close condition and offerer number is ', otherPeers.indexOf(message.FromUser));

            RTCConferenceCore.setSwitchingVideo(true);
            $rootScope.$broadcast("VideoRemoved");

            RTCConferenceCore.createAndSendAnswer(otherPeers.indexOf(message.FromUser), toUserName);

          }
        }
        else if (message.payload.sharingAudio === 'open') {
          toUserName = message.FromUser;
          if (message.ToUser == username) {

            RTCConferenceCore.setRemoteDescription(message.payload, otherPeers.indexOf(message.FromUser));

            console.log('I am in the open condition and offerer number is ', otherPeers.indexOf(message.FromUser));

            RTCConferenceCore.setSwitchingAudio(true);
            $rootScope.$broadcast("AudioShared");

            RTCConferenceCore.createAndSendAnswer(otherPeers.indexOf(message.FromUser), toUserName);

          }
        }
        else if (message.payload.sharingAudio === 'close') {
          toUserName = message.FromUser;
          if (message.ToUser == username) {

            RTCConferenceCore.setRemoteDescription(message.payload, otherPeers.indexOf(message.FromUser));

            console.log('I am in the close condition and offerer number is ', otherPeers.indexOf(message.FromUser));

            RTCConferenceCore.setSwitchingAudio(true);
            $rootScope.$broadcast("AudioRemoved");

            RTCConferenceCore.createAndSendAnswer(otherPeers.indexOf(message.FromUser), toUserName);

          }
        }
        else if (!iJoinLate && isStarted) {

          if (message.ToUser == username) {
            console.log('received OFFER from late joiner '+ toUserName)
            RTCConferenceCore.createPeerConnection(pcIndex);
            RTCConferenceCore.setRemoteDescription(message.payload, pcIndex);
            RTCConferenceCore.createAndSendAnswer(pcIndex, toUserName);

            if(localScreenShared){
              console.log('going to inform about screen');
              $timeout(function(){
                RTCConferenceCore.shareScreenToNext(pcIndex, username, otherPeers[pcIndex]);
              }, 6500);
            }

          }
        }
      }

      else if (message.payload.type === 'answer' && isStarted) {
        console.log('I '+ message.ToUser +' RECEIVED ANSWER FROM '+ message.FromUser)

        toUserName = message.FromUser;
        if (message.ToUser == username) {

          RTCConferenceCore.setToUserName(toUserName);

          if(RTCConferenceCore.getSwitchingScreenShare() || RTCConferenceCore.getSwitchingVideo() || RTCConferenceCore.getSwitchingAudio()) {
            console.log('audio, video or screen switch happenning for ANSWER for '+ message.FromUser)
            RTCConferenceCore.setRemoteDescription(message.payload, otherPeers.indexOf(message.FromUser));
          }
          else {
            console.log('simple ANSWER handling happenning for '+ message.FromUser)
            RTCConferenceCore.setRemoteDescription(message.payload, pcIndex);
          }


        }
      }

      else if (message.payload.type === 'candidate' && isStarted) {
        toUserName = message.FromUser;
        if (message.ToUser == username) {
          RTCConferenceCore.setToUserName(toUserName);

          if(RTCConferenceCore.getSwitchingScreenShare() || RTCConferenceCore.getSwitchingVideo() || RTCConferenceCore.getSwitchingAudio()) {
            console.log('audio, video or screen switch happenning for CANDIDATE for '+ message.FromUser)
            RTCConferenceCore.addIceCandidate(message.payload, otherPeers.indexOf(message.FromUser));
          }
          else {
            console.log('simple CANDIDATE handling happenning for '+ message.FromUser)
            RTCConferenceCore.addIceCandidate(message.payload, pcIndex);
          }
        }
      }

      else if (message.payload.msg === 'bye' && isStarted) {

        RTCConferenceCore.endConnection();

      }
    });

    return {

      sendMessage: function (message) {
        Signalling.sendMessageForMeeting(message);
      },

      sendData: function (message) {
        var i;
        for (i = 0; i < pcLength; i++) {
          RTCConferenceCore.sendDataChannelMessage(message, i);
        }
      },

      joinMeeting: function (payload) {

        username = payload.username;
        room = payload.room;

        Signalling.initialize(null, username, room);

        RTCConferenceCore.initialize(payload.video_elements, payload.audio_elements, pcLength);

        socket.emit('create or join meeting', {room: room, username: username});

      },

      leaveMeeting: function () {
        Signalling.sendMessageForMeeting({msg: 'bye', FromUser : username});
        socket.emit('leave', {room: room, username: username});
      },

      chromeExtensionInstalled: function (cb) {
        ScreenShare.isChromeExtensionAvailable(function (status) {
          cb(status);
        });
      },

      toggleScreenSharing: function (state, cb) {

        var action;
        if (state === 'on')
          action = 'on';
        else if (state === 'off')
          action = 'off';
        else
          return cb('Invalid value. Value should be either "on" or "off".');

        switchPCIndex = 0;

        if (action === 'on') {

          if (!!navigator.webkitGetUserMedia) {

            shareScreen(function (err, stream) {
              if (err) {
                cb(err);
              }
              else {

                RTCConferenceCore.shareScreen(stream, switchPCIndex, username, otherPeers[switchPCIndex]);

                RTCConferenceCore.setSwitchingScreenShare(true);

                localScreenShared = true;

                cb(null);

              }
            });

          }
          else if (!!navigator.mozGetUserMedia) {
            getUserMedia({
              video: {
                mozMediaSource: 'window',
                mediaSource: 'window'
              }
            }, function (stream) {

              RTCConferenceCore.shareScreen(stream, switchPCIndex, username, otherPeers[switchPCIndex]);

              RTCConferenceCore.setSwitchingScreenShare(true);

              localScreenShared = true;

              cb(null);

            }, function (err) {
              cb(err);
            });
          }

        }
        else if (action === 'off') {

          ScreenShare.setSourceIdValue(null);

          switchPCIndex = 0;
          RTCConferenceCore.hideScreen(switchPCIndex, username, otherPeers[switchPCIndex]);

          localScreenShared = false;

          cb(null);
        }


      },

      toggleVideo: function(state, cb) {

        var action;
        if (state === 'on')
          action = 'on';
        else if (state === 'off')
          action = 'off';
        else
          return cb('Invalid value. Value should be either "on" or "off".');

        switchPCIndex = 0;

        if (action === 'on') {

          RTCConferenceCore.captureUserMedia('video', function(err){
            if(err) return alert(err);

            RTCConferenceCore.shareVideo(switchPCIndex, username, otherPeers[switchPCIndex]);

            RTCConferenceCore.setSwitchingVideo(true);

            cb(null);

          }); // there?

        }
        else if (action === 'off') {

          console.log('hin mei ayo.. for hiding video, this is conf service ')

          switchPCIndex = 0;
          RTCConferenceCore.hideVideo(switchPCIndex, username, otherPeers[switchPCIndex]);
          RTCConferenceCore.setSwitchingVideo(true);

          cb(null);
        }
      },

      getMessage: function () {
        return RTCConferenceCore.getDataChannelMessage();
      },

      getPeerName: function (index) {
        index = index-1;
        return (otherPeers[index] === null || typeof otherPeers[index] === 'undefined') ? '' : otherPeers[index];
      },

      toggleAudio: function(state, cb) {

        var action;
        if (state === 'on')
          action = 'on';
        else if (state === 'off')
          action = 'off';
        else
          return cb('Invalid value. Value should be either "on" or "off".');

        switchPCIndex = 0;

        if (action === 'on') {

          RTCConferenceCore.captureUserMedia('audio', function(err){
            if(err) return alert(err);

            RTCConferenceCore.shareAudio(switchPCIndex, username, otherPeers[switchPCIndex]);
            RTCConferenceCore.setSwitchingAudio(true);

            cb(null);

          }); //

        }
        else if (action === 'off') {

          console.log('hin mei ayo.. for hiding video, this is conf service ')

          switchPCIndex = 0;
          RTCConferenceCore.hideAudio(switchPCIndex, username, otherPeers[switchPCIndex]);
          RTCConferenceCore.setSwitchingAudio(true);

          cb(null);
        }
      }


    };


    function maybeStart() {
      //console.log('isStarted localstream isChannelReady ', isStarted, localStream, isChannelReady)
      if (!isStarted && isChannelReady && !iJoinLate) {

        RTCConferenceCore.createPeerConnection(pcIndex);
        isStarted = true;

        if (isInitiator) {
          RTCConferenceCore.createAndSendOffer(pcIndex, toUserName);
        }
      }
      else if(iJoinLate){

        RTCConferenceCore.createPeerConnection(pcIndex);
        isStarted = true;
        //console.log('Im about to call')
        console.log("I have joined late, I have created peer connection index is "+ pcIndex +
        " and otherUsername is "+ toUserName);
        RTCConferenceCore.createAndSendOffer(pcIndex, toUserName);
        //sendMessage({msg: 'You can join', FromUser : $scope.user.username});//doCall();
      }

      $timeout(function(){
        if (iJoinLate && isStarted) {
          pcIndex++;
          if (pcIndex < otherPeers.length) {
            toUserName = otherPeers[pcIndex];
            maybeStart();
          }
          else {
            iJoinLate = false;
            pcIndex--;
          }
        }
      }, 4000);

    }

    function startCalling(){
      RTCConferenceCore.captureUserMedia('audio', function(err){
        if(err) return alert(err);

        Signalling.sendMessageForMeeting({msg: 'got user media', FromUser : username});

        if (isInitiator) {
          maybeStart();
        }
        else if(pcIndex < otherPeers.length && iJoinLate && !isStarted){
          console.log(otherPeers);
          toUserName = otherPeers[pcIndex];
          console.log("I have joined late, i am going to maybestart()");
          maybeStart();

        }

        $rootScope.$broadcast('localStreamCaptured');

      })
    }

    function shareScreen(cb) {
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



  });
