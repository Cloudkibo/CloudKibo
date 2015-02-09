'use strict';

/**
 * This is core WebRTC one-to-one video call service. It depends on the Signalling Service for doing signalling.
 * Furthermore, it uses services from configuration too. To use this, one should follow the WebRTC call procedure.
 * Here it is mostly same as standard procedure of a WebRTC call, but this service hides much of the details from
 * application. Before starting a video call, initialize function must be called and it must be given reference of
 * HTML video elements. This service automatically attaches the remote and local streams to these video elements.
 * It also takes care of both local and remote screen sharing streams. Application must call the functions in
 * following order:
 *
 * 1. Call the initialize() function when controller loads
 * 2. Call the initilizeSignalling() function if not called initialize() function of signalling service
 * 3. Capture the audio & video using captureUserMedia()
 * 4. If both peers has captured the camera then initiator would call the createPeerConnection() function
 * (NOTE: It is responsibility of the application to make sure both peers have got the media access. Application
 * may use the Signalling Service for this purpose)
 * 5. Initiator subsequently would call the createAndSendOffer() method
 * 6. Other peer would receive the offer and would call createPeerConnection()
 * 7. Subsequently, other peer would set the received SDP using setRemoteDescription()
 * (NOTE: For now, it is the responsibility of application to listen to "message" on socket.io for offer, answer
 * and other WebRTC signalling messages)
 * 8. Other peer would now call createAndSendAnswer() function
 * 9. Subsequently, service would automatically get the ICECandidates and send them to other peer
 * (NOTE: Also for ICECandidates, application should listen to "message" and invoke the setRemoteDescription() if
 * the message type is candidate)
 * 10. To end the call, application must call the endConnection() function, however it is application's responsibility
 * to clean the User Interface or change it accordingly.
 */

