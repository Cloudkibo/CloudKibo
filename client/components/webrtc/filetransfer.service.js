/**
 * Created by sojharo on 2/6/2015.
 */

/**
 * Created by sojharo on 2/3/2015.
 */

'use strict';

angular.module('cloudKiboApp')
    .factory('FileTransfer', function FileTransfer($rootScope, pc_config, pc_constraints, sdpConstraints, video_constraints, Signalling) {

        var isInitiator = false;
        var isStarted = false;

        var sendChannel;
        var receiveChannel;

        var pc;

        var message;

        return {


            /**
             * Create Peer Connection
             *
             */
            createPeerConnection: function (cb) {
                try {

                    pc = new RTCPeerConnection(pc_config, {optional: []});//pc_constraints);
                    pc.onicecandidate = handleIceCandidate;

                    //if (!$scope.isInitiator_DC) {
                    try {
                        // Reliable Data Channels not yet supported in Chrome
                        try {
                            sendChannel = pc.createDataChannel("sendDataChannel", {reliable: true});
                        }
                        catch (e) {
                            console.log('UNRELIABLE DATA CHANNEL')
                            sendChannel = pc.createDataChannel("sendDataChannel", {reliable: false});
                        }
                        sendChannel.onmessage = handleMessage;
                        trace('Created send data channel');
                    } catch (e) {
                        cb(e);
                        trace('createDataChannel() failed with exception: ' + e.message);
                        return;
                    }
                    sendChannel.onopen = handleSendChannelStateChange;
                    sendChannel.onclose = handleSendChannelStateChange;
                    //} else {
                    pc.ondatachannel = gotReceiveChannel;

                    cb(null);
                    //}
                } catch (e) {
                    cb(e);
                    console.log('Failed to create PeerConnection, exception: ' + e.message);
                }
            },

            sendData: function (data) {
                sendChannel.send(data);
            },

            /**
             * Create and Send Offer
             *
             */
            createAndSendOffer: function () {
                pc.createOffer(setLocalAndSendMessage, handleCreateOfferError);
            },

            /**
             * Create and Send Answer
             *
             */
            createAndSendAnswer: function () {
                pc.createAnswer(setLocalAndSendMessage, function (error) {
                    console.log(error)
                }, sdpConstraints);
            },

            setRemoteDescription: function (message) {
                pc.setRemoteDescription(new RTCSessionDescription(message));
            },

            addIceCandidate: function (message) {
                var candidate = new RTCIceCandidate({
                    sdpMLineIndex: message.label,
                    candidate: message.candidate
                });
                pc.addIceCandidate(candidate);
            },

            /**
             * Gracefully Ends the WebRTC Peer Connection
             *
             */
            endConnection: function () {
                isStarted = false;
                isInitiator = false;

                try {
                    pc.close();
                } catch (e) {
                }

            },

            getMessage: function () {
                return message;
            },

            setInitiator: function (value) {
                isInitiator = value;
            },

            getInitiator: function () {
                return isInitiator;
            },

            setIsStarted: function (value) {
                isStarted = value;
            },

            getIsStarted: function () {
                return isStarted;
            },

            /**
             * Use this to avoid xss
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

            getChunkSize: function (me, peer) {
                return 16000;//64000;//36000;
            }
        };

        /**
         * Handle Ice Candidates
         *
         * @param event
         */
        function handleIceCandidate(event) {
            if (event.candidate) {
                Signalling.sendMessageForDataChannel({
                    type: 'candidate',
                    label: event.candidate.sdpMLineIndex,
                    id: event.candidate.sdpMid,
                    candidate: event.candidate.candidate
                });
            } else {
                //console.log('End of candidates.');
            }
        }

        /**
         * Set Local Description and send it to other peer
         *
         * @param sessionDescription
         */
        function setLocalAndSendMessage(sessionDescription) {
            // Set Opus as the preferred codec in SDP if Opus is present.
            pc.setLocalDescription(sessionDescription);
            //console.log('setLocalAndSendMessage sending message' , sessionDescription);
            Signalling.sendMessageForDataChannel(sessionDescription);
        }

        /**
         * Handle the Create Offer Error
         *
         * @param error
         */
        function handleCreateOfferError(error) {
            console.log('createOffer() error: ', error);
        }

        function handleMessage(event) {
            trace('MESSAGE GOT: ' + event.data);
            //document.getElementById("dataChannelReceive").value = event.data;

            message = event.data;

            $rootScope.$broadcast("dataChannelMessageReceived");

        }

        function handleSendChannelStateChange() {
            var readyState = sendChannel.readyState;
            //trace('Send channel state is: ' + readyState);
        }

        function gotReceiveChannel(event) {
            //trace('Receive Channel Callback');
            sendChannel = event.channel;
            sendChannel.onmessage = handleMessage;
            sendChannel.onopen = handleReceiveChannelStateChange;
            sendChannel.onclose = handleReceiveChannelStateChange;
        }

        function handleReceiveChannelStateChange() {
            var readyState = sendChannel.readyState;
            //trace('Receive channel state is: ' + readyState);
        }

    });
