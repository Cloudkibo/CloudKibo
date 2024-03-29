'use strict';

angular.module('cloudKiboApp')
  .controller('LoginCtrl', function ($scope, Auth, $location, $window, $log, logger, $http) {

    $http.get('/client_token_braintree').success(function(data){
      braintree.setup(data, "dropin", {
        container: "payment-form"
      });
    });

    Auth.isLoggedInAsync(function(data){
      if(data){
        $location.path('/app');
      }
    })

    $scope.user = {};
    $scope.errors = {};

    $scope.alerts = [];

  $scope.openDoc = function() {
    alert('hello');
	$window.location.href = '/developers.html'
  };  
	$scope.addAlert = function(newtype, newMsg) {
		$log.error('Error type '+ newtype+ " message "+ newMsg)
    logger.log('Error type '+ newtype+ " message "+ newMsg)
		$scope.alerts.push({type: newtype, msg: newMsg});
	};

      $scope.closeAlert = function(index) {
        $scope.alerts.splice(index, 1);
      };

	$scope.underProgress = function(){
		return $scope.progressState;
	};



    $scope.login = function(form) {
      $scope.submitted = true;

      $scope.progressState = true;

      if(form.$valid) {
        Auth.login({
          username: $scope.user1.username,
          password: $scope.user1.password
        })
        .then( function() {
          // Logged in, redirect to home
            logger.log("logged in")
          $scope.progressState = false;
          $location.path('/app');
        })
        .catch( function(err) {
          $log.warn(err)
            logger.log("loggin error"+err)
		      $scope.progressState = false;
          //$scope.errors.other = err.message;
          $scope.addAlert('danger', err.message)
            logger.log('danger', err.message)
          $log.info('error '+ err.message)
        });
      }
    };

    $scope.loginOauth = function(provider) {
      $window.location.href = '/auth/' + provider;
    };
  });