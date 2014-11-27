'use strict';

angular.module('cloudKiboApp')
  .controller('LoginCtrl', function ($scope, Auth, $location, $window) {
    $scope.user = {};
    $scope.errors = {};
    
    $scope.alerts = [];

	$scope.addAlert = function(newtype, newMsg) {
		//console.log('Error', newtype, newMsg)
		$scope.alerts.push({type: newtype, msg: newMsg});
	};
	
	$scope.underProgress = function(){
		return $scope.progressState;
	}

	$scope.closeAlert = function(index) {
		$scope.alerts.splice(index, 1);
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
          $scope.progressState = false;
          $location.path('/app');
        })
        .catch( function(err) {
          console.log(err)
		      $scope.progressState = false;
          //$scope.errors.other = err.message;
          $scope.addAlert('danger', err.message)
        });
      }
    };

    $scope.loginOauth = function(provider) {
      $window.location.href = '/auth/' + provider;
    };
  });
