angular.module('app.controllers', ['ngCordova', 'ngImgCrop', 'btford.socket-io'])
  .controller('initialCtrl', function($scope, $cordovaGeolocation, $cordovaDevice, $ionicHistory, $state, $auth, $q) {
    $scope.loadingMessage = "Bem vindo!!"

    function validate() {
      $auth.validateUser()
        .then(function(data) {
          $ionicHistory.nextViewOptions({ disableBack: true });
          $state.go('starting');
        }, function(result) {
          $ionicHistory.nextViewOptions({ disableBack: true });
          $state.go('login');

          return result;
        });
    }

    var isMob = window.cordova !== undefined;
    if (isMob)
      document.addEventListener("deviceready", validate, false);
    else
      validate();
  })

  .controller('myselfCtrl', function($scope, $cordovaGeolocation, $cordovaDevice, $ionicHistory, $state, $auth, $q) {
    $scope.goApparels = function() {
      $ionicHistory.nextViewOptions({ disableBack: true });
      $state.go('menu.new');
    };
  })

  .controller('loginCtrl', function($scope, $cordovaGeolocation, $cordovaDevice, $ionicHistory, $state, $auth, $q) {
    function successLogged(data) {
      $ionicHistory.nextViewOptions({ disableBack: true });
      $state.go('starting');
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

    $scope.loginAuto = function() {
      logOrRegisterWithUUID();
    };

    $scope.loginWithFacebook = function() {
      $auth.authenticate('facebook')
        .then(successLogged)
        .catch(function(resp) {
          console.log(resp);
          //logOrRegisterWithUUID();
        });
    };

    function validate() {
      $auth.validateUser().then(successLogged, function(result) {
        // deixa a pessoa fazer seu próprio login
        // setTimeout(logOrRegisterWithUUID, 100);

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
        $state.go('login');
      })
      .catch(function(resp) {
        $state.go('starting');
      });
  })

  .controller('startCtrl', function($scope, $cordovaGeolocation, $ionicHistory, $state, $auth, $q, Apparel) {
    $scope.loadingMessage = "Carregando ..."

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

  .controller('matchWarningCtrl', function($scope, $rootScope, $cordovaGeolocation, $ionicHistory, $state, $stateParams, $auth, $q, Apparel, Chat) {
    $scope.chat = Chat.local_active_by_id($stateParams["chat_id"]);
    if (!$scope.chat) {
      Chat.online_active_by_id($stateParams["id"]).then(function(chat) {
        $scope.chat = chat;
      });
    }

    function successUpdatedGeo() {
      
    };

    $scope.cancel = function() {
      $ionicHistory.nextViewOptions({ disableBack: true });
      $state.go('menu.apparel');
    };

    $scope.submit = function() {
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

  .controller('matchNotFoundCtrl', function($scope, $rootScope, $cordovaGeolocation, $ionicHistory, $state, $stateParams, $auth, $q) {
    // TODO tem action deve ir pra filtros caso esteja com filtros
    $scope.hasAction = true;

    $scope.advance = function() {
      // TODO Limpa Filtros

      $ionicHistory.nextViewOptions({ disableBack: true });
      $state.go('menu.apparel', {}, {reload: true});
    };

    updateLatLng($cordovaGeolocation, $auth, $q);
  })

  .controller('apparelCtrl', function($scope, $rootScope, $cordovaGeolocation, $ionicHistory, $state, $auth, $q, $ionicSlideBoxDelegate, Apparel, ApparelRating, Chat, $ionicLoading, $log) {
    $scope.show = function(message) {
      $rootScope.showLoading(message);
    };
    $scope.hide = function(){
      $rootScope.hideLoading();
    };

    function setCurrentApparel() {
      if ($rootScope.apparels.length > 0) {
        var entry = $rootScope.apparels[0];
        $rootScope.apparels.shift();

        // sets dummy data
        if (!entry.hasOwnProperty('user') || !entry.user) {
          entry.user = {
            id: entry.user_id,
            nickname: 'giovana camargo',
            distance: '3km',
            social_image:null,
            image: null
          }
        }
        $scope.entry = entry;
        $ionicSlideBoxDelegate.update();
      } else {
        $ionicHistory.nextViewOptions({ disableBack: true });
        $state.go('menu.not_found');
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
      Chat.force_reload_active().then(function(data) {
        $scope.chats = data;
      });
    }, function(data) {
      console.log(data);
    });

    $scope.open = function(chat) {
      $state.go('menu.chat', { id: chat.id });
    };
  })

  .controller('chatCtrl', function($scope, $rootScope, $cordovaGeolocation, $ionicHistory, $state, $auth, $q, $stateParams, $ionicScrollDelegate, Chat, ChatMessage, ChatSub) {
    $scope.$on("$destroy", function(){
      if ($scope.chat && $scope.chat != null)
        ChatSub.unsubscribe($scope.chat);
    });

    function onSubscribedNewMessage(messageData) {
      $scope.last_message_sent = messageData;
      $scope.saveLocally();

      onNewMessages([ messageData ]);
      $ionicScrollDelegate.scrollBottom(true);
    };

    function onNewMessages(messagesData) {
      for (var i = 0; i < messagesData.length; i++) {
        $scope.chat_messages.push(messagesData[i]);
      }
    }

    function addPreviousMessages(messagesData) {
      for (var i = messagesData.length - 1; i >= 0; i--) {
        $scope.chat_messages.unshift(messagesData[i]);
      }
    }

    function subscribe() {
      ChatSub.subscribe($scope.chat, onSubscribedNewMessage);
    };

    $scope.getLatestMessages = function() {
      var newLastRead = new Date();
      return ChatMessage.latestAfterRead($scope.chat, $scope.chat.last_read_at).then(function(new_messages) {
        onNewMessages(new_messages);
        $scope.chat.last_read_at = newLastRead;
        $scope.chat.saveLocally();

        return new_messages;
      },function(error) {
        console.log(error);
        return error;
      });
    };

    function loadFirstTimeMessages() {
      var newLastRead = new Date();
      return ChatMessage.latest($scope.chat).then(function(new_messages) {
        $scope.chat_messages = new_messages;
        $scope.chat.last_read_at = newLastRead;
        $scope.chat.saveLocally();

        return new_messages;
      }, function(error) {
        console.log(error);
        return error;
      });
    };

    function checkInitialMessages() {
      ChatMessage.current($scope.chat).then(function(currentMessages) {
        $scope.chat_messages = currentMessages;
        $ionicScrollDelegate.scrollBottom(true);

        if (currentMessages.length > 0) {
          $scope.getLatestMessages().then(function() {
            subscribe();
            $ionicScrollDelegate.scrollBottom(true);
          }, subscribe);
        } else { 
          loadFirstTimeMessages().then(function() {
            subscribe();
            $ionicScrollDelegate.scrollBottom(true);
          }, subscribe);
        }
        
      }, function(error) {
        console.log(error);
        subscribe();
      });
    };

    function checkChat() {
      if ($scope.chat && $scope.chat != null) {
        checkInitialMessages();
      }
      else {
        $rootScope.showLoading('Carregando mensagens ...');
        Chat.online_active_by_id($stateParams["id"]).then(function(chat) {
          $scope.chat = chat;
          checkInitialMessages();
          $rootScope.hideLoading();
        });
      }
    }

    $scope.chat = null;
    $scope.chat_messages = null;
    Chat.local_active_by_id($stateParams["id"]).then(function(chat) {
      $scope.chat = chat;
      checkChat();
    }, function(error) {
      console.log(error);
      checkChat();
    })

    $scope.loadPrevious = function() {
      if ($scope.chat_messages == null || $scope.chat_messages.length == 0)
        checkInitialMessages();
      else {
        ChatMessage.previousMessages($scope.chat, $scope.chat_messages[0]).then(function(new_messages) {
          addPreviousMessages(new_messages);
        });
      }
    }

    $scope.send = function() {
      var chat_message = new ChatMessage({chat_id: $scope.chat.id, message: $scope.chat.last_sent_message})
      chat_message.save().then(function(saved_message) {
        $scope.chat.chat_messages.push(saved_message);
        // $scope.chat_messages.push(saved_message);
        $scope.chat.last_sent_message = null;
        $ionicScrollDelegate.scrollBottom(true);
      });
    };

    $scope.getIncludeFile = function(chat_message) {
      if (chat_message.hasOwnProperty('type')) {
        return chat_message.type + '.html';
      } else {
        return 'ChatMessage.html';
      }
    };
  })

  .controller('blankCtrl', function($scope, $cordovaGeolocation, $cordovaDevice, $ionicHistory, $state, $auth, $q) {
    
  })