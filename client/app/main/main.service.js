/**
 * Created by sojharo on 9/1/2015.
 */
'use strict';


angular.module('cloudKiboApp')
  .factory('MainService', function ($rootScope, $q, socket, $log, logger, Auth, $timeout, Sound, $http, $location, RestApi) {

    ///////////////////////////////////////////////////////////////////////////////////////////
    // Joining and Leaving Room Logic
    //////////////////////////////////////////////////////////////////////////////////////////

    var connected = false;

    var meetingroom;
    var roomid;

    function createOrJoinRoom() {

      socket.emit('join global chatroom', {room: roomid, user: Auth.getCurrentUser()});
      console.log("Joining Chat Room, "+ roomid +" username : "+ Auth.getCurrentUser().username)
      $log.info("Joining Chat Room")
      logger.log("Joining Chat Room")
    }

    function LeaveRoom() {
      console.log('Leaving room', {room: roomid, username: Auth.getCurrentUser().username});
      $log.info('Leaving room', {room: roomid, username: Auth.getCurrentUser().username});
      logger.log('Leaving room', {room: roomid, username: Auth.getCurrentUser().username});

      socket.emit('leaveChat', {room: roomid, user: Auth.getCurrentUser()});
    }

    ///////////////////////////////////////////////////////////////////////////////////////////
    // End Joining and Leaving Room Logic
    //////////////////////////////////////////////////////////////////////////////////////////

    ///////////////////////////////////////////////////////////////////////////////////////////
    // Fetching Data by HTTP Requests
    //////////////////////////////////////////////////////////////////////////////////////////

    var contactslist;

    var addRequestslist = {};



    var otherUser = {};

    var fetchOtherUserData = function () {
      if ($location.url() != '/app' && $location.url() != '/conference') {
        $http.post(RestApi.user.searchByUsername, {searchusername: $location.url().split('/')[2]})
          .success(function (data) {
            otherUser = data;
            fetchChatNow();
          });
      }
    };



    var messages = [];

    var isChatLoadUnderProgress = false;

    function fetchChatNow() {
      if (typeof otherUser != 'undefined') {
        isChatLoadUnderProgress = true;
        $http.post(RestApi.userchat.userChats, {user1: Auth.getCurrentUser().username, user2: otherUser.username})
          .success(
          function (data) {
            if (data.status == 'success') {

              for (i in data.msg) {
                messages.push(data.msg[i]);

              }

              isChatLoadUnderProgress = false;
              console.log("Fetched chat")
              $log.info("Fetched chat")
              logger.log("Fetched chat")

            }
          });

        for (var i in contactslist) {
          if (contactslist[i].contactid.username == otherUser.username) {
            contactslist[i].unreadMessage = false;
            $http.post(RestApi.userchat.markMessageAsRead, {
              user1: Auth.getCurrentUser()._id,
              user2: otherUser._id

            }).success();
            console.log("Marking chat as read");
            $log.info("Marking chat as read");
            logger.log("Marking chat as read");
          }
        }

      }
    }

    ///////////////////////////////////////////////////////////////////////////////////////////
    // End Fetching Data by HTTP Requests
    //////////////////////////////////////////////////////////////////////////////////////////

    socket.on('friendrequest', function (data) {
      addRequestslist.push(data);
    });

    socket.on('online', function (friend) {
      for (var i in contactslist) {
        if (contactslist[i].contactid.username == friend.username) {
          contactslist[i].online = true;
          console.log("show online friends " + contactslist[i].online)
          logger.log("show online friends " + contactslist[i].online)
          $log.info("show online friends " + contactslist[i].online)
        }
      }
    });

    socket.on('offline', function (friend) {
      for (var i in contactslist) {
        if (contactslist[i].contactid.username == friend.username) {
          contactslist[i].online = false;
          $rootScope.$broadcast('offline', friend.username);
          console.log("show Offline friends " + contactslist[i].online)
          logger.log("show Offline friends " + contactslist[i].online)
          $log.info("show Offline friends " + contactslist[i].online)
        }
      }
    });

    socket.on('youareonline', function (friends) {
      console.log(friends)
      fetchOtherUserData();
      $http.get(RestApi.contacts.contactListOfUser).success(function (data) {
        contactslist = data;
        console.log("contact list data and chat fetched");
        $log.info("contact list data and chat fetched");
        logger.log("contact list data and chat fetched");
        for (var i in friends) {
          for (var j in contactslist) {
            if (contactslist[j].contactid.username == friends[i].username) {
              contactslist[j].online = true;
              console.log("show online to " + contactslist[j].online)
              $log.info("show online to " + contactslist[j].online)
              logger.log("show online to " + contactslist[j].online)
              break;
            }
          }
        }

        $http.get(RestApi.contacts.pendingAddRequest).success(function (data) {
          addRequestslist = data;
          console.log("pending requests shown " + addRequestslist);
          $log.info("pending requests shown " + addRequestslist);
          logger.log("pending requests shown " + addRequestslist);
        });

      }).error(function (err) {
        console.log('error ', err)
        logger.log('error ', err)
      });

    });

    socket.on('theseareonline', function (friends) {
      for (var i in friends) {
        for (var j in contactslist) {
          if (contactslist[j].contactid.username == friends[i].username) {
            contactslist[j].online = true;

            break;
          }
        }
      }
    });

    socket.on('im', function (im) {
      if (typeof otherUser.username !== 'undefined') {
        if (im.to == Auth.getCurrentUser().username && im.from == otherUser.username) {
          messages.push(im);
        }
        else if (im.to == Auth.getCurrentUser().username && im.from != otherUser.username) {
          for (var i in contactslist) {
            if (contactslist[i].contactid.username == im.from) {
              contactslist[i].unreadMessage = true;
            }
          }
        }
      }
    });

    socket.on('statusUpdate', function (user) {

      if (otherUser.username == user.username)
        otherUser.status = user.status;
      console.log('status updated')
      logger.log("status updated")
    });

    function addHandlers(socket) {


    }


    var api = {
      sendMessage: function (m, d) {
        socket.emit(m, d);
      },
      join: function(){
        meetingroom = 'm_' + Auth.getCurrentUser().username;

        roomid = 'globalchatroom';

        createOrJoinRoom();
        connected = true;
      },
      leave: function (){
        LeaveRoom();
      },
      getOtherUser : function(){
        return otherUser;
      },
      getContactsList : function(){
        return contactslist;
      },
      setContactsList : function(d){
        contactslist = d;
      },
      spliceContactList: function(index){
        contactslist.splice(index, 1);
      },
      emptyContactList: function(){
        contactslist = [];
      },
      getAddRequestslist : function(){
        return addRequestslist;
      },
      spliceAddRequestList: function(index){
        addRequestslist.splice(index, 1);
      },
      emptyAddRequestList: function(){
        addRequestslist = {};
      },
      getMessages: function(){
        return messages;
      },
      addMessage: function(im){
        messages.push(im)
      },
      fetchOtherUserData : function() {
        fetchOtherUserData();
      },
      isChatLoadUnderProgress : function(){
        return isChatLoadUnderProgress;
      }
    };
    EventEmitter.call(api);
    Object.setPrototypeOf(api, EventEmitter.prototype);

    addHandlers(socket);
    return api;
  });
