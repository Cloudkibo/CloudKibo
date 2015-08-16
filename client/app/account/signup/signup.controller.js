'use strict';

angular.module('cloudKiboApp')
  .controller('SignupCtrl', function ($scope, Auth, $location, $window, $log) {
    $scope.user = {};
    $scope.errors = {};

    $scope.alertsRegister = [];

	$scope.addAlertRegister = function(newtype, newMsg) {
		$scope.alertsRegister.push({type: newtype, msg: newMsg});
    $log.info('registering ');
	};

	$scope.closeAlertRegister = function(index) {
		$scope.alertsRegister.splice(index, 1);
	};

	$scope.underProgress = function(){
		return $scope.progressState;
	};

    $scope.register = function(form) {
      $log.info('registered account with info '+ form);

      $scope.submitted = true;

      $scope.progressState = true;

      if(form.$valid) {
        Auth.createUser($scope.user)
        .then( function() {
          // Account created, redirect to home
          $scope.progressState = false;
          $location.path('/app');
        })
        .catch( function(err) {
            $log.error('Error n registering account '+err)
          err = err.data;
          $scope.progressState = false;


          $scope.errors = {};

          // Update validity of form fields that match the mongoose errors
          angular.forEach(err.errors, function(error, field) {
            //form[field].$setValidity('mongoose', false);
            //$scope.errors[field] = error.message;
            $scope.addAlertRegister('danger', error.message)
          });
        });
      }
    };

    $scope.loginOauth = function(provider) {
      $window.location.href = '/auth/' + provider;
    };
  });
