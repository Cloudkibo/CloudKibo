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
      .when('/settings', {
        templateUrl: '/settings',
        controller: 'SettingsCtrl',
        authenticate: true
      });
  });
