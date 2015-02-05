/**
 * Created by sojharo on 2/3/2015.
 */

'use strict';

angular.module('cloudKiboApp')
    .factory('pc_config', function () {
        /*
         return pc_config = {'iceServers': [createIceServer('stun:stun.l.google.com:19302', null, null),
         createIceServer('stun:stun.anyfirewall.com:3478', null, null),
         createIceServer('turn:turn.bistri.com:80?transport=udp', 'homeo', 'homeo'),
         createIceServer('turn:turn.bistri.com:80?transport=tcp', 'homeo', 'homeo'),
         createIceServer('turn:turn.anyfirewall.com:443?transport=tcp', 'webrtc', 'webrtc')
         ]};
         */

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

        /*
         {url: 'turn:cloudkibo@162.243.217.34:3478?transport=udp', username: 'cloudkibo',
         credential: 'cloudkibo'}
         */
    })

    .factory('pc_constraints', function () {
        return {'optional': [{'DtlsSrtpKeyAgreement': true}, {'RtpDataChannels': true}]};
    })

    .factory('sdpConstraints', function () {
        return {
            'mandatory': {
                'OfferToReceiveAudio': true,
                'OfferToReceiveVideo': true
            }
        };
    })

    .factory('video_constraints', function () {
        return {video: true, audio: true};
    })

    .factory('WebRTC', function Sound($rootScope, pc_config, pc_constraints, sdpConstraints, video_constraints, Signalling) {

        var isInitiator = false;
        var isStarted = false;

        var sendChannel;
        var receiveChannel;

        var localStream;
        var localStreamScreen;

        var pc;

        var remoteStream = null;
        var remoteStreamScreen = null;

        var localVideo;
        var localVideoScreen;

        var remoteVideo;
        var remoteVideoScreen;

        var extensionAvailable;

        // todo need to check exact chrome browser because opera also uses chromium framework
        //noinspection UnreachableCodeJS
        var isChrome = !!navigator.webkitGetUserMedia;

        // DetectRTC.js - https://github.com/muaz-khan/WebRTC-Experiment/tree/master/DetectRTC
        // Below code is taken from RTCMultiConnection-v1.8.js (http://www.rtcmulticonnection.org/changes-log/#v1.8)
        var DetectRTC = {};

        return {

            /**
             * Initialize the media elements
             *
             * @param localvideo Video Element to hold local peer's webcam video
             * @param localvideoscreen Video Element to hold local peer's screen
             * @param remotevideo Video Element to hold remote peer's webcam video
             * @param remotevideoscreen Video Element to hold remote peer's screen
             */
            initialize: function (localvideo, localvideoscreen, remotevideo, remotevideoscreen) {
                localVideo = localvideo;
                localVideoScreen = localvideoscreen;
                remoteVideo = remotevideo;
                remoteVideoScreen = remotevideoscreen;

                
                    var screenCallback;

                    DetectRTC.screen = {
                        chromeMediaSource: 'screen',
                        getSourceId: function (callback) {
                            if (!callback) throw '"callback" parameter is mandatory.';
                            screenCallback = callback;
                            window.postMessage('get-sourceId', '*');
                        },
                        isChromeExtensionAvailable: function (callback) {
                            if (!callback) return;

                            if (DetectRTC.screen.chromeMediaSource == 'desktop') callback(true);

                            // ask extension if it is available
                            window.postMessage('are-you-there', '*');

                            setTimeout(function () {
                                if (DetectRTC.screen.chromeMediaSource == 'screen') {
                                    callback(false);
                                } else callback(true);
                            }, 2000);
                        },
                        onMessageCallback: function (data) {
                            console.log('chrome message', data);

                            // "cancel" button is clicked
                            if (data == 'PermissionDeniedError') {
                                DetectRTC.screen.chromeMediaSource = 'PermissionDeniedError';
                                if (screenCallback) return screenCallback('PermissionDeniedError');
                                else throw new Error('PermissionDeniedError');
                            }

                            // extension notified his presence
                            if (data == 'kiboconnection-extension-loaded') {
                                DetectRTC.screen.chromeMediaSource = 'desktop';
                            }

                            // extension shared temp sourceId
                            if (data.sourceId) {
                                DetectRTC.screen.sourceId = data.sourceId;
                                if (screenCallback) screenCallback(DetectRTC.screen.sourceId);
                            }
                        }
                    };

                    // check if desktop-capture extension installed.
                    if (window.postMessage && isChrome) {
                        DetectRTC.screen.isChromeExtensionAvailable(function (status) {
                            extensionAvailable = !status;
                        });
                    }

            },

            /**
             * Create Peer Connection
             *
             */
            createPeerConnection: function () {
                pc = new RTCPeerConnection(pc_config, {optional: []});//pc_constraints);
                pc.onicecandidate = handleIceCandidate;
                pc.onaddstream = handleRemoteStreamAdded;
                pc.onremovestream = handleRemoteStreamRemoved;
                pc.addStream(localStream);
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
             * Capture the User Media
             *
             */
            captureUserMedia: function (cb) {
                getUserMedia(video_constraints,
                    function (newStream) {

                        localStream = newStream;
                        localVideo.src = URL.createObjectURL(newStream);

                        cb(null);
                    },
                    function (err) {
                        cb(err);
                    }
                );
            },

            shareScreen: function (cb) {
                // this statement defines getUserMedia constraints
                // that will be used to capture content of screen
                var screen_constraints = {
                    mandatory: {
                        chromeMediaSource: DetectRTC.screen.chromeMediaSource,
                        maxWidth: 1920,
                        maxHeight: 1080,
                        minAspectRatio: 1.77
                    },
                    optional: []
                };

                // this statement verifies chrome extension availability
                // if installed and available then it will invoke extension API
                // otherwise it will fallback to command-line based screen capturing API
                if (DetectRTC.screen.chromeMediaSource == 'desktop' && !DetectRTC.screen.sourceId) {
                    DetectRTC.screen.getSourceId(function (error) {
                        // if exception occurred or access denied
                        if (error && error == 'PermissionDeniedError') {
                            alert('PermissionDeniedError: User denied to share content of his screen.');
                        }

                        this.shareScreen(cb);

                    });
                    return;
                }

                console.log(DetectRTC.screen.chromeMediaSource);

                // this statement sets gets 'sourceId" and sets "chromeMediaSourceId"
                if (DetectRTC.screen.chromeMediaSource == 'desktop') {
                    screen_constraints.mandatory.chromeMediaSourceId = DetectRTC.screen.sourceId;
                }

                // it is the session that we want to be captured
                // audio must be false
                var session = {
                    audio: false,
                    video: screen_constraints
                };

                // now invoking native getUserMedia API
                navigator.webkitGetUserMedia(session,
                    function (newStream) {

                        localStreamScreen = newStream;
                        localVideoScreen.src = URL.createObjectURL(newStream);

                        pc.addStream(newStream);

                        this.createAndSendOffer();

                        cb(null);

                    }, function (err) {
                        cb(err);
                    });
            },

            /**
             * Gracefully Ends the WebRTC Peer Connection
             *
             */
            endConnection: function () {
                isStarted = false;
                isInitiator = false;

                console.log(localStream);

                if (localStream) {
                    localStream.stop();
                }
                if (localStreamScreen) {
                    localStreamScreen.stop();
                }
                if (remoteStream) {
                    remoteStream.stop();
                    remoteVideo.src = null;
                    remoteStream = null;
                }
                if (remoteStreamScreen) {
                    remoteStreamScreen.stop();
                    remoteVideoScreen.src = null;
                    remoteStreamScreen = null;
                }

                console.log(localStream);

                try {
                    pc.close();
                }catch(e){
                }

            },

            hideScreen: function () {
                localStreamScreen.stop();
                pc.removeStream(localStreamScreen);
                this.createAndSendOffer();
            },

            getLocalStream: function () {
                return localStream;
            },

            getRemoteStreamScreen: function () {
                return remoteStreamScreen;
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

            isExtensionAvailable: function () {
                return extensionAvailable;
            }
        };

        /**
         * Handle Ice Candidates
         *
         * @param event
         */
        function handleIceCandidate(event) {
            if (event.candidate) {
                Signalling.sendMessage({
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
            Signalling.sendMessage(sessionDescription);
        }

        /**
         * Handle the Create Offer Error
         *
         * @param error
         */
        function handleCreateOfferError(error) {
            console.log('createOffer() error: ', error);
        }

        /**
         * Handle the remote stream adding
         *
         * @param event
         */
        function handleRemoteStreamAdded(event) {
            if (!remoteStream) {
                remoteVideo.src = URL.createObjectURL(event.stream);
                remoteStream = event.stream;
            } else {
                remoteVideoScreen.src = URL.createObjectURL(event.stream);
                remoteStreamScreen = event.stream;
            }
        }

        /**
         * Handle the remote peer stream removal
         *
         * @param event
         */
        function handleRemoteStreamRemoved(event) {
            console.log(event);
            if(typeof remoteStreamScreen != 'undefined') {
                remoteStreamScreen.stop();
                remoteStreamScreen = null;
            }
            else {
                remoteStreamScreen.stop();
                remoteStream.stop();

                remoteStreamScreen = null;
                remoteStream = null;
            }
        }

        /////////////////////////////////////////////////////////////////////////////////////////////
        // Screen Sharing Extension and capturing code                                             //
        ////////////////////////////////////////////////////////////////////////////////////////////






        window.addEventListener('message', function (event) {
            if (event.origin != window.location.origin) {
                return;
            }

            //console.log('THIS IS THE EVENT')
            //console.log(event)

            DetectRTC.screen.onMessageCallback(event.data);
        });

        //-----------------//

    });
