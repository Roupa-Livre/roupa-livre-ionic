angular.module('app.services', ['ngResource', 'rails'])
  .config(["railsSerializerProvider", "RailsResourceProvider", function(railsSerializerProvider, RailsResourceProvider) {
      // RailsResourceProvider.extensions('snapshots');

      railsSerializerProvider.underscore(angular.identity).camelize(angular.identity);
  }])

  .factory('ApparelSerializer', function (railsSerializer) {
    return railsSerializer(function () {
      this.nestedAttribute('apparel_images');
      this.nestedAttribute('apparel_tags');
    });
  })

  .factory('Apparel', ['$resource', '$auth', 'railsResourceFactory', 'ApparelSerializer', '$q', 
    function($resource, $auth, railsResourceFactory, ApparelSerializer, $q) {
      var resource = railsResourceFactory({
        url: $auth.apiUrl() + '/apparels', 
        name: 'apparel',
        serializer: 'ApparelSerializer'
      });

      resource.search = function (params) {
        return resource.query(params);
      };

      resource.owned = function() {
        return $q(function(resolve, reject) {
          if (!resource.hasOwnProperty('_owned_apparels')) {
            resource.$get(resource.$url('owned')).then(function(data) {
              if (data != null) {
                // TODO: Salvar em local storage
                resource._owned_apparels = data;
              }
              resolve(data);
            }, reject);
          } else {
            resolve(resource._owned_apparels);
          }
        })
      };

      return resource;
  }])

  .factory('ApparelRating', ['$resource', '$auth', 'railsResourceFactory', 
    function($resource, $auth, railsResourceFactory) {
      var resource = railsResourceFactory({
        url: $auth.apiUrl() + '/apparel_ratings', 
        name: 'apparel_rating'
      });

      return resource;
  }])

  .factory('Chat', ['$resource', '$auth', '$q', '$rootScope', 'railsResourceFactory', 
    function($resource, $auth, $q, $rootScope, railsResourceFactory) {
      var resource = railsResourceFactory({
        url: $auth.apiUrl() + '/chats', 
        name: 'chat'
      });

      if (!resource.hasOwnProperty('_active_chats'))
        resource._active_chats = [];

      function countAllChatsNotifications(data) {
        var totalCount=0;
        for (var i = data.length - 1; i >= 0; i--) {
          var chat = data[i];
          if (chat.last_read_at == null || chat.unread_messages_count > 0)
            totalCount = totalCount + 1;
        }
        return totalCount;
      };

      resource.GlobalNotifications = 0;

      resource.prototype.setLatestChatMessages = function(chat_messages) {
        function reorder(messages) {
          new_list = [];
          for (var i = messages.length - 1; i >= 0; i--) {
            new_list.push(messages[i]);
          }
          return new_list;
        };

        if (!this.hasOwnProperty('chat_messages') || this.chat_messages == null) {
          this.chat_messages = reorder(chat_messages);
        } else {
          for (var i = chat_messages.length - 1; i >= 0; i--) {
            this.chat_messages.push(chat_messages[i]);
          }
        }
      };

      resource.prototype.setPreviousChatMessages = function(chat_messages) {
        for (var i = chat_messages.length - 1; i >= 0; i--) {
          this.chat_messages.unshift(chat_messages[i]);
        }
      };

      resource.prototype.getLastMessage = function() {
        if (this.chat_messages && this.chat_messages.length > 0)
          return this.chat_messages[this.chat_messages.length - 1];
        else
          return null;
      };

      resource.new_chat_created = function(chat) {
        addOrReplaceValues(resource._active_chats, chat);
      };

      resource.local_active_by_id = function(id) {      
        var found = null;
        for (var i = resource._active_chats.length - 1; i >= 0; i--) {
          var chat = resource._active_chats[i];
          if (chat.id == id) {
            found = chat;
            break;
          }
        }
        return found;
      };

      resource.online_active_by_id = function(id) {
        return $q(function(resolve, reject) {
          resource.get(id)
            .then(function(data) {
              addOrReplaceValues(resource._active_chats, data);

              resolve(data[0]);
            }, reject);
        });
      };

      resource.active_by_user = function(user_id) {
        return $q(function(resolve, reject) {
          var found = null;
          for (var i = resource._active_chats.length - 1; i >= 0; i--) {
            var chat = resource._active_chats[i];
            if (chat.user_1_id == user.id || chat.user_2_id == user.id) {
              found = chat;
              break;
            }
          }

          if (found != null) {
            resolve(found);
          } else {
            resource.$get(resource.$url('active_by_user'), { user_id: user_id })
              .then(function(data) {
                addOrReplaceValues(resource._active_chats, data);

                resolve(data);
              }, reject);
          }
        });
      };

      function reloadActive(resolve, reject) {
        resource.query({}).then(function(data) {
          if (data != null) {
            if (resource._active_chats.length == 0) {
              resource._active_chats = data;
            } else {
              for (var i = data.length - 1; i >= 0; i--) {
                var newChatInfo = data[i];
                addOrReplaceValues(resource._active_chats, newChatInfo);
              }
            }
            
            // TODO: Salvar em local storage

            resource.GlobalNotifications = countAllChatsNotifications(data);
            resource.LastRefreshedChatsAt = new Date();
          }
          resolve(data);
        }, reject);
      };

      resource.force_reload_active = function() {      
        return $q(function(resolve, reject) {
          reloadActive(resolve, reject);
        });
      };

      resource.active = function() {
        return $q(function(resolve, reject) {
          if (resource._active_chats.length == 0) {
            reloadActive(resolve, reject);
          } else {
            resolve(resource._active_chats);
          }
        });
      };

      return resource;
  }])

  .factory('ChatMessage', ['$resource', '$auth', '$q', '$rootScope', 'railsResourceFactory', 
    function($resource, $auth, $q, $rootScope, railsResourceFactory) {
      var resource = railsResourceFactory({
        url: $auth.apiUrl() + '/chat_messages', 
        name: 'chat_message'
      });

      resource.latest = function(chat) {
        return $q(function(resolve, reject) {
          resource.query({ chat_id: chat.id }).then(resolve, reject);
        });
      };

      resource.latestAfterRead = function(chat) {
        return $q(function(resolve, reject) {
          resource.query({ chat_id: chat.id, last_read_at: lastReadAt }).then(resolve, reject);
        });
      };

      resource.previousMessages = function(chat, base_message) {
        return $q(function(resolve, reject) {
          resource.query({ chat_id: chat.id, base_message_id: base_message.id }).then(resolve, reject);
        });
      };

      return resource;
  }])

  .factory('SocketService', ['$auth', 'config', 'socketFactory', function ($auth, config, socketFactory) {
    return { socket: null,
      connect: function() {
        var opts =  $auth.retrieveData('auth_headers');
        this.socket =  socketFactory({
          ioSocket: io.connect(config.REALTIME_URL, { query: opts })
        });
      }
    };
  }])

  .factory('ChatSub', ['SocketService', '$auth', function (SocketService, $auth) {
    var container =  [];
    return {
        getSubscriptionName: function(chat) {
          return 'user:' + $auth.user.id + ':chat:' + chat.id + ':messages';
        },

        subscribe: function(chat, callback){
          if (SocketService.socket == null)
            SocketService.connect();

          var name = this.getSubscriptionName(chat);
          if (container.indexOf(name) == -1) {
            SocketService.socket.on(name, callback);
            this.pushContainer(name);
          }
        },
 
        pushContainer : function(subscriptionName){
          container.push(subscriptionName);
        },
 
        //Unsubscribe all containers..
        unsubscribeAll: function(){
          for(var i=0; i<container.length; i++){
              SocketService.socket.removeAllListeners(container[i]);   
          }
          //Now reset the container..
          container = [];
        },
 
        //Unsubscribe all containers..
        unsubscribe: function(chat){
          var name = this.getSubscriptionName(chat);
          var index = container.indexOf(name);
          if (index > -1) {
            SocketService.socket.removeAllListeners(name);
            container.splice(index, 1);
          }
        }
 
    };
  }])

  .factory('BlankFactory', [function(){
    return {
      teste: function() {
        
      }
    }
  }])

  .service('BlankService', [function(){

  }]);

