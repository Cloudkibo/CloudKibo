/**
 * Created by sojharo on 12/31/15.
 */

angular.module('cloudKiboApp')
  .controller('TabsController', function ($scope, $location, Auth, $http, socket, RestApi, logger, $log) {

    $scope.isCollapsed = true;
    $scope.isLoggedIn = Auth.isLoggedIn;
    $scope.isAdmin = Auth.isAdmin;
    $scope.getCurrentUser = Auth.getCurrentUser;

    $scope.user = $scope.getCurrentUser() || {};

    $scope.logout = function () {


      if (Auth.isLoggedIn()) {
        //socket.emit('leave', {room: Auth.getCurrentUser().username, username: Auth.getCurrentUser().username});
        socket.emit('leaveChat', {room: 'globalchatroom', user: Auth.getCurrentUser()});

      }

      console.log("Left gloal chat room");
      logger.log("Left gloal chat room");
      Auth.logout();

      $location.path('/login');
    };

    $scope.isActive = function (route) {
      return route === $location.path();
    };

    $scope.isUserAdmin = function () {
      return $scope.getCurrentUser().role === 'admin';
    };


  })

  .controller('UploadCtrl', ['$scope', 'Upload', '$timeout', function ($scope, Upload, $timeout) {
    $scope.upload = function (dataUrl) {
      Upload.upload({
        url: '/api/users/userimage/update',
        data: {
          file: Upload.dataUrltoBlob(dataUrl)
        }
      }).then(function (response) {
        $timeout(function () {
          $scope.result = response.data;
        });
      }, function (response) {
        if (response.status > 0) $scope.errorMsg = response.status
        + ': ' + response.data;
      }, function (evt) {
        $scope.progress = parseInt(100.0 * evt.loaded / evt.total);
      });
    }
  }])


  .controller('HomeController', ['$scope', function ($scope) {
    $scope.$on('$routeChangeStart', function () {
      console.log('location going to change')
      var element = document.getElementById("theMainDOMForApp");
      if(element != null)
        element.parentNode.removeChild(element);

    });

  }])

  .controller('AddRequestsController', function ($scope, logger) {

  })

  .controller('IndexController', function ($scope, $location, Auth, $http, socket, $interval, $timeout, RestApi, $log, logger) {

    $scope.isCollapsed = true;
    $scope.isLoggedIn = Auth.isLoggedIn;
    $scope.isAdmin = Auth.isAdmin;
    $scope.getCurrentUser = Auth.getCurrentUser;

    $scope.user = $scope.getCurrentUser() || {};

    $scope.logout = function () {

      if (Auth.isLoggedIn()) {
        //socket.emit('leave', {room: Auth.getCurrentUser().username, username: Auth.getCurrentUser().username});
        socket.emit('leaveChat', {room: 'globalchatroom', user: Auth.getCurrentUser()});
        logger.log('leaveChat' + 'room: globalchatroom' + "user: " + Auth.getCurrentUser());
      }

      Auth.logout();

      $location.path('/login');
    };

    $scope.getlocation = function () {
      return $location.url();
    };

    $scope.isActive = function (route) {
      return route === $location.path();
    };

    // slider code

    // Set of Photos
    $scope.photos = [
      {src: '/images/sd1.png', desc: 'Image 01'},
      {src: '/images/sd2.png', desc: 'Image 02'},
      {src: '/images/sd3.png', desc: 'Image 03'},
      {src: '/images/sd4.png', desc: 'Image 04'},
      {src: '/images/sd5.png', desc: 'Image 05'},
      {src: '/images/sd6.png', desc: 'Image 06'}
    ];

    // initial image index
    $scope._Index = 0;

    // if a current image is the same as requested image
    $scope.isActiveImg = function (index) {
      return $scope._Index === index;
    };

    // show prev image
    $scope.showPrev = function () {
      $scope._Index = ($scope._Index > 0) ? --$scope._Index : $scope.photos.length - 1;
    };

    // show next image
    $scope.showNext = function () {
      $scope._Index = ($scope._Index < $scope.photos.length - 1) ? ++$scope._Index : 0;
    };

    // show a certain image
    $scope.showPhoto = function (index) {
      $scope._Index = index;
    };

    $interval($scope.showNext, 6000);

    $timeout(function () {
      Layout.init();
      Layout.initOWL();
    }, 1000);

    $scope.sendFeedback = function (contact) {

      $http.post(RestApi.feedback.feedbackByVisitor, contact)
        .success(function (data) {
          if (data.status == 'success') {
            $scope.addAlert(data.status, data.msg)
          }
          else {

          }

        })

    };

    $scope.alerts = [];

    $scope.addAlert = function (newtype, newMsg) {
      //console.log('Error', newtype, newMsg)
      $scope.alerts.push({type: newtype, msg: newMsg});
    };

    $scope.closeAlert = function (index) {
      $scope.alerts.splice(index, 1);
    };

  })

  .controller('ContactsListController', function ($scope) {
  })

  .controller('NewsControllerSuperUser', function ($scope, Data) {
    $scope.data = Data;
  })

  .controller('NewsController', function ($scope, Data) {
    $scope.data = Data;
  });
