angular.module('cloudKiboApp', ['ngAnimate', 'ui.bootstrap', 'ngRoute'])

	.config(function ($routeProvider) {

	    $routeProvider.

	    when('/', {
	        templateUrl: '/welcomescreen',
	        controller: 'WelcomeScreenController'
	    })

	    .when('/:username', {
			templateUrl: function(params){ return '/getuserview/'+ params.username},
			controller: 'UserViewController'
		});

	})

	
	.factory('Data', function(){
		return {theLimit : 10};
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
		/*
		return pc_config = {'iceServers': [createIceServer('stun:stun.l.google.com:19302', null, null),
								createIceServer('stun:stun.anyfirewall.com:3478', null, null),
								createIceServer('turn:turn.bistri.com:80?transport=udp', 'homeo', 'homeo'),
								createIceServer('turn:turn.bistri.com:80?transport=tcp', 'homeo', 'homeo'),
								createIceServer('turn:turn.anyfirewall.com:443?transport=tcp', 'webrtc', 'webrtc')
                ]};
        */
        
        return pc_config = {'iceServers': [{url: 'turn:cloudkibo@162.243.217.34:3478?transport=udp', username: 'cloudkibo',
													credential: 'cloudkibo'},
								{url: 'stun:stun.l.google.com:19302', username: null, credential: null},
								{url: 'stun:stun.anyfirewall.com:3478', username: null, credential: null},
								{url: 'turn:turn.bistri.com:80?transport=udp', username: 'homeo', credential: 'homeo'},
								{url: 'turn:turn.bistri.com:80?transport=tcp', username: 'homeo', credential: 'homeo'},
								{url: 'turn:turn.anyfirewall.com:443?transport=tcp', username: 'webrtc', credential: 'webrtc'}
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


	
	.directive('schrollBottom', function () {
	  return {
		scope: {
		  schrollBottom: "="
		},
		link: function (scope, element) {
		  scope.$watchCollection('schrollBottom', function (newValue) {
			if (newValue)
			{
			  $(element).scrollTop($(element)[0].scrollHeight);
			}
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
