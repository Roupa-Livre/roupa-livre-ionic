function updateLatLng($cordovaGeolocation, $auth, $q) {
  var deferred = $q.defer();
  var posOptions = {timeout: 10000, enableHighAccuracy: true};
  $cordovaGeolocation.getCurrentPosition(posOptions)
    .then(function (position) {
      var lat  = position.coords.latitude;
      var lng = position.coords.longitude;
      
      $auth.updateAccount({lat: lat, lng: lng})
        .then(function(resp) {
          deferred.resolve(resp);
        }, function(resp) {
          console.log(resp)
          deferred.reject(resp);
        });
    }, function(resp) { 
      console.log(resp); 
      deferred.reject(resp);
    });
  return deferred.promise;
}

angular.module('app.controllers', ['ngCordova'])
  .controller('loginCtrl', function($scope, $cordovaGeolocation, $cordovaDevice, $ionicHistory, $state, $auth) {
    function successLogged(data) {
      $ionicHistory.nextViewOptions({ disableBack: true });
      $state.go('menu.start');
    };

    function logOrRegisterWithUUID() {
      var uuid, provider;
      try {
        uuid = $cordovaDevice.getUUID();
        provider = $cordovaDevice.getPlatform();
      } catch(ex) {
        if (!window.cordova) {
          uuid = "IN-APP12341";
          provider = "IN-APP";
        }
      }

      loginWithUUID(uuid, provider).then(successLogged,
        function(loginResp) {
          console.log(loginResp);
          registerWithUUID().then(successLogged, function(resp) {
            // handle error response
            console.log(resp);
          })
        })
    }

    function loginWithUUID(uuid, provider) {
      var loginData = { email: uuid + '@local.com', password:uuid };

      return $auth.submitLogin(loginData)
        .then(successLogged, function(resp) {
          console.log(resp);
          // handle error response
        });
    };

    function registerWithUUID(uuid, provider) {
      var registrationData = { provider:provider, uid:uuid, type: 'KindHeartedUser',
        email: uuid + '@local.com',
        password:uuid, password_confirmation:uuid };

      return $auth.submitRegistration(registrationData);
    };

    $auth.validateUser().then(successLogged, function(result) {
      logOrRegisterWithUUID();
      return result;
    });
  })

  .controller('logoutCtrl', function($scope, $cordovaGeolocation, $ionicHistory, $state, $auth) {
    $auth.signOut()
      .then(function(resp) {
        // handle success response
      })
      .catch(function(resp) {
        // handle error response
      });
  })

  .controller('startCtrl', function($scope, $cordovaGeolocation, $ionicHistory, $state, $auth, $q) {
    updateLatLng($cordovaGeolocation, $auth, $q)
      .then(function(resp) {
        $ionicHistory.nextViewOptions({ disableBack: true });
        $state.go('menu.apparel');
      }, function(resp) {
        $ionicHistory.nextViewOptions({ disableBack: true });
        $state.go('menu.apparel');
      });
  })

  .controller('apparelCtrl', function($scope, $rootScope, $cordovaGeolocation, $ionicHistory, $state, $auth, $q, $ionicSlideBoxDelegate, Apparel, ApparelRating, $ionicLoading) {
    $scope.show = function() {
      $ionicLoading.show({
        template: 'Carregando roupas ...'
      });
    };
    $scope.hide = function(){
      $ionicLoading.hide();
    };

    function setCurrentApparel() {
      if ($rootScope.apparels.length > 0) {
        var entry = $rootScope.apparels[0];
        $rootScope.apparels.shift();

        // sets dummy data
        entry.user = {
          nickname: 'giovana camargo',
          distance: '3km',
          social_image:null,
          image: null
        }
        $scope.entry = entry;
        $ionicSlideBoxDelegate.update();
      } else {
        $scope.entry = null;
      }
    }

    function loadMore() {
      Apparel.search().then(function(data) {
          $rootScope.apparels = data;
          setCurrentApparel();
          $scope.hide();
        }, function(data) {
          $scope.hide();
        });
    }

    function checkNextApparel(onHasData, onLoadRequired) {
      $scope.show();
      if ($rootScope.apparels && $rootScope.apparels.length > 0) {
        onHasData();
      } else {
        onLoadRequired();
      }
    }

    $scope.like = function() {
      var rating = new ApparelRating({apparel_id: $scope.entry.id, liked: true})
      rating.save().then(function(data) {
        alert('MATCH!')
      });
    };
    $scope.dislike = function() {
      var rating = new ApparelRating({apparel_id: $scope.entry.id, liked: false})
      rating.save().then(function(data) {
        $ionicHistory.nextViewOptions({ disableBack: true });
        // $state.go($state.current, {}, {reload: true});
        $state.transitionTo($state.current, { last_id: $scope.entry.id }, {
          reload: true,
          inherit: false,
          notify: true
        });
      });
    }

    checkNextApparel(setCurrentApparel, loadMore);
    
    updateLatLng($cordovaGeolocation, $auth, $q)
      .then(function(resp) {
        // $scope.getApparels().then(function(data){
        //   // TODO
        //   $scope.hide();
        // });
      }, function(resp) {
        // $scope.hide();
      });
    // $scope.show();

    
  });