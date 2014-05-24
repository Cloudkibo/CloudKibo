angular.module('cloudKiboApp', ['angularFileUpload', 'ngAnimate', 'ui.bootstrap', 'ngRoute'])

	.config(function($routeProvider) {
	  
		$routeProvider.
		  
		  when('/dashboard', {
			templateUrl: '/templates/dashboard',
			controller: 'DashBoardController'
		  }).
		  
		  when('/createcourse', {
			templateUrl: '/templates/createcourse',
			controller: 'CreateCourseController'
		  }).
		  
		  when('/mycourses', {
			templateUrl: '/templates/mycourses',
			controller: 'MyCoursesController'
		  }).
		  
		  when('/myfiles', {
			templateUrl: '/templates/myfiles',
			controller: 'MyFilesController'
		  }).
		  
		  when('/searchcourses', {
			templateUrl: '/templates/searchcourses',
			controller: 'SearchCoursesController'
		  }).
		  
		  when('/displaycourse/:courseid', {
			templateUrl: function(params){ return '/displaycourse/'+ params.courseid},
			controller: 'DisplayCourseController'
		  }).
		  
		  when('/enrollcourse/:courseid', {
			templateUrl: function(params){ return '/enrollcourse/'+ params.courseid},
			controller: 'MyCoursesController'
		  }).
		  
		  when('/dropcourse/:courseid', {
			templateUrl: function(params){ return '/dropcourse/'+ params.courseid},
			controller: 'MyCoursesController'
		  }).
		  
		  when('/editcourse/:courseid', {
			templateUrl: function(params){ return '/editcourse/'+ params.courseid},
			controller: 'EditCourseController'
		  }).
		  
		  when('/viewteacherprofile/:teacherid', {
			templateUrl: function(params){ return '/viewteacherprofile/'+ params.teacherid},
			controller: 'ViewOtherProfileController'
		  }).
		  
		  when('/viewstudentprofile/:studentid', {
			templateUrl: function(params){ return '/viewstudentprofile/'+ params.studentid},
			controller: 'ViewOtherProfileController'
		  }).
		  
		  otherwise({
			redirectTo: '/'
		  });
		  
	})
	
	.factory('Data', function(){
		return {theLimit : 10};
	})
	
	.factory('EducationView', function(){
		return {isOn : false};
	})
	
	.factory('socket', function($rootScope) {
		var socket = io.connect();
		return {
			on: function(eventName, callback) {
				socket.on(eventName, function() {
					var args = arguments;
					$rootScope.$apply(function() {
						callback.apply(socket, args);
					});
				});
			},
			emit: function(eventName, data, callback) {
				socket.emit(eventName, data, function() {
					var args = arguments;
					$rootScope.$apply(function() {
						if(callback) {
						callback.apply(socket, args);
						}
					});
				});
			}
		};
	})
	
	.factory('pc_config', function(){
		//turnserver -o -f -a -n -v -L 107.170.46.121 -u cloudkibo:cloudkibo -r kibo
		return pc_config = {'iceServers': [createIceServer('stun:stun.l.google.com:19302', null, null),
								createIceServer('turn:107.170.46.121:3478?transport=udp', 'cloudkibo', 'cloudkibo'),
								createIceServer('turn:107.170.46.121:3478?transport=tcp', 'cloudkibo', 'cloudkibo')
								//createIceServer('stun:stun.anyfirewall.com:3478', null, null),
								//createIceServer('turn:turn.bistri.com:80?transport=udp', 'homeo', 'homeo'),
								//createIceServer('turn:turn.bistri.com:80?transport=tcp', 'homeo', 'homeo'),
								//createIceServer('turn:turn.anyfirewall.com:443?transport=tcp', 'webrtc', 'webrtc')
                ]};
                /*
				{url: 'turn:cloudkibo@162.243.217.34:3478?transport=udp', username: 'cloudkibo',
													credential: 'cloudkibo'}
				*/
	})
	
	.factory('pc_constraints', function(){
		return pc_constraints = {'optional': [{'DtlsSrtpKeyAgreement': true}, {'RtpDataChannels': true}]};
	})
	
	.factory('sdpConstraints', function(){
		return sdpConstraints = {'mandatory': {
								  'OfferToReceiveAudio':true,
								  'OfferToReceiveVideo':true }};
	})


	
	.directive('ngConfirmClick', [ function(){
		return {
		  priority: -1,
		  restrict: 'A',
		  link: function(scope, element, attrs){
			element.bind('click', function(e){
			  var message = attrs.ngConfirmClick;
			  if(message && !confirm(message)){
				e.stopImmediatePropagation();
				e.preventDefault();
			  }
			});
		  }
		}
	  }
	])

	
	


	
	// see them, they are not working
	.directive('scrollItem',function(){
		return{
		restrict: "A",
		link: function(scope, element, attributes) {
			if (scope.$last){
				//console.log('Emitting FINISHED')
			   scope.$emit("Finished");
		   }
		}
	   }
	})
	
	// does not work
	.directive('scrollIf', function() {
	return{
		restrict: "A",
		link: function(scope, element, attributes) {
			scope.$on("Finished",function(){
				//var chat_height = 300;
				//console.log('Catching EMIT', chat_height);
				//element.scrollTop = chat_height; 
				//var chatBox = document.getElementById('chatBox');
			  //chatBox.scrollTop = 300 + 8 + (1 * 240);
			});
		}
	   }
	  })
	
	// does not work
	.directive("myStream", function(){
	   return {        
		  restrict: 'A',
		  scope:{config:'='},
		  link: function(scope, element, attributes){
		   //Element is whatever element this "directive" is on
		   getUserMedia( {video:true}, function (stream) {
			   console.log(stream)
			 element.src = URL.createObjectURL(stream);
			 //scope.config = {localvideo: element.src};
			 //scope.$apply(); //sometimes this can be unsafe.
		   }, function(error){ console.log(error) });
		  }
	   }

	})
	
	.directive('ngFocus', [function() {
		  var FOCUS_CLASS = "ng-focused";
		  return {
			restrict: 'A',
			require: 'ngModel',
			link: function(scope, element, attrs, ctrl) {
			  ctrl.$focused = false;
			  element.bind('focus', function(evt) {
				element.addClass(FOCUS_CLASS);
				scope.$apply(function() {ctrl.$focused = true;});
			  }).bind('blur', function(evt) {
				element.removeClass(FOCUS_CLASS);
				scope.$apply(function() {ctrl.$focused = false;});
			  });
			}
		  }
		}]);
