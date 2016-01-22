/**
 * Created by sojharo on 8/1/2015.
 */
'use strict';

angular.module('cloudKiboApp')
  .directive('meetingPlayer', function ($sce) {
    return {
      template: '<div class="videoBoxContainer">' +
      '<div class="{{divBoxClass}}" ng-hide="hasSharedVideo()"></div>' +
      '<video ng-src="{{trustSrc()}}" autoplay width="170px" ng-show="hasSharedVideo()" class="videoelement"></video>' +
      '<audio ng-src="{{trustAudioSrc()}}" autoplay ng-show="false"></audio>' +
      '<span>{{peerUserName()}}</span>' +
      '</div>',
      restrict: 'E',
      replace: true,
      scope: {
        vidSrc: '@',
        audSrc: '@',
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
        scope.trustAudioSrc = function () {
          if (!scope.audSrc) {
            return undefined;
          }
          return $sce.trustAsResourceUrl(scope.audSrc);
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
