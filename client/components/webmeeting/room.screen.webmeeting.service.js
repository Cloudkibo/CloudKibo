/* global RTCIceCandidate, RTCSessionDescription, RTCPeerConnection, EventEmitter */
'use strict';


angular.module('cloudKiboApp')
  .factory('MeetingRoomScreen', function ($rootScope, $q, socket, $timeout, pc_config, pc_constraints2, audio_threshold, $log, sdpConstraints, logger) {

    var iceConfig = pc_config,
      peerConnections = {}, userNames = {},
      currentId, roomId,
      stream, username;

    function getPeerConnection(id) {
      if (peerConnections[id]) {
        return peerConnections[id];
      }
      var pc = new RTCPeerConnection(iceConfig, pc_constraints2);
      peerConnections[id] = pc;
      //pc.addStream(stream); // todo see that screen should be added only when we share screen
      pc.onicecandidate = function (evnt) {
        socket.emit('msgScreen', { by: currentId, to: id, ice: evnt.candidate, type: 'ice' });
      };
      pc.onaddstream = function (evnt) {
        logger.log('Received screen stream from '+ id);
        console.log(evnt.stream);
        api.trigger('peer.screenStream', [{
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
          pc.setLocalDescription(sdp);
          console.log('Creating an offer for '+ id +' for screen');
          socket.emit('msgScreen', { by: currentId, to: id, sdp: sdp, type: 'offer', username: username, camaccess : stream });
        }, function (e) {
          $log.error(e);
        },
        sdpConstraints);
    }

    function handleMessage(data) {
      var pc = getPeerConnection(data.by);
      console.log(JSON.stringify(data));
      switch (data.type) {
        case 'offer':
          userNames[data.by] = data.username;
          pc.setRemoteDescription(new RTCSessionDescription(data.sdp), function () {
            console.log('Setting remote description by offer for screen');
            pc.createAnswer(function (sdp) {
              //sdp.sdp = sdp.sdp.replace("minptime=10", "minptime=10; maxaveragebitrate=128000");
              pc.setLocalDescription(sdp);
              socket.emit('msgScreen', { by: currentId, to: data.by, sdp: sdp, type: 'answer', camaccess : stream });
            }, function (e) {
              console.log(e);
            }, sdpConstraints);
          }, function (e) {
            $log.error(e);
          });
          break;
        case 'answer':
          console.log('answer by '+ data.by +' for screen');
          pc.setRemoteDescription(new RTCSessionDescription(data.sdp), function () {
            console.log('Setting remote description by answer for screen');
          }, function (e) {
            $log.error(e);
          });
          break;
        case 'ice':
          if (data.ice) {
            console.log('Adding ice candidates for screen');
            pc.addIceCandidate(new RTCIceCandidate(data.ice));
          }
          break;
      }
    }

    var connected = false;

    function addHandlers(socket) {
      socket.on('peer.connected.new', function (params) {
        userNames[params.id] = params.username;
        //screenSwitch[params.id] = false;
        makeOffer(params.id);
      });
      socket.on('peer.disconnected.new', function (data) {
        //api.trigger('peer.disconnected', [data]); // todo test this later
        if (!$rootScope.$$digest) {
          $rootScope.$apply();
        }
        delete userNames[data.id];
        //delete screenSwitch[data.id];
      });
      socket.on('msgScreen', function (data) {
        handleMessage(data);
      });
      socket.on('conference.streamScreen', function(data){
        if(data.id !== currentId){
          api.trigger('conference.streamScreen', [{
            username: data.username,
            type: data.type,
            action: data.action,
            id: data.id
          }]);
          makeOffer(data.id);
        }
      });
      socket.on('disconnect', function () {
        peerConnections = {};
        userNames = {};
        connected = false;
      });
    }

    var api = {
      init : function(d){
        username = d.username;
        roomId = d.roomId;
        currentId = d.currentId;
      },
      toggleScreen: function (s, p) {
        for (var key in peerConnections) {
          if (p) {
            peerConnections[key].addStream(s);
          }
          else {
            var isChrome = !!navigator.webkitGetUserMedia;
            if(isChrome)
              peerConnections[key].removeStream(s);
            else
              removeTrack(peerConnections[key], s);
          }
        }
        socket.emit('conference.streamScreen', { username: username, type: 'screen', action: p, id: currentId });
      },
      end: function () {
        peerConnections = {}; userNames = {};
        connected = false;
        stream.getTracks()[0].stop();
      }
    };

    // thanks to http://stackoverflow.com/questions/33271154/pc-removestreamstream-not-implemented-firefox-webrtc
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