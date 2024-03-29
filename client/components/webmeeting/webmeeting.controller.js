/**
 * Created by sojharo on 8/1/2015.
 */
'use strict';


angular.module('cloudKiboApp')
  .controller('WebMeetingController', function ($sce, MeetingStream, $location, $routeParams, $scope, MeetingRoom, MeetingRoomVideo, MeetingRoomScreen, MeetingRoomData, $timeout, logger, ScreenShare, MeetingRoomFileHangout) {
    //$('[data-toggle="tooltip"]').tooltip();
    myclockStart();
    $scope.isRoomLocked = false;//Room.getroomStatus({r : $routeParams.mname});//false;

    if($location.search().role){
      $scope.supportCall = true;
    }

    if (!window.RTCPeerConnection || !navigator.getUserMedia) {
      $scope.error = 'WebRTC is not supported by your browser. You can try the app with Chrome and Firefox.';
      logger.log($scope.error);
      return;
    }
    var screenViewer = document.getElementById('screenViewer');
    var screenAndroidImage = document.getElementById('screenAndroidImage');

    $scope.user = $scope.getCurrentUser();
    $scope.isUserNameDefined = function () {
      return (typeof $scope.user.username != 'undefined') && (typeof $scope.user.email != 'undefined');
    };
    $scope.getUsername = function(){
      return $scope.user.username;
    };

    $timeout(function(){
      if($scope.supportCall){
        $scope.supportCallData = {};
        $scope.supportCallData.role = $location.search().role;
        if($scope.supportCallData.role==='agent'){
          $scope.user.username = $location.search().agentname;
          $scope.supportCallData.from = $scope.user.username;
          $scope.supportCallData.to = $location.search().visitorname;
        }
        else{
          $scope.user.username = $location.search().visitorname;
          $scope.supportCallData.from = $scope.user.username;
          $scope.supportCallData.to = $location.search().agentname;
        }
        $scope.supportCallData.visitoremail = $location.search().visitoremail;
        $scope.supportCallData.agentemail = $location.search().agentemail;
        $scope.supportCallData.companyid = $location.search().companyid;
        $scope.supportCallData.request_id = $location.search().request_id;
        $scope.connect();
        return ;
      }
      if ($scope.isUserNameDefined()) {
        logger.log("username is already defined as : ", sampleName);
        $scope.connect();
      } else {
        var sampleName = "user " + Math.floor((Math.random() * 100) + 1);;
        $scope.user.username = window.prompt("Please write your username", sampleName);
        if ($scope.user.username == null)
          $scope.user.username = sampleName;
        $scope.connect();
      }
    }, 1000);

    $scope.isMediaDenied = false;
    $scope.hasUserDeniedMedia = function(){
      return $scope.isMediaDenied;
    };

    $scope.askingMedia = false;
    $scope.isAskingForMediaAccess = function(){
      return $scope.askingMedia;
    };

    var stream;

    $scope.connect = function(){
      logger.log($scope.user.username +' joins the meeting with room name '+ $routeParams.mname);
      $scope.askingMedia = true;
      MeetingStream.getAudio()
        .then(function (s) {
          $scope.askingMedia = false;
          stream = s;
          if($scope.supportCall)
            MeetingRoom.init(stream, $scope.user.username, $scope.supportCallData);
          else
            MeetingRoom.init(stream, $scope.user.username, null);
          //stream = URL.createObjectURL(stream);
          MeetingRoom.joinRoom($routeParams.mname);
          logger.log('Accesss to audio is given to the application, username : '+ $scope.user.username)
        }, function (err) {
          $scope.askingMedia = false;
          $scope.isMediaDenied = true;
          logger.log("audio stream access was denied: error "+err+", username : "+ $scope.user.username);
          $scope.error = 'No audio permissions. Please allow the audio device capturing and refresh your browser.';
          if($scope.supportCall)
            MeetingRoom.init(null, $scope.user.username, $scope.supportCallData);
          else
            MeetingRoom.init(null, $scope.user.username, null);
          MeetingRoom.joinRoom($routeParams.mname);
        });
    };

    $scope.screenSharerId;
    $scope.peers = [];
    MeetingRoom.on('connection.joined', function(d){
      $scope.isRoomLocked = d.roomStatus;
      MeetingRoomVideo.init(d);
      MeetingRoomData.init(d);
      MeetingRoomScreen.init(d);
      logger.log('Initialized MeetingRoomVideo, MeetingRoomData, and MeetingRoomScreen Angularjs services');
    })
    MeetingRoom.on('peer.stream', function (peer) {
      logger.log('Client connected, adding new stream, username : '+ $scope.user.username +' and peer name : '+ peer.username);
      call_me_toclear(); //clear clock
      // Inform the new joiner that you are sharing video
      if($scope.isLocalVideoShared()) MeetingRoomVideo.toggleVideo($scope.isLocalVideoShared(), vidStream);
      if($scope.screenSharedLocal) MeetingRoomScreen.toggleScreen(screenStream, $scope.screenSharedLocal);
      $scope.peers.push({
        id: peer.id,
        username: (peer.stream !== null) ? peer.username : peer.username + ' (No Mic/Cam)',
        sharedVideo: false,
        divClass: 'hideVideoBox',
        audioStream: (peer.stream !== null) ? URL.createObjectURL(peer.stream) : ''
        //stream: (peer.stream !== null) ? URL.createObjectURL(peer.stream) : ''
      });
    });
    MeetingRoomScreen.on('peer.screenStream', function (peer) {
      logger.log('Client shared screen, adding stream, username : '+ $scope.user.username +' and peer name : '+ peer.username);
      peerScreenStream = URL.createObjectURL(peer.stream);
    });
    MeetingRoomVideo.on('peer.streamVideo', function (peer) {
      logger.log('Client shared video, adding stream, username : '+ $scope.user.username +' and peer name : '+ peer.username);
      $scope.peers.forEach(function (p) {
        if(p.id === peer.id){
          $scope.$apply(function(){
            logger.log('attaching stream now to player of the peer')
            p.stream = URL.createObjectURL(peer.stream);
          });
        }
      });
    });
    MeetingRoomVideo.on('conference.streamVideo', function (peer) {
      logger.log('hiding / showing video, username : '+ $scope.user.username +' and peer name : '+ peer.username);
      $scope.peers.forEach(function (p) {
        if(p.id === peer.id){
          if(peer.type === 'video'){
            $scope.$apply(function(){
              p.sharedVideo = peer.action;
            });
          }
        }
      });
    });
    MeetingRoomScreen.on('conference.streamScreen', function (peer) {
      logger.log('hiding / showing screen, username : '+ $scope.user.username +' and peer name : '+ peer.username);
      if(peer.type === 'screen'){
        $scope.$apply(function(){
          $scope.screenSharerId = peer.id;
          $scope.peerSharedScreen = peer.action;
        });
      }
      else if(peer.type === 'screenAndroid'){
        logger.log('hiding / showing screen from android or iOS to web, username : '+ $scope.user.username +' and peer name : '+ peer.username);
        $scope.$apply(function(){
          $scope.screenSharerId = peer.id;
          $scope.androidPeerSharedScreen = peer.action;
        });
      }
    });
    MeetingRoom.on('peer.disconnected', function (peer) {


     if($scope.peers.length == 0) {
       console.log('starting clock ');
       aftermeetingstop(); //  start clock animation in clock.js ***/
     }
      logger.log('Client disconnected, removing stream in controller code, username : '+ $scope.user.username);
      $scope.peers = $scope.peers.filter(function (p) {
        return p.id !== peer.id;
      });
      if(peer.id === $scope.screenSharerId)
        $scope.peerSharedScreen = false;
    });

    $scope.getLocalVideo = function () {
      return $sce.trustAsResourceUrl(videostream);
    };
    $scope.isLocalVideoShared = function () {
      return ($scope.toggleVideoText === 'Hide Video');
    };
    $scope.meetingStarted = function(){
      return ($scope.peers.length > 0)
    };

    $scope.fireFoxScreenDenied = false;
    $scope.isFireFoxScreenShareDenied = function(){
      return $scope.fireFoxScreenDenied;
    };
    $scope.extensionAvailable = false;
    $scope.hasChromeExtension = function () {
      return $scope.extensionAvailable;
    };
    $scope.isFireFox = function () {
      return typeof navigator.mozGetUserMedia !== 'undefined';
    };
    $scope.isMeetingPage = function () {
      return true;
    };

    $scope.chatBoxVisible = true;
    $scope.filesVisible = MeetingRoomFileHangout.showfilesContainer();

    $scope.showChatBox = function () {
      if($scope.meetingStarted()) {
        //call_me_toclear(); // TODO needs to be discussed with zarmeen // clear clock seconds interval in clock.js
        return $scope.chatBoxVisible;
      }
    };
    $scope.showfilesBox = function () {
      if($scope.meetingStarted()) {
        var c = document.getElementById('filelist_container').childNodes.length;
        if(c < 1)
          $scope.filesVisible = false;
        else
          $scope.filesVisible = MeetingRoomFileHangout.showfilesContainer();
        //call_me_toclear(); //clear clock seconds interval in clock.js
        return $scope.filesVisible;
      }
    };
    $scope.showfilesButton = function(){
      if($scope.meetingStarted()) {
        var c = document.getElementById('filelist_container').childNodes.length;
        if(c < 1)
          return false;
        else
          return true;
      }
    }

    $scope.toggleChatBoxVisibility = function () {
      if($scope.chatBoxVisible)
      {
        $scope.widthScreen = '120%';
        $scope.heightScreen = '100%';
      } else{
        $scope.widthScreen = '100%';
        $scope.heightScreen = '100%';
      }
      $scope.chatBoxVisible = !$scope.chatBoxVisible;
    };
    $scope.userMessages = [];
    $scope.sendData = function () {

      if ($scope.dataChannelSend != null) {
        if ($scope.dataChannelSend != '') {
          var data = $scope.dataChannelSend;
          if($scope.supportCallData)
            $scope.supportCallData.msg = data;
          else
            $scope.supportCallData = {};
          MeetingRoom.sendChat(data, $scope.supportCallData);
          $scope.userMessages.push({uname :$scope.user.username,msg:data,msgtime:new Date(),chatcolor:'#427FCA'});
          $scope.dataChannelSend = '';
          logger.log("chat message sent by "+ $scope.user.username)
        }
      }

    };
    MeetingRoom.on('conference.chat', function(data){
      if(data.username !== $scope.user.username) {
        $scope.chatBoxVisible = true;
        if($scope.chatBoxVisible)
        {
          $scope.widthScreen = '100%';
          $scope.heightScreen = '100%';
        } else{
          $scope.widthScreen = '100%';
          $scope.heightScreen = '100%';
        }

        $scope.$apply(function () {
          $scope.userMessages.push({uname : data.username,msg:data.message,msgtime:new Date(),chatcolor :'#E02222'});
          logger.log("chat messsage received by "+ $scope.user.username +" sent from "+data.username);
        });
      }
    });

    $scope.toggleAudioText = 'Mute Audio';
    $scope.audioToggle = function () {
    //  if($scope.meetingStarted()) {

        if ($scope.toggleAudioText === 'Share Audio') {
          $scope.toggleAudioText = 'Mute Audio';
          logger.log("" + $scope.user.username + " has unmuted");

          MeetingRoom.toggleAudio();
          $('#bck-audio').toggleClass('not-working');

        }
        else {
          logger.log("" + $scope.user.username + " has muted");
          $scope.toggleAudioText = 'Share Audio';
          MeetingRoom.toggleAudio();
          $('#bck-audio').toggleClass('not-working');

        }
     // }
    };
    var videostream;
    var vidStream;
    $scope.toggleVideoText = 'Share Video';
    $scope.videoToggle = function () {
     // if($scope.meetingStarted()) { // todo try commenting this out.. as user might test cam while waiting for conference to start
        if ($scope.toggleVideoText === 'Share Video') {
          logger.log("" + $scope.user.username + " has tried to share the video");
          MeetingStream.getVideo()
            .then(function (s) {
              videostream = s;
              vidStream = s;
              videostream = URL.createObjectURL(s);
              $scope.toggleVideoText = 'Hide Video';
              MeetingRoomVideo.toggleVideo(true, vidStream);
              logger.log('Accesss to video is given to the application, username : '+ $scope.user.username)
            }, function (err) {
              console.error(err);
              $scope.askingMedia = false;
              //$scope.isMediaDenied = true;
              $scope.toggleVideoText = 'Share Video';
              logger.log("video stream access was denied: error "+err+", username : "+ $scope.user.username);
              $scope.error = 'No video permissions. Please allow the video capturing and refresh your browser.';
            });

          $('#bck-camera').toggleClass('not-working');

        }
        else {
          $scope.toggleVideoText = 'Share Video';
          MeetingRoomVideo.toggleVideo(false, vidStream);
          MeetingStream.resetVideo();
          logger.log("" + $scope.user.username + " has hidden the video");
          $('#bck-camera').toggleClass('not-working');
             }
     // }
    };

    ScreenShare.initialize();
    var screenStream;
    var peerScreenStream;
    var androidPeerScreenStream;
    $scope.widthScreen = '100%';
    $scope.heightScreen = '100%';
    $scope.peerSharedScreen = false;
    $scope.hasPeerSharedScreen = function () {
      return $scope.peerSharedScreen;
    };
    $scope.androidPeerSharedScreen = false;
    $scope.hasAndroidPeerSharedScreen = function () {
      return $scope.androidPeerSharedScreen;
    };
    $scope.isLocalScreenShared = function () {
      return $scope.screenSharedLocal;
    };
    $scope.getPeerScreen = function () {
      return $sce.trustAsResourceUrl(peerScreenStream);
    };
    $scope.getAndroidPeerScreen = function () {
      return $sce.trustAsResourceUrl(androidPeerScreenStream);
    };

    $scope.installExtension = function () {
      ScreenShare.installChromeExtension();
    };

    ScreenShare.on('extensioninstalled',function(data){
      logger.log('chrome screen sharing extension installed successfully for '+ $scope.user.username)
      $timeout(function(){
        ScreenShare.setScreenConstraintsForFirstTimeInstall();
        $scope.extensionAvailable = true;
        $scope.showScreen();
        //location.reload();
      }, 2000);

    })



    ScreenShare.isChromeExtensionAvailable(function (status) {
      $scope.extensionAvailable = status;
    });
    $scope.showScreenText = 'Share Screen';
    $scope.showScreen = function () {
      if($scope.meetingStarted()) {

        if ($scope.peerSharedScreen) {
          alert('Other person is already sharing screen');
          logger.log('' + $scope.user.username + ' tried sharing screen while other was already sharing the screen');
        } else {
          if ($scope.showScreenText === 'Share Screen') {
            if (!!navigator.webkitGetUserMedia) {
              shareScreenUsingChromeExtension(function (err, stream) {
                if (err) {
                  alert('Permission denied or could not capture the screen.');
                  logger.log('ERROR: Permission denied or could not capture the screen on chrome. Shown to: ' + $scope.user.username);
                }
                else {
                  screenStream = stream;
                  console.log(screenStream);
                  screenStream.getVideoTracks()[0].onended = function () {
                    logger.log('Screen stream stopped in chrome, function called on event of stop screen sharing, username '+ $scope.user.username);
                    removeLocalScreen();
                  };
                  $scope.$apply(function () {
                    $scope.showScreenText = 'Hide Screen';
                    $scope.screenSharedLocal = true;
                  });
                  MeetingRoomScreen.toggleScreen(stream, true);
                  logger.log("Screen captured by " + $scope.user.username + ", now informing other participants. (Chrome browser)");
                }
              });
            }
            else if (!!navigator.mozGetUserMedia) {
              getUserMedia({
                video: {
                  mozMediaSource: 'screen',
                  mediaSource: 'screen'
                }
              }, function (stream) {
                screenStream = stream;
                screenStream.getVideoTracks()[0].onended = function () {
                  logger.log('Screen stream stopped in firefox, function called on event of stop screen sharing, username '+ $scope.user.username);
                  removeLocalScreen();
                };
                $scope.$apply(function () {
                  $scope.showScreenText = 'Hide Screen';
                  $scope.screenSharedLocal = true;
                });
                MeetingRoomScreen.toggleScreen(stream, true);
                logger.log("Screen captured by " + $scope.user.username + ", now informing other participants. (Firefox browser)");
              }, function (err) {
                console.log(err);
                $scope.fireFoxScreenDenied = true;
                //alert('Permission denied or could not capture the screen.');
                logger.log('ERROR: Permission denied or could not capture the screen on firefox. Shown to: ' + $scope.user.username);
              });
            }
          }
          else {
            removeLocalScreen();
          }
        }
      }
    };
    function removeLocalScreen(){
      if($scope.screenSharedLocal) {
        ScreenShare.setSourceIdValue(null);
        screenStream.getTracks()[0].stop();
        MeetingRoomScreen.toggleScreen(screenStream, false);
        $scope.showScreenText = 'Share Screen';
        $scope.screenSharedLocal = false;
        //logger.log('ERROR: Permission denied or could not capture the screen. Shown to: ' + $scope.user.username);
      }
    }
    function shareScreenUsingChromeExtension(cb) {

      if($scope.hasChromeExtension()) {
        // this statement verifies chrome extension availability
        // if installed and available then it will invoke extension API
        // otherwise it will fallback to command-line based screen capturing API
        if (ScreenShare.getChromeMediaSource() == 'desktop' && !ScreenShare.getSourceIdValue()) {

          ScreenShare.getSourceId(function (error) {
            // if exception occurred or access denied
            if (error && error == 'PermissionDeniedError') {
              ScreenShare.setSourceIdValue(undefined);
              ScreenShare.setChromeMediaSource();
              //alert('PermissionDeniedError: User denied to share content of his/her screen.');
              logger.log('PermissionDeniedError: User denied to share content of his/her screen. Shown to: ' + $scope.user.username);
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
      } else {
        $scope.installExtension();
      }
    }

    // todo see if they should be removed
    var canvas = document.createElement('canvas');
    canvas.classList.add('incomingPhoto');
    screenAndroidImage.insertBefore(canvas, screenAndroidImage.firstChild);

    var photo = document.createElement('canvas');
    screenAndroidImage.insertBefore(photo, screenAndroidImage.firstChild);

    var imageData = '';
    /*var buf, count;
     function renderPhoto(data) {
     console.log('full image received')
     console.log(data)
     var canvas = photo.getContext('2d');
     var img = canvas.createImageData(320, 568);
     img.data.set(data);
     canvas.putImageData(img, 0, 0);
     }*/
    var buf;
    var chunks = []; var count;
    MeetingRoomFileHangout.accept_inbound_files();
    MeetingRoomData.on('dataChannel.message.new', function(data){
      if($scope.hasAndroidPeerSharedScreen()){

        if (typeof event.data === 'string') {
          buf = new Uint8ClampedArray(parseInt(data.data));
          count = 0;
          chunks = [];
          console.log('Expecting a total of ' + buf.byteLength + ' bytes');
          return;
        }
        var imgdata = new Uint8ClampedArray(data.data);
        console.log('image chunk')
        buf.set(imgdata, count);
        chunks[count] = data.data;
        count += imgdata.byteLength;
        if (count === buf.byteLength) {
          // we're done: all data chunks have been received
          //renderPhoto(buf);
          var builder = new Blob(chunks, buf.type);
          console.log('full image received');
          screenViewer.src = URL.createObjectURL(builder);
        }

        //if (data.data.byteLength  || typeof data.data !== 'string') {
        /*imageData += data.data;

         var context = canvas.getContext('2d');
         var img = context.createImageData(300, 150);
         img.data.set(data.data);
         context.putImageData(img, 0, 0);
         screenViewer.src = img;
         //androidPeerScreenStream = imageData; // testing
         //screenViewer.src = androidPeerScreenStream;
         trace("Image chunk received");
         var notificationMessage ='You have received a file';
         */

        //} else {
        /*androidPeerScreenStream = imageData;
         screenViewer.src = androidPeerScreenStream;
         imageData = '';
         trace("Received all data. Setting image.");*/
        //}
        return ;
      }
      //console.log(data);
      if (typeof data.data === 'string') {
        if (data.data === 'Speaking') {
          $scope.peers.forEach(function (p) {
            if(p.id === data.id){
              $scope.$apply(function(){
                p.divClass = 'hideVideoBoxSpeaking';
              });
            }
          });
        } else {
          $scope.peers.forEach(function (p) {
            if(p.id === data.id){
              $scope.$apply(function(){
                p.divClass = 'hideVideoBox';
              });
            }
          });
        }
      }
      MeetingRoomFileHangout.dataChannelMessage(data.id, data.data);
    });
    $scope.divBoxClass = 'hideVideoBox';
    $scope.$on('Speaking', function () {
      $scope.$apply(function(){
        $scope.divBoxClass = 'hideVideoBoxSpeaking';
      });
      MeetingRoomData.sendDataChannelMessage('Speaking');
    });
    $scope.$on('Silent', function () {
      $scope.$apply(function(){
        $scope.divBoxClass = 'hideVideoBox';
      });
      MeetingRoomData.sendDataChannelMessage('Silent');
    });

    $scope.connected = true;
    $scope.isConnected = function () {
      return $scope.connected;
    };
    MeetingRoom.on('connection.status', function(data){
      $scope.connected = data.status;
      if(!data.status){
        $scope.peers = [];
        if ($scope.screenSharedLocal) removeLocalScreen();
        $scope.peerSharedScreen = false;
      }
    });



    MeetingRoom.on('room.lock', function(data){
      console.log('locking/unlocking room');
      $scope.isRoomLocked = data.status;
      console.log('$scope.isRoomLocked = ' + $scope.isRoomLocked);
      if(data.status == true)
        alert('Room is now locked');
      else
        alert('Room is unlocked');

    });
    
     MeetingRoom.on('room.unlock.meetingend', function(data){
      console.log('unlocking room after meeting ends');
      $scope.isRoomLocked = data.status;
      console.log('$scope.isRoomLocked = ' + $scope.isRoomLocked);
      
    });
    MeetingRoom.on('knock.request', function(data){

      // data = JSON.parse(data);
      //$("#myModal").show();
      var conf = confirm( data.requestor + ' wants to join conference.Do you want to let him in?');
      //if person grants permission to requestor
      if (conf == true) {
        MeetingRoom.allowperson(data);
      }
    });
    $scope.getRoomStatus = function(){
      return $scope.isRoomLocked;
    }
    $scope.$on('$routeChangeStart', function () {
      location.reload();
    });

    $scope.lockMeeting = function(){
      if(!$scope.isRoomLocked) {
        console.log('locking meeting');
        MeetingRoom.lockRoom({status : true});
      }
      else
      {
        console.log('unlocking meeting');
        MeetingRoom.lockRoom({status :false});

      }
    }


    /****** end meeting ***********/
    $scope.endMeeting = function () {
      logger.log("end meeting selected by "+ $scope.user.username);
      $scope.userMessages = [];
      $scope.peers = [];
      $routeParams.mname = '';
      MeetingRoom.sendChat($scope.user.username + ' has left', $scope.supportCallData);
      if($scope.screenSharedLocal)
        screenStream.getTracks()[0].stop();
      //MeetingStream.reset();
      MeetingRoom.end();
      $location.path('/survey/'+$scope.user.username);
    };

  });
