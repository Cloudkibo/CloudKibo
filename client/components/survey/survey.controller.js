/**
 * Created by zarmeen on 28/2/2016.
 */
'use strict';


angular.module('cloudKiboApp')

  .controller('SurveyController', function ($scope, $routeParams, $http,RestApi,$log,logger,$location) {
    
    
    console.log('Your name is '+ $routeParams.mname);
  
    $scope.uname = $routeParams.mname;
    console.log('This is a survey page');
    
   $scope.form_submitted = false;
   $scope.audio = 3;
   $scope.video = 3;
   $scope.screen = 3;
   $scope.filetransfer = 3;
   $scope.max = 5;
   $scope.isReadonly = false;

  $scope.hoveringOver = function(value) {
    $scope.overStar = value;
    $scope.percent = 100 * (value / $scope.max);
  };

  $scope.ratingStates = [
    {stateOn: 'glyphicon-ok-sign', stateOff: 'glyphicon-ok-circle'},
    {stateOn: 'glyphicon-star', stateOff: 'glyphicon-star-empty'},
    {stateOn: 'glyphicon-heart', stateOff: 'glyphicon-ban-circle'},
    {stateOn: 'glyphicon-heart'},
    {stateOff: 'glyphicon-off'}
  ];
  
  
   $scope.feedBackForm = function () {
     console.log('i am clicked');
     $scope.feedback ={
       username : $scope.uname,
		   audio : $scope.audio,
		   video : $scope.video,
		   screen : $scope.screen,
		   filetransfer : $scope.filetransfer,
     }
     console.log($scope.feedback);
      $http.post(RestApi.feedback.feedbackByUserCall, JSON.stringify($scope.feedback))
        .success(function (data) {
          $scope.feedBackSent = true;
          console.log("Call feedback sent")
          $log.info("Call feedback sent")
          logger.log("Call feedback sent")
        })
        .error(function (data) {
          console.log('Error:', data)
          logger.log('Error:', data)
          $log.info('Error:', data)
        });
        
        $scope.form_submitted = true;
    //    alert('Feedback submitted.Thank you for your feedback.');
        //setTimeout(function(){var ww = window.open(window.location, '_self'); ww.close(); }, 1000);
     //   $location.path('/home');
    };
  
  });
