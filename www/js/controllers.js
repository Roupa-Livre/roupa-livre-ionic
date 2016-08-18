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

  .controller('menuCtrl', function($scope, $cordovaGeolocation, $cordovaDevice, $ionicHistory, $state, $auth, $q) {
    $scope.goApparels = function() {
      $ionicHistory.nextViewOptions({ disableBack: true });
      $state.go('menu.apparel_list');
    };

    $scope.goSearch = function() {
      $ionicHistory.nextViewOptions({ disableBack: true });
      $state.go('menu.search');
    };

    $scope.goNew = function() {
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
    $scope.single_option = false;
    Chat.local_active_by_id($stateParams["chat_id"]).then(function(chat) {
      $scope.chat = chat;
      if (!$scope.chat) {
        Chat.online_active_by_id($stateParams["chat_id"]).then(function(chat) {
          $scope.chat = chat;
        }, function(error) {
          console.log(error);
        });
      }
    });

    function successUpdatedGeo() {
      
    };

    $scope.cancel = function() {
      $ionicHistory.nextViewOptions({ disableBack: true });
      $state.go('menu.apparel');
    };

    $scope.submit = function() {
      $ionicHistory.nextViewOptions({ disableBack: true });
      $state.go('menu.chat', { id: $scope.chat.id });
    };

    updateLatLng($cordovaGeolocation, $auth, $q)
      .then(function(resp) {
        successUpdatedGeo();
      }, function(resp) {
        successUpdatedGeo();
      });
  })

  .controller('matchNotFoundCtrl', function($scope, $rootScope, $cordovaGeolocation, $ionicHistory, $state, $stateParams, $auth, $q, $cordovaSocialSharing, Apparel) {
    // TODO tem action deve ir pra filtros caso esteja com filtros
    $scope.hasAction = Apparel.hasFilters();

    $scope.shareApp = function() {
      $cordovaSocialSharing.share('Vem também trocar umas peças', 'Roupa Livre', null, 'http://www.roupalivre.com.br/') // Share via native share sheet
        .then(function(result) {
          // Success!
        }, function(err) {
          // An error occured. Show a message to the user
        });
    }

    $scope.advance = function() {
      $ionicHistory.nextViewOptions({ disableBack: true });
      $state.go('menu.search');
    };

    updateLatLng($cordovaGeolocation, $auth, $q);
  })

  .controller('apparelListCtrl', function($scope, $rootScope, $cordovaGeolocation, $cordovaDevice, $ionicHistory, $state, $auth, $q, $stateParams, $ionicPopup, Apparel) {
    var user_id = $stateParams.hasOwnProperty("user_id") && $stateParams.user_id > 0 ? $stateParams.user_id : null;
    $scope.is_mine = user_id == null;
    if ($scope.is_mine) {
      $scope.owner_user = $rootScope.user;
      Apparel.owned().then(function(apparels) {
        $scope.apparels = apparels;
      });
    } else {
      // TODO Carrega apparels de outro user
    }

    $scope.edit = function(apparel) {
      if ($scope.is_mine) {
        $ionicHistory.nextViewOptions({ disableBack: false });
        $state.go('menu.edit_apparel', { id: apparel.id });
      }
    }

    $scope.delete = function(apparel) {
      if ($scope.is_mine) {
        var confirmPopup = $ionicPopup.confirm({
          title: 'Tirando?',
          template: 'Já trocou a roupa?<br />Ou só não quer mais trocar?<br />Tem certeza que quer tirar ela do roupa livre?'
        });

        confirmPopup.then(function(res) {
          if(res) {
            Apparel.delete(apparel);
            console.log('You are sure');
          } else {
            console.log('You are not sure');
          }
        });
      }
    }
  })

  .controller('apparelCtrl', function($scope, $rootScope, $cordovaGeolocation, $ionicHistory, $state, $auth, $q, $ionicSlideBoxDelegate, Apparel, ApparelRating, Chat, ApparelMatcher, $ionicLoading, $log, ionicToast) {
    $scope.show = function(message) {
      $rootScope.showLoading(message);
    };
    $scope.hide = function(){
      $rootScope.hideLoading();
    };

    function setCurrentApparel(apparel) {
      if (apparel != null) {
        var entry = apparel;

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

    function loadNextApparel() {
      $scope.show('Carregando roupas ...');
      ApparelMatcher.getNextAvailableApparel().then(function(apparel) {
        setCurrentApparel(apparel);
        $scope.hide();
      }, function(error) {
        $log.debug(error);
        ionicToast.show('Erro carregando mais opções', 'top', false, 1000);
        $scope.hide();
      })
    }

    function nextAfterMatch(chat_data) {
      $ionicHistory.nextViewOptions({ disableBack: true });
      // $state.go($state.current, {}, {reload: true});
      $state.go('menu.match_warning', { chat_id: chat_data.id });
    };

    function nextAfterRating() {
      $ionicHistory.nextViewOptions({ disableBack: true });
      // $state.go($state.current, {}, {reload: true});
      $state.go($state.current, { last_id: $scope.entry.id }, {
        reload: false,
        inherit: false,
        notify: true
      });
    };

    function failAfterRating(error) {
      $log.debug(error);
      ionicToast.show('Erro carregando salvando rating', 'top', false, 1000);
    };

    $scope.like = function() {
      var rating = new ApparelRating({apparel_id: $scope.entry.id, liked: true})
      $scope.show('Opa, será que deu match?');
      rating.save().then(function(data) {
        ApparelMatcher.markFirstAsRated();
        $scope.hide();
        if (data.hasOwnProperty('chat') && data.chat != null)
          nextAfterMatch(data.chat);
        else
          nextAfterRating();
      }, failAfterRating);
    };

    $scope.dislike = function() {
      var rating = new ApparelRating({apparel_id: $scope.entry.id, liked: false})
      rating.save().then(function(data) {
        ApparelMatcher.markFirstAsRated();
        nextAfterRating(data);
      }, failAfterRating);
    }

    loadNextApparel();
    
    updateLatLng($cordovaGeolocation, $auth, $q)
      .then(function(resp) {
        // $scope.getApparels().then(function(data){
        //   // TODO
        //   $scope.hide();
        // });
      }, function(resp) {
        // $scope.hide();
      });

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

  .controller('chatCtrl', function($scope, $rootScope, $cordovaGeolocation, $ionicHistory, $state, $auth, $q, $stateParams, $ionicScrollDelegate, Chat, ChatMessage, ChatSub, ionicToast, config) {
    $scope.$on("$destroy", function(){
      if ($scope.chat && $scope.chat != null)
        ChatSub.unsubscribe($scope.chat);
    });

    function onSubscribedNewMessage(messageData) {
      $scope.last_message_sent = messageData;
      $scope.chat.last_message_sent = messageData;
      $scope.chat.saveLocally();

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

    $scope.showChatDetails = function() {
      $ionicHistory.nextViewOptions({ disableBack: false });
      // $state.go($state.current, {}, {reload: true});
      $state.go('menu.chat_details', { id: $scope.chat.id });
    };

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
      }, function(errorData) {
        $scope.chat.last_sent_message = null;
        try {
          if (config.SHOWS_STACK)
            ionicToast.show('Erro enviando mensagem:\r\n<br/>' + JSON.stringify(errorData), 'top', true, 1000);
          else
            ionicToast.show('Erro inesperado enviando mensagem', 'top', false, 1000);
        } catch (ex) { }
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

  .controller('chatDetailsCtrl', function($scope, $rootScope, $cordovaGeolocation, $ionicHistory, $state, $auth, $q, $stateParams, $ionicScrollDelegate, Chat, ChatMessage, ChatSub) {
    Chat.local_active_by_id($stateParams["id"]).then(function(chat) {
      $scope.chat = chat;
      Chat.online_active_by_id($stateParams["id"]).then(function(newChatInfo) {
        if (newChatInfo)
          $scope.chat = newChatInfo;
      });
    });

    $scope.close = function() {
      $ionicHistory.goBack();
    };
  })
  
  .controller('filterCtrl', function($scope, $rootScope, $cordovaGeolocation, $cordovaDevice, $ionicHistory, $state, $auth, $q, Apparel, ApparelMatcher) {
    $scope.filters = angular.extend({}, Apparel.getFilters());

    $scope.filter = function() {
      $rootScope.apparels = [];
      if ($scope.filters.tags && $scope.filters.tags.length > 0) {
        var tags = $scope.filters.tags[0].name;
        if ($scope.filters.tags.length > 1) {
          for (var i = 1; i < $scope.filters.tags.length; i++) {
            tags = tags + ',' + $scope.filters.tags[i].name;
          }
        }
        
        $scope.filters.apparel_tags = tags;
      } else if ($scope.filters.hasOwnProperty('apparel_tags')) {
        delete $scope.filters['apparel_tags'];
      }

      Apparel.applyFilters($scope.filters);
      ApparelMatcher.clearCache();
      $ionicHistory.nextViewOptions({ disableBack: true });
      $state.go('menu.apparel');
    };

    $scope.cancel = function() {
      Apparel.clearFilters();
      $scope.filters = angular.extend({}, Apparel.getFilters());
    };
  })

  .controller('blankCtrl', function($scope, $cordovaGeolocation, $cordovaDevice, $ionicHistory, $state, $auth, $q) {
    
  })