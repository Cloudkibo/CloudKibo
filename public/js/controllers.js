function HomeController ($scope, $http, socket, pc_config, pc_constraints, sdpConstraints, $timeout){
	
	////////////////////////////////////////////////////////////////////////////////////////
	// General User Interface Logic                                                      //
	///////////////////////////////////////////////////////////////////////////////////////
	
	$scope.alerts = [];
	
	$scope.addAlert = function(newtype, newMsg) {
		console.log('Error', newtype, newMsg)
		$scope.alerts.push({type: newtype, msg: newMsg});
	};

	$scope.closeAlert = function(index) {
		$scope.alerts.splice(index, 1);
	};
	
	$scope.uniqueNamealerts = [];

	$scope.adduniqueNameAlert = function(newtype, newMsg) {
		console.log('Error', newtype, newMsg)
		$scope.uniqueNamealerts.push({type: newtype, msg: newMsg});
	};

	$scope.closeuniqueNameAlert = function(index) {
		$scope.uniqueNamealerts.splice(index, 1);
	};
	
	$scope.userNameDone = false;
	
	$scope.testingDefined = function(){
		
		return ((typeof $scope.user.initialTesting == 'undefined'))
	};
	
	$scope.sendUniqueUserName = function() {
		$http.post('/sendUniqueUserName', {uniqueusername: $scope.uniqueusername})
		.success(function(data) {
			console.log(data)
			if(data.status == 'success'){
				$scope.userNameDone = true;
				$scope.checkDeviceAccess();
			}
			else{
				$scope.adduniqueNameAlert(data.status, data.msg)
			}
		})
	}
	
	if(webrtcDetectedBrowser == "chrome")
	  $scope.supportedBrowser = true;
	else
	  $scope.supportedBrowser = false;
	  
	var localStreamTest = null;
	$scope.deviceAccess = true;
	  
	$scope.checkDeviceAccess = function () {
		  	
		 var video_constraints = {video: true, audio: true};
		 
		 getUserMedia(video_constraints, function (newStream){
				
			var testvideo = document.getElementById("testvideo");
			var testvideo2 = document.getElementById("testvideo2");
			testvideo.src = URL.createObjectURL(newStream);
			testvideo2.src = URL.createObjectURL(newStream);
			localStreamTest = newStream;
			$scope.deviceAccess = true;
			
		 }, function (error){
			 
			$scope.deviceAccess = false;
			console.log(error);
			
		 });
	}
	
	$scope.hasDeviceAccess = function (){
		return $scope.deviceAccess;
	}
	
	$scope.ReadyToGo = function(){
		
		localStreamTest.stop();
		
		$http.post('/initialTestingDone', {initialTesting: 'Yes'})
		.success(function(data) {
			console.log(data)
			if(data.status == 'success'){
				$scope.user = data.msg;
			}
		})
	}
	
	$scope.openMeeting = function(){
		
		if($scope.settingsSelected == true)
		{
			$scope.settingsSelected = !$scope.settingsSelected;
			if(localStreamTest)
				localStreamTest.stop();
		}
		if($scope.callSelected == true)
			$scope.callSelected = !$scope.callSelected;
		if($scope.inviteSelected == true)
			$scope.inviteSelected = !$scope.inviteSelected;
			
		$scope.meetingSelected = !$scope.meetingSelected;
	}
	
	$scope.isMeetingSelected = function () {
		return $scope.meetingSelected;
	};
	
	
	$scope.openInvite = function(){
		
		if($scope.settingsSelected == true)
		{
			$scope.settingsSelected = !$scope.settingsSelected;
			if(localStreamTest)
				localStreamTest.stop();
		}
		if($scope.callSelected == true)
			$scope.callSelected = !$scope.callSelected;
		if($scope.meetingSelected == true)
			$scope.meetingSelected = !$scope.meetingSelected;
			
		$scope.inviteSelected = !$scope.inviteSelected;
	}
	
	$scope.isInviteSelected = function () {
		return $scope.inviteSelected;
	};
	
	$scope.openSettings = function(){
		
		if($scope.inviteSelected == true)
			$scope.inviteSelected = !$scope.inviteSelected;
		if($scope.callSelected == true)
			$scope.callSelected = !$scope.callSelected;
		if($scope.meetingSelected == true)
			$scope.meetingSelected = !$scope.meetingSelected;
		
		$scope.settingsSelected = !$scope.settingsSelected;
		if(localStreamTest)
		   localStreamTest.stop();
	}
	
	$scope.isSettingsSelected = function () {
		return $scope.settingsSelected;
	};
	
	$scope.openCall = function(){
		
		if($scope.inviteSelected == true)
			$scope.inviteSelected = !$scope.inviteSelected;
		if($scope.meetingSelected == true)
			$scope.meetingSelected = !$scope.meetingSelected;
		if($scope.settingsSelected == true)
		{
			$scope.settingsSelected = !$scope.settingsSelected;
			if(localStreamTest)
				localStreamTest.stop();
		}
		
		$scope.callSelected = !$scope.callSelected;
		if(localStreamTest)
		   localStreamTest.stop();
	}
	
	$scope.isCallSelected = function () {
		return $scope.callSelected;
	};
	
	$scope.userNameSearchOption = true;
	
	$scope.isUserNameSearchSelected = function () {
		return $scope.userNameSearchOption;
	};
	
	$scope.switchSearchOption = function () {
		$scope.userNameSearchOption = !$scope.userNameSearchOption;
	};
	
	$scope.emailInvite = function() {
		$http.post('/emailInvite', JSON.stringify($scope.inviteemail))
		.success(function(data) {
			if(data.status == 'success'){
				$scope.addAlert(data.status, data.msg)
			}
		})
	}
	
	$scope.userFound = '';
	$scope.ILeftMyRoom = false;
	
	$scope.searchUserName = function() {
		$http.post('/searchUserName', JSON.stringify($scope.search))
		.success(function(data) {
			if(data.status == 'success'){
				if(data.msg != null){
					$scope.userFound = data.msg;
					$scope.openCall();
					$scope.LeaveRoom();
					$scope.ILeftMyRoom = true;
					roomid = $scope.userFound.username;
					$scope.createOrJoinRoom();
				}
				else{
					$scope.userFound = null;
				}
			}
		})
	}
	
	$scope.searchEmail = function() {
		$http.post('/searchEmail', JSON.stringify($scope.search))
		.success(function(data) {
			if(data.status == 'success'){
				if(data.msg != null){
					$scope.userFound = data.msg;
					$scope.openCall();
					$scope.LeaveRoom();
					$scope.ILeftMyRoom = true;
					roomid = $scope.userFound.username;
					$scope.createOrJoinRoom();
				}
				else{
					$scope.userFound = null;
				}
			}
		})
	}
	
	$scope.updateProfile = function() {
			
		$http.post('/updateProfile', JSON.stringify($scope.user))
			.success(function(data) {
				$scope.user = data;
				$scope.openSettings();
			})
			.error(function(data) {
				console.log(data)
			});
			
		};

		
	////////////////////////////////////////////////////////////////////////////////////////
	// Create or Join Room Logic                                                          //
	///////////////////////////////////////////////////////////////////////////////////////
	
	//if(window.location.pathname.replace('/', '') != 'home'){
	//  roomid = window.location.pathname.replace('/', '');
	//  roomid = roomid.split('/')[1];
	//}
	//else{
	//  roomid = $scope.user.username;
	//}
	
	////////////////////////////////////////////////////////////////////////////////////////
	// WebRTC User Interface Logic                                                        //
	///////////////////////////////////////////////////////////////////////////////////////
	
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
	
	$scope.connectTimeOut = function(){
		
		$scope.meetingroom = $scope.user.username + 'm';
		
		roomid = $scope.user.username;
		$scope.createOrJoinRoom();
		$scope.connected = true;
	}
	
	$timeout($scope.connectTimeOut, 1000);
	
	$scope.localCameraCaptured = function () {
		return $scope.localCameraOn;
	};
	
	$scope.alertsCallStart = [];
	
	$scope.addAlertCallStart = function(newtype, newMsg) {
		$scope.$apply(function(){
			$scope.alertsCallStart.push({type: newtype, msg: newMsg});
		})
	};

	$scope.closeAlertCallStart = function(index) {
		$scope.alertsCallStart.splice(index, 1);
	};
	
	$scope.feedBackSent = false;
	
	$scope.sentFeedback = function(){
		return $scope.feedBackSent;
	}
	
	$scope.feedBackForm = function(){
		$http.post('/feedBackOnCall', JSON.stringify($scope.feedback))
			.success(function(data) {
				$scope.feedBackSent = true;
			})
			.error(function(data) {
				console.log('Error:', data)
			});
	};
	
	$scope.isOtherPeerOffline = function(){
		return $scope.otherPeersOfflineStatus;
	}
	
	$scope.isOtherPeerBusy = false;
	
	$scope.isOtherPeerBusy = function(){
		return $scope.otherPeersBusyStatus;
	}
	
	$scope.screenSharedByPeer = false;
	
	$scope.hasOtherPartySharedScreen = function(){
		return $scope.screenSharedByPeer;
	}
	
	$scope.screenSharedLocal = false;
	
	$scope.isLocalScreenShared = function(){
		return $scope.screenSharedLocal;
	}
	
	$scope.endCall = function(){
			isStarted = false;
			isInitiator = false;
		    
 		    if(localStream)
 		    {
			  localStream.stop();
		    }
			if(localStreamScreen)
			{
			  localStreamScreen.stop();
		    }
		    if(remoteStream)
		    {
				remoteStream.stop();
				remotevideo.src = null;
			}
			if(remoteStreamScreen)
			{
				remoteStreamScreen.stop();
				remotevideoscreen.src = null;
			}
			
			$scope.firstVideoAdded = false;
			$scope.screenSharedLocal = false;
			$scope.screenSharedByPeer = false;
			  
			$scope.localCameraOn = false;
			
			
		    pc.close();
		    pc = null;
		    
		    sendMessage('hangup');
		    
		    var endTime = new Date();
		
		    $scope.callData.EndTime = endTime;
		    
		    $scope.recordCallData();
		    
		    if($scope.ILeftMyRoom == true)
		    {
				$scope.LeaveRoom();
				$scope.ILeftMyRoom = false;
				roomid = $scope.user.username;
				$scope.createOrJoinRoom();
			}
		    
		    $scope.callEnded = true;
	}
	
	$scope.IncomingCallStatement = '';
	$scope.isSomeOneCalling = false;
	
	$scope.isThereIncomingCall = function(){
		return $scope.isSomeOneCalling;
	}
	
	$scope.OutgoingCallStatement = '';
	$scope.areYouCallingSomeone = false;
	
	$scope.isThereOutgoingCall = function(){
		return $scope.areYouCallingSomeone;
	}
	
	$scope.isItRinging = function(){
		return $scope.ringing;
	}
	
	$scope.isOtherSideRinging = function(){
		return $scope.otherSideRinging;
	}
	
	$scope.onTimeout = function(){
		$scope.areYouCallingSomeone = false;
	}
	
	$scope.onTimeoutOfMissedCall = function(){
		$scope.isSomeOneCalling = false;
	}
	
	$scope.callData = {};
	
	$scope.recordCallData = function(){
		$http.post('/recordCallData', JSON.stringify($scope.callData))
	};

	////////////////////////////////////////////////////////////////////////////////////////
	// Signaling Logic                                                                    //
	///////////////////////////////////////////////////////////////////////////////////////
	
	 $scope.createOrJoinRoom = function(){
		console.log('Create or join room', {room: roomid, username: $scope.user.username});
		socket.emit('create or join', {room: roomid, username: $scope.user.username});
	 }
	 
	 $scope.LeaveRoom = function(){
		console.log('Leave room', {room: roomid, username: $scope.user.username});
		socket.emit('leave', {room: roomid, username: $scope.user.username});
	 }
	 	
	socket.on('created', function (room){
	    console.log('Created room ' + room);
	  
	    if(room.room != $scope.user.username)
	    {
			$scope.areYouCallingSomeone = true;
			$scope.OutgoingCallStatement = 'Now Calling... '; 
			$scope.otherSideRinging = true;
			$timeout($scope.onTimeout, 6000);
			$scope.OutgoingCallStatement = 'Callee seems offline or is busy.'; 
			$scope.otherSideRinging = false;
		}
		
		if($scope.ILeftMyRoom == true)
		{
			$scope.LeaveRoom();
			$scope.ILeftMyRoom = false;
			roomid = $scope.user.username;
			$scope.createOrJoinRoom();
		}
	  
	  //isInitiator = true;
	});

	socket.on('full', function (room){
	  
	    $scope.areYouCallingSomeone = true;
		$scope.OutgoingCallStatement = 'Now Calling... '; 
		$scope.otherSideRinging = true;
	    $timeout($scope.onTimeout, 6000);
		$scope.OutgoingCallStatement = 'Callee is Busy on another call...'; 
		$scope.otherSideRinging = false;
		
		if($scope.ILeftMyRoom == true)
		{
			$scope.LeaveRoom();
			$scope.ILeftMyRoom = false;
			roomid = $scope.user.username;
			$scope.createOrJoinRoom();
		}
			
	    console.log('Room ' + room + ' is full');
	});

	socket.on('join', function (room){
	  //console.log('Another peer made a request to join room ' + room);
	  //console.log('This peer is the initiator of room ' + room + '!');
	  isChannelReady = true;
	});

	socket.on('joined', function (room){
	  console.log('This peer has joined room ' + room.room + ' '+ room.username);
	  isChannelReady = true;
	  $scope.startCalling();
	});

	socket.on('log', function (array){
	  console.log.apply(console, array);
	});
	
	window.onbeforeunload = function(e){
		$scope.LeaveRoom();
		if(!$scope.isOtherPeerBusy())
			sendMessage('bye');
	}
	
	function sendMessage(message){
		message = {msg:message};
		message.room = roomid;
		message.username = $scope.user.username;
		//console.log('Client sending message: ', message);
		socket.emit('message', message);
	}
	
	////////////////////////////////////////////////////////////////////////////////////////
	// Variables for WebRTC Session                                                       //
	///////////////////////////////////////////////////////////////////////////////////////
	
	var isChannelReady;
	var isInitiator = false;
	var isStarted = false;
	var sendChannel;
	var receiveChannel;
	var localStream;
	var localStreamScreen;
	var pc;
	var remoteStream;
	var remoteStreamScreen;
	var turnReady;
	var bell = new Audio('/sounds/bells_simple.mp3');
	bell.loop = true;
	
	var remotevideo = document.getElementById("remotevideo");
	remotevideo.src = null;
	
	var remotevideoscreen = document.getElementById("remotevideoscreen");
	remotevideoscreen.src = null;
	
	////////////////////////////////////////////////////////////////////////////////////////
	// WebRTC using sigaling logic                                                        //
	///////////////////////////////////////////////////////////////////////////////////////
	
	socket.on('message', function (message){
		console.log('Client received message: '+ message);
		
		try{
			if(message.split(' ')[0] === 'Incoming')
			{
				$scope.IncomingCallStatement = message;
				$scope.isSomeOneCalling = true;
				bell.load();
				bell.play();
				$scope.ringing = true;
			}
			if(message.split(' ')[0] === 'Missed')
			{
				$scope.IncomingCallStatement = message;
				$scope.ringing = false;
				$timeout($scope.onTimeoutOfMissedCall, 6000);
				bell.stop();
			}
		}catch(e){}
		
		if (message === 'got user media') {
			if (!isInitiator && !isStarted) {
				$scope.receiveCalling();// test maybeStart();
			}
		}
		else if(message === 'Accept Call')
		{
			isInitiator = true;
			$scope.otherSideRinging = false;
		    $scope.areYouCallingSomeone = false;
		    getUserMedia(video_constraints, handleUserMedia, handleUserMediaError);
		}
		else if(message === 'Reject Call')
		{
			$timeout($scope.onTimeout, 6000);
			$scope.OutgoingCallStatement = 'Callee is Busy...'; 
			$scope.otherSideRinging = false;
			
			if($scope.ILeftMyRoom == true)
		    {
				$scope.LeaveRoom();
				$scope.ILeftMyRoom = false;
				roomid = $scope.user.username;
				$scope.createOrJoinRoom();
			}
		}
		else if(message === 'bye')
		{
			isStarted = false;
			isInitiator = false;
		    
 		    if(localStream)
 		    {
			  localStream.stop();
		    }
			if(localStreamScreen)
			{
			  localStreamScreen.stop();
		    }
		    if(remoteStream)
		    {
				remoteStream.stop();
				remotevideo.src = null;
			}
			if(remoteStreamScreen)
			{
				remoteStreamScreen.stop();
				remotevideoscreen.src = null;
			}
			
			$scope.screenSharedLocal = false;
			$scope.screenSharedByPeer = false;
			
			$scope.firstVideoAdded = false;
			  
			$scope.localCameraOn = false;
			
			if(pc!=null)
			{
				pc.close();
				pc = null;
			}
			
			if($scope.ILeftMyRoom == true)
		    {
				$scope.LeaveRoom();
				$scope.ILeftMyRoom = false;
				roomid = $scope.user.username;
				$scope.createOrJoinRoom();
			}
			
			$scope.callEnded = true;
		}
		else if(message === 'hangup')
		{
			isStarted = false;
			isInitiator = false;
		    
 		    if(localStream)
 		    {
			  localStream.stop();
		    }
			if(localStreamScreen)
			{
			  localStreamScreen.stop();
		    }
		    if(remoteStream)
		    {
				remoteStream.stop();
				remotevideo.src = null;
			}
			if(remoteStreamScreen)
			{
				remoteStreamScreen.stop();
				remotevideoscreen.src = null;
			}
			
			$scope.firstVideoAdded = false;
			$scope.screenSharedLocal = false;
			$scope.screenSharedByPeer = false;
			  
			$scope.localCameraOn = false;
			
			if(pc!=null)
			{
				pc.close();
				pc = null;
			}
			
			var endTime = new Date();
		
		    $scope.callData.EndTime = endTime.toUTCString();
		    
		    $scope.recordCallData();
		    
		    if($scope.ILeftMyRoom == true)
		    {
				$scope.LeaveRoom();
				$scope.ILeftMyRoom = false;
				roomid = $scope.user.username;
				$scope.createOrJoinRoom();
			}
			
			$scope.callEnded = true;
			
		}
		else if (message.type === 'offer') {
			if (isInitiator && !isStarted) {
				maybeStart();
			}
			pc.setRemoteDescription(new RTCSessionDescription(message));
			doAnswer();
		} else if (message.type === 'answer' && isStarted) {
			pc.setRemoteDescription(new RTCSessionDescription(message));
		} else if (message.type === 'candidate' && isStarted) {
			var candidate = new RTCIceCandidate({
				sdpMLineIndex: message.label,
				candidate: message.candidate
			});
			pc.addIceCandidate(candidate);
		} else if (message === 'bye' && isStarted) {
			handleRemoteHangup();
		}
	});
	
	function maybeStart() {	
		//console.log('isStarted localstream isChannelReady ', isStarted, localStream, isChannelReady)
		  if (!isStarted && typeof localStream != 'undefined' && isChannelReady) {
			
			createPeerConnection();
			pc.addStream(localStream);
			isStarted = true;
			
			if (!isInitiator) {
			  doCall();
			}
		  }
	}
	
	////////////////////////////////////////////////////////////////////////////////////////
	// WebRTC logic                                                                       //
	///////////////////////////////////////////////////////////////////////////////////////
	
	function createPeerConnection() {
		  try {
			//
			//Different URL way for FireFox
			//
			pc = new RTCPeerConnection(pc_config, {optional: []});//pc_constraints);
			pc.onicecandidate = handleIceCandidate;
			pc.onaddstream = handleRemoteStreamAdded;
			pc.onremovestream = handleRemoteStreamRemoved;
			
			if (!isInitiator) {
				try {
				  // Reliable Data Channels not yet supported in Chrome
				  try{
					sendChannel = pc.createDataChannel("sendDataChannel", {reliable: true});
				  }
				  catch(e){
					  console.log('UNRELIABLE DATA CHANNEL')
					  sendChannel = pc.createDataChannel("sendDataChannel", {reliable: false});
				  }
				  sendChannel.onmessage = handleMessage;
				  trace('Created send data channel');
				} catch (e) {
				  alert('Failed to create data channel. ' +
						'You need Chrome M25 or later with RtpDataChannel enabled : '+ e.message );
				  trace('createDataChannel() failed with exception: ' + e.message);
				}
				sendChannel.onopen = handleSendChannelStateChange;
				sendChannel.onclose = handleSendChannelStateChange;
			  } else {
				pc.ondatachannel = gotReceiveChannel;
			  }
		  } catch (e) {
			console.log('Failed to create PeerConnection, exception: ' + e.message);
			alert('Cannot create RTCPeerConnection object.');
			  return;
		  }
	}
	
	function handleIceCandidate(event) {
		  if (event.candidate) {
			sendMessage({
			  type: 'candidate',
			  label: event.candidate.sdpMLineIndex,
			  id: event.candidate.sdpMid,
			  candidate: event.candidate.candidate});
		  } else {
			console.log('End of candidates.');
		  }
	}

	function handleCreateOfferError(event){
		console.log('createOffer() error: ', e);
	}

	function doCall() {
		  console.log('Sending offer to peer');
		  pc.createOffer(setLocalAndSendMessage, handleCreateOfferError);
	}

	function doAnswer() {
		  console.log('Sending answer to peer.');
		  pc.createAnswer(setLocalAndSendMessage, function (error){console.log(error)}, sdpConstraints);
	}

	function setLocalAndSendMessage(sessionDescription) {
		  // Set Opus as the preferred codec in SDP if Opus is present.
		  pc.setLocalDescription(sessionDescription);
		  //console.log('setLocalAndSendMessage sending message' , sessionDescription);
		  sendMessage(sessionDescription);
	}
	
	$scope.firstVideoAdded = false;
	function handleRemoteStreamAdded(event) {
		  console.log('Remote stream added.');
		  
		  if($scope.firstVideoAdded == false){
			  remotevideo.src = URL.createObjectURL(event.stream);
			  remoteStream = event.stream;
			  $scope.firstVideoAdded = true;
		  }
		  else{
			  $scope.$apply(function(){
				$scope.screenSharedByPeer = true;
			  })
			  
			  remotevideoscreen.src = URL.createObjectURL(event.stream);
			  remoteStreamScreen = event.stream;
		  }
	}

	function handleRemoteStreamRemoved(event) {
		console.log('Remote stream removed. Event: ', event);
		$scope.$apply(function(){
				$scope.screenSharedByPeer = false;
		})
	}
	
	////////////////////////////////////////////////////////////////////////////////////////
	// Media Stream Logic                                                                 //
	///////////////////////////////////////////////////////////////////////////////////////
	
	var localPeerConnection, remotePeerConnection;
		 
	 function handleUserMedia(newStream){
			
		//var localvideo = document.getElementById("localvideo");
		//localvideo.src = URL.createObjectURL(newStream);
		localStream = newStream;
		$scope.localCameraOn = true;
		
		sendMessage('got user media');
		
		if (!isInitiator) {
			maybeStart();
		}
		
	 }
	 
	 function handleUserMediaError(error){
		//console.log(error);
		$scope.addAlertCallStart('danger', 'Could not access your microphone or webcam.')

		if($scope.ILeftMyRoom == true)
		{
			$scope.LeaveRoom();
			$scope.ILeftMyRoom = false;
			roomid = $scope.user.username;
			$scope.createOrJoinRoom();
		}
	 }		 
		
	 var video_constraints = {video: true, audio: true};
	 var screen_constraints = {video: { mandatory: { chromeMediaSource: 'screen' } }};
	 
	 $scope.startCalling = function(){
		sendMessage('Incoming Call: '+ $scope.user.username);
		$scope.areYouCallingSomeone = true;
		$scope.OutgoingCallStatement = 'Now Calling... '; 
		$scope.otherSideRinging = true;
	 }
	 
	 $scope.StopOutgoingCall = function(){
		sendMessage('Missed Incoming Call: '+ $scope.user.username);
		$scope.areYouCallingSomeone = false;
		$scope.otherSideRinging = false;
		$scope.OutgoingCallStatement = 'Calling stopped'; 
		
		if($scope.ILeftMyRoom == true)
		{
			$scope.LeaveRoom();
			$scope.ILeftMyRoom = false;
			roomid = $scope.user.username;
			$scope.createOrJoinRoom();
		}
	 }
	 
	 $scope.receiveCalling = function(){
		getUserMedia(video_constraints, handleUserMedia, handleUserMediaError);
		
		$scope.callData.Caller = $scope.IncomingCallStatement.split(': ')[1];
		$scope.callData.Callee = $scope.user.username;
		var startTime = new Date();
		
		$scope.callData.StartTime = startTime.toUTCString();
	 }
	 
	 $scope.AcceptCall = function(){
		sendMessage('Accept Call');
		$scope.isSomeOneCalling = false;
		bell.pause();
		$scope.ringing = false;
	 }
	 $scope.RejectCall = function(){
		sendMessage('Reject Call')
		$scope.isSomeOneCalling = false;
		bell.pause();
		$scope.ringing = false;
	 }
	 
	 ////////////////////////////////////////////////////////////////////////////////////////
	// Screen Sharing Logic                                                               //
	///////////////////////////////////////////////////////////////////////////////////////
	 
	 $scope.showScreenText = 'Share Screen';
	 
	 $scope.showScreen = function(){
		 
		 if($scope.showScreenText == 'Share Screen')
		 {
			getUserMedia(screen_constraints, handleUserMediaShowScreen, handleUserMediaErrorShowScreen)
			$scope.showScreenText = 'Hide Screen';
			$scope.screenSharedLocal = true;
		 }
		 else
		 {
			 if(localStreamScreen){
				 localStreamScreen.stop();
				 pc.removeStream(localStreamScreen);
				 doCall();
			 }
			   
			 $scope.showScreenText = 'Share Screen';
			 $scope.screenSharedLocal = false;
		 }
	     
	 }
	 
	 function handleUserMediaShowScreen(newStream){
		
		//if(localStream){
		//	localStream.stop();
		//	pc.removeStream(localStream);
		//}
		
		//var localvideoscreen = document.getElementById("localvideoscreen");
		//localvideoscreen.src = URL.createObjectURL(newStream);
		localStreamScreen = newStream;
		pc.addStream(localStreamScreen);
		$scope.localCameraOn = true;
		
		doCall();
		
	 }
	   
	 function handleUserMediaErrorShowScreen(error){
		//console.log(error);
		$scope.addAlertCallStart('danger', 'If you tried to share '+
									'screen you must enable the option "Enable screen capture support in getUserMedia()." '+
									'from chrome://flags. Type chrome://flags in separate tab of your Chrome browser to enable the option.');
									
	 }
	 
	 
	 ////////////////////////////////////////////////////////////////////////////////////////
	// WebRTC DataChannel logic (Text Messages)                                           //
	///////////////////////////////////////////////////////////////////////////////////////
	
	$scope.userMessages = [];
		
	$scope.sendData = function() {
		 
		 var data = $scope.dataChannelSend;
		  sendChannel.send(''+ $scope.user.username +': '+ data);
		  //trace('Sent data: ' + data);
		  $scope.userMessages.push('Me: '+ data)
		  $scope.dataChannelSend = '';
		  
		  var chatBox = document.getElementById('chatBox');
		  chatBox.scrollTop = 300 + 8 + ($scope.userMessages.length * 240);
	 
	 }
	
	function handleMessage(event) {
	  //trace('Received message: ' + event.data);
	  //document.getElementById("dataChannelReceive").value = event.data;
	  
		var message = event.data;
		
		if(message.byteLength) {
			process_binary(0,message,0);
		}
		else if (message.charAt(0) == '{' && message.charAt(message.length-1) == '}') {
			process_data(message);
		}
	    else {
		  $scope.$apply(function(){
			  
			  $scope.userMessages.push(event.data)
			 
		  })
		  var chatBox = document.getElementById('chatBox');
		  chatBox.scrollTop = 300 + 8 + ($scope.userMessages.length * 240);
	  }
	}
	
	function handleSendChannelStateChange() {
		  var readyState = sendChannel.readyState;
		  //trace('Send channel state is: ' + readyState);
		  enableMessageInterface(readyState == "open");
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
		  enableMessageInterface(readyState == "open");
	}

	function enableMessageInterface(shouldEnable) {
		  if (shouldEnable) {
			//dataChannelSend.disabled = false;
			//dataChannelSend.focus();
			//dataChannelSend.placeholder = "";
			//sendButton.disabled = false;
		  } else {
			//dataChannelSend.disabled = true;
			//sendButton.disabled = true;
		  }
	}
	
	 ////////////////////////////////////////////////////////////////////////////////////////
	// File Sharing Logic                                                                 //
	///////////////////////////////////////////////////////////////////////////////////////
	
	window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
	window.URL = window.URL || window.webkitURL;
	accept_inbound_files();
	
	/* event delegation 
	 * -we need to do this to form a chrome app - see https://developer.chrome.com/extensions/contentSecurityPolicy#H2-3
	 * -huge thanks to http://stackoverflow.com/questions/13142664/are-multiple-elements-each-with-an-addeventlistener-allowed 
	 */
	function fileEventHandler(e)
	{
		e = e || window.event;
		var target = e.target || e.srcElement;
		if (target.id.search('-download') != -1) {
			download_file(target.id.replace("-download", ""));
		} else if (target.id.search('-cancel') != -1) {
			cancel_file(target.id.replace("-cancel", ""));
		} else if (target.id == 'upload_stop') {
			upload_stop();
		}
	}
	document.body.addEventListener('click',fileEventHandler,false);
	
	/* sending functionality, only allow 1 file to be sent out at a time */
	var chunks = {};
	var meta = {};
	var filesysteminuse = false;
	var FSdebug = false;
	var chunksPerACK = 16; /* 16k * 16 = 256k (buffer size in Chrome & seems to work 100% of the time) */
	
	function get_chunk_size(me, peer) {

		return 16000;//64000;//36000;

	}
	
	/* Used in Chrome to handle larger files (and firefox with idb.filesystem.js) */
	window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
	var file_to_upload;    /* "pointer" to external file */

	/* recieving functionality, values stored per user id */
	var fs = [];  /* hold our filesystems for download files */
	var saved_fileEntry = []; /* holds temporary fileEntry's during last encryption hash check */
	var downloading = []; /* downloading or not */
	var recieved_meta = []; /* the file meta data other users send over */
	var recievedChunks = []; /* store the chunks in memory before writing them to filesystem */
	var recievedChunksWritePointer = []; /* stores the # of the next chunk to be written to the filesystem */
	var createdChunksWritePointer = []; /* true if the file has been created*/
	var requestedChunksWritePointer = []; /* stores the value of the next chunk to be requested */
	
	/* stop the uploading! */
	function upload_stop() {
		/* remove data */
		chunks = {};
		meta = {};
	
		/* also clear the container */
		create_or_clear_container(0);
		
		/* firefox and chrome specific I think, but clear the file input */
		document.getElementById('file').value='';
	}
	
	/* write a peice of a file to a file on the filesystem... allows for unlimited file size!
	 * FF does have a limitation in that we cannot load files directly out of idb.filesystem.js, we must first load them into memory :(
	 */
	function write_to_file(user_id, chunk_data, chunk_num, hash) {

		//console.log('got Chunks : ', chunk_data)
		
		/* store our chunk temporarily in memory */
		recievedChunks[user_id][chunk_num % chunksPerACK] = chunk_data;
		
		/* once done recieving all chunks for this ack, start writing to memory */
		if (chunk_num %chunksPerACK == (chunksPerACK-1) || recieved_meta[user_id].numOfChunksInFile == (chunk_num+1)) {
			store_in_fs(user_id, hash);
		}
	}
	
	/* only called by write_to_file */
	function store_in_fs(user_id, hash) {
		
		/* massive thanks to http://stackoverflow.com/questions/10720704/filesystem-api-upload-from-local-drive-to-local-filesystem */
		if (createdChunksWritePointer[user_id] == false) {
			options = { create: true };
			createdChunksWritePointer[user_id] = true;
		} else {
			options = { create: false };
		}
		
		fs[user_id].root.getFile(
			recieved_meta[user_id].name,
			options,
			function(fileEntry) {
				/* create a writer that can put data in the file */
				fileEntry.createWriter(function(writer) {
				
					/* once we have written all chunks per ack */
					writer.onwriteend = function() {

						/* request the next chunk */
						recievedChunks[user_id] = [];
						requestedChunksWritePointer[user_id] += chunksPerACK;

						if (recieved_meta[user_id].numOfChunksInFile > recievedChunksWritePointer[user_id]) {
							request_chunk(user_id, recievedChunksWritePointer[user_id], hash);
						}
					};
					
					writer.onerror = FSerrorHandler;

					/* build the blob based on the binary array this.recievedChunks[user_id] */
					var builder = new Blob(recievedChunks[user_id], [recieved_meta[user_id].type]);
					
					/* debug */
					if (FSdebug) {
						console.log("DEBUG: writing chunk2 "+ recievedChunksWritePointer[user_id]);
						for (i=0;i<chunksPerACK;i++) {
							if (recievedChunks[user_id][i]) {
								console.log('recived: '+CryptoJS.SHA256(_arrayBufferToBase64(recievedChunks[user_id][i])).toString(CryptoJS.enc.Base64));
							}
						}
					}
					
					/* write the blob to the file, this can only be called once! Will fail silently if called while writing! We avoid this by only writing once per ack. */
					var seek = recievedChunksWritePointer[user_id] * get_chunk_size('chrome', recieved_meta[user_id].browser); //don't hardcode
					writer.seek(seek);
					writer.write(builder);
					recievedChunksWritePointer[user_id] += chunksPerACK;
					
					/* EOF condition */
					if (recieved_meta[user_id].numOfChunksInFile <= (recievedChunksWritePointer[user_id])) {
						//console.log("creating file link!");
							
						/* stop accepting file info */
						downloading[user_id] = false;
						
						/* on encrypted completion here, send hash back to other user who verifies it, then sends the OK to finish back */
						//if (encryption_type != "NONE") {
							//saved_fileEntry[user_id] = fileEntry;
							//request_chunk(user_id, recievedChunksWritePointer[user_id], hash); /* this chunk doesn't exist, but we need the hash of the last chunk to be verified */
						//} else {
							if (webrtcDetectedBrowser == "chrome") {
								create_file_link (recieved_meta[user_id], user_id, fileEntry);
							} else {
								/* one little idb.filesystem.js quirk */
								fileEntry.file(function(file) { 
									create_file_link (recieved_meta[user_id], user_id, file); /* <-- file, not fileEntry */
								});
							}
						//}
					}
				}, FSerrorHandler);
			}, FSerrorHandler);
	}

	/* process local inbound files */
	function process_inbound_files(file) {

		file_to_upload = file;
		
		meta.name = file.name;
		meta.size = file.size;
		meta.filetype = file.type;
		meta.browser = 'chrome';//$.browser.name; /* need browser name to set chunk size */ // should not be hardcoded
		//console.log(meta);
		
		send_meta();
		sendChannel.send("You have received a file. Download and Save it.");
		/* user 0 is this user! */
		create_upload_stop_link(file_to_upload.name, 0);//, username);
	}
	
	/* Document bind's to accept files copied. Don't accept until we have a connection */
	function accept_inbound_files() {
		
		document.getElementById('file').addEventListener('change', function(e) {
			if (e.target.files.length == 1) {
				var file = e.target.files[0];
		
				process_inbound_files(file);
			}
		}, false);
	}
	
	/* inbound - recieve binary data (from a file)
	 * we are going to have an expectation that these packets arrive in order (requires reliable datachannel)
	 */
	function process_binary(id,message,hash) {
		if (!downloading[id]) {
			return;
		}
		
		if (FSdebug) {
			console.log("processing chunk # " + recieved_meta[id].chunks_recieved);
		}
		
		/* We can write to a file using FileSystem! Chrome has native support, FF uses idb.filesystem.js library */
		/* Note that decrypted file packets are passed here by file_decrypt, we don't have to do any decryption here */
		
		write_to_file(id, message, recieved_meta[id].chunks_recieved, hash);//id, rtc.usernames[id], message, recieved_meta[id].chunks_recieved, hash
		recieved_meta[id].chunks_recieved++;
		
		if (recieved_meta[id].numOfChunksInFile > recieved_meta[id].chunks_recieved) {
			update_container_percentage(id, recieved_meta[id].chunks_recieved - 1, recieved_meta[id].numOfChunksInFile, recieved_meta[id].size);
		} else {
			//console.log("done downloading file!");
			/* stop accepting file info */
			downloading[id] = false;
			/* creating the download link is handled by write_to_file */
		}
	}
	
	/* inbound - recieve data
	 * note that data.chunk refers to the incoming chunk #
	 */
	function process_data(data) {
		data = JSON.parse(data).data;
		//console.log('process_data function: ', data)
		if (data.file_meta) {
			/* we are recieving file meta data */
		
			/* if it contains file_meta, must be meta data! */
			recieved_meta[0] = data.file_meta;
			recieved_meta[0].numOfChunksInFile = Math.ceil(recieved_meta[0].size / get_chunk_size(recieved_meta[0].browser, 'chrome'));// Don't hardcode
			recieved_meta[0].name = sanitize(recieved_meta[0].name);
			
			/* we are not downloading anymore if we just got meta data from a user
			 * call to create_pre_file_link is reliant on this to not display [c] button on new file information
			*/
			downloading[0] = false;
			delete_file(0);
			
			
			/* create a download link */
			create_pre_file_link(recieved_meta[0], 0, data.username);
			
			/* if auto-download, start the process */
			/* removed feature
			if ($("#auto_download").prop('checked')) {
				download_file(data.id);
			}
			*/
			
			//console.log(recieved_meta[0]);
		} else if (data.kill) {
			/* if it is a kill msg, then the user on the other end has stopped uploading! */
			
			downloading[0] = false;
			delete_file(0);
			if (recieved_meta[0]) {
				recieved_meta[0].chunks_recieved = 0;
			}
			create_or_clear_container(0);
			
		} else if (data.ok_to_download) {
			/* if we recieve an ok to download message from other host, our last file hash checks out and we can now offer the file up to the user */
			
			if (is_chrome) {
				create_file_link (recieved_meta[0], 0, saved_fileEntry[0]);
			} else {
				/* one little idb.filesystem.js quirk */
				saved_fileEntry[0].file(function(file) { 
					create_file_link (recieved_meta[0], 0, file); /* <-- file, not fileEntry */
				});
			}
		} else {
			
			//console.log('Chunk is requested')

			/* Otherwise, we are going to assume that if we have reached here, this is a request to download our file */
			if (data.chunk % chunksPerACK == 0) {
				for (i=0;i<chunksPerACK;i++) {
					send_chunk_if_queue_empty(0, data.chunk + i, data.browser, data.rand, data.hash);
				}
			}
		}
	}
	
	/* Use this to avoid xss
	 * recommended escaped char's found here - https://www.owasp.org/index.php/XSS_(Cross_Site_Scripting)_Prevention_Cheat_Sheet#RULE_.231_-_HTML_Escape_Before_Inserting_Untrusted_Data_into_HTML_Element_Content
	 */
	function sanitize(msg) {
	  msg = msg.toString();
	  return msg.replace(/[\<\>"'\/]/g,function(c) {  var sanitize_replace = {
			"<" : "&lt;",
			">" : "&gt;",
			'"' : "&quot;",
			"'" : "&#x27;",
			"/" : "&#x2F;"
		}
		return sanitize_replace[c]; });
	}
	
	
	/* request chunk # chunk_num from id, at this point just used to request the first chunk */
	function request_chunk(id, chunk_num, hash) {
		if (FSdebug) {
			console.log("DEBUG: requesting chunk " + chunk_num + " from " + id);
		}
		
		//console.log('Function which actually asks for chunk')

			sendChannel.send(JSON.stringify({ //id, JSON.stringify({
				"eventName": "request_chunk",
				"data": {
					"chunk": chunk_num,
					"browser": 'chrome'
				}
			}));

	}
	
	/* bootstrap alerts! */
	function boot_alert(text) {
		console.log('Boot_alert: ', text);
		//$("#alerts").append('<div class="alert alert-danger alert-dismissable">'+text+'<button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button></div>');
	}
	
	/* request id's file by sending request for block 0 */
	function download_file(id) {

		/* event listeners or javascript can call us, if id isn't set, must have been an event listener */
		/*if (typeof id == 'object') {
			var str = id.target.id;
			id = str.replace("-download", "");
		}*/

		/* We can't request multiple filesystems or resize it at this time. Avoiding hacking around this ATM
		 * and will instead display warning that only 1 file can be downloaded at a time :(
		 */
		 if (filesysteminuse) {
			//console.log('Sorry, but only 1 file can be downloaded or stored in browser memory at a time, please [c]ancel or [d]elete the other download and try again.')
			boot_alert("Sorry, but only 1 file can be downloaded or stored in browser memory at a time, please [c]ancel or [d]elete the other download and try again.");
			return;
		}

		window.requestFileSystem(window.TEMPORARY, recieved_meta[id].size, function(filesystem) {
			fs[id] = filesystem;
			filesysteminuse = true;
			downloading[id] = true; /* accept file info from user */
			request_chunk(id, 0, 0);
		});
		
		recieved_meta[id].chunks_recieved = 0;
		recievedChunksWritePointer[id] = 0;
		createdChunksWritePointer[id] = false;
		requestedChunksWritePointer[id] = 0;
		recievedChunks[id] = [];
	}
	
	
	/* delete a file - should be called when cancel is requested or kill is called */
	function delete_file(user_id) {
		if (fs[user_id]) {
			filesysteminuse = false;
			fs[user_id].root.getFile(recieved_meta[user_id].name, {create: false}, function(fileEntry) {
				fileEntry.remove(function() {
					console.log('File removed.');
				}, FSerrorHandler);
			}, FSerrorHandler);
		}
	}

	/* cancel incoming file */
	function cancel_file(id) {
		downloading[id] = false; /* deny file info from user */
		delete_file(id);
		recieved_meta[id].chunks_recieved = 0;
		/* create a new download link */
		create_pre_file_link(recieved_meta[id], id);
	}
	
	
	/* creates an entry in our filelist for a user, if it doesn't exist already - TODO: move this to script.js? */
	function create_or_clear_container(id) {
		var filelist = document.getElementById('filelist_cointainer');
		var filecontainer = document.getElementById(id);
		//username = sanitize(username);
		
		/* if the user is downloading something from this person, we should only clear the inside span to save the cancel button */
		if (downloading[id] == true) {
			var span = document.getElementById(id + "-span");
			if (!span) {
				filecontainer.innerHTML = '<span id="'+id+'-span"></span>';
				/* add cancel button */
				var a = document.createElement('a');
				a.download = meta.name;
				a.id = id + '-cancel';
				a.href = 'javascript:void(0);';
				a.style.cssText = 'color:red;';
				a.textContent = '[c]';
				a.draggable = true;
				//append link!
				filecontainer.appendChild(a);
			} else {
				span.innerHTML="";
			}
			return;
		}
		var username=''; // temporary
		if (!filecontainer) {
			/* if filecontainer doesn't exist, create it */
			var fs = '<div id="' + id + '">' + username + '</div>';
			filelist.innerHTML = filelist.innerHTML + fs;
		} else {
			/* if filecontainer does exist, clear it */
			filecontainer.innerHTML = username;
		}
	}
	
	
	/* creates an entry in our filelist for a user, if it doesn't exist already */
	function remove_container(id) {
		var filecontainer = document.getElementById(id);
		if (filecontainer) {
			filecontainer.remove();
		}
		if (fs[id]) {
			delete_file(id);
		}
	}

	/////////////
	// TODO Will see this later, commenting for now
	/////////////
	/* create a link that will let the user start the download */
	function create_upload_stop_link(filename, id){//, username) {
		
		//create a place to store this if it does not already
		create_or_clear_container(id);//, username);
		var filecontainer = document.getElementById(id);
		
		//create the link
		var span = document.createElement('span');
		span.textContent = ''+filename + ' ';
		
		var a = document.createElement('a');
		a.download = meta.name;
		a.id = 'upload_stop';
		a.href = 'javascript:void(0);';
		a.textContent = '[Stop Upload]';
		a.style.cssText = 'color:red;';
		a.draggable = true;
		
		//append link!
		filecontainer.appendChild(span);
		filecontainer.appendChild(a);
		 
	}

	/* create a link that will let the user start the download */
	function create_pre_file_link(meta, id, username) {
		
		//create a place to store this if it does not already
		create_or_clear_container(id);
		var filecontainer = document.getElementById(id);
		
		//create the link
		var span = document.createElement('span');
		span.textContent = '';
		
		var a = document.createElement('a');
		a.download = meta.name;
		a.id = id + '-download';
		a.href = 'javascript:void(0);';
		a.textContent = 'Download : ' + meta.name + ' ' + getReadableFileSizeString(meta.size);
		a.draggable = true;
		
		//append link!
		filecontainer.appendChild(span);
		filecontainer.appendChild(a);

		//append to chat
		sendMessage($scope.user.username +" is now offering file " + meta.name);
	}
	
	/* update a file container with a DL % */
	function update_container_percentage(id, chunk_num, chunk_total, total_size) {

		create_or_clear_container(id);
		var span = document.getElementById(id+'-span');

		/* create file % based on chunk # downloaded */
		var percentage = (chunk_num / chunk_total) * 100;
		span.innerHTML = percentage.toFixed(1) + "% of " + getReadableFileSizeString(total_size) + ' ';
		
	}

	/* -h */
	function getReadableFileSizeString(fileSizeInBytes) {
		var i = -1;
		var byteUnits = [' kB', ' MB', ' GB', ' TB', 'PB', 'EB', 'ZB', 'YB'];
		do {
			fileSizeInBytes = fileSizeInBytes / 1024;
			i++;
		} while (fileSizeInBytes > 1024);
		return Math.max(fileSizeInBytes, 0.1).toFixed(1) + byteUnits[i];
	};

	/* create a link to this file */
	function create_file_link (meta, id, fileEntry) {
		//grab the file type, should probably use a pattern match...
		var remove_base = meta.filetype.split(";");
		var remove_data = remove_base[0].split(":");
		var filetype = remove_data[1];
		var debase64_data;
		
		//create a place to store this if it does not already
		create_or_clear_container(id);
		var filecontainer = document.getElementById(id);
		
		//create the link
		var span = document.createElement('span');
		span.textContent = '';
		var a = document.createElement('a');
		a.download = meta.name;
		/* One difference with Chrome & FF :( */
		if (webrtcDetectedBrowser == "chrome") {
			/* we are going to link to our local file system */
			a.href = fileEntry.toURL();
		} else {
			/* fileEntry is actually not a FileEntry, but a blob in Chrome */
			a.href = window.URL.createObjectURL(fileEntry);
		}
		a.textContent = 'Save : ' + meta.name;
		a.dataset.downloadurl = [filetype, a.download, a.href].join(':');
		a.draggable = true;

		//append link!
		var messages = document.getElementById('messages');
		filecontainer.appendChild(span);
		filecontainer.appendChild(a);
		
		/* make delete button */
		filecontainer.innerHTML = filecontainer.innerHTML+ " ";
		/* add cancel button */
		var can = document.createElement('a');
		can.download = meta.name;
		can.id = id + '-cancel';
		can.href = 'javascript:void(0);';
		can.style.cssText = 'color:red;';
		can.textContent = '[d]';
		can.draggable = true;
		//append link!
		filecontainer.appendChild(can);
		
		//append to chat
		sendMessage("File " + meta.name + " is ready to save locally");
	}
	
	
	/* send out meta data, allow for id to be empty = broadcast */
	function send_meta(id) {
		/*if (jQuery.isEmptyObject(meta)) {
			return;
		}*/
		
		//console.log("sending meta data");
		//console.log(meta);
		
			sendChannel.send(JSON.stringify({
				eventName: "data_msg",
				data: {
					file_meta: meta
				}
			}));
		
	}
	
	/* Please note that this works by sending one chunk per ack */

	function sendchunk(id, chunk_num, other_browser, rand, hash) {
		/* uncomment the following lines and set breakpoints on them to simulate an impaired connection */
		/* if (chunk_num == 30) { console.log("30 reached, breakpoint this line");}
		if (chunk_num == 50) { console.log("30 reached"); }*/

		var reader = new FileReader;
		var upper_limit = (chunk_num + 1) * get_chunk_size(other_browser, 'chrome'); //don't hardcode
		if (upper_limit > meta.size) { upper_limit = meta.size; }
		
		var seek = chunk_num * get_chunk_size(other_browser, 'chrome'); //don't hardcode
		var blob = file_to_upload.slice(seek, upper_limit);
		reader.onload = function(event) { 
			if (reader.readyState == FileReader.DONE) {
				
				//if (encryption_type != "NONE") {
				//	file_encrypt_and_send(id, event.target.result, rand, chunk_num);
				//} else {
					if (FSdebug) {
						console.log("DEBUG: sending chunk "+ chunk_num);
						console.log('sending: '+CryptoJS.SHA256(_arrayBufferToBase64(event.target.result)).toString(CryptoJS.enc.Base64));
					}
					
					sendChannel.send(event.target.result);//id, event.target.result);
				//}
			}
			
			
		}
		reader.readAsArrayBuffer(blob);
	}
	
	/* ideally we would check the SCTP queue here to see if we could send, doesn't seem to work right now though... */
	function send_chunk_if_queue_empty(id, chunk_num, other_browser, rand, hash) {
		//if (encryption_type != "NONE") {
		//	if ( chunk_num > Math.ceil(file_to_upload.size / get_chunk_size($.browser.name, other_browser))) { /* allow numOfChunksInFile+1 in for last encrpytion hash verification */
		//		return;
		//	}
		//} else {
			if ( chunk_num >= Math.ceil(file_to_upload.size / get_chunk_size('chrome', other_browser))) { //don't hardcode
				return;
			}
		//}
		
		sendchunk(id, chunk_num, other_browser, rand, hash);
	}

	/***** File System Errors *****/
	//credit - http://www.html5rocks.com/en/tutorials/file/filesystem/
	function FSerrorHandler(e) {
	  var msg = '';
	  switch (e.code) {
		case FileError.QUOTA_EXCEEDED_ERR:
		  msg = 'QUOTA_EXCEEDED_ERR';
		  break;
		case FileError.NOT_FOUND_ERR:
		  msg = 'NOT_FOUND_ERR';
		  break;
		case FileError.SECURITY_ERR:
		  msg = 'SECURITY_ERR';
		  break;
		case FileError.INVALID_MODIFICATION_ERR:
		  msg = 'INVALID_MODIFICATION_ERR';
		  break;
		case FileError.INVALID_STATE_ERR:
		  msg = 'INVALID_STATE_ERR';
		  break;
		default:
		  msg = 'Unknown Error';
		  break;
	  };
	  console.error('Error: ' + msg);
	}

	//used for debugging - credit - http://stackoverflow.com/questions/9267899/arraybuffer-to-base64-encoded-string
	function _arrayBufferToBase64( buffer ) {
		var binary = ''
		var bytes = new Uint8Array( buffer )
		var len = bytes.byteLength;
		for (var i = 0; i < len; i++) {
			binary += String.fromCharCode( bytes[ i ] )
		}
		return window.btoa( binary );
	}



	////////////////////////////////////////////////////////////////////////////////////////
	// File Sharing Logic End                                                              //
	////////////////////////////////////////////////////////////////////////////////////////

}