angular.module('cloudKiboApp')
    .factory('WebRTC', function WebRTC($rootScope, pc_config, pc_constraints, sdpConstraints, video_constraints, Signalling) {

        var isInitiator = false;            /* It indicates which peer is the initiator of the call */
        var isStarted = false;              /* It indicates whether the WebRTC session is started or not */

        var localStream;                    /* It holds local camera and audio stream */
        var localStreamScreen;              /* It holds local screen sharing stream */

        var pc;                             /* Peer Connection object */

        var remoteStream = null;            /* It holds the other peer's camera and audio stream */
        var remoteStreamScreen = null;      /* It holds the other peer's screen sharing stream */

        var localVideo;                     /* It is the HTML5 video element to hold local peer's video */
        var localVideoScreen;               /* It is the HTML5 video element to hold local screen sharing video */

        var remoteVideo;                    /* It is the HTML5 video element to hold other peer's video */
        var remoteVideoScreen;              /* It is the HTML5 video element to hold other peer's screen sharing video */

        var screenShared;                   /* This boolean variable indicates if the other party has shared the screen */

        return {

            /**
             * Initialize the media elements. Application must call this function prior to making any WebRTC video
             * call. Application's UI must contain four video elements: two for local peer and two for remote peer.
             * Service would attach the local and incoming streams to these video elements by itself. You must get
             * the reference of these elements and pass them as parameters.
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
            },

            /**
             * Creates Peer Connection and attaches the local stream to it. Application must call this function when
             * it knows that both the peers have got the local camera and mic access. In RTCPeerConnection(), we use
             * pc_config service from the configurations. Furthermore, service attaches some private callback functions
             * to some WebRTC connection events. Application doesn't need to care about them. This function assumes
             * that the local peer has got the camera and mic access and it adds the stream to peer connection object.
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
             * Create and Send Offer to other peer. When initiator has got the camera access and has subsequently
             * made the peer connection object using createPeerConnection(), it must call this function now to send
             * the offer to other party. This function uses two private functions as callback to set local description
             * and handle the create offer error. Application doesn't need to care about these functions.
             *
             */
            createAndSendOffer: function () {
                pc.createOffer(setLocalAndSendMessage, handleCreateOfferError);
            },

            /**
             * Create and Send Answer to the peer who made the offer. When peer receives offer from the initiator,
             * it must call this function after setting the remote description. It uses the sdbConstraints from the
             * configurations. It has the callback functions to set local description and handle create answer error.
             * Application is responsible for listening the "message" socket.io event and then check if type is offer.
             * Subsequently, application must call this function to send answer.
             *
             */
            createAndSendAnswer: function () {
                pc.createAnswer(setLocalAndSendMessage, function (error) {
                    console.log(error)
                }, sdpConstraints);
            },

            /**
             * On receiving remote description from other peer with offer or answer message, application must call this
             * function to set the remote description to peer connection object.
             *
             * @param message It is the remote description sent to the local peer
             */
            setRemoteDescription: function (message) {
                pc.setRemoteDescription(new RTCSessionDescription(message));
            },

            /**
             * On receiving ice candidate from other peer, application must call this function to add this candidate
             * to local peer connection object. Application is responsible for listening the "message" socket.io event
             * and then check if type is candidate. Subsequently, appliction must call this function to set the remote
             * candidates.
             *
             * @param message It is the remote candidate sent to the local peer
             */
            addIceCandidate: function (message) {
                var candidate = new RTCIceCandidate({
                    sdpMLineIndex: message.label,
                    candidate: message.candidate
                });
                pc.addIceCandidate(candidate);
            },

            /**
             * Capture the User Media. Application must call this function to capture camera and mic. This function
             * uses video_constraints from the configurations. It sets the callback with null on success and err
             * on error. It attaches the local media stream to video element for the application.
             *
             * @param cb It is the callback which should be called with err if there was an error in accessing the media
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
             * Gracefully Ends the WebRTC Peer Connection. When any peer wants to end the call, it must call this function.
             * It is the responsibility of application to inform other peer about ending of the call. Application would
             * clean or change the UI itself. Both the peers should call this function to end the call.
             * This function cleans many variables and also stop all the local streams so that camera and screen media
             * (if accessed) would be stopped. Finally, it closes the peer connection.
             *
             * todo: localStream.stop() does not release the camera, it must be fixed
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
                } catch (e) {
                }

            },

            /**
             * Initializes the Signalling Service. Application can either initialize the signalling from this service or
             * by injecting the original Signalling Service and calling the initialize.
             *
             * Before starting any WebRTC call, application should give information about username of peers
             * and name of the room they join on the server.
             *
             * @param to Username of the other peer
             * @param from Username of this peer
             * @param roomName Name of the socket.io room which both peers must join for signalling
             */
            initializeSignalling: function (to, from, roomName) {
                Signalling.initialize(to, from, roomName);
            },

            /**
             * Application should call this function whenever the local peer wants to stop sharing the stream. This stops
             * the local screen stream and also removes the stream from the peer connection object. It is the responsibility
             * of application to call createAndSendOffer() function afterwards to let other peer know about this.
             */
            hideScreen: function () {
                localStreamScreen.stop();
                pc.removeStream(localStreamScreen);
            },

            /**
             * Adds the screen stream to peer connection object and video element. There is a complete screen sharing
             * service in this library which talks to screen sharing extension and returns the stream.
             *
             * Currently, screen sharing service is used by application and application get the stream using screen
             * sharing service and add it to peer connection object by calling this function
             *
             * todo: Use the screen sharing service inside this service and don't depend  on application
             *
             * @param stream Screen sharing stream
             */
            addStreamForScreen: function (stream) {
                localStreamScreen = stream;
                localVideoScreen.src = URL.createObjectURL(stream);

                pc.addStream(stream);

            },

            /**
             *  Application can check if the local stream is fetched or not by calling this function.
             *
             * @returns {*}
             */
            getLocalStream: function () {
                return localStream;
            },

            /**
             * Application can check if the remote peer has shared the screen. Application can change
             * the user interface to display or hide the video element which handles remote screen video
             *
             * @returns {*}
             */
            getScreenShared: function () {
                return screenShared;
            },

            /**
             * Application can set this to true for the peer who is the initiator of the call. Service must know
             * who is the initiator of the call. Initiator is the one who sends the offer to other peer.
             *
             * @param value Boolean variable to set the value for isInitiator
             */
            setInitiator: function (value) {
                isInitiator = value;
            },

            /**
             * Application can check if the peer is set as initiator or not by using this function. Initiator is
             * the one who sends the offer to other peer.
             * @returns {boolean}
             */
            getInitiator: function () {
                return isInitiator;
            },

            /**
             * Application can set this to true if the call or signalling has been started. This can be used to
             * put some controls i.e. do not send the candidates until the call is started
             *
             * @param value
             */
            setIsStarted: function (value) {
                isStarted = value;
            },

            /**
             * Application can check if the call or signalling has started or not. This can be used to put some controls.
             * i.e. do not send the candidates until the call is started
             *
             * @returns {boolean}
             */
            getIsStarted: function () {
                return isStarted;
            }
        };

        /**
         * Handle Ice Candidate and send it to other peer. This callback is called from within the peer connection object
         * whenever there are candidates available. We need to send each candidate to remote peer. For this, we use
         * signalling service of this library. Refer to the Signalling Service for more information on signalling.
         *
         * This function is not exposed to application and is handled by library itself.
         *
         * @param event holds the candidate
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
         * Set Local Description and send it to other peer. This callback function is called by createOffer()
         * function of the peer connection object. We need to set the Local Description in peer connection object
         * and then send it to the other peer too. Signalling service is used to send it to other peer. Refer to
         * Signalling service for more information on it.
         *
         * @param sessionDescription description about the session
         */
        function setLocalAndSendMessage(sessionDescription) {
            // Set Opus as the preferred codec in SDP if Opus is present.
            pc.setLocalDescription(sessionDescription);
            //console.log('setLocalAndSendMessage sending message' , sessionDescription);
            Signalling.sendMessage(sessionDescription);
        }

        /**
         * Handle the Create Offer Error. This callback function is called by createOffer() function of the
         * peer connection object whenever there is an error while creating the offer.
         *
         * @param error information about the error which occurred while creating offer
         */
        function handleCreateOfferError(error) {
            console.log('createOffer() error: ', error);
        }

        /**
         * Handle the remote stream. This call back function is used to handle the streams sent by the remote peer.
         * Currently, we have two types of streams to hold: video+audio stream and screen sharing stream. This
         * function takes care of handling both stream and assigning them to correct video element
         *
         * @param event holds the stream sent by the remote peer
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
         * Handle the remote peer stream removal. This callback function is used to handle the situation when remote
         * peer removes any stream i.e. stops screen sharing. This function takes care of knowing which stream has
         * been removed.
         *
         * @param event
         */
        function handleRemoteStreamRemoved(event) {
            console.log(event);
            if (typeof remoteStreamScreen != 'undefined') {
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


    });
