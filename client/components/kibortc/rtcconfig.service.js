'use strict';

/**
 * This is collection of configuration services used in WebRTC Connection. All the services use
 * them to create peer connection. Application can change some of the configurations like changing
 * ICE Server URLs by injecting the concerned service
 */

angular.module('kiboRtc.services')

/**
 * This returns the array of ICE Servers used by WebRTC when peers are behind the proxies and
 * direct connection is impossible.
 *
 * todo: Add the function addICEServer which should take JSON array or JSON object as input
 */
  .factory('pc_config', function ($log) {
/*
    $(document).ready(function() {
      $.get("https://service.xirsys.com/ice",
        {
          ident: "testcloudkibo",
          secret: "9846fdca-ec48-11e5-9e57-6d5d0b63fdb1",
          domain: "api.cloudkibo.com",
          application: "CloudKibo",
          room: "CloudKibo_Conference",
          secure: 1
        },
        function(data, status) {
          console.log("Data: " + data + "nnStatus: " + status);
        });
    });
*/
    var isChrome = !!navigator.webkitGetUserMedia;

    return {'iceServers': [
      {url: (isChrome
            ? 'turn:turn.cloudkibo.com:3478?transport=udp'
            : 'turn:45.55.232.65:3478?transport=udp'), username: 'cloudkibo', credential: 'cloudkibo'},
      {url: (isChrome
            ? 'turn:turn.cloudkibo.com:3478?transport=tcp'
            : 'turn:45.55.232.65:3478?transport=tcp'), username: 'cloudkibo', credential: 'cloudkibo'}
      //{url: 'turn:numb.viagenie.ca:3478', username: 'support@cloudkibo.com', credential: 'cloudkibo'}
      /*{url: (isChrome
        ? 'stun:stun.l.google.com:19302'
        : 'stun:23.21.150.121'), username: null, credential: null},
      {url: 'stun:stun.anyfirewall.com:3478', username: null, credential: null},
      {url: 'turn:turn.bistri.com:80?transport=udp', username: 'homeo', credential: 'homeo'},
      {url: 'turn:turn.bistri.com:80?transport=tcp', username: 'homeo', credential: 'homeo'},
      {url: 'turn:turn.anyfirewall.com:443?transport=tcp', username: 'webrtc', credential: 'webrtc'}*/
    ]};

    // Commented only to test our own turn server with above address and credentials
/*
    return {'iceServers': [
      createIceServer(isChrome
        ? 'stun:stun.l.google.com:19302'
        : 'stun:23.21.150.121', null, null),
      createIceServer('stun:stun.anyfirewall.com:3478', null, null),
      createIceServer('turn:turn.bistri.com:80?transport=udp', 'homeo', 'homeo'),
      createIceServer('turn:turn.bistri.com:80?transport=tcp', 'homeo', 'homeo'),
      createIceServer('turn:turn.anyfirewall.com:443?transport=tcp', 'webrtc', 'webrtc')
    ]};
*/
    /*
     return {'iceServers': [createIceServer('turn:cloudkibo@162.243.217.34:3478?transport=udp', 'cloudkibo', 'cloudkibo'),
       createIceServer('stun:stun.l.google.com:19302', null, null),
     createIceServer('stun:stun.anyfirewall.com:3478', null, null),
     createIceServer('turn:turn.bistri.com:80?transport=udp', 'homeo', 'homeo'),
     createIceServer('turn:turn.bistri.com:80?transport=tcp', 'homeo', 'homeo'),
     createIceServer('turn:turn.anyfirewall.com:443?transport=tcp', 'webrtc', 'webrtc')
     ]};*/
     /*

    return {
      'iceServers': [{
        url: 'turn:cloudkibo@162.243.217.34:3478?transport=udp', username: 'cloudkibo',
        credential: 'cloudkibo'
      },
        {url: 'stun:stun.l.google.com:19302', username: null, credential: null},
        {url: 'stun:stun.anyfirewall.com:3478', username: null, credential: null},
        {url: 'turn:turn.bistri.com:80?transport=udp', username: 'homeo', credential: 'homeo'},
        {url: 'turn:turn.bistri.com:80?transport=tcp', username: 'homeo', credential: 'homeo'},
        {url: 'turn:turn.anyfirewall.com:443?transport=tcp', username: 'webrtc', credential: 'webrtc'}
      ]
    };
    */
    /*
     {url: 'turn:cloudkibo@162.243.217.34:3478?transport=udp', username: 'cloudkibo',
     credential: 'cloudkibo'}
     */
  })

/**
 * Configurations for Reliable Data Channel Connection
 *
 * NOTE: Applications should not use them directly
 *
 * todo: write more documentation from WebRTC official documentation for this
 */
  .factory('pc_constraints', function () {
    return {'optional': [{'DtlsSrtpKeyAgreement': true}, {'RtpDataChannels': true}]};
  })

  .factory('pc_constraints2', function () {
    return {optional: [ {"DtlsSrtpKeyAgreement": true}]};
  })

