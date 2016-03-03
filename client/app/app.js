angular.module('cloudKiboApp', [
  'ngCookies',
  'ngResource',
  'ngSanitize',
  'ngRoute',
  'btford.socket-io',
  'ui.bootstrap',
  'kiboRtc',
  'ngFileUpload',
  'ngImgCrop'
  
  
])
  .config(function ($routeProvider, $locationProvider, $httpProvider) {
    $routeProvider

	  .when('/contact/:username', {
			templateUrl: function(params){ return '/getuserview/'+ params.username},
			controller: 'HomeController' // IMCONtroller
	  })

    .when('/conference/:mname', {
        templateUrl: function(params){ return '/conference/'+ params.mname},
        controller: 'ConferenceController'
    })
    
    .when('/survey/:mname', {
          
          templateUrl: function(params){console.log(params.mname);return '/survey/' + params.mname},
          controller: 'SurveyController'
    })
    .when('/otherBrowser', {
          templateUrl: '/otherBrowser/',
          controller: 'OtherBrowserController'
    })
    .when('/webmeeting/:mname', {
        templateUrl: function(params){ return '/webmeeting/'+ params.mname},
        controller: 'WebMeetingController'
    })
    
    .when('/livehelp/:mname', {
      templateUrl: function(params){ console.log(params); return '/livehelp/'+ params.mname +'?role='+ params.role},
      controller: 'LiveHelpController'
    })

    .otherwise({
      redirectTo: '/login'
    });

   /* $locationProvider.html5Mode({
	  enabled: true,
	  requireBase: false
	});*/
    

    $httpProvider.interceptors.push('authInterceptor');
  })

  .factory('CoreSocketService', function(socketFactory){
    var socket = socketFactory();

    return {
      socket: socket
    };
  })

  .factory('socket', function (CoreSocketService) {
     var socketObject = CoreSocketService.socket;

    return socketObject;

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
          $location.path('/login');
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
          return;
        }
        
    
        
      });
      if (!window.RTCPeerConnection || !navigator.getUserMedia) {
    //  $scope.error = 'WebRTC is not supported by your browser. You can try the app with Chrome and Firefox.';
    //  $log.error('WebRTC is not supported by your browser. You can try the app with Chrome and Firefox.');
    //  logger.log('WebRTC is not supported by your browser. You can try the app with Chrome and Firefox.');
    //  return;
    $location.path('/otherBrowser');
    }
      
      
      
    
    });
    

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
			   console.log(stream);
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

    
    