function IndexController ($scope, $http){
		
		$scope.loginRegisterText = 'Login';
		$scope.haveAccountOrNot = 'I have an account';
		
		$scope.toggleSelected = function () {
			
			if(!$scope.selected)
			{
				$scope.loginRegisterText = 'Register';
				$scope.haveAccountOrNot = 'I am not registered';
			}
			else
			{
				$scope.loginRegisterText = 'Login';
				$scope.haveAccountOrNot = 'I have an account';
			}
			
			$scope.selected = !$scope.selected;
		};
		
		$scope.isSelected = function () {
			return $scope.selected;
		};
}

function LoginRegister ($scope, $http, $window){
	
		$scope.alerts = [];

		$scope.addAlert = function(newtype, newMsg) {
			console.log('Error', newtype, newMsg)
			$scope.alerts.push({type: newtype, msg: newMsg});
		};

		$scope.closeAlert = function(index) {
			$scope.alerts.splice(index, 1);
		};
		
		$scope.alertsRegister = [];

		$scope.addAlertRegister = function(newtype, newMsg) {
			console.log('Error', newtype, newMsg)
			$scope.alertsRegister.push({type: newtype, msg: newMsg});
		};

		$scope.closeAlertRegister = function(index) {
			$scope.alertsRegister.splice(index, 1);
		};
		
		$scope.master = {};
		 
		$scope.update = function(user) {
		$scope.master = angular.copy(user);
		};
		 
		$scope.reset = function() {
		$scope.user = angular.copy($scope.master);
		};
		 
		$scope.isUnchanged = function(user) {
		return angular.equals(user, $scope.master);
		};
		 
		$scope.reset();
		
		$scope.underProgress = function(){
			return $scope.progressState;
		}
		
		$scope.loginForm = function() {
			
			$scope.progressState = true;
			
			$http.post('/login', JSON.stringify($scope.user1))
			.error(function(data) {
				$scope.progressState = false;
				$scope.addAlert('danger', 'Invalid username or password')
			})
			.success(function(data) {
				$scope.progressState = false;
				$window.location.href = '/home';
			});
			
		};
		
		$scope.registerForm = function() {
			
			$scope.progressState = true;
			
			$http.post('/register', JSON.stringify($scope.user))
			.success(function(data) {
				$scope.progressState = false;
				if(data.status != 'success')
					$scope.addAlertRegister(data.status, data.msg)
				else
					$window.location.href = '/home';
			})
			.error(function(data) {
				$scope.progressState = false;
				$scope.addAlertRegister(data, data)
			});
			
		};
		
}

