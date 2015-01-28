'use strict';

angular.module('cloudKiboApp')
  .config(function ($routeProvider) {
    $routeProvider
      .when('/login', {
        templateUrl: '/loginview',
        controller: 'LoginCtrl'
      })
      .when('/register', {
        templateUrl: '/registerview',
        controller: 'SignupCtrl'
      })
      .when('/forgotpassword', {
          templateUrl: '/forgotpasswordview',
          controller: 'ForgotPasswordController'
      })
      .when('/verify/:token', {
          templateUrl: function(params){ return '/verifyview/'+ params.token},
          controller: 'LoginCtrl'
      })
      .when('/resetpassword/:token', {
          templateUrl: function(params){ return '/resetpasswordview/'+ params.token},
          controller: 'NewPasswordController'
      })
      .when('/settings', {
        templateUrl: '/settings',
        controller: 'SettingsCtrl',
        authenticate: true
      });
  });
