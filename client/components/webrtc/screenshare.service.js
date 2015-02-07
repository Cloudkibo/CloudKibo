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

        // this statement defines getUserMedia constraints
        // that will be used to capture content of screen
        var screen_constraints = {
            mandatory: {
                chromeMediaSource: chromeMediaSource,
                maxWidth: 1920,
                maxHeight: 1080,
                minAspectRatio: 1.77
            },
            optional: []
        };


        // it is the session that we want to be captured
        // audio must be false
        var session = {
            audio: false,
            video: screen_constraints
        };

        var sourceId;

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

            },

            onMessageCallback: function (data) {
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
                    sourceId = data.sourceId;
                    if (screenCallback) screenCallback(data.sourceId);
                }
            },

            screen_constraints: function () {
                return screen_constraints;
            },

            session: function () {
                return session;
            },

            getChromeMediaSource: function () {
                return chromeMediaSource;
            },

            getSourceIdValue: function () {
                return sourceId;
            },

            setSourceIdInConstraints: function () {
                screen_constraints.mandatory.chromeMediaSource = sourceId;
            }

        };

    });
