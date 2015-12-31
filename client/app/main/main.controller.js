'use strict';

angular.module('cloudKiboApp')

  .controller('MainController', function ($scope, $http, Auth, Upload, $timeout, $location, Sound, RestApi, logger, $log, Room, MainService) {

    $timeout(function () {

      $scope.getCurrentUser = Auth.getCurrentUser;
      $scope.token = Auth.getToken();

      $scope.user = $scope.getCurrentUser();

    }, 1000);

    $scope.isUserNameDefined = function () {
      return (typeof $scope.user.username !== 'undefined') && (typeof $scope.user.email !== 'undefined');
    };

    $scope.isMeetingPage = function () {
      return false;
    };

    $scope.showError = function () {
      return $scope.isError;
    };

    $scope.isError = false;

    $scope.saveNewUserName = function (tempUser) {

      tempUser._id = $scope.user._id;
      $http.post(RestApi.user.saveUserDetailForFedreatedAuthentication, tempUser)
        .success(function (data) {
          if (data.status == 'success') {
            $scope.user = data.msg;
            Auth.setUser(data.msg);
            $scope.isError = false;
          }
          else {

            $scope.errorMessage = data.msg;
            $scope.isError = true;

          }

        });
      logger.log("New user account saved");
      $log.info("New user account saved");
    };

    MainService.fetchOtherUserData();

    $scope.otherUser = MainService.getOtherUser();

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
      if ($scope.groupCallSelected == true)
        $scope.groupCallSelected = !$scope.groupCallSelected;

      $scope.userFound = '';

      $scope.meetingSelected = !$scope.meetingSelected;
      logger.log("Meeting is opened");
      $log.info("Meeting is opened");
    };

    $scope.isMeetingSelected = function () {
      return $scope.meetingSelected;
    };

    $scope.openGroupCall = function () {

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
      if ($scope.groupCallViewSelected == true)
        $scope.groupCallViewSelected = !$scope.groupCallViewSelected;

      $scope.userFound = '';

      $scope.groupCallSelected = !$scope.groupCallSelected;

    };

    $scope.isGroupCallSelected = function () {
      return $scope.groupCallSelected;
    };

    $scope.isAnyTabSelected = function () {
      return $scope.meetingSelected || $scope.inviteSelected || $scope.callSelected || $scope.addContactSelected || $scope.groupCallSelected || $scope.settingsSelected || $scope.groupCallViewSelected;
    };

    $scope.addContactToGroup = function (contact, group) {
      $http.post(RestApi.groupcall.addContact, {contactusername: contact.contactusername, group_id: group._id})
        .success(function (data) {
          if (data.status)
            alert(data.msg);
          else
            $scope.selectedGroupDetails = data;
        })
    }

    $scope.removeContactToGroup = function (group) {
      $http.post(RestApi.groupcall.removeContact, {
        contactusername: group.user_id.username,
        group_id: group.groupid._id
      })
        .success(function (data) {
          $scope.selectedGroupDetails = data;
        })
    }

    $scope.openGroupView = function (grp) {

      $scope.selectedGroup = grp;

      $http.get(RestApi.groupcall.getSpecificGroup + grp._id)
        .success(function (data) {
          $scope.selectedGroupDetails = data;
        });

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
      if ($scope.groupCallSelected == true)
        $scope.groupCallSelected = !$scope.groupCallSelected;

      $scope.groupCallViewSelected = !$scope.groupCallViewSelected;

    };

    $scope.closeGroupCallView = function () {
      if ($scope.groupCallSelected === false)
        $scope.groupCallSelected = !$scope.groupCallSelected;
      $scope.groupCallViewSelected = !$scope.groupCallViewSelected;
    }

    $scope.isOpenGroupViewSelected = function () {
      return $scope.groupCallViewSelected;
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
      if ($scope.groupCallSelected == true)
        $scope.groupCallSelected = !$scope.groupCallSelected;
      if ($scope.groupCallViewSelected == true)
        $scope.groupCallViewSelected = !$scope.groupCallViewSelected;

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
      if ($scope.groupCallSelected == true)
        $scope.groupCallSelected = !$scope.groupCallSelected;
      if ($scope.groupCallViewSelected == true)
        $scope.groupCallViewSelected = !$scope.groupCallViewSelected;
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
        if ($scope.groupCallViewSelected == true)
          $scope.groupCallViewSelected = !$scope.groupCallViewSelected;

        if (localStreamTest)
          localStreamTest.stop();
      }
      if ($scope.groupCallSelected == true)
        $scope.groupCallSelected = !$scope.groupCallSelected;


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
        if ($scope.groupCallViewSelected == true)
          $scope.groupCallViewSelected = !$scope.groupCallViewSelected;
        if (localStreamTest)
          localStreamTest.stop();

      }
      if ($scope.groupCallSelected == true)
        $scope.groupCallSelected = !$scope.groupCallSelected;
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
      inviteemail.recipientEmail = '';
      inviteemail.shortmessage = '';
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


    $scope.contactslist = MainService.getContactsList;

    $scope.addUserName = function (add) {
      console.log('add username contact')
      $http.post(RestApi.contacts.addContactByName, JSON.stringify(add))
        .success(function (data) {
          if (data.status == 'success') {
            if (data.msg != "null" && data.msg != null && data.msg != "") {
              $scope.userFound = data.msg;
              $scope.openAddContact();

              MainService.setContactsList(data.msg)

              MainService.sendMessage('friendrequest', {
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


    $scope.createGroup = function (add) {
      add.groupowner = $scope.user.username;
      $http.post(RestApi.groupcall.createGroup, JSON.stringify(add))
        .success(function (data) {
          if (data.status === 'failed')
            alert(data.msg);
          else
            $scope.allGroups = data;
        })
    };

    $scope.deleteGroup = function (add) {
      $http.delete(RestApi.groupcall.deleteGroup + add._id)
        .success(function (data) {
          console.log(data);
          $scope.allGroups = data;
        })
    };

    $scope.allGroups = [];
    $http.get(RestApi.groupcall.getGroups).success(function (data) {
      $scope.allGroups = data;
    });

    $scope.allOtherGroups = [];
    $http.get(RestApi.groupcall.getOtherGroups).success(function (data) {
      $scope.allOtherGroups = data;
    });

    $scope.connected = true;
    $scope.isConnected = function () {
      return $scope.connected;
    };
    Room.on('connection.status', function (data) {
      $scope.connected = data.status;
      if (!data.status) {
        $scope.peers = [];
        if ($scope.screenSharedLocal) removeLocalScreen();
        $scope.peerSharedScreen = false;
      }
    });

    $scope.addEmail = function (add) {
      $http.post(RestApi.contacts.addContactByEmail, JSON.stringify(add))
        .success(function (data) {
          if (data.status == 'success') {
            if (data.msg != null) {
              $scope.userFound = data.msg;
              $scope.openAddContact();

              MainService.setContactsList(data.msg)

              MainService.sendMessage('friendrequest', {
                room: 'globalchatroom',
                userid: $scope.user,
                contact: add.searchemail
              })

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
          $scope.user = data; // todo test with many services, sync data among all of them
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
      return $scope.contactslist()[index].unreadMessage;
    };

    $scope.isOnline = function (index) {
      return $scope.contactslist()[index].online;
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


    $scope.addRequestslist = MainService.getAddRequestslist;


    $scope.approveFriendRequest = function (index) {
      $http.post(RestApi.contacts.acceptContactRequest, $scope.addRequestslist()[index].userid)
        .success(function (data) {
          if (data.status == 'success') {
            MainService.setContactsList(data.msg)
            MainService.spliceAddRequestList(index)
            MainService.sendMessage('whozonline', {room: 'globalchatroom', user: $scope.user})
            console.log("Friend request accepted");
            $log.info("Friend request accepted");
            logger.log("Friend request accepted");
          }
          else {

            alert(data.msg);

          }
        });
    };

    $scope.rejectFriendRequest = function (index) {
      $http.post(RestApi.contacts.rejectContactRequest, $scope.addRequestslist[index].userid)
        .success(function (data) {
          if (data.status == 'success') {
            MainService.spliceAddRequestList(index)
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
    // Signaling Logic                                                                    //
    ///////////////////////////////////////////////////////////////////////////////////////



    $scope.setStatus = function () {

      if ($scope.user.status != null) {
        if ($scope.user.status.trim() != '') {

          MainService.sendMessage('status', {room: 'globalchatroom', user: $scope.user})
          console.log("Status set")
          $log.info("Status set")
          logger.log("Status set")
          $http.post(RestApi.user.statusMessage, $scope.user).success(function (data) {
          });
        }
      }

    };


    window.onbeforeunload = function (e) {
      MainService.LeaveRoom();
    };


    ////////////////////////////////////////////////////////////////////////////////////////
    // IM Chat Controller Code Used here (Will remove the IM Chat Controller)             //
    ////////////////////////////////////////////////////////////////////////////////////////

    $scope.messages = MainService.getMessages;


    $scope.im = {};

    $scope.sendIM = function () {

      if ($scope.im.msg != null) {
        if ($scope.im.msg != '') {

          $scope.im.from = $scope.user.username;
          $scope.im.to = $scope.otherUser.username;
          $scope.im.from_id = $scope.user._id;
          $scope.im.to_id = $scope.otherUser._id;
          $scope.im.fromFullName = $scope.user.firstname + ' ' + $scope.user.lastname;

          MainService.sendMessage('im', {room: 'globalchatroom', stanza: $scope.im});

          MainService.addMessage($scope.im);

          console.log("Sending chat msgs");
          logger.log("Sending chat msgs");
          $log.info("Sending chat msgs");

          $scope.im = {};
        }
      }

    };

    $scope.loadUnderProgress = function () {
      return MainService.isChatLoadUnderProgress();
    };

    $scope.hasSharedDetails = function () {
      for (var i in $scope.contactslist()) {
        if ($scope.contactslist()[i].contactid.username == $scope.otherUser.username) {
          return $scope.contactslist()[i].detailsshared != 'No';

        }
      }
      return false;
    };


  });

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // HOME CONTROLLER ENDS HERE
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



