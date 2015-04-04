'use strict';

angular.module('cloudKiboApp')
  .controller('SignupCtrl', function ($scope, Auth, $location, $window) {
    $scope.user = {};
    $scope.errors = {};

    $scope.alertsRegister = [];

	$scope.addAlertRegister = function(newtype, newMsg) {
		$scope.alertsRegister.push({type: newtype, msg: newMsg});
	};

	$scope.closeAlertRegister = function(index) {
		$scope.alertsRegister.splice(index, 1);
	};

	$scope.underProgress = function(){
		return $scope.progressState;
	};

    $scope.register = function(form) {
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

              console.log(err);
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
