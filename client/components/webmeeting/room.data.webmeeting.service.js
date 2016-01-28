/* global RTCIceCandidate, RTCSessionDescription, RTCPeerConnection, EventEmitter */
'use strict';


angular.module('cloudKiboApp')
  .factory('MeetingRoomData', function ($rootScope, $q, socket, $timeout, pc_config, pc_constraints2, audio_threshold, $log, sdpConstraints) {

    var iceConfig = pc_config,
      peerConnections = {}, userNames = {},
      dataChannels = {}, currentId, roomId,
      username;


    function getPeerConnection(id) {
      if (peerConnections[id]) {
        return peerConnections[id];
      }
      var pc = new RTCPeerConnection(iceConfig, pc_constraints2);
      peerConnections[id] = pc;
      pc.onicecandidate = function (evnt) {
        socket.emit('msgData', { by: currentId, to: id, ice: evnt.candidate, type: 'ice' });
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
          //console.log(sdp)
          //sdp.sdp = sdp.sdp.replace("minptime=10", "minptime=10; maxaveragebitrate=128000"); // todo added for testing by sojharo
          pc.setLocalDescription(sdp);
          $log.debug('Creating an offer for'+ id +' for data');
          socket.emit('msgData', { by: currentId, to: id, sdp: sdp, type: 'offer', username: username, camaccess : stream });
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
      api.trigger('dataChannel.message.new', [{
        id: id,
        username: userNames[id],
        data: data
      }]);
    }

    function handleMessage(data) {
      var pc = getPeerConnection(data.by);
      console.log(JSON.stringify(data));
      switch (data.type) {
        case 'offer':
          userNames[data.by] = data.username;
          pc.setRemoteDescription(new RTCSessionDescription(data.sdp), function () {
            $log.debug('Setting remote description by offer for data');
            pc.createAnswer(function (sdp) {
              //sdp.sdp = sdp.sdp.replace("minptime=10", "minptime=10; maxaveragebitrate=128000");
              pc.setLocalDescription(sdp);
              socket.emit('msgData', { by: currentId, to: data.by, sdp: sdp, type: 'answer', camaccess : stream });
            }, function (e) {
              console.log(e);
            }, sdpConstraints);
          }, function (e) {
            $log.error(e);
          });
          break;
        case 'answer':
          console.log('answer by '+ data.by +' for data');
          pc.setRemoteDescription(new RTCSessionDescription(data.sdp), function () {
            $log.debug('Setting remote description by answer for data');
          }, function (e) {
            $log.error(e);
          });
          break;
        case 'ice':
          if (data.ice) {
            $log.debug('Adding ice candidates for data');
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
      socket.on('msgData', function (data) {
        handleMessage(data);
      });
      socket.on('disconnect', function () {
        peerConnections = {};
        userNames = {};
        dataChannels = {};
        connected = false;
      });
    }

    var api = {
      sendDataChannelMessage: function (m) {
        for (var key in dataChannels) {
          if(dataChannels[key].readyState === 'open') {
            dataChannels[key].send(m);
          }
        }
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
