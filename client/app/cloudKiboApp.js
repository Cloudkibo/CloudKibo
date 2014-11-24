angular.module('cloudKiboApp', [
  'ngCookies',
  'ngResource',
  'ngSanitize',
  'ngRoute',
  'btford.socket-io',
  'ui.bootstrap'
])
  .config(function ($routeProvider, $locationProvider, $httpProvider) {
    $routeProvider

	  .when('/contact/:username', {
			templateUrl: function(params){ return '/getuserview/'+ params.username},
			controller: 'HomeController'
	  })
	  
      .otherwise({
        redirectTo: '/'
      });

    $locationProvider.html5Mode({
	  enabled: true,
	  requireBase: false
	});
	
    $httpProvider.interceptors.push('authInterceptor');
  })
  
  .factory('socket', function (socketFactory) {
     return socketFactory();
  })

  .factory('authInterceptor', function ($rootScope, $q, $cookieStore, $location) {
    return {
      // Add authorization token to headers
      request: function (config) {
        config.headers = config.headers || {};
        if ($cookieStore.get('token')) {
          config.headers.Authorization = 'Bearer ' + $cookieStore.get('token');
        }
        return config;
      },

      // Intercept 401s and redirect you to login
      responseError: function(response) {
        if(response.status === 401) {
          $location.path('/');
          // remove any stale tokens
          $cookieStore.remove('token');
          return $q.reject(response);
        }
        else {
          return $q.reject(response);
        }
      }
    };
  })
  
  .factory('Data', function(){
		return {theLimit : 10};
	})

  .run(function ($rootScope, $location, Auth) {
    // Redirect to login if route requires auth and you're not logged in
    $rootScope.$on('$routeChangeStart', function (event, next) {
      Auth.isLoggedInAsync(function(loggedIn) {
        if (next.authenticate && !loggedIn) {
          $location.path('/login');
        }
      });
    });
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
