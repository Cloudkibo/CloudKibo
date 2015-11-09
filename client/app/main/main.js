'use strict';

angular.module('cloudKiboApp')
  .config(function ($routeProvider) {
          $routeProvider
            .when('/app', {
              templateUrl: '/home',
              controller: 'HomeController'
            });
  });
