angular.module('app.factories', ['ngCordova', 'ngResource', 'rails'])
  .factory('UserCheck', ['$auth', '$q', '$rootScope', '$state', '$cordovaGeolocation', '$ionicHistory', 'Apparel',
    function($auth, $q, $rootScope, $state, $cordovaGeolocation, $ionicHistory, Apparel) {
      var service = {};
      
      service.redirectLoggedUser = function() {
        function onUserHasOwnApparels() {
          $rootScope.gotToInitialState('menu.apparel');
          $rootScope.cleanInitialState();
        };

        function onUserHasNoApparel() {
          $ionicHistory.nextViewOptions({ disableBack: true });
          $state.go('menu.new');
        }

        function successUpdatedGeo() {
          Apparel.owned().then(function(data) {
            if (data && data != null && data.length > 0) {
              onUserHasOwnApparels();
            } else {
              onUserHasNoApparel();
            }
          }, function() {
            onUserHasNoApparel();
          });
        };

        updateLatLng($cordovaGeolocation, $auth, $q).then(function(resp) {
          successUpdatedGeo();
        }, function(resp) {
          successUpdatedGeo();
        });
      }

      return service;   
  }]);