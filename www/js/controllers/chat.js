angular.module('app.controllers')
  .controller('chatCtrl', function($scope, $rootScope, $cordovaGeolocation, $ionicHistory, $state, $auth, $q, $stateParams, $ionicScrollDelegate, Chat, ChatMessage, ChatSub, config, $ionicPopup) {
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

    function showLoading() {
      $scope.loadingMessages = true;
      $rootScope.showReadableLoading(getLocalizedMessage("chat.loading.message"));
    }

    function hideLoading() {
      $scope.loadingMessages = false;
      $rootScope.hideReadableLoading();
    }

    $scope.onForceRefresh = function() {
      $rootScope.showConfirmPopup(t('chat.messages.reload.title'),t('chat.messages.reload.body')).then(function(res) {
        if(res) {
          showLoading();

          ChatMessage.clearCache($scope.chat).then(function() {
            $scope.loadingPrevious = false;
            $scope.reachedEnd = false;
            $scope.chat_messages = null;
            $scope.chat_messages_map = {};
            checkChat().then(function() {
              $scope.$broadcast('scroll.refreshComplete');
              hideLoading();
            }, function() {
              $scope.$broadcast('scroll.refreshComplete');
              hideLoading();
            });
          }, function() {
            $scope.$broadcast('scroll.refreshComplete');
            hideLoading();
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

    function checkInitialMessages(allowLoadingMessage) {
      if (typeof allowLoadingMessage === 'undefined') 
        allowLoadingMessage = true
      
      var newLastRead = new Date();
      var loadingStartDate = null;
      function onBeforeFetchOnline() {
        if (allowLoadingMessage) {
          loadingStartDate = new Date();
          showLoading();
        }
      };
      
      return ChatMessage.latest($scope.chat, $scope.pageSize, onBeforeFetchOnline).then(function(currentMessages) {
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

        if (loadingStartDate != null) {
          sleepToBeReadbleIfNeeded(loadingStartDate, config, function() {
            hideLoading();
            loadingStartDate = null;
          });
        }
        
      }, function(error) {
        console.log(error);
        subscribe();

        if (loadingStartDate != null) {
          sleepToBeReadbleIfNeeded(loadingStartDate, config, function() {
            hideLoading();
            loadingStartDate = null;
          });
        }
      });
    };

    function checkChat() {
      if ($scope.chat && $scope.chat != null) {
        return checkInitialMessages();
      }
      else {
        showLoading(t('chat.loading.message'));
        return Chat.online_active_by_id($stateParams["id"]).then(function(chat) {
          $scope.chat = chat;
          checkInitialMessages().then(function() {
            hideLoading();
          }, function() {
            hideLoading();
          });
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
      if ($scope.chat_messages == null || $scope.chat_messages.length == 0) {
        return checkInitialMessages(false);
      }
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
              $rootScope.showToastMessage('Erro enviando mensagem', null, true, JSON.stringify(errorData));
            else
              $rootScope.showToastMessage(t('chat.messages.error.sending'));
          } catch (ex) { }
        });
      } else {
        $rootScope.showToastMessage(t('chat.messages.error.blank_message'));
      }
    };

    $scope.block = function() {
      var popup = $rootScope.showConfirmPopup(t('chat.confirmations.block.title'), t('chat.confirmations.block.subtitle'));
      popup.then(function(res) {
        if (res) {
          $scope.chat.block().then(function(blockData) {
            Chat.clearCache().then(function() {
              Chat.force_reload_active().then(function(data) {
                $rootScope.goChats();
              }, function() {
                $rootScope.goChats();
              });
            });
          });
        }
      });
    };

    $scope.getIncludeFile = function(chat_message) {
      if (chat_message.hasOwnProperty('type')) {
        return chat_message.type + '.html';
      } else {
        return 'ChatMessage.html';
      }
    };
  });