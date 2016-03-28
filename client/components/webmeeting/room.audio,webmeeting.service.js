/* global RTCIceCandidate, RTCSessionDescription, RTCPeerConnection, EventEmitter */
'use strict';


angular.module('cloudKiboApp')
  .factory('MeetingRoom', function ($rootScope, $q, socket, $timeout, pc_config, pc_constraints2, CallStats, audio_threshold, logger, sdpConstraints) {

    var peerConnections = {}, userNames = {},
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
      logger.log(''+ username +' has received TURN configuration  '+ JSON.stringify(pc_config.pc_config()));
      var pc = new RTCPeerConnection(pc_config.pc_config(), pc_constraints2);
      peerConnections[id] = pc;
      if(stream !== null)
        pc.addStream(stream);
      pc.onicecandidate = function (evnt) {
        socket.emit('msgAudio', { by: currentId, to: id, ice: evnt.candidate, type: 'ice' });
      };
      pc.onaddstream = function (evnt) {
        logger.log(''+ username +' has received audio stream by  '+ userNames[id]);
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
    /*  var callStats = new callstats(null,io,jsSHA);
      var AppID     = "199083144";
      var AppSecret = "t/vySeaTw5q6323+ArF2c6nEFT4=";
      callStats.initialize(AppID, AppSecret, username, function (err, msg) {
        console.log("Initializing Status: err="+err+" msg="+msg);
        var usage = callStats.fabricUsage.audio;
        callStats.addNewFabric(pc, id, usage, roomId, function(err, msg){
          console.log("Add new Fabric Status for audio: err="+err+" msg="+msg);
        });
      });
      */
      CallStats.addAudioFabric(pc, id, roomId);
      logger.log(''+ username +' has created audio peer connection for  '+ userNames[id]);
      return pc;
    }

    function makeOffer(id) {
      var pc = getPeerConnection(id);
      logger.log(''+ username +' is going to create audio offer for '+ userNames[id]);
      pc.createOffer(function (sdp) {
          //sdp.sdp = sdp.sdp.replace("minptime=10", "minptime=10; maxaveragebitrate=128000"); // todo added for testing by sojharo
          pc.setLocalDescription(sdp);
          logger.log(''+ username +' is now sending audio offer to '+ userNames[id]);
          socket.emit('msgAudio', { by: currentId, to: id, sdp: sdp, type: 'offer', username: username, camaccess : stream });
        }, function (e) {
          logger.log(''+ username +' got this error when creating audio offer for '+ userNames[id]);
          logger.log(JSON.stringify(e));
          logger.log(''+ username +' got the above error when creating audio offer for '+ userNames[id]);
   //       callStats.reportError(pc, roomId, callStats.webRTCFunctions.createOffer, e);
          CallStats.reportOfferError(pc, roomId, e);
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
      switch (data.type) {
        case 'offer':
          userNames[data.by] = data.username;
          if(data.camaccess === null && !nullStreams[data.by]) {
            handlePeerWithoutAccessToMediaStream(data.by, data.username)
          }
          pc.setRemoteDescription(new RTCSessionDescription(data.sdp), function () {
            logger.log(''+ username +' set audio offer remote description sent by  '+ userNames[data.by]);
            pc.createAnswer(function (sdp) {
              //sdp.sdp = sdp.sdp.replace("minptime=10", "minptime=10; maxaveragebitrate=128000");
              pc.setLocalDescription(sdp);
              logger.log(''+ username +' is now sending audio answer to '+ userNames[data.by]);
              socket.emit('msgAudio', { by: currentId, to: data.by, sdp: sdp, type: 'answer', camaccess : stream });
            }, function (e) {
    //          callStats.reportError(pc, roomId, callStats.webRTCFunctions.createAnswer, e);
              CallStats.reportAnswerError(pc, roomId, e);
              logger.log(''+ username +' got this ERROR when creating audio answer for '+ userNames[data.by]);
              logger.log(JSON.stringify(e));
              logger.log(''+ username +' got the above ERROR when creating audio answer for '+ userNames[data.by]);
            }, sdpConstraints);
          }, function (e) {
            logger.log(''+ username +' got this ERROR when setting audio offer from '+ userNames[data.by]);
            logger.log(JSON.stringify(e));
            logger.log(''+ username +' got the above ERROR when setting audio offer from '+ userNames[data.by]);
          });
          break;
        case 'answer':
          if(data.camaccess === null && !nullStreams[data.by]) {
            handlePeerWithoutAccessToMediaStream(data.by, userNames[data.by])
          }
          pc.setRemoteDescription(new RTCSessionDescription(data.sdp), function () {
            logger.log(''+ username +' set audio answer remote description sent by  '+ userNames[data.by]);
          }, function (e) {
            logger.log(''+ username +' got this ERROR when setting audio answer from '+ userNames[data.by]);
            logger.log(JSON.stringify(e));
            logger.log(''+ username +' got the above ERROR when setting audio answer from '+ userNames[data.by]);
          });
          break;
        case 'ice':
          if (data.ice) {
            logger.log(''+ username +' adding ice candidate for audio sent by  '+ userNames[data.by]);
            pc.addIceCandidate(new RTCIceCandidate(data.ice));
          }
          break;
      }
    }

    var connected = false;

    function addHandlers(socket) {
      socket.on('peer.connected.new', function (params) {
        logger.log(''+ username +' was informed in audio channel that '+ params.username +' has joined the meeting.');
        userNames[params.id] = params.username;
        makeOffer(params.id);
      });
      socket.on('peer.disconnected.new', function (data) {
        logger.log(''+ username +' was informed in audio channel that '+ userNames[data.id] +' has left the meeting.');
        api.trigger('peer.disconnected', [data]);
        if (!$rootScope.$$digest) {
          $rootScope.$apply();
        }
        delete userNames[data.id];
      });
      socket.on('msgAudio', function (data) {
        handleMessage(data);
      });


      socket.on('room.lock',function(data){
        console.log('status:data.status ' + data.status);
        api.trigger('room.lock',[{status:data.status}]);
      });

      socket.on('initRequestor_webmeeting',function(data){
        console.log('You are allowed to join room');
        currentId = data.id;
        roomId = data.currentRoom;
        console.log(''+ username +' joined the room '+ roomId +' and got the id '+ currentId)
        logger.log(''+ username +' joined the room '+ roomId +' and got the id '+ currentId)
        api.trigger('connection.joined', [{
          username : username,
          roomId : roomId,
          currentId : currentId,
          roomStatus : data.roomStatus /* to initialize roomstatus at requestor side*/
        }]);
        CallStats.initialize(username);
        connected = true;
      });


      socket.on('knock.request',function(data){
        console.log(data);
        api.trigger('knock.request',[{room: data.room,requestor: data.requestor, supportcall : data.supportCallData}]);
      });

      socket.on('conference.chat', function(data){
        api.trigger('conference.chat', [{
          username: data.username,
          message: data.message
        }]);
      });
      socket.on('connect', function(){
        logger.log(''+ username +' got some internet issue and has reconnected and joining room again');
        api.trigger('connection.status', [{
          status : true
        }]);
        if(typeof roomId !== 'undefined' && typeof username !== 'undefined')
          connectRoom(roomId);
      });
      socket.on('disconnect', function () {
        console.log('disconnected');
        aftermeetingstop(); // TODO Need to discuss this with Zarmeen /**** start clock animation in clock.js ***/
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
        socket.emit('init.new', { room: r, username: username, supportcall : supportCallData },function (roomid, id,status) {
          if(id === null || status === true){
            var r = confirm("You cannot join conference. Room is locked.Do you want to send Knock Request?");
            if (r == true) {
              //send a knock request to room partipants.
              socket.emit('knock.request',{room:roomid,username: username,supportcall : supportCallData})
            }
            connected = false;
            return;
          }
          currentId = id;
          roomId = roomid;
          logger.log(''+ username +' joined the room '+ roomId +' and got the id '+ id)
          api.trigger('connection.joined', [{
            username : username,
            roomId : roomId,
            currentId : currentId,
            roomStatus : status
          }]);
          CallStats.initialize(username);
        });
        connected = true;
      }
    }
    var api = {
      joinRoom: function (r) {
        connectRoom(r);
      },
      allowperson : function(data){

        socket.emit('initRequestor_webmeeting', { room: data.room, username: data.requestor, supportcall : data.supportCallData });
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


      lockRoom:function(data)
      {
        console.log('calling lockRoom socket' + 'room id : '+ roomId + ' status : '+data.status);
        socket.emit('room.lock', { currentRoom : roomId,status : data.status});
      },
      toggleAudio: function () {
        stream.getAudioTracks()[0].enabled = !(stream.getAudioTracks()[0].enabled);
      },
      end: function () {
        logger.log(''+ username +' has ended the audio peer connections for all');
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
