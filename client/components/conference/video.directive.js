/**
 * Created by sojharo on 8/1/2015.
 */
'use strict';

angular.module('cloudKiboApp')
  .directive('videoPlayer', function ($sce) {
    return {
      template: '<div class="videoBoxContainer">' +
      '<div class="hideVideoBox" ng-hide="hasSharedVideo()"></div>' +
      '<video ng-src="{{trustSrc()}}" autoplay width="170px" ng-show="hasSharedVideo()" class="videoelement"></video>' +
      '<span>{{peerUserName()}}</span>' +
      '<audio autoplay ng-src="{{trustAudSrc()}}"></audio>' +
      '</div>',
      restrict: 'E',
      replace: true,
      scope: {
        vidSrc: '@',
        audSrc: '@',
        userName: '@',
        sharedVid: '@'
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
        scope.trustAudSrc = function () {
          if (!scope.audSrc) {
            return undefined;
          }
          return $sce.trustAsResourceUrl(scope.audSrc);
        };
        scope.peerUserName = function () {
          if (!scope.userName) {
            return undefined;
          }
          return scope.userName;//$sce.trustAsResourceUrl(scope.userName);
        };
      }
    };
  });
