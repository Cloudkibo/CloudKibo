/* global RTCIceCandidate, RTCSessionDescription, RTCPeerConnection, EventEmitter */
'use strict';


angular.module('cloudKiboApp')
  .factory('MeetingRoom', function ($rootScope, $q, socket, $timeout, pc_config, pc_constraints2, audio_threshold, $log, sdpConstraints) {

    var iceConfig = pc_config,
      peerConnections = {}, userNames = {},
      currentId, roomId,
      stream, username, supportCallData,
      nullStreams = {};

    /** Audio Analyser variables **/
    var audioCtx;
    if(!!window.AudioContext)
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    else
      audioCtx = {};
    var analyser;
    if(!!window.AudioContext)
      analyser = audioCtx.createAnalyser();
    else
      analyser = {};
    analyser.minDecibels = -90;
    analyser.maxDecibels = -10;
    analyser.smoothingTimeConstant = 0.85;
    var drawVisual;
    var speaking = false;
    /** Audio Analyser variables ends **/

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
          $rootScope.$broadcast(speaking ? 'Speaking' : 'Silent');
        }
      };
      draw();
    }

    function getPeerConnection(id) {
      if (peerConnections[id]) {
        return peerConnections[id];
      }
      var pc = new RTCPeerConnection(iceConfig, pc_constraints2);
      peerConnections[id] = pc;
      if(stream !== null)
        pc.addStream(stream);
      pc.onicecandidate = function (evnt) {
        socket.emit('msgAudio', { by: currentId, to: id, ice: evnt.candidate, type: 'ice' });
      };
      pc.onaddstream = function (evnt) {
        $log.debug('Received audio stream from '+ id);
        console.log(evnt.stream);
        if (nullStreams[id]) return ;
        api.trigger('peer.stream', [{
          id: id,
          username: userNames[id],
          stream: evnt.stream
        }]);
        if (!$rootScope.$$digest) {
          $rootScope.$apply();
        }
      };
      return pc;
    }

    function makeOffer(id) {
      var pc = getPeerConnection(id);
      pc.createOffer(function (sdp) {
          console.log(sdp)
          //sdp.sdp = sdp.sdp.replace("minptime=10", "minptime=10; maxaveragebitrate=128000"); // todo added for testing by sojharo
          pc.setLocalDescription(sdp);
          $log.debug('Creating an offer for', id);
          socket.emit('msgAudio', { by: currentId, to: id, sdp: sdp, type: 'offer', username: username, camaccess : stream });
        }, function (e) {
          $log.error(e);
        },
        sdpConstraints);
    }

    function handlePeerWithoutAccessToMediaStream(i, n){ // todo test this chunk of code
      api.trigger('peer.stream', [{
        id: i,
        username: n,
        stream: null
      }]);
      nullStreams[i] = n;
    }

    function handleMessage(data) {
      var pc = getPeerConnection(data.by);
      console.log(JSON.stringify(data));
      switch (data.type) {
        case 'offer':
          userNames[data.by] = data.username;
          if(data.camaccess === null && !nullStreams[data.by]) {
            handlePeerWithoutAccessToMediaStream(data.by, data.username)
          }
          pc.setRemoteDescription(new RTCSessionDescription(data.sdp), function () {
            $log.debug('Setting remote description by offer');
            pc.createAnswer(function (sdp) {
              //sdp.sdp = sdp.sdp.replace("minptime=10", "minptime=10; maxaveragebitrate=128000");
              pc.setLocalDescription(sdp);
              socket.emit('msgAudio', { by: currentId, to: data.by, sdp: sdp, type: 'answer', camaccess : stream });
            }, function (e) {
              console.log(e);
            }, sdpConstraints);
          }, function (e) {
            $log.error(e);
          });
          break;
        case 'answer':
          console.log('answer by '+ data.by);
          if(data.camaccess === null && !nullStreams[data.by]) {
            handlePeerWithoutAccessToMediaStream(data.by, userNames[data.by])
          }
          pc.setRemoteDescription(new RTCSessionDescription(data.sdp), function () {
            $log.debug('Setting remote description by answer');
          }, function (e) {
            $log.error(e);
          });
          break;
        case 'ice':
          if (data.ice) {
            $log.debug('Adding ice candidates for audio');
            $log.debug(data.ice)
            pc.addIceCandidate(new RTCIceCandidate(data.ice));
          }
          break;
      }
    }

    var connected = false;

    function addHandlers(socket) {
      socket.on('peer.connected.new', function (params) {
        userNames[params.id] = params.username;
        makeOffer(params.id);
      });
      socket.on('peer.disconnected.new', function (data) {
        api.trigger('peer.disconnected', [data]);
        if (!$rootScope.$$digest) {
          $rootScope.$apply();
        }
        delete userNames[data.id];
      });
      socket.on('msgAudio', function (data) {
        handleMessage(data);
      });
      socket.on('conference.chat', function(data){
        api.trigger('conference.chat', [{
          username: data.username,
          message: data.message
        }]);
      });
      socket.on('conference.stream', function(data){
        if(data.id !== currentId){
          api.trigger('conference.stream', [{
            username: data.username,
            type: data.type,
            action: data.action,
            id: data.id
          }]);
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
        connected = false;
      });
    }

    function connectRoom (r){
      if (!connected) {
        socket.emit('init.new', { room: r, username: username, supportcall : supportCallData }, function (roomid, id) {
          if(id === null){
            alert('You cannot join conference. Room is full');
            connected = false;
            return;
          }
          currentId = id;
          roomId = roomid;
          api.trigger('connection.joined', [{
            username : username,
            roomId : roomId,
            currentId : currentId
          }]);
        });
        connected = true;
      }
    }
    var api = {
      joinRoom: function (r) {
        connectRoom(r);
      },
      init: function (s, n, c) {
        username = n;
        stream = s;
        supportCallData = c;
        if(s!==null) {
          if(!!window.AudioContext) {
            var source = audioCtx.createMediaStreamSource(stream);
            source.connect(analyser);
            analyseAudio()
          }
        }
      },
      sendChat: function (m, s) {
        socket.emit('conference.chat', { message: m, username: username, support_call: s });
      },
      toggleAudio: function () {
        stream.getAudioTracks()[0].enabled = !(stream.getAudioTracks()[0].enabled);
      },
      end: function () {
        peerConnections = {}; userNames = {};
        connected = false;
        stream.getTracks()[0].stop();
      }
    };
    EventEmitter.call(api);
    Object.setPrototypeOf(api, EventEmitter.prototype);

    addHandlers(socket);
    return api;
  });
