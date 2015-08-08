/**
 * Created by sojharo on 8/1/2015.
 */
'use strict';

angular.module('cloudKiboApp')
  .directive('videoPlayer', function ($sce) {
    return {
      template: '<div class="videoBoxContainer">' +
      '<div class="{{divBoxClass}}" ng-hide="hasSharedVideo()"></div>' +
      '<video ng-src="{{trustSrc()}}" autoplay width="170px" ng-show="hasSharedVideo()" class="videoelement"></video>' +
      '<span>{{peerUserName()}}</span>' +
      '</div>',
      restrict: 'E',
      replace: true,
      scope: {
        vidSrc: '@',
        userName: '@',
        sharedVid: '@',
        divBoxClass: '@'
      },
      link: function (scope) {
        console.log('Initializing video-player');
        scope.trustSrc = function () {
          if (!scope.vidSrc) {
            return undefined;
          }
          return $sce.trustAsResourceUrl(scope.vidSrc);
        };
        scope.hasSharedVideo = function () {
          return scope.sharedVid;
        };
        scope.peerUserName = function () {
          if (!scope.userName) {
            return undefined;
          }
          return scope.userName;
        };
      }
    };
  });
