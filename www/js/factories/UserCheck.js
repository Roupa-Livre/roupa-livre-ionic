angular.module('app.factories', ['ngCordova', 'ngResource', 'rails'])
  .factory('UserCheck', ['$auth', '$q', '$rootScope', '$state', '$cordovaGeolocation', '$ionicHistory', 'Apparel',
    function($auth, $q, $rootScope, $state, $cordovaGeolocation, $ionicHistory, Apparel) {
      var service = {};

      service.doOwnsApparels = function() {
        var q = $q.defer();
        Apparel.owned().then(function(data) {
          if (data && data != null && data.length > 0)
            q.resolve(true);
          else
            q.reject();
        }, q.reject);
        return q.promise;
      };

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
          service.doOwnsApparels().then(onUserHasOwnApparels, onUserHasNoApparel);
        };

        updateLatLng($cordovaGeolocation, $auth, $q).then(function(resp) {
          successUpdatedGeo();
        }, function(resp) {
          successUpdatedGeo();
        });
      }

      return service;   
  }]);