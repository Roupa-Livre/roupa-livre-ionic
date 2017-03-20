angular.module('app.factories', ['ngCordova', 'ngResource', 'rails'])
  .factory('UserCheck', ['$auth', '$q', '$rootScope', '$state', '$cordovaGeolocation', '$ionicHistory', 'Apparel', '$timeout',
    function($auth, $q, $rootScope, $state, $cordovaGeolocation, $ionicHistory, Apparel, $timeout) {
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

      service.redirectLoggedUser = function(hideLoading) {
        function hideLoadingIfNeeded() {
          if (hideLoading && !(typeof hideLoading === "undefined")) {
            $rootScope.hideReadableLoading();
          }
        }
        function onUserHasOwnApparels() {
          hideLoadingIfNeeded();

          $timeout(function() {
            if ($auth.user.agreed) {
              $rootScope.gotToInitialState('menu.apparel');
              $rootScope.cleanInitialState();
            } else {
              $rootScope.gotToInitialState('terms');
              $rootScope.cleanInitialState();
            }
          });
        };

        function onUserHasNoApparel() {
          hideLoadingIfNeeded();

          $timeout(function() {
            if ($auth.user.agreed) {
              $ionicHistory.nextViewOptions({ disableBack: true });
              $state.go('menu.new');
            } else {
              $rootScope.gotToInitialState('terms');
              $rootScope.cleanInitialState();
            }
          });
        }

        function successUpdatedGeo(resp) {
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