/**
 * Created by Saba on 09/22/2015.
 */
/* global RTCIceCandidate, RTCSessionDescription, RTCPeerConnection, EventEmitter */
'use strict';


angular.module('cloudKiboApp')
  .factory('Room', function ($rootScope, $q, socket, $timeout, pc_config, audio_threshold, $log) {

    var iceConfig = pc_config,
      peerConnections = {}, userNames = {},
      dataChannels = {}, currentId, roomId,
      stream, username, screenSwitch = {};

    /** Audio Analyser variables **/
    var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    var analyser = audioCtx.createAnalyser();
    analyser.minDecibels = -90;
    analyser.maxDecibels = -10;
    analyser.smoothingTimeConstant = 0.85;
    var drawVisual;
    var speaking = false;
    /** Audio Analyser variables ends **/

    function analyseAudio(){
      analyser.fftSize = 256;
      var bufferLength = analyser.frequencyBinCount;
      console.log(bufferLength);
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
          $rootScope.$broadcast(speaking ? 'Speaking' : 'Silent');
        }
      };
      draw();
    }

    function getPeerConnection(id) {
      if (peerConnections[id]) {
        return peerConnections[id];
      }
      var pc = new RTCPeerConnection(iceConfig);
      peerConnections[id] = pc;
      pc.addStream(stream);
      pc.onicecandidate = function (evnt) {
        socket.emit('msg', { by: currentId, to: id, ice: evnt.candidate, type: 'ice' });
      };
      pc.onaddstream = function (evnt) {
        $log.debug('Received stream from '+ id);
        if(screenSwitch[id]){
          api.trigger('peer.screenStream', [{
            id: id,
            username: userNames[id],
            stream: evnt.stream
          }]);
          screenSwitch[id] = false;
        } else {
          api.trigger('peer.stream', [{
            id: id,
            username: userNames[id],
            stream: evnt.stream
          }]);
        }
        if (!$rootScope.$$digest) {
          $rootScope.$apply();
        }
      };
      pc.ondatachannel = function (evnt) {
        $log.debug('Received DataChannel from '+ id);
        dataChannels[id] = evnt.channel;
        dataChannels[id].onmessage = function (evnt) {
          handleDataChannelMessage(id, evnt.data);
        };
      };
      return pc;
    }

    function makeOffer(id) {
      var pc = getPeerConnection(id);
      makeDataChannel(id);
      pc.createOffer(function (sdp) {
          console.log(sdp)

          pc.setLocalDescription(sdp);
          $log.debug('Creating an offer for', id);
          socket.emit('msg', { by: currentId, to: id, sdp: sdp, type: 'sdp-offer', username: username });
        }, function (e) {
          $log.error(e);
        },
        { mandatory: { offerToReceiveVideo: true, offerToReceiveAudio: true }});
    }

    function makeDataChannel (id) {
      var pc = getPeerConnection(id);
      try {
        // Reliable Data Channels not yet supported in Chrome
        try {
          dataChannels[id] = pc.createDataChannel("sendDataChannel", {reliable: true});
        }
        catch (e) {
          $log.warn('Unreliable DataChannel for '+ id +': '+ e);
          dataChannels[id] = pc.createDataChannel("sendDataChannel", {reliable: false});
        }
        dataChannels[id].onmessage = function (evnt) {
          handleDataChannelMessage(id, evnt.data);
        };
        $log.debug('Created DataChannel for '+ id);
      } catch (e) {
        alert('Failed to create data channel. ' +
        'You need Chrome M25 or later with RtpDataChannel enabled : ' + e.message);
        $log.error('createDataChannel() failed with exception: ' + e.message);
      }
    }

    function handleDataChannelMessage(id, data) {
      //console.log('datachannel message '+ data);
      api.trigger('dataChannel.message', [{
        id: id,
        username: userNames[id],
        data: data
      }]);
    }

    function handleMessage(data) {
      var pc = getPeerConnection(data.by);
      switch (data.type) {
        case 'sdp-offer':
          userNames[data.by] = data.username;
          pc.setRemoteDescription(new RTCSessionDescription(data.sdp), function () {
            $log.debug('Setting remote description by offer');
            pc.createAnswer(function (sdp) {

              pc.setLocalDescription(sdp);
              socket.emit('msg', { by: currentId, to: data.by, sdp: sdp, type: 'sdp-answer' });
            }, function (e) {
              $log.error(e);
            });
          }, function (e) {
            $log.error(e);
          });
          break;
        case 'sdp-answer':
          console.log('answer by '+ data.by);
          pc.setRemoteDescription(new RTCSessionDescription(data.sdp), function () {
            $log.debug('Setting remote description by answer');
          }, function (e) {
            $log.error(e);
          });
          break;
        case 'ice':
          if (data.ice) {
            $log.debug('Adding ice candidates');
            pc.addIceCandidate(new RTCIceCandidate(data.ice));
          }
          break;
      }
    }

    var connected = false;



    $scope.connect = function(){
      $log.info($scope.user.username +' joins the groucall with room name '+ $routeParams.mname);
      logger.log($scope.user.username +' joins the groucall with room name '+ $routeParams.mname);
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




    function addHandlers(socket) {
      socket.on('peer.connected', function (params) {
        userNames[params.id] = params.username;
        screenSwitch[params.id] = false;
        makeOffer(params.id);
      });
      socket.on('peer.disconnected', function (data) {
        api.trigger('peer.disconnected', [data]);
        if (!$rootScope.$$digest) {
          $rootScope.$apply();
        }
        delete userNames[data.id];
        delete screenSwitch[data.id];
      });

      socket.on('msg', function (data) {
        handleMessage(data);
      });

      /*socket.on('groupcall.chat', function(data){
        api.trigger('groupcall.chat', [{
          username: data.username,
          message: data.message
        }]);
      });*/

      socket.on('groupcall.stream', function(data){
        if(data.id !== currentId){
          if(data.type === 'screen' && data.action) screenSwitch[data.id] = true;
          api.trigger('groupcall.stream', [{
            username: data.username,
            type: data.type,
            action: data.action,
            id: data.id
          }]);
          if(data.type === 'screen') makeOffer(data.id);
        }
      });

      socket.on('connect', function(){
        console.log('connected')
        api.trigger('connection.status', [{
          status : true
        }]);
        if(typeof roomId !== 'undefined' && typeof username !== 'undefined')
          connectRoom(roomId);
      });

      socket.on('disconnect', function () {
        console.log('disconnected')
        api.trigger('connection.status', [{
          status: false
        }]);
        peerConnections = {};
        userNames = {};
        dataChannels = {};
        connected = false;
      });
    }

    function connectRoom (r){
      if (!connected) {
        socket.emit('init', { room: r, username: username }, function (roomid, id) {
          if(id === null){
            alert('You cannot join groupcall. Room is full');
            connected = false;
            return;
          }
          currentId = id;
          roomId = roomid;
        });
        connected = true;
      }
    }
    var api = {
      joinRoom: function (r) {
        connectRoom(r);
      },
      createRoom: function () { // DEPRECATED, not using anymore.
        var d = $q.defer();
        socket.emit('init', null, function (roomid, id) {
          d.resolve(roomid);
          roomId = roomid;
          currentId = id;
          connected = true;
        });
        return d.promise;
      },
      init: function (s, n) {
        stream = s;
        username = n;
        var source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);
        analyseAudio()
      },
      /*sendChat: function (m) {
        socket.emit('groupcall.chat', { message: m, username: username });
      },
      */
      sendDataChannelMessage: function (m) {
        for (var key in dataChannels) {
          if(dataChannels[key].readyState === 'open')
            dataChannels[key].send(m);
        }
      },
      toggleAudio: function () {
        stream.getAudioTracks()[0].enabled = !(stream.getAudioTracks()[0].enabled);
      },
      toggleVideo: function (p) {
        socket.emit('groupcall.stream', { username: username, type: 'video', action: p, id: currentId });
      },
      toggleScreen: function (s, p) {
        for (var key in peerConnections) {
          if (p) {
            peerConnections[key].addStream(s);
          }
          else {
            peerConnections[key].removeStream(s);
          }
        }
        socket.emit('groupcall.stream', { username: username, type: 'screen', action: p, id: currentId });
      },
      end: function () {
        peerConnections = {}; userNames = {}; dataChannels = {};
        connected = false;
      }
    };
    EventEmitter.call(api);
    Object.setPrototypeOf(api, EventEmitter.prototype);

    addHandlers(socket);
    return api;
  });
