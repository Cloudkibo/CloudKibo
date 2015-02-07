/**
 * Created by sojharo on 2/7/2015.
 */

/**
 * Created by sojharo on 2/3/2015.
 */

'use strict';

angular.module('cloudKiboApp')
    .factory('ScreenShare', function ScreenShare($rootScope, $window, pc_config, pc_constraints, sdpConstraints, video_constraints, Signalling) {

        // todo need to check exact chrome browser because opera also uses chromium framework
        var isChrome;

        var screenCallback;

        var chromeMediaSource;

        return {

            initialize: function () {
                // todo need to check exact chrome browser because opera also uses chromium framework
                isChrome = !!navigator.webkitGetUserMedia;

                chromeMediaSource = 'screen';
            },

            getSourceId: function (callback) {
                if (!callback) throw '"callback" parameter is mandatory.';
                screenCallback = callback;
                $window.postMessage('get-sourceId', '*');
            },

            isChromeExtensionAvailable: function (callback) {
                if (!callback) return;

                if (chromeMediaSource == 'desktop') callback(true);

                // ask extension if it is available
                $window.postMessage('are-you-there', '*');

                setTimeout(function () {
                    if (chromeMediaSource == 'screen') {
                        callback(false);
                    } else callback(true);
                }, 2000);

            }
        };

        function onMessageCallback(data) {
            //console.log('chrome message', data);

            // "cancel" button is clicked
            if (data == 'PermissionDeniedError') {
                chromeMediaSource = 'PermissionDeniedError';
                if (screenCallback) return screenCallback('PermissionDeniedError');
                else throw new Error('PermissionDeniedError');
            }

            // extension notified its presence
            if (data == 'kiboconnection-extension-loaded') {
                chromeMediaSource = 'desktop';
            }

            // extension shared temp sourceId
            if (data.sourceId) {
                if (screenCallback) screenCallback(data.sourceId);
            }
        }

        $window.addEventListener('message', function (event) {
            if (event.origin != window.location.origin) {
                return;
            }

            //console.log('THIS IS THE EVENT')
            //console.log(event)

            onMessageCallback(event.data);
        });

    });
