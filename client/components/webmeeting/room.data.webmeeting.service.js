/* global RTCIceCandidate, RTCSessionDescription, RTCPeerConnection, EventEmitter */
'use strict';


angular.module('cloudKiboApp')
  .factory('MeetingRoomData', function ($rootScope, $q, socket, $timeout, pc_config, pc_constraints2, audio_threshold, sdpConstraints, logger) {

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
        logger.log(''+ username +' has received datachannel by  '+ userNames[id]);
        dataChannels[id] = evnt.channel;
        dataChannels[id].onmessage = function (evnt) {
          handleDataChannelMessage(id, evnt.data);
        };
      };
   /*   var callStats = new callstats(null,io,jsSHA);
      var AppID     = "199083144";
      var AppSecret = "t/vySeaTw5q6323+ArF2c6nEFT4=";
      callStats.initialize(AppID, AppSecret, username, function (err, msg) {
        console.log("Initializing Status: err="+err+" msg="+msg);
        var usage = callStats.fabricUsage.data;
        callStats.addNewFabric(pc, id, usage, roomId, function(err, msg){
          console.log("Add new Fabric Status for data: err="+err+" msg="+msg);
        });
      });
      */
      logger.log(''+ username +' has created data peer connection for  '+ userNames[id]);
      return pc;
    }

    function makeOffer(id) {
      var pc = getPeerConnection(id);
      makeDataChannel(id);
      logger.log(''+ username +' is going to create data offer for '+ userNames[id]);
      pc.createOffer(function (sdp) {
          //console.log(sdp)
          //sdp.sdp = sdp.sdp.replace("minptime=10", "minptime=10; maxaveragebitrate=128000"); // todo added for testing by sojharo
          pc.setLocalDescription(sdp);
          logger.log(''+ username +' is now sending data offer to '+ userNames[id]);
          socket.emit('msgData', { by: currentId, to: id, sdp: sdp, type: 'offer', username: username });
        }, function (e) {
          logger.log(''+ username +' got this error when creating data offer for '+ userNames[id]);
          logger.log(JSON.stringify(e));
          logger.log(''+ username +' got the above error when creating data offer for '+ userNames[id]);
  //        callStats.reportError(pc, roomId, callStats.webRTCFunctions.createOffer, e);
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
          logger.log(''+ username +' got this error when creating reliable data channel for '+ userNames[id] +'. creating unreliable datachannel now');
          logger.log(JSON.stringify(e));
          logger.log(''+ username +' got the above error when creating reliable data channel for '+ userNames[id] +'. creating unreliable datachannel now');
          dataChannels[id] = pc.createDataChannel("sendDataChannel", {reliable: false});
        }
        dataChannels[id].onmessage = function (evnt) {
          handleDataChannelMessage(id, evnt.data);
        };
        logger.log(''+ username +' has created datachannel for '+ userNames[id]);
      } catch (e) {
        alert('Failed to create data channel. ' +
        'You need Chrome M25 or later with RtpDataChannel enabled : ' + e.message);
        logger.log(''+ username +' got this error when creating data channel for '+ userNames[id]);
        logger.log(JSON.stringify(e));
        logger.log(''+ username +' got the above error when creating data channel for '+ userNames[id]);
      }
    }

    function handleDataChannelMessage(id, data) {
      api.trigger('dataChannel.message.new', [{
        id: id,
        username: userNames[id],
        data: data
      }]);
    }

    function handleMessage(data) {
      var pc = getPeerConnection(data.by);
      switch (data.type) {
        case 'offer':
          userNames[data.by] = data.username;
          pc.setRemoteDescription(new RTCSessionDescription(data.sdp), function () {
            logger.log(''+ username +' set data offer remote description sent by  '+ userNames[data.by]);
            pc.createAnswer(function (sdp) {
              //sdp.sdp = sdp.sdp.replace("minptime=10", "minptime=10; maxaveragebitrate=128000");
              pc.setLocalDescription(sdp);
              logger.log(''+ username +' is now sending data answer to '+ userNames[data.by]);
              socket.emit('msgData', { by: currentId, to: data.by, sdp: sdp, type: 'answer' });
            }, function (e) {
  //            callStats.reportError(pc, roomId, callStats.webRTCFunctions.createAnswer, e);
              logger.log(''+ username +' got this ERROR when creating data answer for '+ userNames[data.by]);
              logger.log(JSON.stringify(e));
              logger.log(''+ username +' got the above ERROR when creating data answer for '+ userNames[data.by]);
            }, sdpConstraints);
          }, function (e) {
            logger.log(''+ username +' got this ERROR when setting data offer from '+ userNames[data.by]);
            logger.log(JSON.stringify(e));
            logger.log(''+ username +' got the above ERROR when setting data offer from '+ userNames[data.by]);
          });
          break;
        case 'answer':
          console.log('answer by '+ data.by +' for data');
          pc.setRemoteDescription(new RTCSessionDescription(data.sdp), function () {
            logger.log(''+ username +' set data answer remote description sent by  '+ userNames[data.by]);
          }, function (e) {
            logger.log(''+ username +' got this ERROR when setting data answer from '+ userNames[data.by]);
            logger.log(JSON.stringify(e));
            logger.log(''+ username +' got the above ERROR when setting data answer from '+ userNames[data.by]);
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
        logger.log(''+ username +' was informed in data channel that '+ params.username +' has joined the meeting.');
        userNames[params.id] = params.username;
        makeOffer(params.id);
      });
      socket.on('peer.disconnected.new', function (data) {
        logger.log(''+ username +' was informed in data channel that '+ userNames[data.id] +' has left the meeting.');
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
      init : function(d){
        username = d.username;
        roomId = d.roomId;
        currentId = d.currentId;
      },
      sendDataChannelMessage: function (m) {
        for (var key in dataChannels) {
          if(dataChannels[key].readyState === 'open') {
            dataChannels[key].send(m);
          }
        }
      },
      end: function () {
        logger.log(''+ username +' has ended the data peer connections for all');
        peerConnections = {}; userNames = {}; dataChannels = {};
        connected = false;
      }
    };
    EventEmitter.call(api);
    Object.setPrototypeOf(api, EventEmitter.prototype);

    addHandlers(socket);
    return api;
  });
