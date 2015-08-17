'use strict';

angular.module('cloudKiboApp')
    .controller('TabsController', function ($scope, $location, Auth, $http, socket, RestApi, logger, $log) {

        $scope.isCollapsed = true;
        $scope.isLoggedIn = Auth.isLoggedIn;
        $scope.isAdmin = Auth.isAdmin;
        $scope.getCurrentUser = Auth.getCurrentUser;

        $scope.user = $scope.getCurrentUser() || {};

        $scope.logout = function () {


            if (Auth.isLoggedIn()) {
                //socket.emit('leave', {room: Auth.getCurrentUser().username, username: Auth.getCurrentUser().username});
                socket.emit('leaveChat', {room: 'globalchatroom', user: Auth.getCurrentUser()});

            }

            console.log("Left gloal chat room");
            $log.info("Left gloal chat room");
            Auth.logout();

            $location.path('/login');
        };

        $scope.isActive = function (route) {
            return route === $location.path();
        };

        $scope.isUserAdmin = function () {
            return $scope.getCurrentUser().role === 'admin';
        };




    })

    .controller('HomeController', function ($scope, $http, Auth, socket, $timeout, $location, Sound, WebRTC, Signalling, ScreenShare, RestApi, logger) {

		    $scope.getCurrentUser = Auth.getCurrentUser;

        $scope.isUserNameDefined = function() {
            return (typeof $scope.user.username != 'undefined') && (typeof $scope.user.email != 'undefined');
        };

        $scope.isMeetingPage = function(){
            return false;
        };

        $scope.showError = function(){
            return $scope.isError;
        };

        $scope.isError = false;

        $scope.saveNewUserName = function (tempUser) {

            tempUser._id = $scope.user._id;
            $http.post(RestApi.user.saveUserDetailForFedreatedAuthentication, tempUser)
                .success(function (data) {
                    if(data.status == 'success') {
                        $scope.user = data.msg;
                        Auth.setUser(data.msg);
                        $scope.isError = false;
                    }
                    else{

                        $scope.errorMessage = data.msg;
                        $scope.isError = true;

                    }

                })
          console.log("New user account saved");
          $log.info("New user account saved");
        };

        $scope.user = $scope.getCurrentUser();

        var i;

        $scope.otherUser = {};

        if ($location.url() != '/app') {
            $http.post(RestApi.user.searchByUsername, {searchusername: $location.url().split('/')[2]})
                .success(function (data) {
                    $scope.otherUser = data;

                });
        }

        $scope.getlocation = function () {
            return $location.url();
        };


        //**********************************************************************************//
        //**********************************************************************************//
        // All the contents of Tabs and Menus                                               //
        //**********************************************************************************//
        //**********************************************************************************//


        $scope.deviceAccess = true;

        var localStreamTest = null;

        $scope.checkDeviceAccess = function () {

            var video_constraints = {video: true, audio: true};

            getUserMedia(video_constraints, function (newStream) {

                var testvideo = document.getElementById("testvideo");
                var testvideo2 = document.getElementById("testvideo2");
                testvideo.src = URL.createObjectURL(newStream);
                testvideo2.src = URL.createObjectURL(newStream);
                localStreamTest = newStream;
                $scope.deviceAccess = true;
              console.log("testing video ");
              $log.info("testing video ");
            }, function (error) {

                $scope.deviceAccess = false;
                console.log(error);
                $log.info(error);

            });
        };

        $scope.hasDeviceAccess = function () {
            return $scope.deviceAccess;
        };

        $scope.ReadyToGo = function () {

            localStreamTest.stop();

            $http.post(RestApi.user.initialTesting, {initialTesting: 'Yes'})
                .success(function (data) {
                    //console.log(data);
                    if (data.status == 'success') {
                        $scope.user.initialTesting = data.msg.initialTesting;
                    }
                })
        };

        $scope.openMeeting = function () {

            if ($scope.settingsSelected == true) {
                $scope.settingsSelected = !$scope.settingsSelected;
                if (localStreamTest)
                    localStreamTest.stop();
            }
            if ($scope.callSelected == true)
                $scope.callSelected = !$scope.callSelected;
            if ($scope.inviteSelected == true)
                $scope.inviteSelected = !$scope.inviteSelected;
            if ($scope.addContactSelected == true)
                $scope.addContactSelected = !$scope.addContactSelected;

            $scope.userFound = '';

            $scope.meetingSelected = !$scope.meetingSelected;
          console.log("Meeting is opened");
          $log.info("Meeting is opened");
        };

        $scope.isMeetingSelected = function () {
            return $scope.meetingSelected;
        };


        $scope.openInvite = function () {

            if ($scope.settingsSelected == true) {
                $scope.settingsSelected = !$scope.settingsSelected;
                if (localStreamTest)
                    localStreamTest.stop();
            }
            if ($scope.callSelected == true)
                $scope.callSelected = !$scope.callSelected;
            if ($scope.meetingSelected == true)
                $scope.meetingSelected = !$scope.meetingSelected;
            if ($scope.addContactSelected == true)
                $scope.addContactSelected = !$scope.addContactSelected;

            $scope.userFound = '';

            $scope.inviteSelected = !$scope.inviteSelected;
          console.log("invite selected");
          $log.info("invite selected");
        };

        $scope.isInviteSelected = function () {
            return $scope.inviteSelected;
        };

        $scope.openSettings = function () {

            if ($scope.inviteSelected == true)
                $scope.inviteSelected = !$scope.inviteSelected;
            if ($scope.callSelected == true)
                $scope.callSelected = !$scope.callSelected;
            if ($scope.meetingSelected == true)
                $scope.meetingSelected = !$scope.meetingSelected;
            if ($scope.addContactSelected == true)
                $scope.addContactSelected = !$scope.addContactSelected;

            $scope.userFound = '';

            $scope.settingsSelected = !$scope.settingsSelected;
            if (localStreamTest)
                localStreamTest.stop();

          console.log("Settings selected");
          $log.info("Settings selected");
        };

        $scope.isSettingsSelected = function () {
            return $scope.settingsSelected;
        };

        $scope.openCall = function () {

            if ($scope.inviteSelected == true)
                $scope.inviteSelected = !$scope.inviteSelected;
            if ($scope.meetingSelected == true)
                $scope.meetingSelected = !$scope.meetingSelected;
            if ($scope.addContactSelected == true)
                $scope.addContactSelected = !$scope.addContactSelected;
            if ($scope.settingsSelected == true) {
                $scope.settingsSelected = !$scope.settingsSelected;
                if (localStreamTest)
                    localStreamTest.stop();
            }

            $scope.userFound = '';

            $scope.callSelected = !$scope.callSelected;
            if (localStreamTest)
                localStreamTest.stop();
          console.log("call selected");
          $log.info("call selected");
        };

        $scope.isCallSelected = function () {
            return $scope.callSelected;
        };

        $scope.openAddContact = function () {

            if ($scope.inviteSelected == true)
                $scope.inviteSelected = !$scope.inviteSelected;
            if ($scope.meetingSelected == true)
                $scope.meetingSelected = !$scope.meetingSelected;
            if ($scope.callSelected == true)
                $scope.callSelected = !$scope.callSelected;
            if ($scope.settingsSelected == true) {
                $scope.settingsSelected = !$scope.settingsSelected;
                if (localStreamTest)
                    localStreamTest.stop();

            }
          console.log("Add contact selected");
          $log.info("Add contact selected");

            $scope.userFound = '';

            $scope.addContactSelected = !$scope.addContactSelected;
            if (localStreamTest)
                localStreamTest.stop();
        };

        $scope.isAddContactSelected = function () {
            return $scope.addContactSelected;
        };

        $scope.userNameSearchOption = true;

        $scope.isUserNameSearchSelected = function () {
            return $scope.userNameSearchOption;
        };

        $scope.switchSearchOption = function () {
            $scope.userNameSearchOption = !$scope.userNameSearchOption;
        };

        $scope.userNameAddOption = true;

        $scope.isUserNameAddSelected = function () {
            return $scope.userNameAddOption;
        };

        $scope.switchAddOption = function () {
            $scope.userNameAddOption = !$scope.userNameAddOption;
        };

        $scope.alerts = [];

        $scope.addAlert = function (newtype, newMsg) {
            console.log('Error', newtype, newMsg);
            $scope.alerts.push({type: newtype, msg: newMsg});
        };

        $scope.closeAlert = function (index) {
            $scope.alerts.splice(index, 1);
        };

        $scope.emailInvite = function (inviteemail) {
            $http.post(RestApi.user.inviteContactByEmail, JSON.stringify(inviteemail))
                .success(function (data) {
                    if (data.status == 'success') {
                        $scope.addAlert(data.status, data.msg)
                    }
                })
          console.log("Email invite selected");
          $log.info("Email invite selected");
        };

        $scope.userFound = '';

        $scope.searchUserName = function () {
            $http.post(RestApi.user.searchByUsername, JSON.stringify($scope.search))
                .success(function (data) {
                    if (data != 'null' && data != null && data != '') {
                        $scope.userFound = data;
                        $scope.openCall();
                        $scope.callThisPerson(data.username);

                    }
                    else {
                        $scope.userFound = null;
                    }
                })
        };

        $scope.searchEmail = function () {
            $http.post(RestApi.user.searchByUserEmail, JSON.stringify($scope.search))
                .success(function (data) {
                    if (data != 'null' && data != null && data != '') {
                        $scope.userFound = data;
                        $scope.openCall();

                        $scope.callThisPerson(data.username);

                    }
                    else {
                        $scope.userFound = null;
                    }
                })
          console.log("Search contact by email");
          $log.info("Search contact by email");
        };

        $scope.contactslist = {};

        $scope.addUserName = function (add) {
            $http.post(RestApi.contacts.addContactByName, JSON.stringify(add))
                .success(function (data) {
                    if (data.status == 'success') {
                        if (data.msg != "null" && data.msg != null && data.msg != "") {
                            $scope.userFound = data.msg;
                            $scope.openAddContact();

                            $scope.contactslist = data.msg;

                            socket.emit('friendrequest', {
                                room: 'globalchatroom',
                                userid: $scope.user,
                                contact: add.searchusername
                            })
                          console.log("contact added by username");
                          $log.info("contact added by username");

                        }
                        else {
                            $scope.userFound = null;
                        }
                    }
                    else if (data.status == 'danger') {
                        $scope.addUserResponseMessage = data.msg;
                        $scope.userFound = 'danger';
                    }
                })
        };

        // todo Testing Required

        $scope.addEmail = function (add) {
            $http.post(RestApi.contacts.addContactByEmail, JSON.stringify(add))
                .success(function (data) {
                    if (data.status == 'success') {
                        if (data.msg != null) {
                            $scope.userFound = data.msg;
                            $scope.openAddContact();

                            $scope.contactslist = data.msg;

                            socket.emit('friendrequest', {
                                room: 'globalchatroom',
                                userid: $scope.user,
                                contact: add.searchemail
                            })

                          console.log("contact added by email");
                          $log.info("contact added by email");
                        }
                        else {
                            $scope.userFound = null;
                        }
                    }
                    else if (data.status == 'danger') {
                        $scope.addUserResponseMessage = data.msg;
                        $scope.userFound = 'danger';
                      console.log("contact NOT found by email");
                      $log.info("contact NOT found by email");
                    }
                })
        };

        $scope.updateProfile = function (gotUser) {
            $http.put(RestApi.user.changeUserProfile, JSON.stringify(gotUser))
                .success(function (data) {
                    $scope.user = data;
                    $scope.openSettings();
                })
                .error(function (data) {
                    console.log(data)
                });
          console.log("contact profile updated");
          $log.info("contact profile updated");

        };


        //////////////////////////////////////////////////////////////////////////////////////////////////
        // Helper Code                                                                                  //
        //////////////////////////////////////////////////////////////////////////////////////////////////

        $scope.isUnreadMessage = function (index) {
            return $scope.contactslist[index].unreadMessage;
        };

        $scope.isOnline = function (index) {
            return $scope.contactslist[index].online;

        };

        ////////////////////////////////////////////////////////////////////////////////////////
        // General User Interface Logic                                                      //
        ///////////////////////////////////////////////////////////////////////////////////////

        $scope.testingDefined = function () {

            //console.log($scope.user.initialTesting)

            //if((typeof $scope.user.initialTesting == 'undefined'))
            //	$scope.checkDeviceAccess();

            return false;//((typeof $scope.user.initialTesting == 'undefined'))
        };


        $scope.supportedBrowser = webrtcDetectedBrowser == "chrome";


        $http.get(RestApi.contacts.contactListOfUser).success(function (data) {
            $scope.contactslist = data;
            $scope.fetchChatNow();
          console.log("contact list data and chat fetched");
          $log.info("contact list data and chat fetched");
        }).error(function (err) {
            console.log('error ', err)
        });

        $scope.addRequestslist = {};

        $http.get(RestApi.contacts.pendingAddRequest).success(function (data) {
            $scope.addRequestslist = data;
          console.log("pending requests shown "+ $scope.addRequestslist);
          $log.info("pending requests shown "+ $scope.addRequestslist);
        });

        socket.on('friendrequest', function (data) {
            $scope.addRequestslist.push(data);
        });

        $scope.approveFriendRequest = function (index) {
            $http.post(RestApi.contacts.acceptContactRequest, $scope.addRequestslist[index].userid)
                .success(function (data) {
                    if (data.status == 'success') {
                        $scope.contactslist = data.msg;
                        $scope.addRequestslist.splice(index, 1);
                        socket.emit('whozonline', {room: 'globalchatroom', user: $scope.user})
                      console.log("Friend request accepted");
                      $log.info("Friend request accepted");
                    }
                    else{

                      alert(data.msg);

                    }
                });
        };

        $scope.rejectFriendRequest = function (index) {
            $http.post(RestApi.contacts.rejectContactRequest, $scope.addRequestslist[index].userid)
                .success(function (data) {
                    if (data.status == 'success') {
                        $scope.addRequestslist.splice(index, 1);
                      console.log("Friend request rejected");
                      $log.info("Friend request rejected");
                    }
                });
        };

        $scope.removeFriend = function (index) {
            $http.post(RestApi.contacts.removeFromContactList, {contact: index})
                .success(function (data) {
                    //console.log(data);
                console.log("Friend removed")
                $log.info("Friend removed")
                    if (data.status == 'success') {
                        $location.path('/app');
                    }
                });
        };

        $scope.removechathistory = function (index) {
            $http.post(RestApi.userchat.removeChatHistroy, {username: index.username})
                .success(function (data) {
                    //console.log(data);
                    if (data.status == 'success') {
                        $location.path('/app');
                      console.log("Chat history removed")
                      $log.info("Chat history removed")
                    }
                });
        };


        ////////////////////////////////////////////////////////////////////////////////////////
        // WebRTC User Interface Logic                                                        //
        ////////////////////////////////////////////////////////////////////////////////////////
        /*
         document.fullscreenEnabled = document.fullscreenEnabled || document.mozFullScreenEnabled || document.documentElement.webkitRequestFullScreen;

         $scope.enterVideoFullScreen = function(){
         var remotevideo = document.getElementById("remotevideo");
         if (document.fullscreenEnabled) {
         requestFullscreen(remotevideo);
         }
         }

         $scope.enterVideoScreenFullScreen = function(){
         var remotevideoscreen = document.getElementById("remotevideoscreen");
         if (document.fullscreenEnabled) {
         requestFullscreen(remotevideoscreen);
         }
         }

         function requestFullscreen(element) {
         if (element.requestFullscreen) {
         element.requestFullscreen();
         } else if (element.mozRequestFullScreen) {
         element.mozRequestFullScreen();
         } else if (element.webkitRequestFullScreen) {
         element.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
         }
         }
         */

        $scope.connected = false;

        $scope.localCameraOn = false;

        $scope.isConnected = function () {
            return $scope.connected;
        };

        $scope.callEnded = false;

        $scope.hasCallEnded = function () {
            return $scope.callEnded;
        };

        $scope.ignoreFeedBack = function () {
            $scope.feedBackSent = true;
        };

        $scope.extensionAvailable = false;

        $scope.hasChromeExtension = function(){
          return $scope.extensionAvailable;
        };

        $scope.isFireFox = function(){
          return typeof navigator.mozGetUserMedia !== 'undefined';
        }

        $scope.localCameraCaptured = function () {
            return $scope.localCameraOn;
        };

        $scope.alertsCallStart = [];

        $scope.addAlertCallStart = function (newtype, newMsg) {
            $scope.$apply(function () {
                $scope.alertsCallStart.push({type: newtype, msg: newMsg});
            })
        };

        $scope.closeAlertCallStart = function (index) {
            $scope.alertsCallStart.splice(index, 1);
        };

        $scope.feedBackSent = false;

        $scope.sentFeedback = function () {
            return $scope.feedBackSent;
        };

        $scope.feedBackForm = function () {
            $http.post(RestApi.feedback.feedbackByUser, JSON.stringify($scope.feedback))
                .success(function (data) {
                    $scope.feedBackSent = true;
                console.log("Call feedback sent")
                $log.info("Call feedback sent")
                })
                .error(function (data) {
                    console.log('Error:', data)
                $log.info('Error:', data)
                });
        };

        $scope.isOtherPeerOffline = function () {
            return $scope.otherPeersOfflineStatus;
          console.log("Status of call"+ $scope.otherPeersOfflineStatus )
          $log.info("Status of call"+ $scope.otherPeersOfflineStatus )
        };

        $scope.isOtherPeerBusy = false;

        $scope.isOtherPeerBusy = function () {
            return $scope.otherPeersBusyStatus;
        };

        $scope.otherScreenShared = false;

        $scope.hasOtherPartySharedScreen = function () {
            return $scope.otherScreenShared;
        };

        $scope.$on('screenShared', function(){

            $scope.$apply(function(){
                $scope.otherScreenShared = true;
            })
          console.log("Screen shared by other")
          $log.info("Screen shared by other")

        });

        $scope.$on('screenRemoved', function(){

            $scope.$apply(function(){
                $scope.otherScreenShared = false;
            })
          console.log("Screen remoed/hidden by other")
          $log.info("Screen remoed/hidden by other")

        });

        $scope.screenSharedLocal = false;

        $scope.isLocalScreenShared = function () {
            return $scope.screenSharedLocal;
        };

        $scope.callThisPerson = function (calleeusername) {

            if ($scope.areYouCallingSomeone == false && $scope.amInCall == false) {

                socket.emit('callthisperson', {
                    room: 'globalchatroom',
                    callee: calleeusername,
                    caller: $scope.user.username
                });
              console.log("Calling person "+ calleeusername);
              $log.info("Calling person "+ calleeusername);

                $scope.OutgoingCallStatement = 'Outgoing Call to : ' + calleeusername;

                $scope.areYouCallingSomeone = true;
            }

        };

        $scope.endCall = function () {
          console.log("end call selected")
          $log.info("end call selected");
            WebRTC.endConnection();
          console.log("connetion ended")
          $log.info("connetion ended")

            $scope.firstVideoAdded = false;
          console.log("stop 1st video")
          $log.info("stop 1st video")

            $scope.screenSharedLocal = false;
          console.log("stop shared screen")
          $log.info("stop shared screen")

            $scope.screenSharedByPeer = false;
          console.log("stop other person's shared screen")
          $log.info("stop other person's shared screen")


            $scope.localCameraOn = false;
          console.log("stop local camera capture")
          $log.info("stop local camera capture")

            Signalling.sendMessage('hangup');
          console.log("STOP signalling msg sent ")
          $log.info("STOP signalling msg sent ")

            //noinspection UnnecessaryLocalVariableJS
          var endTime = new Date();

            $scope.callData.EndTime = endTime;

            $scope.recordCallData();

            $scope.userMessages = [];

            $scope.callEnded = true;

            $scope.amInCall = false;

            $scope.amInCallWith = '';
        };

        $scope.IncomingCallStatement = '';
        $scope.isSomeOneCalling = false;

        $scope.isThereIncomingCall = function () {
            return $scope.isSomeOneCalling;
        };

        $scope.OutgoingCallStatement = '';
        $scope.areYouCallingSomeone = false;

        $scope.isThereOutgoingCall = function () {
            return $scope.areYouCallingSomeone;
        };

        $scope.isItRinging = function () {
            return $scope.ringing;
        };

        $scope.isOtherSideRinging = function () {
            return $scope.otherSideRinging;
        };

        $scope.onTimeoutForPersonOfflineOrBusy = function () {
            $scope.areYouCallingSomeone = false;
        };

        $scope.onTimeoutOfMissedCall = function () {
            $scope.isSomeOneCalling = false;
        };

        $scope.callData = {};

        $scope.recordCallData = function () {
            $http.post(RestApi.callrecord.setCallRecordData, JSON.stringify($scope.callData))
        };

        var localPeerHideVideo = document.getElementById("localPeerHideVideo");
        var remotePeerHideVideo = document.getElementById("remotePeerHideVideo");

        $scope.$on('Speaking', function () {
          localPeerHideVideo.style.cssText = 'border : 2px solid #000000;';
          console.log('speaking '+ $scope.localSpeaking)
          $log.info('speaking '+ $scope.localSpeaking)
        });

        $scope.$on('Silent', function () {
          localPeerHideVideo.style.cssText = 'border : 0px solid #000000;';
          console.log('silent '+ $scope.localSpeaking)
          $log.info('silent '+ $scope.localSpeaking)
        });

        $scope.$on('PeerSpeaking', function () {
          remotePeerHideVideo.style.cssText = 'border : 2px solid #000000;';
          console.log('speaking '+ $scope.localSpeaking)
          $log.info('speaking '+ $scope.localSpeaking)
        });

        $scope.$on('PeerSilent', function () {
          remotePeerHideVideo.style.cssText = 'border : 0px solid #000000;';
          console.log('silent '+ $scope.localSpeaking)
          $log.info('silent '+ $scope.localSpeaking)
        });

        var peerSharedVideo = false;

        $scope.hasPeerSharedVideo = function(){
          return peerSharedVideo;
        };

        var localVideoCaptured = false;
        var localAudioCaptured = false;

        $scope.isVideoCaptured = function(){
          return localVideoCaptured;
          console.log("localVideoCaptured")
          $log.info("localVideoCaptured")
        };

        $scope.isAudioCaptured = function(){
          return localAudioCaptured;
          console.log("localVideoCaptured")
          $log.info("localVideoCaptured")
        };

        $scope.toggleVideoStream = function() {
          WebRTC.toggleVideo(function(err){
            if (err) return alert('Permission denied.');
            console.log("video toggled")
            $log.info("video toggled")
            localVideoCaptured = WebRTC.isLocalVideoShared();

          })
        }

        $scope.toggleAudioStream = function() {
          WebRTC.toggleAudio(function(err){
            if (err) return alert('Permission denied.');
            console.log("Audio toggled")
            $log.info("Audio toggled")
            localAudioCaptured = WebRTC.isLocalAudioShared();

          })
        };

        ////////////////////////////////////////////////////////////////////////////////////////
        // Create or Join Room Logic                                                          //
        ////////////////////////////////////////////////////////////////////////////////////////
        var roomid;

        $scope.connectTimeOut = function () {

            $scope.meetingroom = 'm_' + $scope.user.username;

            roomid = 'globalchatroom';

            $scope.createOrJoinRoom();
            $scope.connected = true;

            var remotevideo = document.getElementById("remotevideo");
          console.log("Remote video captured")
          $log.info("Remote video captured")

            var remotevideoscreen = document.getElementById("remotevideoscreen");
          console.log("Remote video Screen captured")
          $log.info("Remote video Screen captured")

            var localvideo = document.getElementById("localvideo");
          console.log("Local video captured")
          $log.info("Local video captured")

            var remoteaudio = document.getElementById('remoteaudio');
          console.log("Local Audio captured")
          $log.info("Local Audio captured")

            WebRTC.initialize(localvideo, localvideo, remotevideo, remoteaudio, remotevideoscreen);
          console.log("Initializing meeting call")
          $log.info("Initializing meeting call")
        };

        $timeout($scope.connectTimeOut, 1000);

        ////////////////////////////////////////////////////////////////////////////////////////
        // Signaling Logic                                                                    //
        ///////////////////////////////////////////////////////////////////////////////////////

        $scope.createOrJoinRoom = function () {

            // Leave room if already joined... (temporary fix)

            // todo put it in signalling service, it is also linked with above connectTimeOut
            socket.emit('leaveChat', {room: roomid, user: $scope.user});
          console.log("leave chatRoom to rejoin")
          $log.info("leave chatRoom to rejoin")

            // Rejoin the room... (temporary fix)

            socket.emit('join global chatroom', {room: roomid, user: $scope.user});
          console.log("Joining Chat Room")
          $log.info("Joining Chat Room")
        };

        $scope.LeaveRoom = function () {
            console.log('Leaving room', {room: roomid, username: $scope.user.username});
            $log.info('Leaving room', {room: roomid, username: $scope.user.username});

            socket.emit('leaveChat', {room: 'globalchatroom', user: $scope.user});
        };

        $scope.setStatus = function () {

            if ($scope.user.status != null) {
                if ($scope.user.status.trim() != '') {

                    socket.emit('status', {room: 'globalchatroom', user: $scope.user});
                  console.log("Status set")
                  $log.info("Status set")
                    $http.post(RestApi.user.statusMessage, $scope.user).success(function (data) {
                    });
                }
            }

        };

        socket.on('online', function (friend) {
            for (i in $scope.contactslist) {
                if ($scope.contactslist[i].contactid.username == friend.username) {
                    $scope.contactslist[i].online = true;
                  console.log("show online friends "+ $scope.contactslist[i].online)
                  $log.info("show online friends "+ $scope.contactslist[i].online)
                }
            }
        });

        socket.on('offline', function (friend) {
            for (i in $scope.contactslist) {
                if ($scope.contactslist[i].contactid.username == friend.username) {
                    $scope.contactslist[i].online = false;
                  console.log("show Offline friends "+ $scope.contactslist[i].online)
                  $log.info("show Offline friends "+ $scope.contactslist[i].online)
                }
            }
        });

        socket.on('youareonline', function (friends) {
            for (i in friends) {
                for (var j in $scope.contactslist) {
                    if ($scope.contactslist[j].contactid.username == friends[i].username) {
                        $scope.contactslist[j].online = true;
                      console.log("show online to "+ $scope.contactslist[j].online)
                      $log.info("show online to "+ $scope.contactslist[j].online)
                        break;
                    }
                }
            }
        });

        socket.on('theseareonline', function (friends) {
            for (i in friends) {
                for (var j in $scope.contactslist) {
                    if ($scope.contactslist[j].contactid.username == friends[i].username) {
                        $scope.contactslist[j].online = true;

                        break;
                    }
                }
            }
        });

        socket.on('calleeisoffline', function (nickname) {

            console.log('Callee is OFFLINE')
            $log.info('Callee is OFFLINE')

            $scope.OutgoingCallStatement = nickname + ' is offline.';

            $timeout($scope.onTimeoutForPersonOfflineOrBusy, 6000);

            $scope.amInCall = false;

            $scope.amInCallWith = '';

        });

        socket.on('calleeisbusy', function (data) {

            console.log('Callee is OFFLINE')
            $log.info('Callee is OFFLINE')

            $scope.OutgoingCallStatement = data.callee + ' is busy on other call.';

            $timeout($scope.onTimeoutForPersonOfflineOrBusy, 6000);

            $scope.amInCall = false;

            $scope.amInCallWith = '';


        });

        $scope.amInCallWith = '';

        socket.on('othersideringing', function (data) {

            $scope.otherSideRinging = true;

            $scope.amInCall = true;

            $scope.amInCallWith = data.callee;

            Signalling.initialize(data.callee, $scope.user.username, roomid);

        });

        $scope.amInCall = false;

        socket.on('areyoufreeforcall', function (data) {

            if ($scope.amInCall == false) {

                $scope.IncomingCallStatement = data.caller + ' is calling you';
                $scope.isSomeOneCalling = true;
                Sound.load();
                Sound.play();
                $scope.ringing = true;
                socket.emit('yesiamfreeforcall', {mycaller: data.caller, me: $scope.user.username});
                $scope.amInCall = true;
                $scope.amInCallWith = data.caller;

                Signalling.initialize(data.caller, $scope.user.username, roomid);
              console.log("checking if callee is free for call")
              $log.info("checking if callee is free for call")
            }
            else {
                socket.emit('noiambusy', {mycaller: data.caller, me: $scope.user.username})
            }

        });

        socket.on('disconnected', function (data) {

            Sound.load();
            Sound.pause();

            $scope.ringing = false;
            $scope.amInCall = false;
            $scope.amInCallWith = '';
        });

        window.onbeforeunload = function (e) {
            $scope.LeaveRoom();
            if (!$scope.isOtherPeerBusy())
                Signalling.sendMessage({msg: 'bye'});
        };

        ////////////////////////////////////////////////////////////////////////////////////////
        // WebRTC using sigaling logic                                                        //
        ///////////////////////////////////////////////////////////////////////////////////////

        socket.on('message', function (message) {
            console.log('Client received message: ');
          $log.info('Client received message: ');


            if(typeof message == 'string'){
                try {
                    message = JSON.parse(message);
                    console.log("sending msg: ' "+message+" ' ");
                  $log.info("sending msg: ' "+message+" ' ");
                }catch(e){}
            }

            if(typeof message != 'string'){
                try {
                    console.log(JSON.stringify(message))
                }catch(e){}
            }

            try {
                if (message.split(' ')[0] === 'Missed') {
                    $scope.IncomingCallStatement = message;

                    $scope.amInCall = false;
                    $scope.amInCallWith = '';

                    $scope.ringing = false;
                    $timeout($scope.onTimeoutOfMissedCall, 6000);
                    Sound.load();
                    Sound.pause();

                    Signalling.destroy();
                  $log.info("call missed: ' "+message+" ' ");
                }
            } catch (e) {
            }

            if (message === 'got user media') {
                if (!WebRTC.getInitiator() && !WebRTC.getIsStarted()) {
                    $scope.receiveCalling();
                }
            }
            else if (message === 'Accept Call') {

                WebRTC.setInitiator(true);

                $scope.otherSideRinging = false;
                $scope.areYouCallingSomeone = false;
              console.log("Accepting call")
              $log.info("Accepting call")

                getMedia();

            }
            else if (message === 'Reject Call') {
                $timeout($scope.onTimeoutForPersonOfflineOrBusy, 6000);
                $scope.OutgoingCallStatement = $scope.amInCallWith + ' is Busy...';
                $scope.otherSideRinging = false;
                $scope.amInCall = false;
                $scope.amInCallWith = '';


                Signalling.destroy();
              console.log("Rejecting call")
              $log.info("Rejecting call")
            }
            else if (message === 'sharing video'){
              WebRTC.setSharingVideo(true);
              peerSharedVideo = true;
              console.log("Sharing Video")
              $log.info("Sharing Video")
            }
            else if (message === 'hiding video'){
              WebRTC.setHidingVideo(true);
              peerSharedVideo = false;
              console.log("Hidding Video")
              $log.info("Hidding Video")
            }
            else if (message === 'bye') {

                WebRTC.endConnection();
              console.log("received msg to end connection /call")
              $log.info("received msg to end connection /call")
                $scope.screenSharedLocal = false;
                $scope.screenSharedByPeer = false;
                $scope.firstVideoAdded = false;
                $scope.localCameraOn = false;
                $scope.userMessages = [];
                $scope.callEnded = true;
                $scope.amInCall = false;
                $scope.amInCallWith = '';
            }
            else if (message === 'hangup') {

                WebRTC.endConnection();
              console.log("received msg to end/hangup connection /call")
              $log.info("received msg to end/hangup connection /call")
                $scope.firstVideoAdded = false;
                $scope.screenSharedLocal = false;
                $scope.screenSharedByPeer = false;

                $scope.localCameraOn = false;

                var endTime = new Date();

                $scope.callData.EndTime = endTime.toUTCString();

                $scope.recordCallData();
              console.log("call data recorded")
              $log.info("call data recorded")

                $scope.userMessages = [];

                $scope.callEnded = true;

                $scope.amInCall = false;

                $scope.amInCallWith = '';

            }
            else if(message.type == '__set_session_key') {
                Signalling.setSessionKey(message.sessionKey);
            }
            else if (message.type === 'offer') {
                if (WebRTC.getInitiator() && !WebRTC.getIsStarted()) {
                    maybeStart();
                }
                WebRTC.setRemoteDescription(message);
                WebRTC.createAndSendAnswer();
            } else if (message.type === 'answer' && WebRTC.getIsStarted()) {
                WebRTC.setRemoteDescription(message);
            } else if (message.type === 'candidate' && WebRTC.getIsStarted()) {
                WebRTC.addIceCandidate(message);
            }
        });

        function maybeStart() {
            if (!WebRTC.getIsStarted() && typeof WebRTC.getLocalAudioStream() != 'undefined') {

                WebRTC.createPeerConnection();

                WebRTC.setIsStarted(true);

                if (!WebRTC.getInitiator()) {
                    WebRTC.createAndSendOffer();
                }
            }
        }

        ////////////////////////////////////////////////////////////////////////////////////////
        // Media Stream Logic                                                                 //
        ///////////////////////////////////////////////////////////////////////////////////////

        function getMedia () {
            WebRTC.captureUserMedia('audio', function (err) {

                if (err) {
                    $scope.addAlertCallStart('danger', 'Could not access your microphone or webcam.');
                    console.log("Could not access your microphone or webcam")
                    $log.info("Could not access your microphone or webcam")
                    $scope.ringing = false;
                    $scope.amInCall = false;
                    $scope.amInCallWith = '';

                    WebRTC.endConnection();
                  console.log("Connection ended")
                  $log.info("Connection ended")

                } else {

                    localAudioCaptured = true;

                    WebRTC.captureUserMedia('video', function (err) {

                        if (err) {
                            $scope.addAlertCallStart('danger', 'Could not access your microphone or webcam.');
                          console.log("Could not access your microphone or webcam")
                          $log.info("Could not access your microphone or webcam")

                            $scope.ringing = false;
                            $scope.amInCall = false;
                            $scope.amInCallWith = '';

                            WebRTC.endConnection();
                          console.log("Connection ended")
                          $log.info("Connection ended")
                        }
                        else {

                            localVideoCaptured = true;

                            $scope.localCameraOn = true;

                            Signalling.sendMessage('got user media');
                          console.log("Accessed your microphone or webcam")
                          $log.info("Accessed your microphone or webcam")

                            if (!WebRTC.getInitiator()) {

                                maybeStart();
                              console.log("Can start a call ")
                              $log.info("Can start a call ")

                            }
                        }

                    })

                }

            });
        }

        $scope.StopOutgoingCall = function () {
            Signalling.sendMessage('Missed Call: ' + $scope.user.username);
            $scope.areYouCallingSomeone = false;
            $scope.otherSideRinging = false;
            $scope.amInCall = false;
            $scope.amInCallWith = '';
            $scope.OutgoingCallStatement = 'Calling stopped';
          console.log("Calling stopped")
          $log.info("Calling stopped")

        };

        $scope.receiveCalling = function () {

            getMedia();

            $scope.callData.Caller = $scope.IncomingCallStatement.split(': ')[1];
            $scope.callData.Callee = $scope.user.username;
            var startTime = new Date();

            $scope.callData.StartTime = startTime.toUTCString();
          console.log("received call data")
          $log.info("received call data")
        };

        $scope.AcceptCall = function () {
            Signalling.sendMessage('Accept Call');
            $scope.isSomeOneCalling = false;
            Sound.load();
            Sound.pause();
            $scope.ringing = false;
          console.log("Accepting call")
          $log.info("Accepting call")
        };

        $scope.RejectCall = function () {
            Signalling.sendMessage('Reject Call');
            $scope.isSomeOneCalling = false;
            Sound.load();
            Sound.pause();
            $scope.ringing = false;
            $scope.amInCall = false;
            $scope.amInCallWith = '';
          console.log("Rejecting call")
          $log.info("Rejecting call")
        };


        ////////////////////////////////////////////////////////////////////////////////////////
        // IM Chat Controller Code Used here (Will remove the IM Chat Controller)             //
        ////////////////////////////////////////////////////////////////////////////////////////


        $scope.messages = [];
        $scope.im = {};

        $scope.fetchChatNow = function () {
            if (typeof $scope.otherUser != 'undefined') {
                $http.post(RestApi.userchat.userChats, {user1: $scope.user.username, user2: $scope.otherUser.username})
                  .success(
                    function (data) {
                        if (data.status == 'success') {

                            for (i in data.msg) {
                                $scope.messages.push(data.msg[i]);

                            }

                            $scope.isUnderProgress = false;
                          console.log("Fetched chat")
                          $log.info("Fetched chat")

                        }
                    });

                for (var i in $scope.contactslist) {
                    if ($scope.contactslist[i].contactid.username == $scope.otherUser.username) {
                        $scope.contactslist[i].unreadMessage = false;
                        $http.post(RestApi.userchat.markMessageAsRead, {
                            user1: $scope.user._id,
                            user2: $scope.otherUser._id

                        }).success();
                      console.log("Marking chat as read");
                      $log.info("Marking chat as read");
                    }
                }

            }
        };

        $scope.sendIM = function () {

            if ($scope.im.msg != null) {
                if ($scope.im.msg != '') {

                    $scope.im.from = $scope.user.username;
                    $scope.im.to = $scope.otherUser.username;
                    $scope.im.from_id = $scope.user._id;
                    $scope.im.to_id = $scope.otherUser._id;
                    $scope.im.fromFullName = $scope.user.firstname + ' ' + $scope.user.lastname;

                    socket.emit('im', {room: 'globalchatroom', stanza: $scope.im});

                    $scope.messages.push($scope.im);

                    /*$http.post(RestApi.userchat.saveChats, $scope.im).success(function (data) {
                    });
                    */
                  console.log("Sending chat msgs");
                  $log.info("Sending chat msgs");

                    $scope.im = {};
                }
            }

        };

        socket.on('im', function (im) {

            if(typeof $scope.otherUser.username !== 'undefined')
            {
              if (im.to == $scope.user.username && im.from == $scope.otherUser.username) {
                $scope.messages.push(im);
                console.log("Sending chat msgs to "+ $scope.user.username);
                console.log("Sending chat From "+ $scope.otherUser.username);

                $log.info("Sending chat msgs to "+ $scope.user.username);
                $log.info("Sending chat From "+ $scope.otherUser.username);
              }
              else if (im.to == $scope.user.username && im.from != $scope.otherUser.username) {
                for (i in $scope.contactslist) {
                  if ($scope.contactslist[i].contactid.username == im.from) {
                    $scope.contactslist[i].unreadMessage = true;
                  }
                }
              }
            }
        });

        socket.on('statusUpdate', function (user) {

            if ($scope.otherUser.username == user.username)
                $scope.otherUser.status = user.status;
        });

        $scope.isUnderProgress = true;

        $scope.loadUnderProgress = function () {
            return $scope.isUnderProgress;
        };

        $scope.hasSharedDetails = function () {
            for (var i in $scope.contactslist) {
                if ($scope.contactslist[i].contactid.username == $scope.otherUser.username) {
                    return $scope.contactslist[i].detailsshared != 'No';

                }
            }
            return false;
        };


        ////////////////////////////////////////////////////////////////////////////////////////
        // Screen Sharing Logic                                                               //
        ///////////////////////////////////////////////////////////////////////////////////////

        $scope.showScreenText = 'Share Screen';

        $scope.showScreen = function () {

            if ($scope.showScreenText == 'Share Screen') {

              console.log("Inside share screen")

              if(!!navigator.webkitGetUserMedia){

                shareScreen(function (err, stream) {
                  if(err) {
                    $scope.addAlertCallStart('danger', err);
                    console.log("Error in sharing screen")
                  }
                  else {

                    WebRTC.addStreamForScreen(stream);

                    WebRTC.createAndSendOffer();

                    $scope.showScreenText = 'Hide Screen';
                    $scope.screenSharedLocal = true;
                    console.log("Screen shared")

                  }
                });

              }
              else if(!!navigator.mozGetUserMedia){
                getUserMedia({
                  video : {
                    mozMediaSource: 'window',
                    mediaSource: 'window'
                  }}, function(stream){

                  WebRTC.addStreamForScreen(stream);

                  WebRTC.createAndSendOffer();

                  $scope.showScreenText = 'Hide Screen';
                  $scope.screenSharedLocal = true;
                  console.log("Screen shared by Firefox")

                }, function(err){
                  alert(err)
                });
              }


            }
            else {
                WebRTC.hideScreen();
                WebRTC.createAndSendOffer();

                ScreenShare.setSourceIdValue(null);

                $scope.showScreenText = 'Share Screen';
                $scope.screenSharedLocal = false;
              console.log("Hide screen screen")
            }

        };

        function shareScreen(cb) {
            // this statement verifies chrome extension availability
            // if installed and available then it will invoke extension API
            // otherwise it will fallback to command-line based screen capturing API
            if (ScreenShare.getChromeMediaSource() == 'desktop' && !ScreenShare.getSourceIdValue()) {
                ScreenShare.getSourceId(function (error) {
                    // if exception occurred or access denied
                    if (error && error == 'PermissionDeniedError') {
                        alert('PermissionDeniedError: User denied to share content of his/her screen.');
                    }

                    // this statement sets gets 'sourceId" and sets "chromeMediaSourceId"
                    if (ScreenShare.getChromeMediaSource() == 'desktop') {
                        ScreenShare.setSourceIdInConstraints();
                    }

                    // now invoking native getUserMedia API
                    navigator.webkitGetUserMedia(ScreenShare.session(),
                        function (newStream) {

                            cb(null, newStream);

                        }, function (err) {
                            cb(err);
                        });

                });
            }

        }

        //////////////////////////////////////////////////////////////////////////////////////////
        // Talking to extension                                                                 //
        //////////////////////////////////////////////////////////////////////////////////////////

        ScreenShare.initialize();

        ScreenShare.isChromeExtensionAvailable(function (status){
            $scope.extensionAvailable = status;
          console.log("Check chhrome extension status : "+$scope.extensionAvailable)
        });

        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        // INSTALLATION OF EXTENSION                                                                                           //
        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        $scope.installExtension = function () {

          ScreenShare.installChromeExtension();
          console.log("installing chrome extension");
        };

    })

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // HOME CONTROLLER ENDS HERE
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    .controller('AddRequestsController', function ($scope) {
    })

    .controller('IndexController', function ($scope, $location, Auth, $http, socket, $interval, $timeout, RestApi) {

        $scope.isCollapsed = true;
        $scope.isLoggedIn = Auth.isLoggedIn;
        $scope.isAdmin = Auth.isAdmin;
        $scope.getCurrentUser = Auth.getCurrentUser;

        $scope.user = $scope.getCurrentUser() || {};

        $scope.logout = function () {

            if (Auth.isLoggedIn()) {
                //socket.emit('leave', {room: Auth.getCurrentUser().username, username: Auth.getCurrentUser().username});
                socket.emit('leaveChat', {room: 'globalchatroom', user: Auth.getCurrentUser()});
            }

            Auth.logout();

            $location.path('/login');
        };

        $scope.getlocation = function () {
            return $location.url();
        };

        $scope.isActive = function (route) {
            return route === $location.path();
        };

        // slider code

        // Set of Photos
        $scope.photos = [
            {src: '/images/sd1.png', desc: 'Image 01'},
            {src: '/images/sd2.png', desc: 'Image 02'},
            {src: '/images/sd3.png', desc: 'Image 03'},
            {src: '/images/sd4.png', desc: 'Image 04'},
            {src: '/images/sd5.png', desc: 'Image 05'},
            {src: '/images/sd6.png', desc: 'Image 06'}
        ];

        // initial image index
        $scope._Index = 0;

        // if a current image is the same as requested image
        $scope.isActiveImg = function (index) {
            return $scope._Index === index;
        };

        // show prev image
        $scope.showPrev = function () {
            $scope._Index = ($scope._Index > 0) ? --$scope._Index : $scope.photos.length - 1;
        };

        // show next image
        $scope.showNext = function () {
            $scope._Index = ($scope._Index < $scope.photos.length - 1) ? ++$scope._Index : 0;
        };

        // show a certain image
        $scope.showPhoto = function (index) {
            $scope._Index = index;
        };

        $interval($scope.showNext, 6000);

        $timeout(function(){
          Layout.init();
          Layout.initOWL();
        }, 1000);

        $scope.sendFeedback = function (contact) {

            $http.post(RestApi.feedback.feedbackByVisitor, contact)
                .success(function (data) {
                    if(data.status == 'success') {
                        $scope.addAlert(data.status, data.msg)
                    }
                    else{

                    }

                })

        };

        $scope.alerts = [];

        $scope.addAlert = function(newtype, newMsg) {
            //console.log('Error', newtype, newMsg)
            $scope.alerts.push({type: newtype, msg: newMsg});
        };

        $scope.closeAlert = function(index) {
            $scope.alerts.splice(index, 1);
        };

    })

    .controller('ContactsListController', function ($scope) {
    })

    .controller('NewsControllerSuperUser', function ($scope, Data) {
        $scope.data = Data;
    })

    .controller('NewsController', function ($scope, Data) {
        $scope.data = Data;
    });

