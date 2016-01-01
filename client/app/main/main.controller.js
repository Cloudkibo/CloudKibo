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

    MainService.fetchOtherUserData();

    $scope.otherUser = MainService.getOtherUser();



    $scope.contactslist = MainService.getContactsList;




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



