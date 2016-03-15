/**
 * Created by sojharo on 3/14/16.
 */
/* global RTCIceCandidate, RTCSessionDescription, RTCPeerConnection, EventEmitter */
'use strict';


angular.module('cloudKiboApp')
  .factory('CallStats', function ($rootScope, logger) {

    var callStats = new callstats(null,io,jsSHA);
    var AppID     = "199083144";
    var AppSecret = "t/vySeaTw5q6323+ArF2c6nEFT4=";

    var api = {
      initialize : function(username){
        callStats.initialize(AppID, AppSecret, username, function (err, msg) {
          console.log("Initializing Status: err="+err+" msg="+msg);
        });
      },
      addAudioFabric: function(pc, id, roomId){
        var usage = callStats.fabricUsage.audio;
        callStats.addNewFabric(pc, id, usage, roomId, function(err, msg){
          console.log("Add new Fabric Status for audio: err="+err+" msg="+msg);
        });
      },
      addVideoFabric: function(pc, id, roomId){
        var usage = callStats.fabricUsage.video;
        callStats.addNewFabric(pc, id, usage, roomId, function(err, msg){
          console.log("Add new Fabric Status for audio: err="+err+" msg="+msg);
        });
      },
      addScreenFabric: function(pc, id, roomId){
        var usage = callStats.fabricUsage.screen;
        callStats.addNewFabric(pc, id, usage, roomId, function(err, msg){
          console.log("Add new Fabric Status for audio: err="+err+" msg="+msg);
        });
      },
      addDataFabric: function(pc, id, roomId){
        var usage = callStats.fabricUsage.data;
        callStats.addNewFabric(pc, id, usage, roomId, function(err, msg){
          console.log("Add new Fabric Status for audio: err="+err+" msg="+msg);
        });
      },
      reportOfferError : function(pc, roomId, e){
        callStats.reportError(pc, roomId, callStats.webRTCFunctions.createOffer, e);
      },
      reportAnswerError : function(pc, roomId, e){
        callStats.reportError(pc, roomId, callStats.webRTCFunctions.createAnswer, e);
      }
    };
    EventEmitter.call(api);
    Object.setPrototypeOf(api, EventEmitter.prototype);

    return api;
  });