function RatingControllers ($scope) {
	  
	  $scope.rate = 7;
	  $scope.max = 10;
	  $scope.isReadonly = false;

	  $scope.hoveringOver = function(value) {
		$scope.overStar = value;
		$scope.percent = 100 * (value / $scope.max);
	  };

	  $scope.ratingStates = [
		{stateOn: 'glyphicon-ok-sign', stateOff: 'glyphicon-ok-circle'},
		{stateOn: 'glyphicon-star', stateOff: 'glyphicon-star-empty'},
		{stateOn: 'glyphicon-heart', stateOff: 'glyphicon-ban-circle'},
		{stateOn: 'glyphicon-heart'},
		{stateOff: 'glyphicon-off'}
	  ];
}

function NewsControllerSuperUser ($scope, Data){
		$scope.data = Data;
}

function editStudentController ($scope, $http){
		
		$scope.selected = false;
		$scope.editButton = 'Edit';
		
		$scope.editToggle = function () {
			$scope.selected = !$scope.selected;
			
			if($scope.isSelected())
			   $scope.editButton = 'Cancel Edit';
			else
			   $scope.editButton = 'Edit';
		};
		
		$scope.isSelected = function () {
			return $scope.selected;
		};
		
		$scope.processForm = function() {
			
			$http.post('/editStudentProfile', JSON.stringify($scope.studentProfile))
			.success(function(data) {
				
				$scope.studentProfile = data;
				
				$scope.selected = !$scope.selected;
				$scope.editButton = 'Edit';
			});
			
		};
}

