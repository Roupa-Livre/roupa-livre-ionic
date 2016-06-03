angular.module('app.controllers', ['ngCordova', 'ngImgCrop'])
  .controller('loginCtrl', function($scope, $cordovaGeolocation, $cordovaDevice, $ionicHistory, $state, $auth, $q) {
    function successLogged(data) {
      $ionicHistory.nextViewOptions({ disableBack: true });
      $state.go('menu.start');
    };

    function logOrRegisterWithUUID() {
      var uuid, provider;
      try {
        uuid = $cordovaDevice.getUUID();
        console.log(uuid);
        provider = $cordovaDevice.getPlatform();
        console.log(provider);
      } catch(ex) {
        if (!window.cordova) {
          uuid = "in-app12341";
          provider = "email";
        }
      }

      loginWithUUID(uuid, provider).then(successLogged,
        function(loginResp) {
          console.log(loginResp);
          registerWithUUID(uuid, provider).then(successLogged, function(resp) {
            // handle error response
            console.log(resp);
          })
        })
    }

    function loginWithUUID(uuid, provider) {
      var loginData = { email: uuid + '@local.com', password:uuid };

      var deferred = $q.defer();
      $auth.submitLogin(loginData)
        .then(function(data) {
          deferred.resolve(data);
        }, function(resp) {
          console.log(resp);
          deferred.reject(resp);
          // handle error response
        });
      return deferred.promise;
    };

    function registerWithUUID(uuid, provider) {
      var registrationData = { provider:provider, uid:uuid, type: 'KindHeartedUser',
        email: uuid + '@local.com',
        password:uuid, password_confirmation:uuid };

      return $auth.submitRegistration(registrationData);
    };

    function validate() {
      $auth.validateUser().then(successLogged, function(result) {
        setTimeout(logOrRegisterWithUUID, 100);
        return result;
      });
    }

    var isMob = window.cordova !== undefined;
    if (isMob)
      document.addEventListener("deviceready", validate, false);
    else
      validate();
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

  .controller('startCtrl', function($scope, $cordovaGeolocation, $ionicHistory, $state, $auth, $q, Apparel) {
    function onUserHasOwnApparels() {
      $ionicHistory.nextViewOptions({ disableBack: true });
      $state.go('menu.apparel');
    };

    function successUpdatedGeo() {
      Apparel.owned().then(function(data) {
        if (data && data != null && data.length > 0) {
          onUserHasOwnApparels();
        } else {
          $ionicHistory.nextViewOptions({ disableBack: true });
          $state.go('menu.new');
        }
      }, function() {
        $ionicHistory.nextViewOptions({ disableBack: true });
        $state.go('menu.new');
      });
    };

    updateLatLng($cordovaGeolocation, $auth, $q)
      .then(function(resp) {
        successUpdatedGeo();
      }, function(resp) {
        successUpdatedGeo();
      });
  })

  .controller('matchWarningCtrl', function($scope, $cordovaGeolocation, $ionicHistory, $state, $auth, $q, Apparel) {
    function successUpdatedGeo() {
      
    };

    $scope.cancel = function() {
      $ionicHistory.nextViewOptions({ disableBack: true });
      $state.go('menu.apparel');
    };

    $scope.submit = function() {
      alert('começando chat');

      $ionicHistory.nextViewOptions({ disableBack: true });
      $state.go('menu.chat');
    };

    updateLatLng($cordovaGeolocation, $auth, $q)
      .then(function(resp) {
        successUpdatedGeo();
      }, function(resp) {
        successUpdatedGeo();
      });
  })

  .controller('apparelCtrl', function($scope, $rootScope, $cordovaGeolocation, $ionicHistory, $state, $auth, $q, $ionicSlideBoxDelegate, Apparel, ApparelRating, Chat, $ionicLoading, $log) {
    $scope.show = function(message) {
      $ionicLoading.show({ template: message });
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
          id: entry.user_id,
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
      $scope.show('Carregando roupas ...');
      if ($rootScope.apparels && $rootScope.apparels.length > 0) {
        onHasData();
        $scope.hide();
      } else {
        onLoadRequired();
      }
    }

    function nextAfterMatch(chat_data) {
      Chat.new_chat_created(chat_data);

      $ionicHistory.nextViewOptions({ disableBack: true });
      // $state.go($state.current, {}, {reload: true});
      $state.go('menu.match_warning', { chat_id: chat_data.id });
    };

    function nextAfterRating() {
      $ionicHistory.nextViewOptions({ disableBack: true });
      // $state.go($state.current, {}, {reload: true});
      $state.transitionTo($state.current, { last_id: $scope.entry.id }, {
        reload: true,
        inherit: false,
        notify: true
      });
    };

    function failAfterRating(error) {
      $log.debug(error);
    };

    $scope.like = function() {
      var rating = new ApparelRating({apparel_id: $scope.entry.id, liked: true})
      $scope.show('Opa, será que deu match?');
      rating.save().then(function(data) {
        $scope.hide();
        if (data.hasOwnProperty('chat') && data.chat != null)
          nextAfterMatch(data.chat);
        else
          nextAfterRating();
      });
    };

    $scope.dislike = function() {
      var rating = new ApparelRating({apparel_id: $scope.entry.id, liked: false})
      rating.save().then(nextAfterRating, failAfterRating);
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

  })

  .controller('chatsCtrl', function($scope, $cordovaGeolocation, $ionicHistory, $state, $auth, $q, Chat) {
    Chat.active().then(function(data) {
      $scope.chats = data;
    });

    $scope.open = function(chat) {
      $state.go('menu.chat', { id: chat.id });
    };
  })

  .controller('chatCtrl', function($scope, $cordovaGeolocation, $ionicHistory, $state, $auth, $q, $stateParams, Chat, ChatMessage) {
    $scope.chat = Chat.local_active_by_id($stateParams["id"]);
    $scope.chat_messages = null;

    function checkInitialMessages() {
      $scope.chat_messages = [];
    };

    if ($scope.chat != null)
      checkInitialMessages();
    else {
      Chat.online_active_by_id($stateParams["id"]).then(function(chat) {
        $scope.chat = chat;
        checkInitialMessages();
      });
    }

    $scope.getIncludeFile = function(chat_message) {
      if (chat_message.hasOwnProperty('type')) {
        return chat_message.type + '.html';
      } else {
        return 'ChatMessage.html';
      }
    };
  });