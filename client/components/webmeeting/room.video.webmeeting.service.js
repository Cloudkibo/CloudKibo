/* global RTCIceCandidate, RTCSessionDescription, RTCPeerConnection, EventEmitter */
'use strict';


angular.module('cloudKiboApp')
  .factory('MeetingRoomVideo', function ($rootScope, $q, socket, $timeout, pc_config, pc_constraints2, audio_threshold, $log, sdpConstraints, logger) {

    var iceConfig = pc_config,
      peerConnections = {}, userNames = {},
      currentId, roomId,
      stream, username;

    var ffIceRenogatiationParametersToSave;

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
        logger.log('Received video stream from '+ id);
        console.log(evnt.stream);
        api.trigger('peer.streamVideo', [{
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
          $log.debug('Creating an offer for '+ id +' for video');
          socket.emit('msgVideo', { by: currentId, to: id, sdp: sdp, type: 'offer', username: username, camaccess : stream });
        }, function (e) {
          $log.error(e);
        },
        sdpConstraints);
    }

    function handleMessage(data) {
      var pc = getPeerConnection(data.by);
      //console.log(JSON.stringify(data));
      switch (data.type) {
        case 'offer':
          if(!isChrome) { // todo this hack is for chrome to firefox interoperability... will be removed soon when chrome fix
            var sub = data.sdp.sdp;
            ffIceRenogatiationParametersToSave = ffIceRenogatiationParametersToSave || sub.substring(sub.indexOf("a=ice-uf"), sub.indexOf("a=fing"));
            data.sdp.sdp = data.sdp.sdp.replace(sub.substring(sub.indexOf("a=ice-uf"), sub.indexOf("a=fing")), ffIceRenogatiationParametersToSave);
            data.sdp.sdp = data.sdp.sdp.replace(sub.substring(sub.indexOf("a=ice-uf"), sub.indexOf("a=fing")), ffIceRenogatiationParametersToSave);
          }
          userNames[data.by] = data.username;
          pc.setRemoteDescription(new RTCSessionDescription(data.sdp), function () {
            $log.debug('Setting remote description by offer for video');
            pc.createAnswer(function (sdp) {
              //sdp.sdp = sdp.sdp.replace("minptime=10", "minptime=10; maxaveragebitrate=128000");
              pc.setLocalDescription(sdp);
              socket.emit('msgVideo', { by: currentId, to: data.by, sdp: sdp, type: 'answer', camaccess : stream });
            }, function (e) {
              console.log(e);
            }, sdpConstraints);
          }, function (e) {
            $log.error(e);
          });
          break;
        case 'answer':
          if(!isChrome) { // todo this hack is for chrome to firefox interoperability... will be removed soon when chrome fix
            var sub = data.sdp.sdp;
            ffIceRenogatiationParametersToSave = ffIceRenogatiationParametersToSave || sub.substring(sub.indexOf("a=ice-uf"), sub.indexOf("a=fing"));
            data.sdp.sdp = data.sdp.sdp.replace(sub.substring(sub.indexOf("a=ice-uf"), sub.indexOf("a=fing")), ffIceRenogatiationParametersToSave);
            data.sdp.sdp = data.sdp.sdp.replace(sub.substring(sub.indexOf("a=ice-uf"), sub.indexOf("a=fing")), ffIceRenogatiationParametersToSave);
          }
          console.log('answer by '+ data.by +' for video');
          pc.setRemoteDescription(new RTCSessionDescription(data.sdp), function () {
            $log.debug('Setting remote description by answer');
          }, function (e) {
            $log.error(e);
          });
          break;
        case 'ice':
          if (data.ice) {
            $log.debug('Adding ice candidates for video');
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
        //api.trigger('peer.disconnected', [data]); // todo test this later
        if (!$rootScope.$$digest) {
          $rootScope.$apply();
        }
        delete userNames[data.id];
      });
      socket.on('msgVideo', function (data) {
        handleMessage(data);
      });
      socket.on('conference.streamVideo', function(data){
        console.log('some one is about to share video '+ JSON.stringify(data))
        if(data.id !== currentId){
          api.trigger('conference.streamVideo', [{
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
      toggleVideo: function (p, s) {
        for (var key in peerConnections) {
          if (p) {
            peerConnections[key].addStream(s);
          }
          else {
            if(isChrome)
              peerConnections[key].removeStream(s);
            else
              removeTrack(peerConnections[key], s);
          }
        }
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