function editTeacherController ($scope, $http){
		
		$scope.selected = false;
		$scope.editButton = 'Edit';
		
		$scope.editToggle = function () {
			$scope.selected = !$scope.selected;
			
			if($scope.isSelected())
			   $scope.editButton = 'Cancel Edit';
			else
			   $scope.editButton = 'Edit';
		};
		
		$scope.isSelected = function () {
			return $scope.selected;
		};
		
		$scope.processForm = function() {
			
			//console.log('done')
			
			$http.post('/editTeacherProfile', JSON.stringify($scope.teacherProfile))
			.success(function(data) {
				
				$scope.teacherProfile = data;
				
				$scope.selected = !$scope.selected;
				$scope.editButton = 'Edit';
			});
			
		};
}

function editAdminController ($scope, $http){
		
		$scope.selected = false;
		$scope.editButton = 'Edit';
		
		$scope.editToggle = function () {
			$scope.selected = !$scope.selected;
			
			if($scope.isSelected())
			   $scope.editButton = 'Cancel Edit';
			else
			   $scope.editButton = 'Edit';
		};
		
		$scope.isSelected = function () {
			return $scope.selected;
		};
		
		$scope.processForm = function() {

			$http.post('/editAdminProfile', JSON.stringify($scope.adminProfile))
			.success(function(data) {
				
				$scope.adminProfile = data;
				
				$scope.selected = !$scope.selected;
				$scope.editButton = 'Edit';
			});
			
		};
}

