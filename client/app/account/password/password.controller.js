'use strict';

angular.module('cloudKiboApp')
    .controller('ForgotPasswordController', function($scope, $http, RestApi){

        $scope.isCollapsed = true;

        $scope.save = function() {
            var dataToSend = {
                email : $scope.user3.email
            };

            $http.post(RestApi.user.resetPasswordRequest, JSON.stringify(dataToSend))
                .success(function(data) {
                    console.log(data)
                    $scope.addAlert(data.status, data.msg)
                    if(data.status == 'success')
                        $scope.sentData = true;
                });

        };

        $scope.sentData = false;

        $scope.forgotPassAlerts = [];

        $scope.addAlert = function(newtype, newMsg) {
            $scope.forgotPassAlerts.push({type: newtype, msg: newMsg});
        };

        $scope.closeAlert = function(index) {
            $scope.forgotPassAlerts.splice(index, 1);
        };

    })


    .controller('NewPasswordController', function($scope, $http){

        $scope.save = function() {

            var dataToSend = {
                token : $scope.token,
                password : $scope.user1.password
            };

            $http.post(RestApi.user.newPassword, JSON.stringify(dataToSend))
                .success(function(data) {
                    $scope.user.message = data;
                    $scope.sentData = true;

                });

        };

        $scope.sentData = false;
        $scope.user = {};
        $scope.user.message = 'Not Sent';



    });

