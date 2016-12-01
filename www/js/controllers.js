angular.module('app.controllers', ['ngCordova', 'ngImgCrop', 'btford.socket-io', 'app.factories'])
  .controller('initialCtrl', function($scope, $rootScope, $cordovaGeolocation, $cordovaDevice, $ionicHistory, $state, $auth, $q, UserCheck) {
    $scope.loadingMessage = "Bem vindo!!"

    function validate() {
      $auth.validateUser()
        .then(function(data) {
          UserCheck.redirectLoggedUser();
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

  .controller('loginCtrl', function($scope, $rootScope, $cordovaGeolocation, $cordovaDevice, $ionicHistory, $state, $auth, $q, UserCheck) {
    function successLogged(data) {
      UserCheck.redirectLoggedUser();
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

  .controller('logoutCtrl', function($scope, $cordovaGeolocation, $ionicHistory, $state, $auth, UserCheck) {
    $auth.signOut()
      .then(function(resp) {
        $state.go('login');
      })
      .catch(function(resp) {
        UserCheck.redirectLoggedUser();
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
    if ($scope.is_mine) 
      $scope.owner_user = $rootScope.user;

    function refreshApparels() {
      if ($scope.is_mine) {
        Apparel.owned().then(function(apparels) {
          $scope.apparels = apparels;
        });
      } else {
        // TODO Carrega apparels de outro user
      }
    }
    refreshApparels();

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
            console.log('You are sure');
            apparel.delete().then(function() {
              Apparel.clear_owned_cache();
              refreshApparels();
            });
          } else {
            console.log('You are not sure');
          }
        });
      }
    }
  })

  .controller('chatsCtrl', function($scope, $cordovaGeolocation, $ionicHistory, $state, $auth, $q, Chat, $ionicPopup) {

    $scope.onForceRefresh = function() {
      // TODO Confirmar
      var confirmPopup = $ionicPopup.confirm({
        title: 'Recarregar tudo?',
        template: 'Quer recarregar todas informações dos chats?'
      });

      confirmPopup.then(function(res) {
        if(res) {
          Chat.clearCache().then(function() {
            Chat.force_reload_active().then(function(data) {
              $scope.chats = data;
              $scope.$broadcast('scroll.refreshComplete');
            }, function() {
              $scope.$broadcast('scroll.refreshComplete');
            });
          }, function() {
            $scope.$broadcast('scroll.refreshComplete');
          });
        }
      });
    };

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

  .controller('chatCtrl', function($scope, $rootScope, $cordovaGeolocation, $ionicHistory, $state, $auth, $q, $stateParams, $ionicScrollDelegate, Chat, ChatMessage, ChatSub, ionicToast, config, $ionicPopup) {
    $scope.pageSize = 20;
    $scope.$on("$destroy", function(){
      if ($scope.chat && $scope.chat != null)
        ChatSub.unsubscribe($scope.chat);
    });

    $scope.loadingPrevious = false;
    $scope.reachedEnd = false;
    $scope.onMessageInfiniteScroll = ionic.debounce(function() {
      if ($ionicScrollDelegate.getScrollPosition().top <= 50) {
        $scope.onMessagesScroll();
      }
    }, 500);

    $scope.onForceRefresh = function() {
      // TODO Confirmar
      var confirmPopup = $ionicPopup.confirm({
        title: 'Recarregar tudo?',
        template: 'Quer recarregar o chat todo?'
      });

      confirmPopup.then(function(res) {
        if(res) {
          ChatMessage.clearCache($scope.chat).then(function() {
            $scope.loadingPrevious = false;
            $scope.reachedEnd = false;
            $scope.chat_messages = null;
            $scope.chat_messages_map = {};
            checkChat().then(function() {
              $scope.$broadcast('scroll.refreshComplete');
            }, function() {
              $scope.$broadcast('scroll.refreshComplete');
            });
          }, function() {
            $scope.$broadcast('scroll.refreshComplete');
          });
        }
      });
    };

    $scope.onMessagesScroll = function() {
      if (!$scope.reachedEnd) {
        if (!$scope.loadingPrevious) {
          $scope.loadingPrevious = true;
          $scope.loadPrevious().then(function(data) {
            $scope.reachedEnd = !data || data.length == 0;
            $scope.loadingPrevious = false;
            $scope.$broadcast('scroll.refreshComplete');
          }, function() {
            $scope.loadingPrevious = false;
            $scope.$broadcast('scroll.refreshComplete');
          });
        }
      } else {
        $scope.$broadcast('scroll.refreshComplete');
      }
    };

    function setAndAddLastMessage(messageData) {
      updateLastReadDate();

      onNewMessages([ messageData ]);
      $ionicScrollDelegate.scrollBottom(true);
    };

    function hasOnMap(message) {
      return ($scope.chat_messages_map.hasOwnProperty('m_' + message.id));
    }

    function setOnMap(message) {
      $scope.chat_messages_map['m_' + message.id] = message.id;
    }


    function onSubscribedNewMessage(messageData) {
      setAndAddLastMessage(messageData);
    };

    function onNewMessages(messagesData) {
      for (var i = 0; i < messagesData.length; i++) {
        var message = messagesData[i];
        if (!hasOnMap(message)) {
          $scope.chat_messages.push(message);
          setOnMap(message);
        }
      }
    }

    function addPreviousMessages(messagesData) {
      for (var i = messagesData.length - 1; i >= 0; i--) {
        var message = messagesData[i];
        if (!hasOnMap(message)) {
          $scope.chat_messages.unshift(message);
          setOnMap(message);
        }
      }
    }

    function subscribe() {
      ChatSub.subscribe($scope.chat, onSubscribedNewMessage);
    };

    function updateLastReadDate() {
      ChatMessage.retrieveLastMessage($scope.chat).then(function(lastMessage) {
        if (lastMessage != null) {
          $scope.last_message_sent = lastMessage;
          $scope.chat.last_message_sent = lastMessage;
          $scope.chat.last_read_at = lastMessage.created_at;
          $scope.chat.saveLocally();
        }
      });
    }

    $scope.getLatestMessages = function() {
      return ChatMessage.latestAfterRead($scope.chat, $scope.chat.last_read_at, $scope.pageSize).then(function(new_messages) {
        onNewMessages(new_messages);
        updateLastReadDate();

        return new_messages;
      },function(error) {
        console.log(error);
        return error;
      });
    };

    function loadFirstTimeMessages() {
      var newLastRead = new Date();
      return ChatMessage.latest($scope.chat, $scope.pageSize).then(function(new_messages) {
        $scope.chat_messages = new_messages;
        for (var i = 0; i < new_messages.length; i++)
          setOnMap(new_messages[i]);
        
        updateLastReadDate();

        return new_messages;
      }, function(error) {
        console.log(error);
        return error;
      });
    };

    function checkInitialMessages() {
      var newLastRead = new Date();
      return ChatMessage.latest($scope.chat, $scope.pageSize).then(function(currentMessages) {
        $scope.chat_messages = currentMessages;
        for (var i = 0; i < currentMessages.length; i++)
          setOnMap(currentMessages[i]);
        $ionicScrollDelegate.scrollBottom(true);

        if (currentMessages.length > 0) {
          $scope.getLatestMessages().then(function() {
            subscribe();
            updateLastReadDate();

            $ionicScrollDelegate.scrollBottom(true);
          });
        } else {
          subscribe();
          updateLastReadDate();
        }
        
      }, function(error) {
        console.log(error);
        subscribe();
      });
    };

    function checkChat() {
      if ($scope.chat && $scope.chat != null) {
        return checkInitialMessages();
      }
      else {
        $rootScope.showLoading('Carregando mensagens ...');
        return Chat.online_active_by_id($stateParams["id"]).then(function(chat) {
          $scope.chat = chat;
          checkInitialMessages();
          $rootScope.hideLoading();
          return chat;
        });
      }
    }

    $scope.chat = null;
    $scope.chat_messages = null;
    $scope.chat_messages_map = { };
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
        return checkInitialMessages();
      else {
        return ChatMessage.previousMessages($scope.chat, $scope.chat_messages[0], $scope.pageSize).then(function(new_messages) {
          addPreviousMessages(new_messages);
          return new_messages;
        });
      }
    }

    $scope.send = function() {
      var messageTrimmed = $scope.chat.last_sent_message ? $scope.chat.last_sent_message.trim() : '';
      if (messageTrimmed.length > 0) {
        var chat_message = new ChatMessage({chat_id: $scope.chat.id, message: messageTrimmed})
        chat_message.saveAndPersist().then(function(savedMessage) {
          $scope.chat.last_sent_message = null;
          setAndAddLastMessage(new ChatMessage(savedMessage));
        }, function(errorData) {
          $scope.chat.last_sent_message = null;
          try {
            if (config.SHOWS_STACK)
              ionicToast.show('Erro enviando mensagem:\r\n<br/>' + JSON.stringify(errorData), 'top', false, 1000);
            else
              ionicToast.show('Erro inesperado enviando mensagem', 'top', false, 1000);
          } catch (ex) { }
        });
      } else {
        ionicToast.show('Mensagem em branco não vale!', 'top', false, 3000);
      }
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