'use strict';

angular.module('cloudKiboApp')
  .controller('SettingsCtrl', function ($scope, User, Auth, $log, logger) {
    $scope.errors = {};

    $scope.changePassword = function(form) {
      $scope.submitted = true;
      if(form.$valid) {
        Auth.changePassword( $scope.user.oldPassword, $scope.user.newPassword )
        .then( function() {
          $scope.message = 'Password successfully changed.';
          $log.info('Passwrod was successfully changed '+$scope.message)
          logger.log('Passwrod was successfully changed '+$scope.message)
        })
        .catch( function() {
            $log.warn('incorrect password ')
            logger.log('incorrect password ')
          form.password.$setValidity('mongoose', false);
          $scope.errors.other = 'Incorrect password';
          $scope.message = '';
        });
      }
		};
  });