function editParentController ($scope, $http){
		
		$scope.selected = false;
		$scope.editButton = 'Edit';
		
		$scope.editToggle = function () {
			$scope.selected = !$scope.selected;
			
			if($scope.isSelected())
			   $scope.editButton = 'Cancel Edit';
			else
			   $scope.editButton = 'Edit';
		};
		
		$scope.isSelected = function () {
			return $scope.selected;
		};
		
		$scope.processForm = function() {
			
			$http.post('/editParentProfile', JSON.stringify($scope.parentProfile))
			.success(function(data) {
				
				$scope.parentProfile = data;
				
				$scope.selected = !$scope.selected;
				$scope.editButton = 'Edit';
			});
			
		};
}

function SearchCourseController ($scope, $http){
	//  $http.get('/data/searchcourses').success(function(data) {
	//    $scope.courses = data
	//  })
}

function NewsController ($scope, Data){
		$scope.data = Data;
}

function AnnouncementController ($scope, $http){
		
		$scope.processForm = function() {
			
			$http.post('/editannounce', JSON.stringify($scope.announcement))
			.success(function(data) {
				//console.log(data);
				
				$scope.selected = !$scope.selected;
				$scope.editSelected = !$scope.editSelected;
			});
			
		};
		
		$scope.btnLabel = 'View';
		
		$scope.toggleSelected = function () {
			
			if(!$scope.selected)
			{
				$scope.btnLabel = 'Hide';
			}
			else
			{
				$scope.btnLabel = 'View';
			}
			
			$scope.selected = !$scope.selected;
		};
		
		$scope.isSelected = function () {
			return $scope.selected;
		};
		
		$scope.toggleEditSelected = function () {
			$scope.editSelected = !$scope.editSelected;
		};
		
		$scope.isEditSelected = function () {
			return $scope.editSelected;
		};
}

function GradingController ($scope, $http){
		
		$scope.save = function() {
			
			var dataToSend = {
				grade : $scope.grading.grade,
				teacherid : $scope.grading.teacherid,
				courseid : $scope.grading.courseid._id,
				studentid : $scope.grading.studentid._id
			};
			
			$http.post('/grade', JSON.stringify(dataToSend))
			.success(function(data) {
				gradings = data;
				
			});
			
		};
}
	
function ForgotPassword ($scope, $http){
		
		$scope.isCollapsed = true;
		
		$scope.save = function() {
			var dataToSend = {
				username : $scope.user3.username,
			};
			
			$http.post('/forgotPasswordRequest', JSON.stringify(dataToSend))
			.success(function(data) {
				$scope.addAlert(data.status, data.msg)
				if(data.status == 'success')
				  $scope.sentData = true;
			});
			
		};
		
		$scope.sentData = false;

		$scope.forgotPassAlerts = [];

		$scope.addAlert = function(newtype, newMsg) {
			$scope.forgotPassAlerts.push({type: newtype, msg: newMsg});
		};

		$scope.closeAlert = function(index) {
			$scope.forgotPassAlerts.splice(index, 1);
		};
}

function NewPassword ($scope, $http){
		
		$scope.save = function() {
			
			var dataToSend = {
				token : $scope.token,
				password : $scope.user.password
			};
			
			$http.post('/ChangePassword', JSON.stringify(dataToSend))
			.success(function(data) {
				$scope.user.message = data;
				$scope.sentData = true;
				
			});
			
		};
		
		$scope.sentData = false;
		$scope.user = {};
		$scope.user.message = 'Not Sent';

		
}

function EditController ($scope){

}

function FileController($scope, $http, $timeout, $upload) {
			$scope.fileReaderSupported = window.FileReader != null;
			
			$scope.hasUploader = function(index) {
				return $scope.upload[index] != null;
			};
			$scope.abort = function(index) {
				$scope.upload[index].abort(); 
				$scope.upload[index] = null;
			};
			$scope.storageFull = function(){
				var sum = 0;
				for(var i = 0; i < $scope.gotfiles.length; i++){
					sum += $scope.gotfiles[i].fileid.size;
				}
				if(sum >= $scope.configdata.totalSizeForUser)
				  return true;
				else
				  return false;
			};
			$scope.onFileSelect = function($files) {
				$scope.selectedFiles = [];
				$scope.progress = [];
				if ($scope.upload && $scope.upload.length > 0) {
					for (var i = 0; i < $scope.upload.length; i++) {
						if ($scope.upload[i] != null) {
							$scope.upload[i].abort();
						}
					}
				}
				$scope.upload = [];
				$scope.uploadResult = [];
				$scope.selectedFiles = $files;
				$scope.dataUrls = [];
				for ( var i = 0; i < $files.length; i++) {
					var $file = $files[i];
					if (window.FileReader && $file.type.indexOf('image') > -1) {
						var fileReader = new FileReader();
						fileReader.readAsDataURL($files[i]);
						function setPreview(fileReader, index) {
							fileReader.onload = function(e) {
								$timeout(function() {
									$scope.dataUrls[index] = e.target.result;
								});
							}
						}
						setPreview(fileReader, i);
					}
					$scope.progress[i] = -1;
					$scope.message = '';
				}
			};
			
			$scope.deleteFile = function(data){
				if(confirm('Are you sure you want to delete file '+ data.fileid.filename))
				{
					$http.get('/delete'+ data.fileid.filephysicalpath)
					.success(function(data) {
						$scope.gotfiles = data;
					});
				}
			};
			
			$scope.start = function(index) {
				$scope.progress[index] = 0;
				if($scope.selectedFiles[index].size < $scope.configdata.fileUploadSizeLimit)
				{
					var fileMatched = false;
					
					for(var i = 0; i < $scope.gotfiles.length; i++)
					  if($scope.selectedFiles[index].name == $scope.gotfiles[i].fileid.filename)
					    fileMatched = true;
					    
					if(!fileMatched){// || $scope.uploadTrials == 1){
						
						if($scope.uploadTrials == 1)
						{
							console.log('I m here')
							var splitName = $scope.selectedFiles[index].name.split('.')
							$scope.selectedFiles[index].name = splitName[0].concat(Math.floor((Math.random()*100)+1).toString(), '.', splitName[1]);
							console.log(splitName[0].concat(Math.floor((Math.random()*100)+1).toString(), '.', splitName[1]))
							return ;
						}
						
						$scope.upload[index] = $upload.upload({
							url : '/upload',
							method: $scope.httpMethod,
							headers: {'myHeaderKey': 'myHeaderVal'},
							file: $scope.selectedFiles[index],
							fileFormDataName: 'fileUploaded'
						}).then(function(response) {
							//console.log(response.data)
							$scope.gotfiles = response.data;
						}, null, function(evt) {
							$scope.progress[index] = parseInt(100.0 * evt.loaded / evt.total);
						});
					}
					else
					{
						$scope.message = 'This file is already stored in your file space.';
						$scope.progress[index] = -1;
						$scope.uploadTrials = 1;
					}
				}
				else
				{
					$scope.message = 'File too big to be uploaded';
					$scope.progress[index] = -1;
				}
			}
}

