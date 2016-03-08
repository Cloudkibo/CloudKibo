/* global RTCIceCandidate, RTCSessionDescription, RTCPeerConnection, EventEmitter */
'use strict';


angular.module('cloudKiboApp')
  .factory('MeetingRoomVideo', function ($rootScope, $q, socket, $timeout, pc_config, pc_constraints2, audio_threshold, $log, sdpConstraints, logger) {

    var iceConfig = pc_config,
      peerConnections = {}, userNames = {},
      currentId, roomId,
      stream, username, localVideoShared=false;

    var otherStream = {}; // note this is workaround for firefox as firefoxs doesn't support renegotiation

    var isChrome = !!navigator.webkitGetUserMedia;

    function getPeerConnection(id) {
      if (peerConnections[id]) {
        return peerConnections[id];
      }
      var pc = new RTCPeerConnection(iceConfig, pc_constraints2);
      peerConnections[id] = pc;
      pc.onicecandidate = function (evnt) {
        console.log('ice got for video');
        socket.emit('msgVideo', { by: currentId, to: id, ice: evnt.candidate, type: 'ice' });
      };
      pc.onaddstream = function (evnt) {
        console.log('Received video stream from '+ id);
        console.log(evnt.stream);
        if(!otherStream[id]) {
          api.trigger('peer.streamVideo', [{
            id: id,
            username: userNames[id],
            stream: evnt.stream
          }]);
          if (!$rootScope.$$digest) {
            $rootScope.$apply();
          }
          otherStream[id] = evnt.stream;
        }
      };
      var usage = callStats.fabricUsage.video;
      callStats.addNewFabric(pc, id, usage, roomId, function(err, msg){
        console.log("Initializing Status: err="+err+" msg="+msg);
      });
      return pc;
    }

    function makeOffer(id) {
      var pc = getPeerConnection(id);
      pc.createOffer(function (sdp) {
          pc.setLocalDescription(sdp);
          $log.debug('Creating an offer for '+ id +' for video');
          socket.emit('msgVideo', { by: currentId, to: id, sdp: sdp, type: 'offer', username: username, camaccess : stream });
        }, function (e) {
          callStats.reportError(pc, roomId, callStats.webRTCFunctions.createOffer, e);
          $log.error(e);
        },
        sdpConstraints);
    }

    function handleMessage(data) {
      var pc = getPeerConnection(data.by);
      //console.log(JSON.stringify(data));
      switch (data.type) {
        case 'offer':
          if(otherStream[data.by]){ // workaround for firefox as it doesn't support renegotiation (ice restart unsupported error in firefox)
            otherStream[data.by] = false;
            delete peerConnections[data.by];
            pc = getPeerConnection(data.by);
          }
          pc.addStream(stream);
          userNames[data.by] = data.username;
          pc.setRemoteDescription(new RTCSessionDescription(data.sdp), function () {
            console.log('Setting remote description by offer for video '+ data.by);
            console.log(data.sdp.sdp)
            pc.createAnswer(function (sdp) {
              //sdp.sdp = sdp.sdp.replace("minptime=10", "minptime=10; maxaveragebitrate=128000");
              pc.setLocalDescription(sdp);
              socket.emit('msgVideo', { by: currentId, to: data.by, sdp: sdp, type: 'answer', camaccess : stream });
            }, function (e) {
              callStats.reportError(pc, roomId, callStats.webRTCFunctions.createAnswer, e);
              console.log(e);
            }, sdpConstraints);
          }, function (e) {
            $log.error(e);
          });
          break;
        case 'answer':
          console.log('answer by '+ data.by +' for video');
          console.log(data.sdp.sdp)
          pc.setRemoteDescription(new RTCSessionDescription(data.sdp), function () {
            console.log('Setting remote description by answer');
          }, function (e) {
            $log.error(e);
          });
          break;
        case 'ice':
          if (data.ice) {
            console.log('Adding ice candidates for video from '+ data.by);
            pc.addIceCandidate(new RTCIceCandidate(data.ice));
          }
          break;
      }
    }

    var connected = false;

    function addHandlers(socket) {
      socket.on('peer.connected.new', function (params) {
        userNames[params.id] = params.username;
        //makeOffer(params.id);
      });
      socket.on('peer.disconnected.new', function (data) {
        if (!$rootScope.$$digest) {
          $rootScope.$apply();
        }
        delete userNames[data.id];
        delete otherStream[data.id];
      });
      socket.on('msgVideo', function (data) {
        handleMessage(data);
      });
      socket.on('conference.streamVideo', function(data){
        if(data.id !== currentId){
          console.log('some one is about to share video '+ JSON.stringify(data))
          api.trigger('conference.streamVideo', [{
            username: data.username,
            type: data.type,
            action: data.action,
            id: data.id
          }]);
          if(data.action) {
            if(localVideoShared) { // workaround for firefox as it doesn't support renegotiation (ice restart unsupported error in firefox)
              otherStream[data.id] = false;
              delete peerConnections[data.id];
            }
            makeOffer(data.id);
          } else {
            otherStream[data.id] = false;
            delete peerConnections[data.id];
          }
        }
      });
      socket.on('disconnect', function () {
        peerConnections = {};
        userNames = {};
        otherStream = {};
        connected = false;
      });
    }

    var api = {
      init : function(d){
        username = d.username;
        roomId = d.roomId;
        currentId = d.currentId;
      },
      toggleVideo: function (p, s) {
        if (!p) {
          peerConnections = {};
        }
        if(p) localVideoShared = true;
        else localVideoShared = false;
        stream = s;
        console.log('letting other peer know that video is being shared')
        socket.emit('conference.streamVideo', { username: username, type: 'video', action: p, id: currentId });
      },
      end: function () {
        peerConnections = {}; userNames = {};
        connected = false;
        stream.getTracks()[0].stop();
      }
    };

    function removeTrack(pc, stream){
      pc.getSenders().forEach(function(sender){
        stream.getTracks().forEach(function(track){
          if(track == sender.track){
            pc.removeTrack(sender);
          }
        })
      });
    }

    EventEmitter.call(api);
    Object.setPrototypeOf(api, EventEmitter.prototype);

    addHandlers(socket);
    return api;
  });
