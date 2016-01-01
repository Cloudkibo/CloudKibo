/**
 * Created by sojharo on 12/31/15.
 */

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
        socket.emit('leaveChat', {room: 'globalchatroom', username: Auth.getCurrentUser().username});

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

  .controller('UploadCtrl', ['$scope', 'Upload', '$timeout', function ($scope, Upload, $timeout) {
    $scope.upload = function (dataUrl) {
      Upload.upload({
        url: '/api/users/userimage/update',
        data: {
          file: Upload.dataUrltoBlob(dataUrl)
        }
      }).then(function (response) {
        $timeout(function () {
          $scope.result = response.data;
        });
      }, function (response) {
        if (response.status > 0) $scope.errorMsg = response.status
        + ': ' + response.data;
      }, function (evt) {
        $scope.progress = parseInt(100.0 * evt.loaded / evt.total);
      });
    }
  }])


  .controller('HomeController', ['$scope', '$timeout', 'Auth', '$http', 'RestApi', 'Room', '$location', function ($scope, $timeout, Auth, $http, RestApi, Room, $location) {
    $scope.$on('$routeChangeStart', function () {
      console.log('location going to change')
      var element = document.getElementById("theMainDOMForApp");
      if(element != null)
        element.parentNode.removeChild(element);

    });

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

    $scope.getlocation = function () {
      return $location.url();
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

    $scope.testingDefined = function () {

      //console.log($scope.user.initialTesting)

      //if((typeof $scope.user.initialTesting == 'undefined'))
      //	$scope.checkDeviceAccess();

      return false;//((typeof $scope.user.initialTesting == 'undefined'))
    };

    $scope.supportedBrowser = webrtcDetectedBrowser == "chrome";



  }])

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
        socket.emit('leaveChat', {room: 'globalchatroom', username: Auth.getCurrentUser().username});
        logger.log('leaveChat' + 'room: globalchatroom' + "user: " + Auth.getCurrentUser());
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

    $timeout(function () {
      Layout.init();
      Layout.initOWL();
    }, 1000);

    $scope.sendFeedback = function (contact) {

      $http.post(RestApi.feedback.feedbackByVisitor, contact)
        .success(function (data) {
          if (data.status == 'success') {
            $scope.addAlert(data.status, data.msg)
          }
          else {

          }

        })

    };

    $scope.alerts = [];

    $scope.addAlert = function (newtype, newMsg) {
      //console.log('Error', newtype, newMsg)
      $scope.alerts.push({type: newtype, msg: newMsg});
    };

    $scope.closeAlert = function (index) {
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