function FileControllerCourse ($scope, $http, $timeout, $upload) {
			$scope.fileReaderSupported = window.FileReader != null;
			
			$scope.hasUploader = function(index) {
				return $scope.upload[index] != null;
			};
			$scope.abort = function(index) {
				$scope.upload[index].abort(); 
				$scope.upload[index] = null;
			};
			$scope.storageFull = function(){
				var sum = 0;
				for(var i = 0; i < $scope.gotfiles.length; i++){
					sum += $scope.gotfiles[i].fileid.size;
				}
				if(sum >= $scope.configdata.totalSizeForClass)
				  return true;
				else
				  return false;
			};
			$scope.onFileSelect = function($files) {
				$scope.selectedFiles = [];
				$scope.progress = [];
				if ($scope.upload && $scope.upload.length > 0) {
					for (var i = 0; i < $scope.upload.length; i++) {
						if ($scope.upload[i] != null) {
							$scope.upload[i].abort();
						}
					}
				}
				$scope.upload = [];
				$scope.uploadResult = [];
				$scope.selectedFiles = $files;
				$scope.dataUrls = [];
				for ( var i = 0; i < $files.length; i++) {
					var $file = $files[i];
					if (window.FileReader && $file.type.indexOf('image') > -1) {
						var fileReader = new FileReader();
						fileReader.readAsDataURL($files[i]);
						function setPreview(fileReader, index) {
							fileReader.onload = function(e) {
								$timeout(function() {
									$scope.dataUrls[index] = e.target.result;
								});
							}
						}
						setPreview(fileReader, i);
					}
					$scope.progress[i] = -1;
					$scope.message = '';
				}
			};
			
			$scope.deleteClassFile = function(data){
				if(confirm('Are you sure you want to delete file '+ data.fileid.filename))
				{
					$http.get('/deleteClassFile'+ data.fileid.filephysicalpath)
					.success(function(data) {
						$scope.gotfiles = data;
					});
				}
			};
			
			$scope.start = function(index) {
				$scope.progress[index] = 0;
				if($scope.selectedFiles[index].size < $scope.configdata.fileUploadSizeLimit)
				{
					var fileMatched = false;
					
					for(var i = 0; i < $scope.gotfiles.length; i++)
					  if($scope.selectedFiles[index].name == $scope.gotfiles[i].fileid.filename)
					    fileMatched = true;
					    
					if(!fileMatched){// || $scope.uploadTrials == 1){
						
						if($scope.uploadTrials == 1)
						{
							console.log('I m here')
							var splitName = $scope.selectedFiles[index].name.split('.')
							$scope.selectedFiles[index].name = splitName[0].concat(Math.floor((Math.random()*100)+1).toString(), '.', splitName[1]);
							console.log(splitName[0].concat(Math.floor((Math.random()*100)+1).toString(), '.', splitName[1]))
							
							return ;
						}
						
						$scope.upload[index] = $upload.upload({
							url : '/uploadInClass/'+ $scope.course._id,
							method: $scope.httpMethod,
							headers: {'myHeaderKey': 'myHeaderVal'},
							file: $scope.selectedFiles[index],
							fileFormDataName: 'fileUploaded'
						}).then(function(response) {
							//console.log(response.data)
							$scope.gotfiles = response.data;
						}, null, function(evt) {
							$scope.progress[index] = parseInt(100.0 * evt.loaded / evt.total);
						});
					}
					else
					{
						$scope.message = 'This file is already stored in the file space.';
						$scope.progress[index] = -1;
						$scope.uploadTrials = 1;
					}
				}
				else
				{
					$scope.message = 'File too big to be uploaded';
					$scope.progress[index] = -1;
				}
			}
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
// MEETING ROOM CONTROLLER
///////////////////////////////////////////////////////////////////////////////////////////////////////////////

function MeetingController ($scope, $http, socket, pc_config, pc_constraints, sdpConstraints, $timeout){
	
	////////////////////////////////////////////////////////////////////////////////////////
	// Create or Join Room Logic                                                          //
	///////////////////////////////////////////////////////////////////////////////////////
	
	if(window.location.pathname.replace('/', '') != 'home'){
	  roomid = window.location.pathname.replace('/', '');
	  roomid = roomid.split('/')[1];
	}
	
	////////////////////////////////////////////////////////////////////////////////////////
	// WebRTC User Interface Logic                                                        //
	///////////////////////////////////////////////////////////////////////////////////////
	
	$scope.connected = false;
	
	$scope.roomname = '';
	
	$scope.localCameraOn = false;
	
	$scope.isConnected = function () {
		return $scope.connected;
	};
	
	$scope.callEnded = false;
	
	$scope.hasCallEnded = function () {
		return $scope.callEnded;
	};
	
	$scope.connectTimeOut = function(){
		$scope.roomname = roomid;
		$scope.createOrJoinMeeting();
		$scope.connected = true;
	}
	
	$timeout($scope.connectTimeOut, 1000);
	
	$scope.localCameraCaptured = function () {
		return $scope.localCameraOn;
	};
	
	$scope.screenSharedByPeer = false;
	
	$scope.hasOtherPartySharedScreen = function(){
		return $scope.screenSharedByPeer;
	}
	
	$scope.screenSharedLocal = false;
	
	$scope.isLocalScreenShared = function(){
		return $scope.screenSharedLocal;
	}
	
	////////////////////////////////////////////////////////////////////////////////////////
	// Signaling Logic                                                                    //
	///////////////////////////////////////////////////////////////////////////////////////
	
	 $scope.createOrJoinMeeting = function(){
		console.log('Create or join room', {room: roomid, username: $scope.user.username});
		socket.emit('create or join meeting', {room: roomid, username: $scope.user.username});
	 }
	 
	 $scope.LeaveRoom = function(){
		console.log('Leave room', {room: roomid, username: $scope.user.username});
		socket.emit('leave', {room: roomid, username: $scope.user.username});
	 }
	 	
	socket.on('created', function (room){
	    console.log('Created room ' + room);
	  
	  isInitiator = true;
	});

	socket.on('full', function (room){
	    console.log('Room ' + room + ' is full');
	});

	socket.on('join', function (room){
	  //console.log('Another peer made a request to join room ' + room);
	  //console.log('This peer is the initiator of room ' + room + '!');
	  isChannelReady = true;
	});

	socket.on('joined', function (room){
	  console.log('This peer has joined room ' + room.room + ' '+ room.username);
	  isChannelReady = true;
	  $scope.startCalling();
	});

	socket.on('log', function (array){
	  console.log.apply(console, array);
	});
	
	window.onbeforeunload = function(e){
		$scope.LeaveRoom();
		if(!$scope.isOtherPeerBusy())
			sendMessage('bye');
	}
	
	function sendMessage(message){
		message = {msg:message};
		message.room = roomid;
		message.username = $scope.user.username;
		//console.log('Client sending message: ', message);
		socket.emit('message', message);
	}
	
	////////////////////////////////////////////////////////////////////////////////////////
	// Variables for WebRTC Session                                                       //
	///////////////////////////////////////////////////////////////////////////////////////
	
	var isChannelReady;
	var isInitiator = false;
	var isStarted = false;
	var sendChannel;
	var receiveChannel;
	var localStream;
	var localStreamScreen;
	var pc;
	var remoteStream;
	var remoteStreamScreen;
	var turnReady;
	var bell = new Audio('/sounds/bells_simple.mp3');
	bell.loop = true;
	
	var remotevideo = document.getElementById("remotevideo");
	remotevideo.src = null;
	
	var remotevideoscreen = document.getElementById("remotevideoscreen");
	remotevideoscreen.src = null;
	
	////////////////////////////////////////////////////////////////////////////////////////
	// WebRTC using sigaling logic                                                        //
	///////////////////////////////////////////////////////////////////////////////////////
	
	socket.on('message', function (message){
		console.log('Client received message: '+ message);
		
		if (message === 'got user media') {
			if (isInitiator && !isStarted) {
				$scope.startCalling();//maybeStart();
			}
		}
		else if (message.type === 'offer') {
			if (!isInitiator && !isStarted) {
				maybeStart();
			}
			pc.setRemoteDescription(new RTCSessionDescription(message));
			doAnswer();
		} else if (message.type === 'answer' && isStarted) {
			pc.setRemoteDescription(new RTCSessionDescription(message));
		} else if (message.type === 'candidate' && isStarted) {
			var candidate = new RTCIceCandidate({
				sdpMLineIndex: message.label,
				candidate: message.candidate
			});
			pc.addIceCandidate(candidate);
		} else if (message === 'bye' && isStarted) {
			handleRemoteHangup();
		}
	});
	
	function maybeStart() {	
		//console.log('isStarted localstream isChannelReady ', isStarted, localStream, isChannelReady)
		  if (!isStarted && typeof localStream != 'undefined' && isChannelReady) {
			
			createPeerConnection();
			pc.addStream(localStream);
			isStarted = true;
			
			if (isInitiator) {
			  doCall();
			}
		  }
	}
	
	////////////////////////////////////////////////////////////////////////////////////////
	// WebRTC logic                                                                       //
	///////////////////////////////////////////////////////////////////////////////////////
	
	function createPeerConnection() {
		  try {
			//
			//Different URL way for FireFox
			//
			pc = new RTCPeerConnection(pc_config, {optional: []});//pc_constraints);
			pc.onicecandidate = handleIceCandidate;
			pc.onaddstream = handleRemoteStreamAdded;
			pc.onremovestream = handleRemoteStreamRemoved;
			
			if (isInitiator) {
				try {
				  // Reliable Data Channels not yet supported in Chrome
				  try{
					sendChannel = pc.createDataChannel("sendDataChannel", {reliable: true});
				  }
				  catch(e){
					  console.log('UNRELIABLE DATA CHANNEL')
					  sendChannel = pc.createDataChannel("sendDataChannel", {reliable: false});
				  }
				  sendChannel.onmessage = handleMessage;
				  trace('Created send data channel');
				} catch (e) {
				  alert('Failed to create data channel. ' +
						'You need Chrome M25 or later with RtpDataChannel enabled : '+ e.message );
				  trace('createDataChannel() failed with exception: ' + e.message);
				}
				sendChannel.onopen = handleSendChannelStateChange;
				sendChannel.onclose = handleSendChannelStateChange;
			  } else {
				pc.ondatachannel = gotReceiveChannel;
			  }
		  } catch (e) {
			console.log('Failed to create PeerConnection, exception: ' + e.message);
			alert('Cannot create RTCPeerConnection object.');
			  return;
		  }
	}
	
	function handleIceCandidate(event) {
		  if (event.candidate) {
			sendMessage({
			  type: 'candidate',
			  label: event.candidate.sdpMLineIndex,
			  id: event.candidate.sdpMid,
			  candidate: event.candidate.candidate});
		  } else {
			console.log('End of candidates.');
		  }
	}

	function handleCreateOfferError(event){
		console.log('createOffer() error: ', e);
	}

	function doCall() {
		  console.log('Sending offer to peer');
		  pc.createOffer(setLocalAndSendMessage, handleCreateOfferError);
	}

	function doAnswer() {
		  console.log('Sending answer to peer.');
		  pc.createAnswer(setLocalAndSendMessage, function (error){console.log(error)}, sdpConstraints);
	}

	function setLocalAndSendMessage(sessionDescription) {
		  // Set Opus as the preferred codec in SDP if Opus is present.
		  pc.setLocalDescription(sessionDescription);
		  //console.log('setLocalAndSendMessage sending message' , sessionDescription);
		  sendMessage(sessionDescription);
	}
	
	$scope.firstVideoAdded = false;
	function handleRemoteStreamAdded(event) {
		  console.log('Remote stream added.');
		  
		  if($scope.firstVideoAdded == false){
			  remotevideo.src = URL.createObjectURL(event.stream);
			  remoteStream = event.stream;
			  $scope.firstVideoAdded = true;
		  }
		  else{
			  $scope.$apply(function(){
				$scope.screenSharedByPeer = true;
			  })
			  
			  remotevideoscreen.src = URL.createObjectURL(event.stream);
			  remoteStreamScreen = event.stream;
		  }
	}

	function handleRemoteStreamRemoved(event) {
		console.log('Remote stream removed. Event: ', event);
		$scope.$apply(function(){
				$scope.screenSharedByPeer = false;
		})
	}
	
	////////////////////////////////////////////////////////////////////////////////////////
	// Media Stream Logic                                                                 //
	///////////////////////////////////////////////////////////////////////////////////////
	
	var localPeerConnection, remotePeerConnection;
		 
	 function handleUserMedia(newStream){
			
		var localvideo = document.getElementById("localvideo");
		localvideo.src = URL.createObjectURL(newStream);
		localStream = newStream;
		$scope.localCameraOn = true;
		
		sendMessage('got user media');
		
		if (isInitiator) {
			maybeStart();
		}
		
	 }
	 
	 function handleUserMediaError(error){
		//console.log(error);
	 }		 
		
	 var video_constraints = {video: true, audio: true};
	 var screen_constraints = {video: { mandatory: { chromeMediaSource: 'screen' } }};
	 
	 $scope.startCalling = function(){
		getUserMedia(video_constraints, handleUserMedia, handleUserMediaError);
	 }
	 
	 ////////////////////////////////////////////////////////////////////////////////////////
	// Screen Sharing Logic                                                               //
	///////////////////////////////////////////////////////////////////////////////////////
	 
	 $scope.showScreenText = 'Share Screen';
	 
	 $scope.showScreen = function(){
		 
		 if($scope.showScreenText == 'Share Screen')
		 {
			getUserMedia(screen_constraints, handleUserMediaShowScreen, handleUserMediaErrorShowScreen)
			$scope.showScreenText = 'Hide Screen';
			$scope.screenSharedLocal = true;
		 }
		 else
		 {
			 if(localStreamScreen){
				 localStreamScreen.stop();
				 pc.removeStream(localStreamScreen);
				 doCall();
			 }
			   
			 $scope.showScreenText = 'Share Screen';
			 $scope.screenSharedLocal = false;
		 }
	     
	 }
	 
	 function handleUserMediaShowScreen(newStream){
		
		//if(localStream){
		//	localStream.stop();
		//	pc.removeStream(localStream);
		//}
		
		var localvideoscreen = document.getElementById("localvideoscreen");
		localvideoscreen.src = URL.createObjectURL(newStream);
		localStreamScreen = newStream;
		pc.addStream(localStreamScreen);
		$scope.localCameraOn = true;
		
		doCall();
		
	 }
	   
	 function handleUserMediaErrorShowScreen(error){
		//console.log(error);
		$scope.addAlertCallStart('danger', 'If you tried to share '+
									'screen you must enable the option "Enable screen capture support in getUserMedia()." '+
									'from chrome://flags. Type chrome://flags in separate tab of your Chrome browser to enable the option.');
									
	 }
	 
	 
	 ////////////////////////////////////////////////////////////////////////////////////////
	// WebRTC DataChannel logic (Text Messages)                                           //
	///////////////////////////////////////////////////////////////////////////////////////
	
	$scope.userMessages = [];
		
	$scope.sendData = function() {
		 
		 var data = $scope.dataChannelSend;
		  sendChannel.send(''+ $scope.user.username +': '+ data);
		  //trace('Sent data: ' + data);
		  $scope.userMessages.push('Me: '+ data)
		  $scope.dataChannelSend = '';
		  
		  var chatBox = document.getElementById('chatBox');
		  chatBox.scrollTop = 300 + 8 + ($scope.userMessages.length * 240);
	 
	 }
	
	function handleMessage(event) {
	  //trace('Received message: ' + event.data);
	  //document.getElementById("dataChannelReceive").value = event.data;
	  
		var message = event.data;
		
		if(message.byteLength) {
			process_binary(0,message,0);
		}
		else if (message.charAt(0) == '{' && message.charAt(message.length-1) == '}') {
			process_data(message);
		}
	    else {
		  $scope.$apply(function(){
			  
			  $scope.userMessages.push(event.data)
			 
		  })
		  var chatBox = document.getElementById('chatBox');
		  chatBox.scrollTop = 300 + 8 + ($scope.userMessages.length * 240);
	  }
	}
	
	function handleSendChannelStateChange() {
		  var readyState = sendChannel.readyState;
		  //trace('Send channel state is: ' + readyState);
		  enableMessageInterface(readyState == "open");
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
		  enableMessageInterface(readyState == "open");
	}

	function enableMessageInterface(shouldEnable) {
		  if (shouldEnable) {
			//dataChannelSend.disabled = false;
			//dataChannelSend.focus();
			//dataChannelSend.placeholder = "";
			//sendButton.disabled = false;
		  } else {
			//dataChannelSend.disabled = true;
			//sendButton.disabled = true;
		  }
	}
	
	 ////////////////////////////////////////////////////////////////////////////////////////
	// File Sharing Logic                                                                 //
	///////////////////////////////////////////////////////////////////////////////////////
	
	window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
	window.URL = window.URL || window.webkitURL;
	accept_inbound_files();
	
	/* event delegation 
	 * -we need to do this to form a chrome app - see https://developer.chrome.com/extensions/contentSecurityPolicy#H2-3
	 * -huge thanks to http://stackoverflow.com/questions/13142664/are-multiple-elements-each-with-an-addeventlistener-allowed 
	 */
	function fileEventHandler(e)
	{
		e = e || window.event;
		var target = e.target || e.srcElement;
		if (target.id.search('-download') != -1) {
			download_file(target.id.replace("-download", ""));
		} else if (target.id.search('-cancel') != -1) {
			cancel_file(target.id.replace("-cancel", ""));
		} else if (target.id == 'upload_stop') {
			upload_stop();
		}
	}
	document.body.addEventListener('click',fileEventHandler,false);
	
	/* sending functionality, only allow 1 file to be sent out at a time */
	var chunks = {};
	var meta = {};
	var filesysteminuse = false;
	var FSdebug = false;
	var chunksPerACK = 16; /* 16k * 16 = 256k (buffer size in Chrome & seems to work 100% of the time) */
	
	function get_chunk_size(me, peer) {

		return 16000;//64000;//36000;

	}
	
	/* Used in Chrome to handle larger files (and firefox with idb.filesystem.js) */
	window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
	var file_to_upload;    /* "pointer" to external file */

	/* recieving functionality, values stored per user id */
	var fs = [];  /* hold our filesystems for download files */
	var saved_fileEntry = []; /* holds temporary fileEntry's during last encryption hash check */
	var downloading = []; /* downloading or not */
	var recieved_meta = []; /* the file meta data other users send over */
	var recievedChunks = []; /* store the chunks in memory before writing them to filesystem */
	var recievedChunksWritePointer = []; /* stores the # of the next chunk to be written to the filesystem */
	var createdChunksWritePointer = []; /* true if the file has been created*/
	var requestedChunksWritePointer = []; /* stores the value of the next chunk to be requested */
	
	/* stop the uploading! */
	function upload_stop() {
		/* remove data */
		chunks = {};
		meta = {};
	
		/* also clear the container */
		create_or_clear_container(0);
		
		/* firefox and chrome specific I think, but clear the file input */
		document.getElementById('file').value='';
	}
	
	/* write a peice of a file to a file on the filesystem... allows for unlimited file size!
	 * FF does have a limitation in that we cannot load files directly out of idb.filesystem.js, we must first load them into memory :(
	 */
	function write_to_file(user_id, chunk_data, chunk_num, hash) {

		//console.log('got Chunks : ', chunk_data)
		
		/* store our chunk temporarily in memory */
		recievedChunks[user_id][chunk_num % chunksPerACK] = chunk_data;
		
		/* once done recieving all chunks for this ack, start writing to memory */
		if (chunk_num %chunksPerACK == (chunksPerACK-1) || recieved_meta[user_id].numOfChunksInFile == (chunk_num+1)) {
			store_in_fs(user_id, hash);
		}
	}
	
	/* only called by write_to_file */
	function store_in_fs(user_id, hash) {
		
		/* massive thanks to http://stackoverflow.com/questions/10720704/filesystem-api-upload-from-local-drive-to-local-filesystem */
		if (createdChunksWritePointer[user_id] == false) {
			options = { create: true };
			createdChunksWritePointer[user_id] = true;
		} else {
			options = { create: false };
		}
		
		fs[user_id].root.getFile(
			recieved_meta[user_id].name,
			options,
			function(fileEntry) {
				/* create a writer that can put data in the file */
				fileEntry.createWriter(function(writer) {
				
					/* once we have written all chunks per ack */
					writer.onwriteend = function() {

						/* request the next chunk */
						recievedChunks[user_id] = [];
						requestedChunksWritePointer[user_id] += chunksPerACK;

						if (recieved_meta[user_id].numOfChunksInFile > recievedChunksWritePointer[user_id]) {
							request_chunk(user_id, recievedChunksWritePointer[user_id], hash);
						}
					};
					
					writer.onerror = FSerrorHandler;

					/* build the blob based on the binary array this.recievedChunks[user_id] */
					var builder = new Blob(recievedChunks[user_id], [recieved_meta[user_id].type]);
					
					/* debug */
					if (FSdebug) {
						console.log("DEBUG: writing chunk2 "+ recievedChunksWritePointer[user_id]);
						for (i=0;i<chunksPerACK;i++) {
							if (recievedChunks[user_id][i]) {
								console.log('recived: '+CryptoJS.SHA256(_arrayBufferToBase64(recievedChunks[user_id][i])).toString(CryptoJS.enc.Base64));
							}
						}
					}
					
					/* write the blob to the file, this can only be called once! Will fail silently if called while writing! We avoid this by only writing once per ack. */
					var seek = recievedChunksWritePointer[user_id] * get_chunk_size('chrome', recieved_meta[user_id].browser); //don't hardcode
					writer.seek(seek);
					writer.write(builder);
					recievedChunksWritePointer[user_id] += chunksPerACK;
					
					/* EOF condition */
					if (recieved_meta[user_id].numOfChunksInFile <= (recievedChunksWritePointer[user_id])) {
						//console.log("creating file link!");
							
						/* stop accepting file info */
						downloading[user_id] = false;
						
						/* on encrypted completion here, send hash back to other user who verifies it, then sends the OK to finish back */
						//if (encryption_type != "NONE") {
							//saved_fileEntry[user_id] = fileEntry;
							//request_chunk(user_id, recievedChunksWritePointer[user_id], hash); /* this chunk doesn't exist, but we need the hash of the last chunk to be verified */
						//} else {
							if (webrtcDetectedBrowser == "chrome") {
								create_file_link (recieved_meta[user_id], user_id, fileEntry);
							} else {
								/* one little idb.filesystem.js quirk */
								fileEntry.file(function(file) { 
									create_file_link (recieved_meta[user_id], user_id, file); /* <-- file, not fileEntry */
								});
							}
						//}
					}
				}, FSerrorHandler);
			}, FSerrorHandler);
	}

	/* process local inbound files */
	function process_inbound_files(file) {

		file_to_upload = file;
		
		meta.name = file.name;
		meta.size = file.size;
		meta.filetype = file.type;
		meta.browser = 'chrome';//$.browser.name; /* need browser name to set chunk size */ // should not be hardcoded
		//console.log(meta);
		
		send_meta();
		sendChannel.send("You have received a file. Download and Save it.");
		/* user 0 is this user! */
		create_upload_stop_link(file_to_upload.name, 0);//, username);
	}
	
	/* Document bind's to accept files copied. Don't accept until we have a connection */
	function accept_inbound_files() {
		
		document.getElementById('file').addEventListener('change', function(e) {
			if (e.target.files.length == 1) {
				var file = e.target.files[0];
		
				process_inbound_files(file);
			}
		}, false);
	}
	
	/* inbound - recieve binary data (from a file)
	 * we are going to have an expectation that these packets arrive in order (requires reliable datachannel)
	 */
	function process_binary(id,message,hash) {
		if (!downloading[id]) {
			return;
		}
		
		if (FSdebug) {
			console.log("processing chunk # " + recieved_meta[id].chunks_recieved);
		}
		
		/* We can write to a file using FileSystem! Chrome has native support, FF uses idb.filesystem.js library */
		/* Note that decrypted file packets are passed here by file_decrypt, we don't have to do any decryption here */
		
		write_to_file(id, message, recieved_meta[id].chunks_recieved, hash);//id, rtc.usernames[id], message, recieved_meta[id].chunks_recieved, hash
		recieved_meta[id].chunks_recieved++;
		
		if (recieved_meta[id].numOfChunksInFile > recieved_meta[id].chunks_recieved) {
			update_container_percentage(id, recieved_meta[id].chunks_recieved - 1, recieved_meta[id].numOfChunksInFile, recieved_meta[id].size);
		} else {
			//console.log("done downloading file!");
			/* stop accepting file info */
			downloading[id] = false;
			/* creating the download link is handled by write_to_file */
		}
	}
	
	/* inbound - recieve data
	 * note that data.chunk refers to the incoming chunk #
	 */
	function process_data(data) {
		data = JSON.parse(data).data;
		//console.log('process_data function: ', data)
		if (data.file_meta) {
			/* we are recieving file meta data */
		
			/* if it contains file_meta, must be meta data! */
			recieved_meta[0] = data.file_meta;
			recieved_meta[0].numOfChunksInFile = Math.ceil(recieved_meta[0].size / get_chunk_size(recieved_meta[0].browser, 'chrome'));// Don't hardcode
			recieved_meta[0].name = sanitize(recieved_meta[0].name);
			
			/* we are not downloading anymore if we just got meta data from a user
			 * call to create_pre_file_link is reliant on this to not display [c] button on new file information
			*/
			downloading[0] = false;
			delete_file(0);
			
			
			/* create a download link */
			create_pre_file_link(recieved_meta[0], 0, data.username);
			
			/* if auto-download, start the process */
			/* removed feature
			if ($("#auto_download").prop('checked')) {
				download_file(data.id);
			}
			*/
			
			//console.log(recieved_meta[0]);
		} else if (data.kill) {
			/* if it is a kill msg, then the user on the other end has stopped uploading! */
			
			downloading[0] = false;
			delete_file(0);
			if (recieved_meta[0]) {
				recieved_meta[0].chunks_recieved = 0;
			}
			create_or_clear_container(0);
			
		} else if (data.ok_to_download) {
			/* if we recieve an ok to download message from other host, our last file hash checks out and we can now offer the file up to the user */
			
			if (is_chrome) {
				create_file_link (recieved_meta[0], 0, saved_fileEntry[0]);
			} else {
				/* one little idb.filesystem.js quirk */
				saved_fileEntry[0].file(function(file) { 
					create_file_link (recieved_meta[0], 0, file); /* <-- file, not fileEntry */
				});
			}
		} else {
			
			//console.log('Chunk is requested')

			/* Otherwise, we are going to assume that if we have reached here, this is a request to download our file */
			if (data.chunk % chunksPerACK == 0) {
				for (i=0;i<chunksPerACK;i++) {
					send_chunk_if_queue_empty(0, data.chunk + i, data.browser, data.rand, data.hash);
				}
			}
		}
	}
	
	/* Use this to avoid xss
	 * recommended escaped char's found here - https://www.owasp.org/index.php/XSS_(Cross_Site_Scripting)_Prevention_Cheat_Sheet#RULE_.231_-_HTML_Escape_Before_Inserting_Untrusted_Data_into_HTML_Element_Content
	 */
	function sanitize(msg) {
	  msg = msg.toString();
	  return msg.replace(/[\<\>"'\/]/g,function(c) {  var sanitize_replace = {
			"<" : "&lt;",
			">" : "&gt;",
			'"' : "&quot;",
			"'" : "&#x27;",
			"/" : "&#x2F;"
		}
		return sanitize_replace[c]; });
	}
	
	
	/* request chunk # chunk_num from id, at this point just used to request the first chunk */
	function request_chunk(id, chunk_num, hash) {
		if (FSdebug) {
			console.log("DEBUG: requesting chunk " + chunk_num + " from " + id);
		}
		
		//console.log('Function which actually asks for chunk')

			sendChannel.send(JSON.stringify({ //id, JSON.stringify({
				"eventName": "request_chunk",
				"data": {
					"chunk": chunk_num,
					"browser": 'chrome'
				}
			}));

	}
	
	/* bootstrap alerts! */
	function boot_alert(text) {
		console.log('Boot_alert: ', text);
		//$("#alerts").append('<div class="alert alert-danger alert-dismissable">'+text+'<button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button></div>');
	}
	
	/* request id's file by sending request for block 0 */
	function download_file(id) {

		/* event listeners or javascript can call us, if id isn't set, must have been an event listener */
		/*if (typeof id == 'object') {
			var str = id.target.id;
			id = str.replace("-download", "");
		}*/

		/* We can't request multiple filesystems or resize it at this time. Avoiding hacking around this ATM
		 * and will instead display warning that only 1 file can be downloaded at a time :(
		 */
		 if (filesysteminuse) {
			//console.log('Sorry, but only 1 file can be downloaded or stored in browser memory at a time, please [c]ancel or [d]elete the other download and try again.')
			boot_alert("Sorry, but only 1 file can be downloaded or stored in browser memory at a time, please [c]ancel or [d]elete the other download and try again.");
			return;
		}

		window.requestFileSystem(window.TEMPORARY, recieved_meta[id].size, function(filesystem) {
			fs[id] = filesystem;
			filesysteminuse = true;
			downloading[id] = true; /* accept file info from user */
			request_chunk(id, 0, 0);
		});
		
		recieved_meta[id].chunks_recieved = 0;
		recievedChunksWritePointer[id] = 0;
		createdChunksWritePointer[id] = false;
		requestedChunksWritePointer[id] = 0;
		recievedChunks[id] = [];
	}
	
	
	/* delete a file - should be called when cancel is requested or kill is called */
	function delete_file(user_id) {
		if (fs[user_id]) {
			filesysteminuse = false;
			fs[user_id].root.getFile(recieved_meta[user_id].name, {create: false}, function(fileEntry) {
				fileEntry.remove(function() {
					console.log('File removed.');
				}, FSerrorHandler);
			}, FSerrorHandler);
		}
	}

	/* cancel incoming file */
	function cancel_file(id) {
		downloading[id] = false; /* deny file info from user */
		delete_file(id);
		recieved_meta[id].chunks_recieved = 0;
		/* create a new download link */
		create_pre_file_link(recieved_meta[id], id);
	}
	
	
	/* creates an entry in our filelist for a user, if it doesn't exist already - TODO: move this to script.js? */
	function create_or_clear_container(id) {
		var filelist = document.getElementById('filelist_cointainer');
		var filecontainer = document.getElementById(id);
		//username = sanitize(username);
		
		/* if the user is downloading something from this person, we should only clear the inside span to save the cancel button */
		if (downloading[id] == true) {
			var span = document.getElementById(id + "-span");
			if (!span) {
				filecontainer.innerHTML = '<span id="'+id+'-span"></span>';
				/* add cancel button */
				var a = document.createElement('a');
				a.download = meta.name;
				a.id = id + '-cancel';
				a.href = 'javascript:void(0);';
				a.style.cssText = 'color:red;';
				a.textContent = '[c]';
				a.draggable = true;
				//append link!
				filecontainer.appendChild(a);
			} else {
				span.innerHTML="";
			}
			return;
		}
		var username=''; // temporary
		if (!filecontainer) {
			/* if filecontainer doesn't exist, create it */
			var fs = '<div id="' + id + '">' + username + '</div>';
			filelist.innerHTML = filelist.innerHTML + fs;
		} else {
			/* if filecontainer does exist, clear it */
			filecontainer.innerHTML = username;
		}
	}
	
	
	/* creates an entry in our filelist for a user, if it doesn't exist already */
	function remove_container(id) {
		var filecontainer = document.getElementById(id);
		if (filecontainer) {
			filecontainer.remove();
		}
		if (fs[id]) {
			delete_file(id);
		}
	}

	/////////////
	// TODO Will see this later, commenting for now
	/////////////
	/* create a link that will let the user start the download */
	function create_upload_stop_link(filename, id){//, username) {
		
		//create a place to store this if it does not already
		create_or_clear_container(id);//, username);
		var filecontainer = document.getElementById(id);
		
		//create the link
		var span = document.createElement('span');
		span.textContent = ''+filename + ' ';
		
		var a = document.createElement('a');
		a.download = meta.name;
		a.id = 'upload_stop';
		a.href = 'javascript:void(0);';
		a.textContent = '[Stop Upload]';
		a.style.cssText = 'color:red;';
		a.draggable = true;
		
		//append link!
		filecontainer.appendChild(span);
		filecontainer.appendChild(a);
		 
	}

	/* create a link that will let the user start the download */
	function create_pre_file_link(meta, id, username) {
		
		//create a place to store this if it does not already
		create_or_clear_container(id);
		var filecontainer = document.getElementById(id);
		
		//create the link
		var span = document.createElement('span');
		span.textContent = '';
		
		var a = document.createElement('a');
		a.download = meta.name;
		a.id = id + '-download';
		a.href = 'javascript:void(0);';
		a.textContent = 'Download : ' + meta.name + ' ' + getReadableFileSizeString(meta.size);
		a.draggable = true;
		
		//append link!
		filecontainer.appendChild(span);
		filecontainer.appendChild(a);

		//append to chat
		sendMessage($scope.user.username +" is now offering file " + meta.name);
	}
	
	/* update a file container with a DL % */
	function update_container_percentage(id, chunk_num, chunk_total, total_size) {

		create_or_clear_container(id);
		var span = document.getElementById(id+'-span');

		/* create file % based on chunk # downloaded */
		var percentage = (chunk_num / chunk_total) * 100;
		span.innerHTML = percentage.toFixed(1) + "% of " + getReadableFileSizeString(total_size) + ' ';
		
	}

	/* -h */
	function getReadableFileSizeString(fileSizeInBytes) {
		var i = -1;
		var byteUnits = [' kB', ' MB', ' GB', ' TB', 'PB', 'EB', 'ZB', 'YB'];
		do {
			fileSizeInBytes = fileSizeInBytes / 1024;
			i++;
		} while (fileSizeInBytes > 1024);
		return Math.max(fileSizeInBytes, 0.1).toFixed(1) + byteUnits[i];
	};

	/* create a link to this file */
	function create_file_link (meta, id, fileEntry) {
		//grab the file type, should probably use a pattern match...
		var remove_base = meta.filetype.split(";");
		var remove_data = remove_base[0].split(":");
		var filetype = remove_data[1];
		var debase64_data;
		
		//create a place to store this if it does not already
		create_or_clear_container(id);
		var filecontainer = document.getElementById(id);
		
		//create the link
		var span = document.createElement('span');
		span.textContent = '';
		var a = document.createElement('a');
		a.download = meta.name;
		/* One difference with Chrome & FF :( */
		if (webrtcDetectedBrowser == "chrome") {
			/* we are going to link to our local file system */
			a.href = fileEntry.toURL();
		} else {
			/* fileEntry is actually not a FileEntry, but a blob in Chrome */
			a.href = window.URL.createObjectURL(fileEntry);
		}
		a.textContent = 'Save : ' + meta.name;
		a.dataset.downloadurl = [filetype, a.download, a.href].join(':');
		a.draggable = true;

		//append link!
		var messages = document.getElementById('messages');
		filecontainer.appendChild(span);
		filecontainer.appendChild(a);
		
		/* make delete button */
		filecontainer.innerHTML = filecontainer.innerHTML+ " ";
		/* add cancel button */
		var can = document.createElement('a');
		can.download = meta.name;
		can.id = id + '-cancel';
		can.href = 'javascript:void(0);';
		can.style.cssText = 'color:red;';
		can.textContent = '[d]';
		can.draggable = true;
		//append link!
		filecontainer.appendChild(can);
		
		//append to chat
		sendMessage("File " + meta.name + " is ready to save locally");
	}
	
	
	/* send out meta data, allow for id to be empty = broadcast */
	function send_meta(id) {
		/*if (jQuery.isEmptyObject(meta)) {
			return;
		}*/
		
		//console.log("sending meta data");
		//console.log(meta);
		
			sendChannel.send(JSON.stringify({
				eventName: "data_msg",
				data: {
					file_meta: meta
				}
			}));
		
	}
	
	/* Please note that this works by sending one chunk per ack */

	function sendchunk(id, chunk_num, other_browser, rand, hash) {
		/* uncomment the following lines and set breakpoints on them to simulate an impaired connection */
		/* if (chunk_num == 30) { console.log("30 reached, breakpoint this line");}
		if (chunk_num == 50) { console.log("30 reached"); }*/

		var reader = new FileReader;
		var upper_limit = (chunk_num + 1) * get_chunk_size(other_browser, 'chrome'); //don't hardcode
		if (upper_limit > meta.size) { upper_limit = meta.size; }
		
		var seek = chunk_num * get_chunk_size(other_browser, 'chrome'); //don't hardcode
		var blob = file_to_upload.slice(seek, upper_limit);
		reader.onload = function(event) { 
			if (reader.readyState == FileReader.DONE) {
				
				//if (encryption_type != "NONE") {
				//	file_encrypt_and_send(id, event.target.result, rand, chunk_num);
				//} else {
					if (FSdebug) {
						console.log("DEBUG: sending chunk "+ chunk_num);
						console.log('sending: '+CryptoJS.SHA256(_arrayBufferToBase64(event.target.result)).toString(CryptoJS.enc.Base64));
					}
					
					sendChannel.send(event.target.result);//id, event.target.result);
				//}
			}
			
			
		}
		reader.readAsArrayBuffer(blob);
	}
	
	/* ideally we would check the SCTP queue here to see if we could send, doesn't seem to work right now though... */
	function send_chunk_if_queue_empty(id, chunk_num, other_browser, rand, hash) {
		//if (encryption_type != "NONE") {
		//	if ( chunk_num > Math.ceil(file_to_upload.size / get_chunk_size($.browser.name, other_browser))) { /* allow numOfChunksInFile+1 in for last encrpytion hash verification */
		//		return;
		//	}
		//} else {
			if ( chunk_num >= Math.ceil(file_to_upload.size / get_chunk_size('chrome', other_browser))) { //don't hardcode
				return;
			}
		//}
		
		sendchunk(id, chunk_num, other_browser, rand, hash);
	}

	/***** File System Errors *****/
	//credit - http://www.html5rocks.com/en/tutorials/file/filesystem/
	function FSerrorHandler(e) {
	  var msg = '';
	  switch (e.code) {
		case FileError.QUOTA_EXCEEDED_ERR:
		  msg = 'QUOTA_EXCEEDED_ERR';
		  break;
		case FileError.NOT_FOUND_ERR:
		  msg = 'NOT_FOUND_ERR';
		  break;
		case FileError.SECURITY_ERR:
		  msg = 'SECURITY_ERR';
		  break;
		case FileError.INVALID_MODIFICATION_ERR:
		  msg = 'INVALID_MODIFICATION_ERR';
		  break;
		case FileError.INVALID_STATE_ERR:
		  msg = 'INVALID_STATE_ERR';
		  break;
		default:
		  msg = 'Unknown Error';
		  break;
	  };
	  console.error('Error: ' + msg);
	}

	//used for debugging - credit - http://stackoverflow.com/questions/9267899/arraybuffer-to-base64-encoded-string
	function _arrayBufferToBase64( buffer ) {
		var binary = ''
		var bytes = new Uint8Array( buffer )
		var len = bytes.byteLength;
		for (var i = 0; i < len; i++) {
			binary += String.fromCharCode( bytes[ i ] )
		}
		return window.btoa( binary );
	}



	////////////////////////////////////////////////////////////////////////////////////////
	// File Sharing Logic End                                                              //
	////////////////////////////////////////////////////////////////////////////////////////

}