/**
 * Session Description Protocol Constraints
 *
 * NOTE: Applications should not use them directly
 */
  .factory('sdpConstraints', function () {

    var isChrome = !!navigator.webkitGetUserMedia;

    if (isChrome) {
      return {
        'mandatory': {
          'OfferToReceiveAudio': true,
          'OfferToReceiveVideo': true
        }
      };
    } else {
      return {
          'offerToReceiveAudio': true,
          'offerToReceiveVideo': true
      };
    }

  })

/**
 * Video Constraints for getUserMedia() of WebRTC API
 *
 * todo: add the function setVideoConstraints
 */

  .factory('video_constraints', function () {
    return {video: true, audio: false};
  })

  .factory('audio_threshold', function(){
    return 18;
  })

/**
 * Audio Constraints for getUserMedia() of WebRTC API
 *
 * todo: add the function setVideoConstraints
 */

  .factory('audio_constraints', function () {
    return {video: false, audio: true};
  })


  .factory('FileUtility', function FileUtility($rootScope, $log) {

    return {


      /**
       * Use this to avoid xss attack
       * recommended escaped char's found here - https://www.owasp.org/index.php/XSS_(Cross_Site_Scripting)_Prevention_Cheat_Sheet#RULE_.231_-_HTML_Escape_Before_Inserting_Untrusted_Data_into_HTML_Element_Content
       *
       * @param msg
       * @returns {*}
       */
      sanitize: function (msg) {
        msg = msg.toString();
        return msg.replace(/[\<\>"'\/]/g, function (c) {
          var sanitize_replace = {
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#x27;",
            "/": "&#x2F;"
          }
          return sanitize_replace[c];
        });
      },

      /**
       * bootstrap alerts!
       *
       * @param text
       */
      bootAlert: function (text) {
        alert(text);
        console.log('Boot_alert: ', text);
        $log.info('Boot_alert: ', text);
      },

      /**
       * File System Errors
       * credit - http://www.html5rocks.com/en/tutorials/file/filesystem/
       *
       * @param e
       * @constructor
       */
      FSerrorHandler: function (e) {
        var msg = '';
        switch (e.code) {
          case FileError.QUOTA_EXCEEDED_ERR:
            msg = 'QUOTA_EXCEEDED_ERR';
            $log.warn(msg);
            break;
          case FileError.NOT_FOUND_ERR:
            msg = 'NOT_FOUND_ERR';
            $log.warn(msg);
            break;
          case FileError.SECURITY_ERR:
            msg = 'SECURITY_ERR';
            $log.warn(msg);
            break;
          case FileError.INVALID_MODIFICATION_ERR:
            msg = 'INVALID_MODIFICATION_ERR';
            $log.warn(msg);
            break;
          case FileError.INVALID_STATE_ERR:
            msg = 'INVALID_STATE_ERR';
            $log.warn(msg);
            break;
          default:
            msg = 'Unknown Error';
            break;
        }

        console.error('Error: ' + msg);
        $log.error('Error: ' + msg);
      },

      /**
       * File size is often given to us in bytes. We need to convert them to MBs or GBs for user
       * readability.
       *
       * @param fileSizeInBytes file size in bytes
       * @returns {string} File Size with appropriate unit
       */
      getReadableFileSizeString: function (fileSizeInBytes) {
        var i = -1;
        var byteUnits = [' kB', ' MB', ' GB', ' TB', 'PB', 'EB', 'ZB', 'YB'];
        do {
          fileSizeInBytes = fileSizeInBytes / 1024;
          i++;
        } while (fileSizeInBytes > 1024);
        return Math.max(fileSizeInBytes, 0.1).toFixed(1) + byteUnits[i];
      },

      /**
       * used for debugging - credit - http://stackoverflow.com/questions/9267899/arraybuffer-to-base64-encoded-string
       *
       * @param buffer
       * @returns {string}
       * @private
       */
      _arrayBufferToBase64: function (buffer) {
        var binary = ''
        var bytes = new Uint8Array(buffer)
        var len = bytes.byteLength;
        for (var i = 0; i < len; i++) {
          binary += String.fromCharCode(bytes[i])
        }
        return window.btoa(binary);
      },

      /**
       * This is the chunk size limit for data to be sent or received using data channel. It might increase
       * if browser supports in future.
       *
       * @param me
       * @param peer
       * @returns {number}
       */
      getChunkSize: function () {
        return 16000;//64000;//36000;
      },

      getChunksPerAck: function () {
        return 16; /* 16k * 16 = 256k (buffer size in Chrome & seems to work 100% of the time) */
      }
    };





  });
