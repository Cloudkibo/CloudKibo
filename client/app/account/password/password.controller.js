'use strict';

angular.module('cloudKiboApp')
    .controller('ForgotPasswordController', function($scope, $http){

        $scope.isCollapsed = true;

        $scope.save = function() {
            var dataToSend = {
                username : $scope.user3.username,
            };

            $http.post('/api/users/resetpasswordrequest', JSON.stringify(dataToSend))
                .success(function(data) {
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
                password : $scope.user.password
            };

            $http.post('/ChangePassword', JSON.stringify(dataToSend))
                .success(function(data) {
                    $scope.user.message = data;
                    $scope.sentData = true;

                });

        };

        $scope.sentData = false;
        $scope.user = {};
        $scope.user.message = 'Not Sent';



    });


