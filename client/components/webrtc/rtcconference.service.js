'use strict';

angular.module('cloudKiboApp')
    .factory('RTCConference', function RTCConference($rootScope, pc_config, pc_constraints, sdpConstraints, video_constraints, Signalling) {

        var pcIndex = 0;
        var pcLength = 4;

        var isChannelReady;
        var isInitiator = false;
        var isStarted = false;

        var sendChannel = new Array(pcLength);
        var receiveChannel;

        var localStream;
        var localStreamScreen;

        var pc = new Array(pcLength);

        var remoteStream1;
        var remoteStream2;
        var remoteStream3;
        var remoteStream4;

        var remoteStreamScreen;

        var remotevideo1;
        var remotevideo2;
        var remotevideo3;
        var remotevideo4;

        var remoteVideoScreen;

        var localvideo;
        var localvideoscreen;

        var iJoinLate = false;

        var screenSharePCIndex = 0;

        var turnReady;

        return {

            /**
             * Initialize the media elements
             *
             * @param remVid1
             * @param remVid2
             * @param remVid3
             * @param remVid4
             * @param remVidScr
             * @param locVid
             * @param locVidScr
             */
            initialize: function (remVid1, remVid2, remVid3, remVid4, remVidScr, locVid, locVidScr) {
                remotevideo1 = remVid1;
                remotevideo2 = remVid2;
                remotevideo3 = remVid3;
                remotevideo4 = remVid4;
                remoteVideoScreen = remVidScr;
                localvideo = locVid;
                localvideoscreen = locVidScr;
            },

            /**
             * Create Peer Connection
             *
             */
            createPeerConnection: function () {
                try {
                    //
                    //Different URL way for FireFox
                    //
                    pc[pcIndex] = new RTCPeerConnection(pc_config, {optional: []});//pc_constraints);
                    pc[pcIndex].onicecandidate = handleIceCandidate;
                    pc[pcIndex].onaddstream = handleRemoteStreamAdded;
                    pc[pcIndex].onremovestream = handleRemoteStreamRemoved;

                    //if (isInitiator) {
                    try {
                        // Reliable Data Channels not yet supported in Chrome
                        try {
                            sendChannel[pcIndex] = pc[pcIndex].createDataChannel("sendDataChannel", {reliable: true});
                        }
                        catch (e) {
                            console.log('UNRELIABLE DATA CHANNEL')
                            sendChannel[pcIndex] = pc[pcIndex].createDataChannel("sendDataChannel", {reliable: false});
                        }
                        sendChannel[pcIndex].onmessage = handleMessage;
                        trace('Created send data channel');
                    } catch (e) {
                        alert('Failed to create data channel. ' +
                        'You need Chrome M25 or later with RtpDataChannel enabled : ' + e.message);
                        trace('createDataChannel() failed with exception: ' + e.message);
                    }
                    sendChannel[pcIndex].onopen = handleSendChannelStateChange;
                    sendChannel[pcIndex].onclose = handleSendChannelStateChange;
                    // } else {
                    pc[pcIndex].ondatachannel = gotReceiveChannel;
                    pc.addStream(localStream);
                    // }
                } catch (e) {
                    console.log('Failed to create PeerConnection, exception: ' + e.message);
                    alert('Cannot create RTCPeerConnection object.');
                    return;
                }
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
            },

            addStreamForScreen: function (stream) {
                localStreamScreen = stream;
                localVideoScreen.src = URL.createObjectURL(stream);

                pc.addStream(stream);
            },

            getLocalStream: function () {
                return localStream;
            },

            getScreenShared: function () {
                return screenShared;
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

            increasePCIndex: function () {
                pcIndex++;
            },

            getPcIndex: function () {
                return pcIndex;
            },

            setIsChannelReady: function (value) {
                isChannelReady = value;
            },

            getIsChannelReady: function () {
                return isChannelReady;
            },

            setIJoinLate: function (value) {
                iJoinLate = value;
            },

            getIJoinLate: function () {
                return iJoinLate;
            },

            stopLocalStream: function () {
                localStream.stop();
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
                screenShared = true;
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
                screenShared = false;
            }
            else {
                remoteStreamScreen.stop();
                remoteStream.stop();

                remoteStreamScreen = null;
                remoteStream = null;
            }
        }

        function handleMessage(event) {
            //trace('MESSAGE GOT: ' + event.data);
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
