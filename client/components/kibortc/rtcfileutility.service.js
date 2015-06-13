/**
 * Created by sojharo on 6/12/2015.
 */
'use strict';

/**
 * This is the core File Transfer service. It is independent of the video call service. It depends on Signalling service
 * for doing Signalling. Furthermore, it uses services from configuration too. To use this, one should follow the WebRTC
 * call procedure. Here it is mostly same as standard procedure of a WebRTC call, but this service hides much of the
 * details from application.
 */
angular.module('kiboRtc.services')
  .factory('FileUtility', function FileUtility($rootScope) {


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
            break;
          case FileError.NOT_FOUND_ERR:
            msg = 'NOT_FOUND_ERR';
            break;
          case FileError.SECURITY_ERR:
            msg = 'SECURITY_ERR';
            break;
          case FileError.INVALID_MODIFICATION_ERR:
            msg = 'INVALID_MODIFICATION_ERR';
            break;
          case FileError.INVALID_STATE_ERR:
            msg = 'INVALID_STATE_ERR';
            break;
          default:
            msg = 'Unknown Error';
            break;
        }

        console.error('Error: ' + msg);
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
