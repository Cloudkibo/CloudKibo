'use strict';

/**
 * This module was intended to make conference call code more modular. This is not used for now and is also
 * incomplete, as rewriting of conference code was delayed.
 */

angular.module('kiboRtc.services')
  .factory('RTCConferenceCore', function RTCConference($rootScope, pc_config, pc_constraints, sdpConstraints, audio_constraints, video_constraints, Signalling, $timeout) {

    var pcIndexTemp = 0;
    var pcLength = 4;

    var roomname;
    var username;
    var toUserName

    var isChannelReady;
    /* It is used to check Data Channel is ready or not */
    var isInitiator = false;
    /* It indicates which peer is the initiator of the call */
    var isStarted = false;
    /* It indicates whether the WebRTC session is started or not */

    var sendChannel = [];
    var receiveChannel;

    var localAudioStream;
    var localVideoStream;

    var audioShared = false;
    var videoShared = false;

    var pc = [];
    /* Array of Peer Connection Objects */

    var remoteAudioStream1;
    var remoteAudioStream2;
    var remoteAudioStream3;
    var remoteAudioStream4;

    var remoteVideoStream1;
    var remoteVideoStream2;
    var remoteVideoStream3;
    var remoteVideoStream4;

    var remoteStreamScreen;

    var remoteaudio1;
    var remoteaudio2;
    var remoteaudio3;
    var remoteaudio4;

    var remotevideo1;
    var remotevideo2;
    var remotevideo3;
    var remotevideo4;

    var remoteVideoScreen;

    var localvideo;

    var iJoinLate = false;

    var screenSharePCIndex = 0;

    var turnReady;

    var AUDIO = 'audio';
    /* Constant defining audio */
    var VIDEO = 'video';
    /* Constant defining video */

    var firstAudioAdded = false;
    var secondAudioAdded = false;
    var thirdAudioAdded = false;
    var forthAudioAdded = false;

    var firstVideoAdded = false;
    var secondVideoAdded = false;
    var thirdVideoAdded = false;
    var forthVideoAdded = false;
    var switchingScreenShare = false;

    return {

      /**
       * Initialize the media elements. Application must call this function prior to making any WebRTC video
       * call. Application's UI must contain four video elements: two for local peer and two for remote peer.
       * Service would attach the local and incoming streams to these video elements by itself. You must get
       * the reference of these elements and pass them as parameters.
       *
       * @param remVid1
       * @param remVid2
       * @param remVid3
       * @param remVid4
       * @param remVidScr
       * @param locVid
       */
      initialize: function (video_elements, audio_elements, pc_length) {
        remoteaudio1 = audio_elements.remote1;
        remoteaudio2 = audio_elements.remote2;
        remoteaudio3 = audio_elements.remote3;
        remoteaudio4 = audio_elements.remote4;

        remotevideo1 = video_elements.remote1;
        remotevideo2 = video_elements.remote2;
        remotevideo3 = video_elements.remote3;
        remotevideo4 = video_elements.remote4;

        remoteVideoScreen = video_elements.remoteScreen;
        localvideo = video_elements.local;

        pcLength = pc_length;
        pc = new Array(pcLength);

        for(var i = 0; i<pcLength; i++){
          pc[i] = null;
        }

      },

      /**
       * Creates Peer Connection and attaches the local stream to it. Application must call this function when
       * it knows that both the peers have got the local camera and mic access. In RTCPeerConnection(), we use
       * pc_config service from the configurations. Furthermore, service attaches some private callback functions
       * to some WebRTC connection events. Application doesn't need to care about them. This function assumes
       * that the local peer has got the camera and mic access and it adds the stream to peer connection object.
       * todo this needs some work
       */
      createPeerConnection: function (pcInd) {
        try {

          pc[pcInd] = new RTCPeerConnection(pc_config, {optional: []});//pc_constraints);
          pc[pcInd].onicecandidate = handleIceCandidate;
          pc[pcInd].onaddstream = handleRemoteStreamAdded;
          pc[pcInd].onremovestream = handleRemoteStreamRemoved;
/*
          //if (isInitiator) {
          try {
            // Reliable Data Channels not yet supported in Chrome
            try {
              sendChannel[pcInd] = pc[pcInd].createDataChannel("sendDataChannel", {reliable: true});
            }
            catch (e) {
              console.log('UNRELIABLE DATA CHANNEL')
              sendChannel[pcInd] = pc[pcInd].createDataChannel("sendDataChannel", {reliable: false});
            }
            sendChannel[pcInd].onmessage = handleMessage;
            trace('Created send data channel');
          } catch (e) {
            alert('Failed to create data channel. ' +
            'You need Chrome M25 or later with RtpDataChannel enabled : ' + e.message);
            trace('createDataChannel() failed with exception: ' + e.message);
          }
          sendChannel[pcInd].onopen = handleSendChannelStateChange;
          sendChannel[pcInd].onclose = handleSendChannelStateChange;
          // } else {
          pc[pcInd].ondatachannel = gotReceiveChannel;
*/
          if(audioShared) {
            pc[pcInd].addStream(localAudioStream);
            console.log('added audio stream to pc', localAudioStream);
          }
          else {
            pc[pcInd].addStream(localVideoStream);
            console.log('added video stream to pc ', localVideoStream);
          }

          // }
        } catch (e) {
          console.log('Failed to create PeerConnection, exception: ' + e.message);
          alert('Cannot create RTCPeerConnection object.');
        }
      },

      /**
       * Create and Send Offer to other peer. When initiator has got the camera access and has subsequently
       * made the peer connection object using createPeerConnection(), it must call this function now to send
       * the offer to other party. This function uses two private functions as callback to set local description
       * and handle the create offer error. Application doesn't need to care about these functions.
       *
       */
      createAndSendOffer: function (pcInd, toUser) {
        pcIndexTemp = pcInd;
        toUserName = toUser;
        pc[pcInd].createOffer(setLocalAndSendMessage, handleCreateOfferError);
      },

      /**
       * Create and Send Answer to the peer who made the offer. When peer receives offer from the initiator,
       * it must call this function after setting the remote description. It uses the sdbConstraints from the
       * configurations. It has the callback functions to set local description and handle create answer error.
       * Application is responsible for listening the "message" socket.io event and then check if type is offer.
       * Subsequently, application must call this function to send answer.
       *
       */
      createAndSendAnswer: function (pcInd, toUser) {
        pcIndexTemp = pcInd;
        toUserName = toUser;
        pc[pcInd].createAnswer(setLocalAndSendMessage, function (error) {
          console.log(error)
        }, sdpConstraints);
      },

      /**
       * On receiving remote description from other peer with offer or answer message, application must call this
       * function to set the remote description to peer connection object.
       *
       * @param message It is the remote description sent to the local peer
       */
      setRemoteDescription: function (message, pcInd) {
        pc[pcInd].setRemoteDescription(new RTCSessionDescription(message));
      },

      /**
       * On receiving ice candidate from other peer, application must call this function to add this candidate
       * to local peer connection object. Application is responsible for listening the "message" socket.io event
       * and then check if type is candidate. Subsequently, appliction must call this function to set the remote
       * candidates.
       *
       * @param message It is the remote candidate sent to the local peer
       */
      addIceCandidate: function (message, pcInd) {
        var candidate = new RTCIceCandidate({
          sdpMLineIndex: message.label,
          candidate: message.candidate
        });
        pc[pcInd].addIceCandidate(candidate);
      },

      /**
       * This will toggle the local video on or off. It will automatically notify other client that
       * video has been turned off or on.
       *
       * @param cb callback function to notify application if task was not successful
       */
      toggleVideo: function (cb) {
        if (videoShared) {

          localVideoStream.stop();
          pc.removeStream(localVideoStream);
          Signalling.sendMessage('hiding video');
          pc.createOffer(setLocalAndSendMessage, handleCreateOfferError);

          localVideo.src = null;

          videoShared = false;

          $rootScope.$broadcast('localVideoRemoved');

          cb(null);
        }
        else {

          captureMedia(video_constraints, VIDEO, function (err) {
            if (err) return cb(err);

            pc.addStream(localVideoStream);
            Signalling.sendMessage('sharing video');
            pc.createOffer(setLocalAndSendMessage, handleCreateOfferError);

            localVideo.src = URL.createObjectURL(localVideoStream);

            videoShared = true;

            $rootScope.$broadcast('localVideoAdded');

            cb(null);

          });

        }
      },

      /**
       * This will toggle the local audio on or off. It will automatically notify other client that
       * audio has been turned off or on.
       *
       * @param cb callback function to notify application if task was not successful
       */
      toggleAudio: function (cb) {
        if (audioShared) {

          localAudioStream.stop();
          pc.removeStream(localAudioStream);
          pc.createOffer(setLocalAndSendMessage, handleCreateOfferError);

          audioShared = false;

          $rootScope.$broadcast('localAudioRemoved');

          cb(null);
        }
        else {

          captureMedia(audio_constraints, AUDIO, function (err) {
            if (err) return cb(err);

            pc.addStream(localAudioStream);
            pc.createOffer(setLocalAndSendMessage, handleCreateOfferError);

            audioShared = true;

            $rootScope.$broadcast('localAudioAdded');

            cb(null);

          });

        }
      },

      /**
       * Capture the User Media. Application must call this function to capture camera and mic. This function
       * uses video_constraints from the configurations. It sets the callback with null on success and err
       * on error. It attaches the local media stream to video element for the application.
       *
       * @param streamType Type of the stream to be captured. Possible values are "audio" or "video"
       * @param cb It is the callback which should be called with err if there was an error in accessing the media
       */
      captureUserMedia: function (streamType, cb) {
        var constraints;

        if (streamType == AUDIO)
          constraints = audio_constraints;
        else if (streamType == VIDEO)
          constraints = video_constraints;
        else
          return cb('Invalid stream type. Must be "audio" or "video"');

        captureMedia(constraints, streamType, cb);

      },

      /**
       * Gracefully Ends the WebRTC Peer Connection. When any peer wants to end the call, it must call this function.
       * It is the responsibility of application to inform other peer about ending of the call. Application would
       * clean or change the UI itself. Both the peers should call this function to end the call.
       * This function cleans many variables and also stop all the local streams so that camera and screen media
       * (if accessed) would be stopped. Finally, it closes the peer connection.
       *
       */
      endConnection: function () {
        isStarted = false;
        isInitiator = false;

        console.log(localStream);

        if (localStream) {
          localStream.stop();
        }
        if (localStreamScreen) {
          localStreamScreen.stop();
        }
        if (remoteStream) {
          remoteStream.stop();
          remoteVideo.src = null;
          remoteStream = null;
        }
        if (remoteStreamScreen) {
          remoteStreamScreen.stop();
          remoteVideoScreen.src = null;
          remoteStreamScreen = null;
        }

        console.log(localStream);

        try {
          pc.close();
        } catch (e) {
        }

      },

      /**
       * Initializes the Signalling Service. Application can either initialize the signalling from this service or
       * by injecting the original Signalling Service and calling the initialize.
       *
       * Before starting any WebRTC call, application should give information about username of peers
       * and name of the room they join on the server.
       *
       * @param to Username of the other peer
       * @param from Username of this peer
       * @param roomName Name of the socket.io room which both peers must join for signalling
       */
      initializeSignalling: function (to, from, roomName) {
        Signalling.initialize(to, from, roomName);
      },

      /**
       * Application should call this function whenever the local peer wants to stop sharing the stream. This stops
       * the local screen stream and also removes the stream from the peer connection object. It is the responsibility
       * of application to call createAndSendOffer() function afterwards to let other peer know about this.
       */
      hideScreen: function () {
        localStreamScreen.stop();
        pc.removeStream(localStreamScreen);
      },

      /**
       * Adds the screen stream to peer connection object and video element. There is a complete screen sharing
       * service in this library which talks to screen sharing extension and returns the stream.
       *
       * Currently, screen sharing service is used by application and application get the stream using screen
       * sharing service and add it to peer connection object by calling this function
       *
       * todo: Use the screen sharing service inside this service and don't depend  on application
       *
       * @param stream Screen sharing stream
       */
      addStreamForScreen: function (stream) {
        localStreamScreen = stream;
        localVideoScreen.src = URL.createObjectURL(stream);

        pc.addStream(stream);
      },

      /**
       *  Application can check if the local stream is fetched or not by calling this function.
       *
       * @returns {*}
       */
      getLocalStream: function () {
        return localStream;
      },

      getScreenShared: function () {
        return screenShared;
      },

      /**
       * Application can set this to true for the peer who is the initiator of the call. Service must know
       * who is the initiator of the call. Initiator is the one who sends the offer to other peer.
       *
       * @param value Boolean variable to set the value for isInitiator
       */
      setInitiator: function (value) {
        isInitiator = value;
      },

      /**
       * Application can check if the peer is set as initiator or not by using this function. Initiator is
       * the one who sends the offer to other peer.
       * @returns {boolean}
       */
      getInitiator: function () {
        return isInitiator;
      },

      /**
       * Application can set this to true if the call or signalling has been started. This can be used to
       * put some controls i.e. do not send the candidates until the call is started
       *
       * @param value
       */
      setIsStarted: function (value) {
        isStarted = value;
      },

      /**
       * Application can check if the call or signalling has started or not. This can be used to put some controls.
       * i.e. do not send the candidates until the call is started
       *
       * @returns {boolean}
       */
      getIsStarted: function () {
        return isStarted;
      },

      increasePCIndex: function () {
        pcIndex++;
      },

      getPcIndex: function () {
        return pcIndex;
      },

      setIsChannelReady: function (value) {
        isChannelReady = value;
      },

      getIsChannelReady: function () {
        return isChannelReady;
      },

      setIJoinLate: function (value) {
        iJoinLate = value;
      },

      getIJoinLate: function () {
        return iJoinLate;
      },

      setToUserName: function(username) {
        toUserName = username;
      }
    };

    /**
     * Handle Ice Candidate and send it to other peer. This callback is called from within the peer connection object
     * whenever there are candidates available. We need to send each candidate to remote peer. For this, we use
     * signalling service of this library. Refer to the Signalling Service for more information on signalling.
     *
     * This function is not exposed to application and is handled by library itself.
     *
     * @param event holds the candidate
     *
     * todo this needs work and also injecting the values in this won't work
     */
    function handleIceCandidate(event) {
      if (event.candidate) {
        console.log('I got candidate...');
        Signalling.sendMessageForMeeting({
          type: 'candidate',
          label: event.candidate.sdpMLineIndex,
          id: event.candidate.sdpMid,
          candidate: event.candidate.candidate}, toUserName);
      } else {
        console.log('End of candidates.');
      }
    }

    /**
     * Set Local Description and send it to other peer. This callback function is called by createOffer()
     * function of the peer connection object. We need to set the Local Description in peer connection object
     * and then send it to the other peer too. Signalling service is used to send it to other peer. Refer to
     * Signalling service for more information on it.
     *
     * @param sessionDescription description about the session
     */
    function setLocalAndSendMessage(sessionDescription) {

      pc[pcIndexTemp].setLocalDescription(sessionDescription);

      //console.log(''+ sessionDescription.FromUser +' sending Offer or Answer to ', toUserName)
      Signalling.sendMessageForMeeting(sessionDescription, toUserName);
    }

    /**
     * Handle the Create Offer Error. This callback function is called by createOffer() function of the
     * peer connection object whenever there is an error while creating the offer.
     *
     * @param error information about the error which occurred while creating offer
     */
    function handleCreateOfferError(error) {
      console.log('createOffer() error: ', error);
    }

    /**
     * Handle the remote stream. This call back function is used to handle the streams sent by the remote peer.
     * Currently, we have two types of streams to hold: video streams, audio stream and screen sharing stream. This
     * function takes care of handling of all stream and assigning them to correct video or audio element.
     *
     * When screen is shared it broadcasts 'screenShared' to the application. Application is responsible
     * to listen to that message and change the UI accordingly i.e. show video element
     *
     * @param event holds the stream sent by the remote peer
     * todo this needs some work, remove scopes from here
     */
    function handleRemoteStreamAdded(event) {
      console.log('Remote stream added. ', event.stream);//, event);

      if (event.stream.getAudioTracks().length) {
        if(firstAudioAdded == false){
          $rootScope.$broadcast('peer1Joined');

          console.log('added audio in 1');

          remoteaudio1.src = URL.createObjectURL(event.stream);
          remoteAudioStream1 = event.stream;
          firstAudioAdded = true;
        }
        else if(firstAudioAdded == true && secondAudioAdded == false){
          $rootScope.$broadcast('peer2Joined');

          console.log('added audio in 2');

          remoteaudio2.src = URL.createObjectURL(event.stream);
          remoteAudioStream2 = event.stream;
          secondAudioAdded = true;
        }
        else if(firstAudioAdded == true && secondAudioAdded == true && thirdAudioAdded == false){
          $rootScope.$broadcast('peer3Joined');

          console.log('added audio in 3');

          remoteaudio3.src = URL.createObjectURL(event.stream);
          remoteAudioStream3 = event.stream;
          thirdAudioAdded = true;
        }
        else if(firstAudioAdded == true && secondAudioAdded == true && thirdAudioAdded == true && forthAudioAdded == false){
          $rootScope.$broadcast('peer4Joined');

          console.log('added audio in 4');

          remoteaudio4.src = URL.createObjectURL(event.stream);
          remoteAudioStream4 = event.stream;
          forthAudioAdded = true;
        }
      }

      if (event.stream.getVideoTracks().length) {

        if(firstVideoAdded == false){
          $rootScope.$broadcast('peer1SharedVideo');

          console.log('added video in 1');

          remotevideo1.src = URL.createObjectURL(event.stream);
          remoteVideoStream1 = event.stream;
          firstVideoAdded = true;
        }
        else if(firstVideoAdded == true && secondVideoAdded == false){
          $rootScope.$broadcast('peer2SharedVideo');

          console.log('added video in 2');

          remotevideo2.src = URL.createObjectURL(event.stream);
          remoteVideoStream2 = event.stream;
          secondVideoAdded = true;
        }
        else if(firstVideoAdded == true && secondVideoAdded == true && thirdVideoAdded == false){
          $rootScope.$broadcast('peer3SharedVideo');

          console.log('added video in 3');

          remotevideo3.src = URL.createObjectURL(event.stream);
          remoteVideoStream3 = event.stream;
          thirdVideoAdded = true;
        }
        else if(firstVideoAdded == true && secondVideoAdded == true && thirdVideoAdded == true && forthVideoAdded == false){
          $rootScope.$broadcast('peer4SharedVideo');

          console.log('added video in 4');

          remotevideo4.src = URL.createObjectURL(event.stream);
          remoteVideoStream4 = event.stream;
          forthVideoAdded = true;
        }

        // todo screen switching would need work
        if(switchingScreenShare == true){
          $rootScope.$broadcast('ScreenShared');

          remoteVideoScreen.src = URL.createObjectURL(event.stream);
          remoteStreamScreen = event.stream;
          switchingScreenShare = false;

          console.log('added in screen');

          // todo this needs to be understood
          $timeout(function(){
            Signalling.sendMessageForMeeting('got screen', toUserName);
          }, 4000);

        }

      }



    }

    /**
     * Handle the remote peer stream removal. This callback function is used to handle the situation when remote
     * peer removes any stream i.e. stops screen sharing. This function takes care of knowing which stream has
     * been removed.
     *
     * When screen is removed it broadcasts 'screenShared' to the application. Application is responsible
     * to listen to that message and change the UI accordingly i.e. hide video element
     *
     * @param event
     *
     * todo this needs work
     */
    function handleRemoteStreamRemoved(event) {
      console.log('Remote stream removed.');// Event: ', event);
      $scope.$apply(function(){
        $scope.screenSharedByPeer = false;
      })
    }

    /**
     * This callback function is used to handle the message sent by other peer. The message is sent using data channel
     * of WebRTC. It broadcasts this message to the application so that application can use the message.
     *
     * @param event contains the data sent by other peer
     */
    function handleMessage(event) {
      //trace('MESSAGE GOT: ' + event.data);
      //document.getElementById("dataChannelReceive").value = event.data;

      message = event.data;

      $rootScope.$broadcast("dataChannelMessageReceived");

    }

    /**
     * This callback function is used to handle the sendChannel's state whether it is opened or closed.
     *
     * todo: look for more documentation of this from WebRTC
     */
    function handleSendChannelStateChange() {
      var readyState = sendChannel.readyState;
      //trace('Send channel state is: ' + readyState);
    }

    /**
     * This callback function is called by WebRTC whenever the receiving channel is opened. This receiving channel
     * is the channel through which data travels.
     *
     * @param event holds the channel
     */
    function gotReceiveChannel(event) {
      //trace('Receive Channel Callback');
      sendChannel = event.channel;
      sendChannel.onmessage = handleMessage;
      sendChannel.onopen = handleReceiveChannelStateChange;
      sendChannel.onclose = handleReceiveChannelStateChange;
    }

    /**
     * This is used to handle the situation when receive channel is opened or closed. Application should
     * modify the UI depending on whether the data channel is opened or not.
     *
     * todo: notify the change to application using a broadcast
     */
    function handleReceiveChannelStateChange() {
      var readyState = sendChannel.readyState;
      //trace('Receive channel state is: ' + readyState);
    }

    /**
     * Helper function to capture user media. This will be used by the service internally. This
     * should not be exposed to the application.
     *
     * @param constraints Audio or Video constraints should be set here
     * @param type Stream type should be specified here. Possible values are 'audio' and 'video'
     * @param cb Callback function should be given here
     *
     */
    function captureMedia(constraints, type, cb) {

      getUserMedia(constraints,
        function (newStream) {

          if (type == AUDIO) {
            localAudioStream = newStream;
            audioShared = true;
          }
          else if (type == VIDEO) {
            localVideoStream = newStream;
            localvideo.src = URL.createObjectURL(newStream);
            videoShared = true;
          }

          cb(null);
        },
        function (err) {
          cb(err);
        }
      );

    }


  });
