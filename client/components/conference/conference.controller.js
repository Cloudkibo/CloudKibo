/**
 * Created by sojharo on 8/1/2015.
 */
'use strict';


angular.module('cloudKiboApp')
  .controller('ConferenceController', function ($sce, Stream, $location, $routeParams, $scope, Room, $timeout, logger, ScreenShare, FileHangout, $log) {
    $('[data-toggle="tooltip"]').tooltip();
    myclockStart(); //callme to start clock animation
    if($location.search().role){
      logger.log('This is a Support Call');
      $scope.supportCall = true;
    }

    if (!window.RTCPeerConnection || !navigator.getUserMedia) {
      $scope.error = 'WebRTC is not supported by your browser. You can try the app with Chrome and Firefox.';
      logger.log('WebRTC is not supported by your browser. You can try the app with Chrome and Firefox.');
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
          logger.log('This is agent on support call page. Agent\'s name is '+ $scope.user.username +' and visitor\'s name is '+ $scope.supportCallData.to);
        }
        else{
          $scope.user.username = $location.search().visitorname;
          $scope.supportCallData.from = $scope.user.username;
          $scope.supportCallData.to = $location.search().agentname;
          logger.log('This is visitor on support call page. Visitor\'s name is '+ $scope.user.username +' and agent\'s name is '+ $scope.supportCallData.to);
        }
        $scope.supportCallData.visitoremail = $location.search().visitoremail;
        $scope.supportCallData.agentemail = $location.search().agentemail;
        $scope.supportCallData.companyid = $location.search().companyid;
        $scope.supportCallData.request_id = $location.search().request_id;
        logger.log('Company id for this support call is '+ $scope.supportCallData.companyid +' and request id is '+ $scope.supportCallData.request_id);
        $scope.connect();
        return ;
      }
      if ($scope.isUserNameDefined()) {
        logger.log("username is already defined as : ", $scope.user.username);
        $scope.connect();
      } else {
        var sampleName = "user " + Math.floor((Math.random() * 100) + 1);
        $scope.user.username =window.prompt("Please write your username", sampleName);
       

       if ($scope.user.username == null)
            console.log('username :'+$scope.user.username);
        logger.log('Username got resolved to '+ $scope.user.username)
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
      Stream.get()
        .then(function (s) {
          $scope.askingMedia = false;
          stream = s;
          if($scope.supportCall)
            Room.init(stream, $scope.user.username, $scope.supportCallData);
          else
            Room.init(stream, $scope.user.username, null);
          stream = URL.createObjectURL(stream);
          Room.joinRoom($routeParams.mname);
          logger.log('Accesss to audio and video is given to the application, username : '+ $scope.user.username)
        }, function (err) {
          console.error(err);
          $scope.askingMedia = false;
          $scope.isMediaDenied = true;
          logger.log("audio video stream access was denied: error "+err+", username : "+ $scope.user.username);
          $scope.error = 'No audio/video permissions. Please allow the audio/video capturing and refresh your browser.';
          if($scope.supportCall)
            Room.init(null, $scope.user.username, $scope.supportCallData);
          else
            Room.init(null, $scope.user.username, null);
          Room.joinRoom($routeParams.mname);
        });
    };

    $scope.screenSharerId;
    $scope.peers = [];
    Room.on('peer.stream', function (peer) {
      console.info(peer.stream)
      logger.log('Client connected, adding new stream, username : '+ $scope.user.username +' and peer name : '+ peer.username);
      // Inform the new joiner that you are sharing video
      if($scope.isLocalVideoShared()) Room.toggleVideo($scope.isLocalVideoShared());
      if($scope.screenSharedLocal) Room.toggleScreen(screenStream, true);
      $scope.peers.push({
        id: peer.id,
        username: (peer.stream !== null) ? peer.username : peer.username + ' (No Mic/Cam)',
        sharedVideo: false,
        divClass: 'hideVideoBox',
       
        stream: (peer.stream !== null) ? URL.createObjectURL(peer.stream) : ''
      });
    });
    Room.on('peer.screenStream', function (peer) {
      logger.log('Client shared screen, adding stream, username : '+ $scope.user.username +' and peer name : '+ peer.username);
      peerScreenStream = URL.createObjectURL(peer.stream);
    });
    Room.on('conference.stream', function (peer) {
      logger.log('got message of hiding / showing video or screen to username : '+ $scope.user.username +' and peer name : '+ peer.username);
      $scope.peers.forEach(function (p) {
        if(p.id === peer.id){
          if(peer.type === 'video'){
            $scope.$apply(function(){
              p.sharedVideo = peer.action;
            });
          }
          else if(peer.type === 'screen'){
            $scope.$apply(function(){
              $scope.screenSharerId = peer.id;
              $scope.peerSharedScreen = peer.action;
            });
          }
          else if(peer.type === 'screenAndroid'){
            $scope.$apply(function(){
              $scope.screenSharerId = peer.id;
              $scope.androidPeerSharedScreen = peer.action;
            });
          }
        }
      });
    });
    Room.on('peer.disconnected', function (peer) {
      console.log('i am called');
       aftermeetingstop(); /**** start clock animation in clock.js ***/
      logger.log('Client disconnected, removing stream from username : '+ $scope.user.username +' and peer name : '+ peer.username);
      $scope.peers = $scope.peers.filter(function (p) {
        return p.id !== peer.id;
      });
      if(peer.id === $scope.screenSharerId)
        $scope.peerSharedScreen = false;
    });

    $scope.getLocalVideo = function () {
      return $sce.trustAsResourceUrl(stream);
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
    $scope.showChatBox = function () {
      if($scope.meetingStarted()) {
     
        call_me_toclear(); //clear clock seconds interval in clock.js
        return $scope.chatBoxVisible;
      }
    };
    
       
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
          Room.sendChat(data, $scope.supportCallData);
          $scope.userMessages.push('Me: ' + data);
          $scope.dataChannelSend = '';
          logger.log("chat message sent by "+ $scope.user.username)
        }
      }
    };
    Room.on('conference.chat', function(data){
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
          $scope.userMessages.push(data.username +': '+ data.message);
          logger.log("chat messsage received by "+data.username);
        });
      }
    });

    $scope.toggleAudioText = 'Mute Audio';
    $scope.audioToggle = function () {
      
      if($scope.meetingStarted()) {
        if ($scope.toggleAudioText === 'Share Audio') {
          $scope.toggleAudioText = 'Mute Audio';
          logger.log("" + $scope.user.username + " has unmuted");
          Room.toggleAudio();
          $('#bck-audio').toggleClass('not-working');
          $('#bck-audio >a').attr('data-original-title', function(index, attr){
                  return attr == 'Mute Audio' ? 'UnMute Audio' : 'Mute Audio';
          }).tooltip('show');
        
        }
        else {
          logger.log("" + $scope.user.username + " has muted");
          $scope.toggleAudioText = 'Share Audio';
          Room.toggleAudio();
          $('#bck-audio').toggleClass('not-working');
          $('#bck-audio >a').attr('data-original-title', function(index, attr){
                  return attr == 'Mute Audio' ? 'UnMute Audio' : 'Mute Audio';
          }).tooltip('show');
        }
      }
    };
    $scope.toggleVideoText = 'Share Video';
    $scope.videoToggle = function () {
      if($scope.meetingStarted()) {
        if ($scope.toggleVideoText === 'Share Video') {
          $scope.toggleVideoText = 'Hide Video';
          logger.log("" + $scope.user.username + " has shared the video");
          Room.toggleVideo(true);
          $('#bck-camera').toggleClass('not-working');
          $('#bck-camera >a').attr('data-original-title', function(index, attr){
                  return attr == 'Show Video' ? 'Hide Video' : 'Show Video';
          }).tooltip('show');
        }
        else {
          $scope.toggleVideoText = 'Share Video';
          Room.toggleVideo(false);
          logger.log("" + $scope.user.username + " has hidden the video");
          $('#bck-camera').toggleClass('not-working');
           $('#bck-camera >a').attr('data-original-title', function(index, attr){
                  return attr == 'Show Video' ? 'Hide Video' : 'Show Video';
          }).tooltip('show');
        }
      }
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
                  console.log(err);
                  logger.log(err);
                  alert('Permission denied or could not capture the screen.');
                  logger.log('Chrome ERROR: Permission denied or could not capture the screen. Shown to: ' + $scope.user.username);
                }
                else {
                  screenStream = stream;
                  console.log(screenStream);
                  screenStream.getVideoTracks()[0].onended = function () {
                    logger.log('function called on event of stop screen sharing, username: '+ $scope.user.username +' : chrome extension');
                    removeLocalScreen();
                  };
                  $scope.$apply(function () {
                    $scope.showScreenText = 'Hide Screen';
                    $scope.screenSharedLocal = true;
                  });
                  Room.toggleScreen(stream, true);
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
                $scope.$apply(function () {
                  $scope.showScreenText = 'Hide Screen';
                  $scope.screenSharedLocal = true;
                });
                Room.toggleScreen(stream, true);
                logger.log("Screen captured by " + $scope.user.username + ", now informing other participants. (Firefox browser)");
              }, function (err) {
                $scope.fireFoxScreenDenied = true;
                //alert('Permission denied or could not capture the screen.');
                logger.log('Firefox ERROR: Permission denied or could not capture the screen. Shown to: ' + $scope.user.username);
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
      ScreenShare.setSourceIdValue(null);
      screenStream.getTracks()[0].stop();
      Room.toggleScreen(screenStream, false);
      $scope.showScreenText = 'Share Screen';
      $scope.screenSharedLocal = false;
      logger.log('Going to remove local screen shared from '+ $scope.user.username);
    }
    function shareScreenUsingChromeExtension(cb) {

      if($scope.hasChromeExtension()) {
        // this statement verifies chrome extension availability
        // if installed and available then it will invoke extension API
        // otherwise it will fallback to command-line based screen capturing API
        if (ScreenShare.getChromeMediaSource() == 'desktop' && !ScreenShare.getSourceIdValue()) {

          ScreenShare.getSourceId(function (error) {
            console.log(error)
            // if exception occurred or access denied
            if (error && error == 'PermissionDeniedError') {
              console.log('inside permission denied error in shareScreenUsingChromeExtension')
              ScreenShare.setSourceIdValue(undefined);
              ScreenShare.setChromeMediaSource();
              //alert('PermissionDeniedError: User denied to share content of his/her screen.');
              logger.log('PermissionDeniedError: User denied to share content of his/her screen. Shown to: ' + $scope.user.username);
            }
            console.log(error);
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

    var canvas = document.createElement('canvas');
    canvas.classList.add('incomingPhoto');
    screenAndroidImage.insertBefore(canvas, screenAndroidImage.firstChild);

    var imageData = '';
    FileHangout.accept_inbound_files();
    Room.on('dataChannel.message', function(data){
      console.log(data.data);
      console.log(data)
      if($scope.hasAndroidPeerSharedScreen()){
        console.log('Android shared screen is true')
        if (data.data.byteLength  || typeof data.data !== 'string') {
          imageData += data.data;

          var context = canvas.getContext('2d');
          var img = context.createImageData(300, 150);
          img.data.set(data.data);
          context.putImageData(img, 0, 0);
          screenViewer.src = img;
          //androidPeerScreenStream = imageData; // testing
          //screenViewer.src = androidPeerScreenStream;
          trace("Image chunk received");
          var notificationMessage ='You have received a file';


        } else {
          androidPeerScreenStream = imageData;
          screenViewer.src = androidPeerScreenStream;
          imageData = '';
          trace("Received all data. Setting image.");
        }
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
      FileHangout.dataChannelMessage(data.id, data.data);
    });
    $scope.divBoxClass = 'hideVideoBox';
    $scope.$on('Speaking', function () {
      $scope.$apply(function(){
        $scope.divBoxClass = 'hideVideoBoxSpeaking';
      });
      Room.sendDataChannelMessage('Speaking');
    });
    $scope.$on('Silent', function () {
      $scope.$apply(function(){
        $scope.divBoxClass = 'hideVideoBox';
      });
      Room.sendDataChannelMessage('Silent');
    });

    $scope.connected = true;
    $scope.isConnected = function () {
      return $scope.connected;
    };
    Room.on('connection.status', function(data){
      console.log('called after endMeeting');
      $scope.connected = data.status;
      if(!data.status){
        $scope.peers = [];
        if ($scope.screenSharedLocal) removeLocalScreen();
        $scope.peerSharedScreen = false;
      }
    });

    $scope.$on('$routeChangeStart', function () {
      location.reload();
    });

    
    
    /****** end meeting ***********/
     $scope.endMeeting = function () {
      $log.info("end meeting selected");
      logger.log("end meeting selected");
      logger.log("end meeting selected");
      $scope.userMessages = [];
      $scope.peers = [];
      $routeParams.mname = '';
      Room.sendChat($scope.user.username + ' has left', $scope.supportCallData);
      if($scope.screenSharedLocal)
        screenStream.getTracks()[0].stop();
      Stream.reset();
      Room.end();
      $location.path('/survey/'+$scope.user.username);
    };
  });
