/**
 * Created by sojharo on 2/3/2015.
 */

'use strict';

angular.module('cloudKiboApp')
    .factory('Sound', function Sound($rootScope) {

        var bell = new Audio('/sounds/bells_simple.mp3');
        bell.loop = true;

        return {

            /**
             * Plays Ring Tone
             *
             */
            play: function() {
                bell.play();
            },

            /**
             * Pause the Ring Tone
             *
             */
            pause: function() {
                bell.pause();
            },

            /**
             * Load the bell from start
             *
             */
            load: function() {
                bell.load();
            }
        };
    });
