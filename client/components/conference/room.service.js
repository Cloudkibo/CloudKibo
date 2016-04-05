/* global RTCIceCandidate, RTCSessionDescription, RTCPeerConnection, EventEmitter */
'use strict';


angular.module('cloudKiboApp')
  .factory('Room', function ($rootScope, $q, socket, $timeout, pc_config, pc_constraints2, audio_threshold, $log, logger, sdpConstraints) {

    var  peerConnections = {}, userNames = {},
      dataChannels = {}, currentId, roomId,fileReceivers =[],
      stream, username, screenSwitch = {}, otherScreenShared = false,
      supportCallData, nullStreams = {};
    var roomStatus;

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
      logger.log(pc_config.pc_config());
      var pc = new RTCPeerConnection(pc_config.pc_config(), pc_constraints2);
      peerConnections[id] = pc;
      if(stream !== null)
        pc.addStream(stream);
      pc.onicecandidate = function (evnt) {
        socket.emit('msg', { by: currentId, to: id, ice: evnt.candidate, type: 'ice' });
      };
      pc.onaddstream = function (evnt) {
        $log.debug('Received stream from '+ id);
        console.log(evnt.stream);
        if(screenSwitch[id]){
          api.trigger('peer.screenStream', [{
            id: id,
            username: userNames[id],
            stream: evnt.stream
          }]);
          screenSwitch[id] = false;
          logger.log('Received screen sharing stream by '+ username);
        } else {
          if (nullStreams[id]) return ;
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
        logger.log('Received DataChannel from '+ userNames[id] +' by '+ username);
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
          //sdp.sdp = sdp.sdp.replace("minptime=10", "minptime=10; maxaveragebitrate=128000"); // todo added for testing by sojharo
          pc.setLocalDescription(sdp);
          $log.debug('Creating an offer for', id);
          socket.emit('msg', { by: currentId, to: id, sdp: sdp, type: 'offer', username: username, camaccess : stream });
        }, function (e) {
          $log.error(e);
        },
        sdpConstraints);
    }

    function makeDataChannel (id) {
      var pc = getPeerConnection(id);
      try {
        // Reliable Data Channels not yet supported in Chrome
        try {
          dataChannels[id] = pc.createDataChannel("sendDataChannel", {reliable: true});
        }
        catch (e) {
          logger.log('Reliable createDataChannel() failed with exception: ' + JSON.stringify(e.message) +' for username: '+ username +' (Not supported in chrome)');
          dataChannels[id] = pc.createDataChannel("sendDataChannel", {reliable: false});
        }
        dataChannels[id].onmessage = function (evnt) {
          handleDataChannelMessage(id, evnt.data);
        };
        $log.debug('Created DataChannel for '+ id);
      } catch (e) {
        alert('Failed to create data channel. ' +
        'You need Chrome M25 or later with RtpDataChannel enabled : ' + e.message);
        logger.log('createDataChannel() failed with exception: ' + JSON.stringify(e.message) +' for username: '+ username);
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
    function handlePeerWithoutAccessToMediaStream(i, n){
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
              socket.emit('msg', { by: currentId, to: data.by, sdp: sdp, type: 'answer', camaccess : stream });
            }, function (e) {
              logger.log('Error in creating answer : '+ JSON.stringify(e) +' shown to '+ username +' sent by '+ data.username);
            }, sdpConstraints);
          }, function (e) {
            logger.log('Error in setting remote offer : '+ JSON.stringify(e) +' shown to '+ username +' sent by '+ data.username);
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
            logger.log('Error in setting remote answer : '+ JSON.stringify(e) +' shown to '+ username +' sent by '+ data.username);
          });
          break;
        case 'ice':
          if (data.ice) {
            $log.debug('Adding ice candidates');
            $log.debug(data.ice)
            pc.addIceCandidate(new RTCIceCandidate(data.ice));
          }
          break;
      }
    }

    var connected = false;

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
      socket.on('conference.chat', function(data){
        api.trigger('conference.chat', [{
          username: data.username,
          message: data.message
        }]);
      });
      socket.on('room.lock',function(data){
        console.log('status:data.status ' + data.status);
        api.trigger('room.lock',[{status:data.status}]);
      });

      /*** called after meeting ends **/
      socket.on('room.unlock.meetingend',function(data){
        console.log('status:data.status ' + data.status);
        api.trigger('room.unlock.meetingend',[{status:data.status}]);
      });

      socket.on('initRequestor',function(data){
        console.log('You are allowed to join room');
        currentId = data.id;
        roomId = data.currentRoom;
        connected = true;
        roomStatus = data.roomStatus;
        api.trigger('setRoomStatus',[{status:data.roomStatus}]);
      });

      socket.on('knock.request',function(data){
        console.log(data);
        api.trigger('knock.request',[{room: data.room,requestor: data.requestor, supportcall : data.supportCallData}]);
      });
      socket.on('conference.stream', function(data){
        if(data.id !== currentId){
          if(data.type === 'screen' && data.action) screenSwitch[data.id] = true;
          if(data.type === 'screen') otherScreenShared = data.action;
          api.trigger('conference.stream', [{
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
        aftermeetingstop() /**** start clock animation in clock.js ***/
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

        socket.emit('init', { room: r, username: username, supportcall : supportCallData }, function (roomid, id,status) {
          if(id === null || status === true){
            var r = confirm("You cannot join conference. Room is locked.Do you want to send Knock Request?");
            if (r == true) {
              //send a knock request to room partipants.
              socket.emit('knock.request',{room:roomid,username: username,supportcall : supportCallData})
            }
            //var('You cannot join conference. Room is locked');
            //console.log('You cannot join conference. Room is locked');
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
      allowperson : function(data){

        socket.emit('initRequestor', { room: data.room, username: data.requestor, supportcall : data.supportCallData });
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
      init: function (s, n, c) {
        username = n;
        stream = s;
        supportCallData = c;
        if(s!==null) {
          var source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);
          analyseAudio()
        }
      },

      sendChat: function (m, s) {
        console.log('Calling sendchat socket');
        socket.emit('conference.chat', { message: m, username: username, support_call: s });
      },

      lockRoom:function(data)
      {
        console.log('calling lockRoom socket' + 'room id : '+ roomId + ' status : '+data.status);
        socket.emit('room.lock', { currentRoom : roomId,status : data.status});
      },
      sendDataChannelMessage: function (m) {
        for (var key in dataChannels) {
          if(dataChannels[key].readyState === 'open') {
            dataChannels[key].send(m);
          }
        }
      },

      /*** function to send data to particular user ***/

      sendDataChannelMessageToUser: function (m,k) {

          if(dataChannels[k].readyState === 'open') {
            dataChannels[k].send(m);
          }

      },

      initFileStatus :function(data)
      {
        console.log('Init file status function called');
        data = JSON.parse(data).data;
        console.log(data);
        for (var key in dataChannels) {
          if(dataChannels[key].readyState === 'open') {
            var singleObj = {};
            singleObj.fileid = data.file_id;
            singleObj.receiverid = key;
            singleObj.filestatus = false;
            fileReceivers.push(singleObj);

          }
        }

        console.log(JSON.stringify(fileReceivers));
      },
      setFileStatus : function(data)
      {
        console.log('Set file status function called');
        console.log(data);
        for(var i = 0;i<fileReceivers.length;i++)
        {
          if(fileReceivers[i].fileid == data.file_id &&  fileReceivers[i].receiverid == data.receiverid)
          {
            fileReceivers[i].filestatus =   true;
            break;
          }
        }
        var flag = 0;
        for(var i = 0;i<fileReceivers.length;i++)
        {
          if(fileReceivers[i].fileid == data.file_id &&  fileReceivers[i].filestatus == false)
          {
            flag = 1;
            return false;

          }
        }

        if(flag == 0)
        {
          console.log('calling removeStopupload : ' + data.file_id );
          return true;
        }

      }
      ,
      toggleAudio: function () {
        stream.getAudioTracks()[0].enabled = !(stream.getAudioTracks()[0].enabled);
      },
      toggleVideo: function (p) {
        socket.emit('conference.stream', { username: username, type: 'video', action: p, id: currentId });
      },
      toggleScreen: function (s, p) {
        if(otherScreenShared){
          api.trigger('screen.shared.failed', [{
            status: false
          }]);
          alert('Other person is trying to share the screen.');
          return;
        }
        for (var key in peerConnections) {
          if (p) {
            peerConnections[key].addStream(s);
          }
          else {
            peerConnections[key].removeStream(s);
          }
        }
        socket.emit('conference.stream', { username: username, type: 'screen', action: p, id: currentId });
      },
      end: function () {
        peerConnections = {}; userNames = {}; dataChannels = {};
        connected = false;

      // stream.getTracks()[0].stop();

      },

      getusername:function(){
        return username;
      },
      getcurrentid:function(){
        return currentId;
      }

    }
    EventEmitter.call(api);
    Object.setPrototypeOf(api, EventEmitter.prototype);

    addHandlers(socket);
    return api;
  });
