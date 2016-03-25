/* global RTCIceCandidate, RTCSessionDescription, RTCPeerConnection, EventEmitter */
'use strict';


angular.module('cloudKiboApp')
  .factory('MeetingRoomScreen', function ($rootScope, $q, socket, $timeout, pc_config, pc_constraints2, CallStats, audio_threshold, sdpConstraints, logger) {

    var peerConnections = {}, userNames = {},
      currentId, roomId,
      stream, username;

    var otherStream; // note this is workaround for firefox as firefoxs doesn't support renegotiation

    var isChrome = !!navigator.webkitGetUserMedia;

    function getPeerConnection(id) {
      if (peerConnections[id]) {
        return peerConnections[id];
      }
      var pc = new RTCPeerConnection(pc_config.pc_config(), pc_constraints2);
      peerConnections[id] = pc;
      pc.onicecandidate = function (evnt) {
        socket.emit('msgScreen', { by: currentId, to: id, ice: evnt.candidate, type: 'ice' });
      };
      pc.onaddstream = function (evnt) {
        logger.log(''+ username +' has received screen stream by  '+ userNames[id]);
        if(!otherStream) {
          api.trigger('conference.streamScreen', [{
            username: userNames[id],
            type: 'screen',
            action: true,
            id: id
          }]);
          api.trigger('peer.screenStream', [{
            id: id,
            username: userNames[id],
            stream: evnt.stream
          }]);
          if (!$rootScope.$$digest) {
            $rootScope.$apply();
          }
          otherStream = evnt.stream;
        }
      };
  /*    var callStats = new callstats(null,io,jsSHA);
      var AppID     = "199083144";
      var AppSecret = "t/vySeaTw5q6323+ArF2c6nEFT4=";
      callStats.initialize(AppID, AppSecret, username, function (err, msg) {
        console.log("Initializing Status: err="+err+" msg="+msg);
        var usage = callStats.fabricUsage.screen;
        callStats.addNewFabric(pc, id, usage, roomId, function(err, msg){
          console.log("Add new Fabric Status for screen: err="+err+" msg="+msg);
        });
      });
      */
      CallStats.addScreenFabric(pc, id, roomId);
      logger.log(''+ username +' has created screen peer connection for  '+ userNames[id]);
      return pc;
    }

    function makeOffer(id) {
      var pc = getPeerConnection(id);
      logger.log(''+ username +' is going to create screen offer for '+ userNames[id]);
      pc.createOffer(function (sdp) {
          pc.setLocalDescription(sdp);
          logger.log(''+ username +' is now sending screen offer to '+ userNames[id]);
          socket.emit('msgScreen', { by: currentId, to: id, sdp: sdp, type: 'offer', username: username, camaccess : stream });
        }, function (e) {
          logger.log(''+ username +' got this error when creating screen offer for '+ userNames[id]);
          logger.log(JSON.stringify(e));
          logger.log(''+ username +' got the above error when creating screen offer for '+ userNames[id]);
    //      callStats.reportError(pc, roomId, callStats.webRTCFunctions.createOffer, e);
          CallStats.reportOfferError(pc, roomId, e);
        },
        sdpConstraints);
    }

    function handleMessage(data) {
      var pc = getPeerConnection(data.by);
      switch (data.type) {
        case 'offer':
          pc.addStream(stream);
          userNames[data.by] = data.username;
          pc.setRemoteDescription(new RTCSessionDescription(data.sdp), function () {
            logger.log(''+ username +' set screen offer remote description sent by  '+ userNames[data.by]);
            pc.createAnswer(function (sdp) {
              //sdp.sdp = sdp.sdp.replace("minptime=10", "minptime=10; maxaveragebitrate=128000");
              pc.setLocalDescription(sdp);
              logger.log(''+ username +' is now sending screen answer to '+ userNames[data.by]);
              socket.emit('msgScreen', { by: currentId, to: data.by, sdp: sdp, type: 'answer', camaccess : stream });
            }, function (e) {
              logger.log(''+ username +' got this ERROR when creating screen answer for '+ userNames[data.by]);
              logger.log(JSON.stringify(e));
              logger.log(''+ username +' got the above ERROR when creating screen answer for '+ userNames[data.by]);
    //          callStats.reportError(pc, roomId, callStats.webRTCFunctions.createAnswer, e);
              CallStats.reportAnswerError(pc, roomId, e);
            }, sdpConstraints);
          }, function (e) {
            logger.log(''+ username +' got this ERROR when setting screen offer from '+ userNames[data.by]);
            logger.log(JSON.stringify(e));
            logger.log(''+ username +' got the above ERROR when setting screen offer from '+ userNames[data.by]);
          });
          break;
        case 'answer':
          userNames[data.by] = data.username;
          pc.setRemoteDescription(new RTCSessionDescription(data.sdp), function () {
            logger.log(''+ username +' set screen answer remote description sent by  '+ userNames[data.by]);
          }, function (e) {
            logger.log(''+ username +' got this ERROR when setting screen answer from '+ userNames[data.by]);
            logger.log(JSON.stringify(e));
            logger.log(''+ username +' got the above ERROR when setting screen answer from '+ userNames[data.by]);
          });
          break;
        case 'ice':
          if (data.ice) {
            logger.log(''+ username +' adding ice candidate for screen sent by  '+ userNames[data.by]);
            pc.addIceCandidate(new RTCIceCandidate(data.ice));
          }
          break;
      }
    }

    var connected = false;

    function addHandlers(socket) {
      socket.on('peer.connected.new', function (params) {
        logger.log(''+ username +' was informed in screen channel that '+ params.username +' has joined the meeting.');
        userNames[params.id] = params.username;
        //makeOffer(params.id);
      });
      socket.on('peer.disconnected.new', function (data) {
        logger.log(''+ username +' was informed in screen channel that '+ userNames[data.id] +' has left the meeting.');
        if (!$rootScope.$$digest) {
          $rootScope.$apply();
        }
        delete userNames[data.id];
      });
      socket.on('msgScreen', function (data) {
        handleMessage(data);
      });
      socket.on('conference.streamScreen', function(data){
        if(data.id !== currentId){
          if(!data.action){
            api.trigger('conference.streamScreen', [{
              username: data.username,
              type: data.type,
              action: data.action,
              id: data.id
            }]);
          }
          if(otherStream && data.action){ // in case i already know that he has shared the screen", and now is just informing new comer
            return ;
          }
          if(data.action) {
            logger.log(''+ username +' was informed that '+ data.username +' wants to share the screen.');
            makeOffer(data.id);
          } else {
            logger.log(''+ username +' was informed that '+ data.username +' wants to hide the screen.');
            otherStream = false;
            delete peerConnections[data.id];
          }
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
        if (!p) {
          peerConnections = {};
        }
        stream = s;
        socket.emit('conference.streamScreen', { username: username, type: 'screen', action: p, id: currentId });
      },
      end: function () {
        logger.log(''+ username +' has ended the screen peer connections for all');
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
