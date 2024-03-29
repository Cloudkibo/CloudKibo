/* global RTCIceCandidate, RTCSessionDescription, RTCPeerConnection, EventEmitter */
'use strict';


angular.module('cloudKiboApp')
  .factory('MeetingRoomVideo', function ($rootScope, $q, socket, $timeout, pc_config, pc_constraints2, CallStats, audio_threshold, sdpConstraints, logger) {

    var peerConnections = {}, userNames = {},
      currentId, roomId,
      stream, username, localVideoShared=false;

    var otherStream = {}; // note this is workaround for firefox as firefoxs doesn't support renegotiation
    var alreadyMakingOffer = {}; // note this is for the case when both try to share the video at same time which created conflict in signaling

    var isChrome = !!navigator.webkitGetUserMedia;

    function getPeerConnection(id) {
      if (peerConnections[id]) {
        return peerConnections[id];
      }
      var pc = new RTCPeerConnection(pc_config.pc_config(), pc_constraints2);
      peerConnections[id] = pc;
      pc.onicecandidate = function (evnt) {
        socket.emit('msgVideo', { by: currentId, to: id, ice: evnt.candidate, type: 'ice' });
      };
      pc.onaddstream = function (evnt) {
        logger.log(''+ username +' has received video stream by  '+ userNames[id]);
        if(!otherStream[id]) {
          api.trigger('peer.streamVideo', [{
            id: id,
            username: userNames[id],
            stream: evnt.stream
          }]);
          api.trigger('conference.streamVideo', [{
            username: userNames[id],
            type: 'video',
            action: true,
            id: id
          }]);
          if (!$rootScope.$$digest) {
            $rootScope.$apply();
          }
          otherStream[id] = evnt.stream;
        }
      };
      CallStats.addVideoFabric(pc, id, roomId);
      logger.log(''+ username +' has created video peer connection for  '+ userNames[id]);
      return pc;
    }

    function makeOffer(id) {
      var pc = getPeerConnection(id);
      logger.log(''+ username +' is going to create video offer for '+ userNames[id]);
      pc.createOffer(function (sdp) {
          pc.setLocalDescription(sdp);
          logger.log(''+ username +' is now sending video offer to '+ userNames[id]);
          socket.emit('msgVideo', { by: currentId, to: id, sdp: sdp, type: 'offer', username: username, camaccess : stream });
        }, function (e) {
          logger.log(''+ username +' got this error when creating video offer for '+ userNames[id]);
          logger.log(JSON.stringify(e));
          logger.log(''+ username +' got the above error when creating video offer for '+ userNames[id]);
  //        callStats.reportError(pc, roomId, callStats.webRTCFunctions.createOffer, e);
          CallStats.reportOfferError(pc, roomId, e);
        },
        sdpConstraints);
    }

    function handleMessage(data) {
      var pc = getPeerConnection(data.by);
      switch (data.type) {
        case 'offer':
          if(alreadyMakingOffer[data.by]){ // note this is for the case when both try to share the video at same time which created conflict in signaling
            delete alreadyMakingOffer[data.by];
            return ;
          }
          if(otherStream[data.by]){ // workaround for firefox as it doesn't support renegotiation (ice restart unsupported error in firefox)
            logger.log(''+ username +' uses workaround for firefox creates peer connection again for  '+ data.username);
            otherStream[data.by] = false;
            delete peerConnections[data.by];
            pc = getPeerConnection(data.by);
          }
          var localStreams = pc.getLocalStreams();
          logger.log(''+ username +' has got this number of local video streams: '+ localStreams.length);
          if(localStreams.length < 1) {
            pc.addStream(stream);
          }
          userNames[data.by] = data.username;
          pc.setRemoteDescription(new RTCSessionDescription(data.sdp), function () {
            logger.log(''+ username +' set video offer remote description sent by  '+ userNames[data.by]);
            pc.createAnswer(function (sdp) {
              //sdp.sdp = sdp.sdp.replace("minptime=10", "minptime=10; maxaveragebitrate=128000");
              pc.setLocalDescription(sdp);
              logger.log(''+ username +' is now sending video answer to '+ userNames[data.by]);
              socket.emit('msgVideo', { by: currentId, to: data.by, sdp: sdp, type: 'answer', camaccess : stream });
            }, function (e) {
              logger.log(''+ username +' got this ERROR when creating video answer for '+ userNames[data.by]);
              logger.log(JSON.stringify(e));
              logger.log(''+ username +' got the above ERROR when creating video answer for '+ userNames[data.by]);
      //        callStats.reportError(pc, roomId, callStats.webRTCFunctions.createAnswer, e);
              CallStats.reportAnswerError(pc, roomId, e);
            }, sdpConstraints);
          }, function (e) {
            logger.log(''+ username +' got this ERROR when setting video offer from '+ userNames[data.by]);
            logger.log(JSON.stringify(e));
            logger.log(''+ username +' got the above ERROR when setting video offer from '+ userNames[data.by]);
          });
          break;
        case 'answer':
          if(alreadyMakingOffer[data.by]){ // note this is for the case when both try to share the video at same time which created conflict in signaling
            delete alreadyMakingOffer[data.by];
          }
          pc.setRemoteDescription(new RTCSessionDescription(data.sdp), function () {
            logger.log(''+ username +' set video answer remote description sent by  '+ userNames[data.by]);
          }, function (e) {
            logger.log(''+ username +' got this ERROR when setting video answer from '+ userNames[data.by]);
            logger.log(JSON.stringify(e));
            logger.log(''+ username +' got the above ERROR when setting video answer from '+ userNames[data.by]);
          });
          break;
        case 'ice':
          if (data.ice) {
            logger.log(''+ username +' adding ice candidate for video sent by  '+ userNames[data.by]);
            pc.addIceCandidate(new RTCIceCandidate(data.ice));
          }
          break;
      }
    }

    var connected = false;

    function addHandlers(socket) {
      socket.on('peer.connected.new', function (params) {
        logger.log(''+ username +' was informed in video channel that '+ params.username +' has joined the meeting.');
        userNames[params.id] = params.username;
        //makeOffer(params.id);
      });
      socket.on('peer.disconnected.new', function (data) {
        logger.log(''+ username +' was informed in video channel that '+ userNames[data.id] +' has left the meeting.');
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
          if(!data.action) {
            api.trigger('conference.streamVideo', [{
              username: data.username,
              type: data.type,
              action: data.action,
              id: data.id
            }]);
          }
          if(otherStream[data.id] && data.action){ // in case i already know that he has shared the video, and now is just informing new comer
            return ;
          }
          if(data.action) {
            logger.log(''+ username +' was informed that '+ data.username +' wants to share the video.');
            if(localVideoShared) { // workaround for firefox as it doesn't support renegotiation (ice restart unsupported error in firefox)
              logger.log(''+ username +' was informed in firefox workaround that '+ data.username +' wants to share the video. Peer connection is removed for that person');
              otherStream[data.id] = false;
              delete peerConnections[data.id];
            }
            userNames[data.by] = data.username;
            alreadyMakingOffer[data.by] = true; // note this is for the case when both try to share the video at same time which created conflict in signaling
            makeOffer(data.id);
          } else {
            logger.log(''+ username +' was informed that '+ data.username +' wants to hide the video.');
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
        localVideoShared = p;
        stream = s;
        socket.emit('conference.streamVideo', { username: username, type: 'video', action: p, id: currentId });
      },
      end: function () {
        logger.log(''+ username +' has ended the video peer connections for all');
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
