'use strict';

angular.module('cloudKiboApp')
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: '/index',
        controller: 'IndexController'
      })
      .when('/app', {
        templateUrl: '/home',
        controller: 'HomeController'
      })
      .when('/features', {
        templateUrl: '/features',
        controller: 'IndexController'
      });
  });
