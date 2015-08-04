/* global RTCIceCandidate, RTCSessionDescription, RTCPeerConnection, EventEmitter */
'use strict';


angular.module('cloudKiboApp')
  .factory('Room', function ($rootScope, $q, socket, $timeout) {

    var iceConfig = { 'iceServers': [{ 'url': 'stun:stun.l.google.com:19302' }]},
        peerConnections = {}, userNames = {},
        currentId, roomId,
        stream, username, screenSwitch = false;

    function getPeerConnection(id) {
      if (peerConnections[id]) {
        return peerConnections[id];
      }
      var pc = new RTCPeerConnection(iceConfig);
      peerConnections[id] = pc;
      pc.addStream(stream);
      pc.onicecandidate = function (evnt) {
        socket.emit('msg', { by: currentId, to: id, ice: evnt.candidate, type: 'ice' });
      };
      pc.onaddstream = function (evnt) {
        console.log('Received new stream');
        if(screenSwitch){
          api.trigger('peer.screenStream', [{
            id: id,
            username: userNames[id],
            stream: evnt.stream
          }]);
          screenSwitch = false;
        } else {
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
      return pc;
    }

    function makeOffer(id) {
      var pc = getPeerConnection(id);
      pc.createOffer(function (sdp) {
        pc.setLocalDescription(sdp);
        console.log('Creating an offer for', id);
        socket.emit('msg', { by: currentId, to: id, sdp: sdp, type: 'sdp-offer', username: username });
      }, function (e) {
        console.log(e);
      },
      { mandatory: { OfferToReceiveVideo: true, OfferToReceiveAudio: true }});
    }

    function handleMessage(data) {
      var pc = getPeerConnection(data.by);
      switch (data.type) {
        case 'sdp-offer':
          userNames[data.by] = data.username;
          pc.setRemoteDescription(new RTCSessionDescription(data.sdp), function () {
            console.log('Setting remote description by offer');
            pc.createAnswer(function (sdp) {
              pc.setLocalDescription(sdp);
              socket.emit('msg', { by: currentId, to: data.by, sdp: sdp, type: 'sdp-answer' });
            });
          });
          break;
        case 'sdp-answer':
          pc.setRemoteDescription(new RTCSessionDescription(data.sdp), function () {
            console.log('Setting remote description by answer');
          }, function (e) {
            console.error(e);
          });
          break;
        case 'ice':
          if (data.ice) {
            console.log('Adding ice candidates');
            pc.addIceCandidate(new RTCIceCandidate(data.ice));
          }
          break;
      }
    }

    var connected = false;

    function addHandlers(socket) {
      socket.on('peer.connected', function (params) {
        userNames[params.id] = params.username;
        makeOffer(params.id);
      });
      socket.on('peer.disconnected', function (data) {
        api.trigger('peer.disconnected', [data]);
        if (!$rootScope.$$digest) {
          $rootScope.$apply();
        }
        delete userNames[data.id];
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
      socket.on('conference.stream', function(data){
        if(data.type === 'screen') screenSwitch = true;
        api.trigger('conference.stream', [{
          username: data.username,
          type: data.type,
          action: data.action,
          id: data.id
        }]);
      });
    }

    var api = {
      joinRoom: function (r) {
        if (!connected) {
          socket.emit('init', { room: r, username: username }, function (roomid, id) {
            currentId = id;
            roomId = roomid;
          });
          connected = true;
        }
      },
      createRoom: function () {
        var d = $q.defer();
        socket.emit('init', null, function (roomid, id) {
          d.resolve(roomid);
          roomId = roomid;
          currentId = id;
          connected = true;
        });
        return d.promise;
      },
      init: function (s, n) {
        stream = s;
        username = n;
      },
      sendChat: function (m) {
        socket.emit('conference.chat', { message: m, username: username });
      },
      toggleAudio: function () {
        stream.getAudioTracks()[0].enabled = !(stream.getAudioTracks()[0].enabled);
      },
      toggleVideo: function (p) {
        socket.emit('conference.stream', { username: username, type: 'video', action: p, id: currentId });
      },
      toggleScreen: function (s, p) {
        socket.emit('conference.stream', { username: username, type: 'screen', action: p, id: currentId });
        for (var key in peerConnections) {
          var tick = function (i) {
            return function () {
              if (peerConnections.hasOwnProperty(key)) {
                if (p) {
                  peerConnections[key].addStream(s);
                }
                else {
                  peerConnections[key].removeStream(s);
                }
                peerConnections[key].createOffer(function (sdp) {
                    peerConnections[key].setLocalDescription(sdp);
                    console.log('Creating an offer for', key);
                    socket.emit('msg', {by: currentId, to: key, sdp: sdp, type: 'sdp-offer', username: username});
                  }, function (e) {
                    console.log(e);
                  },
                  {mandatory: {OfferToReceiveVideo: true, OfferToReceiveAudio: true}});
              }
            }
          };
          console.log(key)
          $timeout(tick(key), 4000);
        }
      }
    };
    EventEmitter.call(api);
    Object.setPrototypeOf(api, EventEmitter.prototype);

    addHandlers(socket);
    return api;
  });
