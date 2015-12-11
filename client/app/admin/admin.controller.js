'use strict';

angular.module('cloudKiboApp')
  .controller('AdminCtrl', function ($scope, $http, Auth, User, $log, logger) {

    $http.get('/api/configurations/fetch')
      .success(function(data){
        $scope.supersettings = data;
        $log.info('Fetching data '+ data)
        logger.log('Fetching data '+ data)
      });

    $http.get('/api/feedback')
      .success(function(data){
        $scope.feedbacks = data;
        $log.info('Fetching data '+ data)
        logger.log('Fetching data '+ data)
      });

    $http.get('/api/configurations/fetch')
      .success(function(data){
        $scope.supersettings = data;
        $log.info('Fetching data '+ data)
      });
    // Use the User $resource to fetch all users
    $scope.users = User.query();

    $scope.delete = function(user) {
      User.remove({ id: user._id });
      angular.forEach($scope.users, function(u, i) {
        if (u === user) {
          $scope.users.splice(i, 1);
        }
      });
      logger.log("delete user")
    };

    $scope.isUserNameDefined = function() {
      return true;
    };

    $scope.isMeetingPage = function(){
      return false;
    };

    $scope.saveSuperuserSettings = function(supersettings){

      if(confirm('Are you sure you want to save these changes?')) {


        $http.post('/api/configurations/', JSON.stringify(supersettings))
          .success(function (data) {
            if(data.status == 'success') {

              alert("Saved.");

              $log.info('saving changes ');
              logger.log('saving changes ');

              //$scope.addAlertsSuperuserSetting(data.status, 'Changes saved.');
            }
            else {

              //$scope.addAlertsSuperuserSetting(data.status, data.msg);
            }
          });

      }

    };

  });
