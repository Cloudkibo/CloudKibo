'use strict';

angular.module('cloudKiboApp')
  .config(function ($routeProvider) {
    $routeProvider
      .when('/admin', {
        templateUrl: '/superuser',
        controller: 'AdminCtrl'
      });
  });