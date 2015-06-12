'use strict';

/**
 * This module was intended to make conference call code more modular. This is not used for now and is also
 * incomplete, as rewriting of conference code was delayed.
 */

angular.module('kiboRtc.services')
  .factory('RTCConference', function RTCConference($rootScope, socket, Signalling, RTCConferenceCore, ScreenShare) {

    var username;
    var room;
    var toUserName;

    var isInitiator = false;
    var isChannelReady = false;
    var isStarted = false;
    var pcIndex = 0;
    var pcLength = 4;
    var screenSharePCIndex = 0;
    var otherPeers = [];

    var switchingScreenShare = false;

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

      //$scope.meetingData.members.splice( $scope.meetingData.members.indexOf($scope.user.username), 1 );
      otherPeers.splice(otherPeers.indexOf(username), 1);

      isChannelReady = true;
    });

    socket.on('joined', function (room) {
      console.log('This peer has joined room ' + room.room + ' ' + room.username + ' ' + room.otherClients);
      isChannelReady = true;

      if (room.otherClients.length > 1) {
        iJoinLate = true;
        otherPeers = room.otherClients.slice();
      }

      startCalling();
    });

    // todo complete todo here
    socket.on('message', function (message) {
      //console.log('Client received message: '+ JSON.stringify(message));

      if (message.payload.msg === 'got user media') {
        if (isInitiator && !isStarted) {
          toUserName = message.FromUser;
          startCalling();//maybeStart();
        }
      }

      else if (message.payload.msg === 'got screen' && message.ToUser == username) {

        screenSharePCIndex++;
        if (screenSharePCIndex <= pcIndex) {
          RTCConferenceCore.shareScreenToNext(screenSharePCIndex, username, otherPeers[screenSharePCIndex]);
        }

      }

      else if (message.payload.msg === 'screen close' && message.ToUser == username) {

        screenSharePCIndex++;
        if (screenSharePCIndex <= pcIndex) {
          RTCConferenceCore.hideScreenToNext(screenSharePCIndex, username, otherPeers[screenSharePCIndex]);
        }

      }

      else if (message.payload.type === 'offer') {
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
        else if (!iJoinLate && isStarted) {
          if (message.ToUser == username) {
            RTCConferenceCore.createPeerConnection(pcIndex);
            console.log('I GOT OFFER FROM '+ toUserName);
            RTCConferenceCore.setRemoteDescription(message.payload, pcIndex);
            RTCConferenceCore.createAndSendAnswer(pcIndex, toUserName);
          }
        }
      }

      else if (message.payload.type === 'answer' && isStarted) {
        toUserName = message.FromUser;
        if (message.ToUser == username) {
          //console.log('I RECEIVED ANSWER FROM '+ message.FromUser)
          RTCConferenceCore.setToUserName(toUserName);
          RTCConferenceCore.setRemoteDescription(message.payload, pcIndex);
        }
      }

      else if (message.payload.type === 'candidate' && isStarted) {
        toUserName = message.FromUser;
        if (message.ToUser == username) {
          RTCConferenceCore.setToUserName(toUserName);
          RTCConferenceCore.addIceCandidate(message.payload, pcIndex);
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

        screenSharePCIndex = 0;

        if(action === 'on'){

          if (!!navigator.webkitGetUserMedia) {

            shareScreen(function (err, stream) {
              if (err) {
                cb(err);
              }
              else {

                RTCConferenceCore.shareScreen(stream, screenSharePCIndex, username, otherPeers[screenSharePCIndex]);

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

              RTCConferenceCore.shareScreen(stream, screenSharePCIndex, username, otherPeers[screenSharePCIndex]);

              cb(null);

            }, function (err) {
              cb(err);
            });
          }

        }
        else if(action === 'off'){

          ScreenShare.setSourceIdValue(null);

          screenSharePCIndex = 0;
          RTCConferenceCore.hideScreen(screenSharePCIndex, username, otherPeers[screenSharePCIndex]);

          cb(null);
        }


      },

      getMessage: function () {
        return RTCConferenceCore.getDataChannelMessage();
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
        RTCConferenceCore.createAndSendOffer(pcIndex, toUserName);
        //sendMessage({msg: 'You can join', FromUser : $scope.user.username});//doCall();
      }
    }

    function startCalling(){
      RTCConferenceCore.captureUserMedia('audio', function(err){
        if(err) return alert(err);

        Signalling.sendMessageForMeeting({msg: 'got user media', FromUser : username});

        if (isInitiator) {
          maybeStart();
        }
        else if(pcIndex < otherPeers.length && iJoinLate && !isStarted){
          toUserName = otherPeers[pcIndex];
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

    window.onbeforeunload = function(e){
      //var endTime = new Date();
      //$scope.meetingData.EndTime = endTime.toUTCString();
      //$scope.recordMeetingData();
      Signalling.sendMessage('bye');
      // todo this needs work
      //RTCConferenceCore.leaveMeeting();
      //localStream.stop(); // todo this should be in service
    };


  });
