'use strict';

/**
 * This module was intended to make conference call code more modular. This is not used for now and is also
 * incomplete, as rewriting of conference code was delayed.
 */

angular.module('kiboRtc.services')
  .factory('RTCConference', function RTCConference($rootScope, socket, Signalling, RTCConferenceCore) {

    var username;
    var room;
    var toUserName;

    var isInitiator = false;
    var isChannelReady = false;
    var isStarted = false;
    var pcIndex = 0;
    var pcLength = 4;
    var otherPeers = [];

    var iJoinLate = false;

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

    window.onbeforeunload = function(e){
      //var endTime = new Date();
      //$scope.meetingData.EndTime = endTime.toUTCString();
      //$scope.recordMeetingData();
      Signalling.sendMessage('bye');
      // todo this needs work
      //RTCConferenceCore.leaveMeeting();
      //localStream.stop(); // todo this should be in service
    };

    return {

      sendMessage: function (message) {
        Signalling.sendMessageForMeeting(message);
      },

      joinMeeting: function (payload) {

        username = payload.username;
        room = payload.room;

        Signalling.initialize(null, username, room);

        RTCConferenceCore.initialize(payload.video_elements, pcLength);

        socket.emit('create or join meeting', {room: room, username: username});

      },

      leaveMeeting: function () {
        socket.emit('leave', {room: room, username: username});
      }

    };

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

      if (message.msg === 'got user media') {
        if (isInitiator && !isStarted) {
          toUserName = message.FromUser;
          startCalling();//maybeStart();
        }
      }

      else if (message.msg === 'got screen' && message.ToUser == username) {

        screenSharePCIndex++;
        if (screenSharePCIndex < pc.length) {
          if (typeof pc[screenSharePCIndex] != 'undefined') {
            pc[screenSharePCIndex].addStream(localStreamScreen);
            pc[screenSharePCIndex].createOffer(function (sessionDescription) {
              sessionDescription.FromUser = $scope.user.username;
              sessionDescription.ToUser = otherPeers[screenSharePCIndex];
              //console.log('INSIDE CONDITION SCREEN SHARE OPEN')

              if ($scope.closingScreenShare == false) {
                sessionDescription.sharingScreen = 'open';
                console.log('SHARING THE SCREEN')
              }
              else {
                sessionDescription.sharingScreen = 'close';
                console.log('CLOSING THE SCREEN');
                $scope.screenSharedLocal = false;
              }

              // Set Opus as the preferred codec in SDP if Opus is present.
              pc[screenSharePCIndex].setLocalDescription(sessionDescription);

              sendMessage(sessionDescription);

            }, handleCreateOfferError);
          }
        }

      }

      else if (message.msg === 'screen close' && message.ToUser == $scope.user.username) {

        screenSharePCIndex++;
        if (screenSharePCIndex < pc.length) {
          if (typeof pc[screenSharePCIndex] != 'undefined') {
            pc[screenSharePCIndex].removeStream(localStreamScreen);
            pc[screenSharePCIndex].createOffer(function (sessionDescription) {
              sessionDescription.FromUser = $scope.user.username;
              sessionDescription.ToUser = otherPeers[screenSharePCIndex];
              //console.log('INSIDE CONDITION SCREEN SHARE CLOSE')

              if ($scope.closingScreenShare == false) {
                sessionDescription.sharingScreen = 'open';
                console.log('SHARING THE SCREEN')
              }
              else {
                sessionDescription.sharingScreen = 'close';
                console.log('CLOSING THE SCREEN');
                $scope.screenSharedLocal = false;
              }

              // Set Opus as the preferred codec in SDP if Opus is present.
              pc[screenSharePCIndex].setLocalDescription(sessionDescription);

              sendMessage(sessionDescription);

            }, handleCreateOfferError);
          }
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
        else if (message.sharingScreen === 'open') {
          toUserName = message.FromUser;
          if (message.ToUser == $scope.user.username) {
            pc[otherPeers.indexOf(message.FromUser)].setRemoteDescription(new RTCSessionDescription(message));

            console.log('I am in the open condition and offerer number is ', otherPeers.indexOf(message.FromUser));

            $scope.switchingScreenShare = true;
            $scope.peerSharedScreen = true;

            var showScreenButton = document.getElementById("showScreenButton");
            showScreenButton.disabled = true;

            pc[otherPeers.indexOf(message.FromUser)].createAnswer(function (sessionDescription) {

                sessionDescription.FromUser = $scope.user.username;
                sessionDescription.ToUser = toUserName;
                // Set Opus as the preferred codec in SDP if Opus is present.
                pc[otherPeers.indexOf(message.FromUser)].setLocalDescription(sessionDescription);

                sendMessage(sessionDescription);

                console.log('I have answered the screen share offer')

              },
              function (error) {
                console.log(error)
              }, sdpConstraints);
          }
        }
        else if (message.sharingScreen === 'close') {
          toUserName = message.FromUser;
          if (message.ToUser == $scope.user.username) {
            pc[otherPeers.indexOf(message.FromUser)].setRemoteDescription(new RTCSessionDescription(message));

            console.log('I am in the close condition and offerer number is ', otherPeers.indexOf(message.FromUser));

            $scope.peerSharedScreen = false;

            var showScreenButton = document.getElementById("showScreenButton");
            showScreenButton.disabled = false;

            pc[otherPeers.indexOf(message.FromUser)].createAnswer(function (sessionDescription) {

                sessionDescription.FromUser = $scope.user.username;
                sessionDescription.ToUser = toUserName;
                // Set Opus as the preferred codec in SDP if Opus is present.
                pc[otherPeers.indexOf(message.FromUser)].setLocalDescription(sessionDescription);

                sendMessage(sessionDescription);

                console.log('I have answered the screen close offer')

              },
              function (error) {
                console.log(error)
              }, sdpConstraints);

            $timeout($scope.screenCloseTimeOut, 3000);
          }
        }
        else if (!iJoinLate && isStarted) {
          if (message.ToUser == username) {
            RTCConferenceCore.createPeerConnection(pcIndex);
            console.log('I GOT OFFER FROM '+ toUserName)
            RTCConferenceCore.setRemoteDescription(message.payload, pcIndex);
            RTCConferenceCore.createAndSendAnswer(pcIndex, toUserName);
          }
        }
      }

      else if (message.type === 'answer' && isStarted) {
        toUserName = message.FromUser;
        if (message.ToUser == username) {
          //console.log('I RECEIVED ANSWER FROM '+ message.FromUser)
          RTCConferenceCore.setToUserName(toUserName);
          RTCConferenceCore.setRemoteDescription(message.payload, pcIndex);
        }
      }

      else if (message.type === 'candidate' && isStarted) {
        toUserName = message.FromUser;
        if (message.ToUser == username) {
          var candidate = new RTCIceCandidate({
            sdpMLineIndex: message.payload.label,
            candidate: message.payload.candidate
          });
          RTCConferenceCore.setToUserName(toUserName);
          RTCConferenceCore.addIceCandidate(candidate, pcIndex);
        }
      }

      else if (message.msg === 'bye' && isStarted) {

        if (otherPeers.indexOf(message.FromUser) == 0) {
          $scope.firstVideoAdded = false;
          remoteStream1 = null;
          remotevideo1.src = null;
        }
        else if (otherPeers.indexOf(message.FromUser) == 1) {
          $scope.secondVideoAdded = false;
          remoteStream2 = null;
          remotevideo2.src = null;

          $scope.$apply(function () {
            $scope.peer2Joined = false;
          })
        }
        else if (otherPeers.indexOf(message.FromUser) == 2) {
          $scope.thirdVideoAdded = false;
          remoteStream3 = null;
          remotevideo3.src = null;

          $scope.$apply(function () {
            $scope.peer3Joined = false;
          })
        }
        else if (otherPeers.indexOf(message.FromUser) == 3) {
          $scope.forthVideoAdded = false;
          remoteStream4 = null;
          remotevideo4.src = null;

          $scope.$apply(function () {
            $scope.peer4Joined = false;
          })
        }

        if (!$scope.firstVideoAdded && !$scope.secondVideoAdded && !$scope.thirdVideoAdded && !$scope.forthVideoAdded) {
          localStream.stop();
          $scope.localCameraOn = false;
          $scope.callEnded = true;
          console.log("HIN MEI AYO AAA")
        }

        pcIndex--;

        pc.splice(pc.indexOf(message.FromUser), 1);
        sendChannel.splice(sendChannel.indexOf(message.FromUser), 1);

      }
    });


  });
