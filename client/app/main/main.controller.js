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
            logger.log("Left gloal chat room");
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

    .controller('HomeController', function ($scope, $http, Auth, socket, $timeout, $location, Sound, RestApi, logger, $log) {

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
          logger.log("New user account saved");
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
                //testvideo.src = URL.createObjectURL(newStream);
                testvideo2.src = URL.createObjectURL(newStream);
                localStreamTest = newStream;
                $scope.deviceAccess = true;
              logger.log("testing video ");
              $log.info("testing video ");
            }, function (error) {

                $scope.deviceAccess = false;
                console.log(error);
              logger.log(error);

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
          logger.log("Meeting is opened");
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
          logger.log("invite selected");
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

          logger.log("Settings selected");
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
          logger.log("call selected");
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
          logger.log("Add contact selected");
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
          logger.log('Error', newtype, newMsg);
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
          inviteemail.recipientEmail= '';
          inviteemail.shortmessage= '';
          console.log("Email invite selected");
          $log.info("Email invite selected");
          logger.log("Email invite selected");
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
          logger.log("Search contact by email");
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
                          logger.log("contact added by username");

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
                            });

                          console.log("contact added by email");
                          $log.info("contact added by email");
                          logger.log("contact added by email");
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
                      logger.log("contact NOT found by email");
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
                logger.log(data)
                });
          console.log("contact profile updated");
          $log.info("contact profile updated");
          logger.log("contact profile updated");

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
          logger.log("contact list data and chat fetched");
        }).error(function (err) {
            console.log('error ', err)
          logger.log('error ', err)
        });

        $scope.addRequestslist = {};

        $http.get(RestApi.contacts.pendingAddRequest).success(function (data) {
            $scope.addRequestslist = data;
          console.log("pending requests shown "+ $scope.addRequestslist);
          $log.info("pending requests shown "+ $scope.addRequestslist);
          logger.log("pending requests shown "+ $scope.addRequestslist);
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
                      logger.log("Friend request accepted");
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
                      logger.log("Friend request rejected");
                    }
                });
        };

        $scope.removeFriend = function (index) {
            $http.post(RestApi.contacts.removeFromContactList, index)
                .success(function (data) {
                    //console.log(data);
                console.log("Friend removed")
                $log.info("Friend removed")
                logger.log("Friend removed")
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
                      logger.log("Chat history removed")
                    }
                });
        };

        $scope.ignoreFeedBack = function () {
            $scope.feedBackSent = true;
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
                logger.log("Call feedback sent")
                })
                .error(function (data) {
                    console.log('Error:', data)
                logger.log('Error:', data)
                $log.info('Error:', data)
                });
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
          logger.log("time out")
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
          logger.log("leave chatRoom to rejoin")

            // Rejoin the room... (temporary fix)

            socket.emit('join global chatroom', {room: roomid, user: $scope.user});
          console.log("Joining Chat Room")
          $log.info("Joining Chat Room")
          logger.log("Joining Chat Room")
        };

        $scope.LeaveRoom = function () {
            console.log('Leaving room', {room: roomid, username: $scope.user.username});
            $log.info('Leaving room', {room: roomid, username: $scope.user.username});
          logger.log('Leaving room', {room: roomid, username: $scope.user.username});

            socket.emit('leaveChat', {room: 'globalchatroom', user: $scope.user});
        };

        $scope.setStatus = function () {

            if ($scope.user.status != null) {
                if ($scope.user.status.trim() != '') {

                    socket.emit('status', {room: 'globalchatroom', user: $scope.user});
                  console.log("Status set")
                  $log.info("Status set")
                  logger.log("Status set")
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
                  logger.log("show online friends "+ $scope.contactslist[i].online)
                  $log.info("show online friends "+ $scope.contactslist[i].online)
                }
            }
        });

        socket.on('offline', function (friend) {
            for (i in $scope.contactslist) {
                if ($scope.contactslist[i].contactid.username == friend.username) {
                    $scope.contactslist[i].online = false;
                  console.log("show Offline friends "+ $scope.contactslist[i].online)
                  logger.log("show Offline friends "+ $scope.contactslist[i].online)
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
                      logger.log("show online to "+ $scope.contactslist[j].online)
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

        socket.on('disconnected', function (data) {

            Sound.load();
            Sound.pause();

            $scope.ringing = false;
            $scope.amInCall = false;
            $scope.amInCallWith = '';
        });

        window.onbeforeunload = function (e) {
            $scope.LeaveRoom();
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
                          logger.log("Fetched chat")

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
                      logger.log("Marking chat as read");
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
                  logger.log("Sending chat msgs");
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
                logger.log("Sending chat From "+ $scope.otherUser.username);

                $log.info("Sending chat msgs to "+ $scope.user.username);
                logger.log("Sending chat msgs to "+ $scope.user.username);
                $log.info("Sending chat From "+ $scope.otherUser.username);
                logger.log("Sending chat From "+ $scope.otherUser.username);
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
          logger.log("status updated")
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


    })

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // HOME CONTROLLER ENDS HERE
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    .controller('AddRequestsController', function ($scope, logger) {
    })

    .controller('IndexController', function ($scope, $location, Auth, $http, socket, $interval, $timeout, RestApi, $log, logger) {

        $scope.isCollapsed = true;
        $scope.isLoggedIn = Auth.isLoggedIn;
        $scope.isAdmin = Auth.isAdmin;
        $scope.getCurrentUser = Auth.getCurrentUser;

        $scope.user = $scope.getCurrentUser() || {};

        $scope.logout = function () {

            if (Auth.isLoggedIn()) {
                //socket.emit('leave', {room: Auth.getCurrentUser().username, username: Auth.getCurrentUser().username});
                socket.emit('leaveChat', {room: 'globalchatroom', user: Auth.getCurrentUser()});
              logger.log('leaveChat'+'room: globalchatroom'+"user: "+Auth.getCurrentUser());
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

