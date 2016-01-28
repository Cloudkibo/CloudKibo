/* global RTCIceCandidate, RTCSessionDescription, RTCPeerConnection, EventEmitter */
'use strict';


angular.module('cloudKiboApp')
  .factory('MeetingRoomScreen', function ($rootScope, $q, socket, $timeout, pc_config, pc_constraints2, audio_threshold, $log, sdpConstraints) {

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
          console.log(sdp)
          pc.setLocalDescription(sdp);
          $log.debug('Creating an offer for '+ id +' for screen');
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
            $log.debug('Setting remote description by offer for screen');
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
            $log.debug('Setting remote description by answer');
          }, function (e) {
            $log.error(e);
          });
          break;
        case 'ice':
          if (data.ice) {
            $log.debug('Adding ice candidates for screen');
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
        screenSwitch[params.id] = false;
        makeOffer(params.id);
      });
      socket.on('peer.disconnected.new', function (data) {
        //api.trigger('peer.disconnected', [data]); // todo test this later
        if (!$rootScope.$$digest) {
          $rootScope.$apply();
        }
        delete userNames[data.id];
        delete screenSwitch[data.id];
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
      toggleScreen: function (s, p) {
        for (var key in peerConnections) {
          if (p) {
            peerConnections[key].addStream(s);
          }
          else {
            peerConnections[key].removeStream(s);
          }
        }
        socket.emit('conference.streamScreen', { username: username, type: 'video', action: p, id: currentId });
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
