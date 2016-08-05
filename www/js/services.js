angular.module('app.services', ['ngCordova', 'ngResource', 'rails'])
  .config(["railsSerializerProvider", "RailsResourceProvider", function(railsSerializerProvider, RailsResourceProvider) {
      // RailsResourceProvider.extensions('snapshots');

      railsSerializerProvider.underscore(angular.identity).camelize(angular.identity);
  }])

  .factory('DBA', ['$cordovaSQLite', '$q', '$ionicPlatform', function($cordovaSQLite, $q, $ionicPlatform) {
    var self = this;
    var db;

    function dbsafe(value) {
      if (!value || value == null)
        return null;
      else
        return value;
    }

    self.init = function() {
      var q = $q.defer();

      self.get_db().then(function (db) {         
        var CHATS_TABLE_QUERY = "CREATE TABLE IF NOT EXISTS chats (id integer primary key, user_1_id integer, user_2_id integer, name text, last_read_at date, other_user blob, others_last_read_at date, other_user_apparels blob, owned_apparels blob, unread_messages_count integer, total_messages_count integer, last_message_sent blob, last_message_sent_at date)";
        $cordovaSQLite.execute(db, CHATS_TABLE_QUERY); 

        // $cordovaSQLite.execute(db, 'DROP TABLE chat_messages'); 
        var MESSAGES_TABLE_QUERY = "CREATE TABLE IF NOT EXISTS chat_messages (id integer primary key, chat_id integer, user_id integer, message text, created_at date)";
        $cordovaSQLite.execute(db, MESSAGES_TABLE_QUERY); 

        self.query = do_query;

        q.resolve(db);
      });

      return q.promise;
    }

    self.get_db = function() {
      var q = $q.defer();

      $ionicPlatform.ready(function () {         
        if (window.cordova) {
          // http://phonegapcmsworld.blogspot.com.br/2016/06/iosDatabaseLocation-value-is-now-mandatory-in-openDatabase-call.html
          if (ionic.Platform.isAndroid()) {
            db = $cordovaSQLite.openDB({ name: "roupalivre_v1.db", iosDatabaseLocation:'default'}); 
          } else {
            try {
              db = window.sqlitePlugin.openDatabase({ name: "roupalivre_v1.db", location: 2, createFromLocation: 1});   
            } catch (err) {
              console.log(err);
              db = $cordovaSQLite.openDB({ name: "roupalivre_v1.db", iosDatabaseLocation:'default'}); 
            }
            
          }
          
        } else {
          db = window.openDatabase('roupalivre_v1.db', '1.0', 'roupa_livre', -1);
        }

        q.resolve(db);
      });

      return q.promise;
    }

    var do_query = function (query, parameters) {
      parameters = parameters || [];
      var q = $q.defer();

      $cordovaSQLite.execute(db, query, parameters)
        .then(function (result) {
          q.resolve(result);
        }, function (error) {
          console.warn('Erro na execução da query');
          console.warn(error);
          q.reject(error);
        });
      
      return q.promise;
    }
      
    var check_and_query = function (query, parameters) {
      parameters = parameters || [];
      var q = $q.defer();

      self.init().then(function(db) {
        do_query(query, parameters).then(q.resolve, q.reject);
      });
      
      return q.promise;
    }

    self.query = check_and_query;
      
    // Processa result set
    self.getAll = function(result) {
      return processAll(result, function(item) { return item; });
    }

    self.processAll = function(result, processFunction) {
      var output = [];

      for (var i = 0; i < result.rows.length; i++) {
        output.push(processFunction(result.rows.item(i)));
      }
      return output;
    }

    self.getFirstOrNull = function(result) {
      return processFirstOrNull(result, function(item) { return item; });
    }

    self.processFirstOrNull = function(result, processFunction) {
      if (result.rows.length > 0)
        return processFunction(result.rows.item(0));
      return null;
    }

    return self;
  }])

  .factory('ApparelSerializer', ['railsSerializer', function (railsSerializer) {
    return railsSerializer(function () {
      this.nestedAttribute('apparel_images');
      this.nestedAttribute('apparel_tags');
    });
  }])

  .factory('Apparel', ['$resource', '$auth', 'railsResourceFactory', 'ApparelSerializer', '$q', 
    function($resource, $auth, railsResourceFactory, ApparelSerializer, $q) {
      var resource = railsResourceFactory({
        url: $auth.apiUrl() + '/apparels', 
        name: 'apparel',
        serializer: 'ApparelSerializer'
      });

      var filters = {};

      resource.hasFilters = function() {
        return !isEmptyObject(filters);
      };

      resource.applyFilters = function(newFilters) {
        filters = newFilters;
      };

      resource.clearFilters = function() {
        filters = {};
      };

      resource.getFilters = function() {
        return filters;
      };

      resource.search = function (params) {
        params = params || {};
        filters = filters || {};
        var mergedParams = angular.extend({}, params, filters)
        return resource.query(mergedParams);
      };

      resource.owned_by_user = function (user_id) {
        return resource.query({ user_id: user_id});
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

      resource.prototype.hasGender = function() {
        return this.gender != null && this.gender != "SKIP";
      }

      resource.prototype.hasAgeInfo = function() {
        return this.age_info != null;
      }

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

  .factory('Chat', ['$resource', '$auth', '$q', '$rootScope', 'railsResourceFactory', '$cordovaSQLite', 'DBA',
    function($resource, $auth, $q, $rootScope, railsResourceFactory, $cordovaSQLite, DBA) {
      var resource = railsResourceFactory({
        url: $auth.apiUrl() + '/chats', 
        name: 'chat'
      });

      function readFromDB(dbData) {
        var chat = new resource(dbData);
        chat.other_user = JSON.parse(chat.other_user);
        chat.other_user_apparels = JSON.parse(chat.other_user_apparels);
        chat.owned_apparels = JSON.parse(chat.owned_apparels);
        chat.last_message_sent = JSON.parse(chat.last_message_sent);
        delete chat['last_message_sent_at'];
        return chat;
      };

      function saveToDB(chat) {
        var values = [chat.id, chat.user_1_id, chat.user_2_id, name, chat.last_read_at, JSON.stringify(chat.other_user), chat.others_last_read_at, JSON.stringify(chat.other_user_apparels), JSON.stringify(chat.owned_apparels), chat.unread_messages_count, chat.total_messages_count, JSON.stringify(chat.last_message_sent), (chat.last_message_sent != null ? chat.last_message_sent.created_at : null)];
        DBA.query("INSERT OR REPLACE INTO chats (id, user_1_id, user_2_id, name, last_read_at, other_user, others_last_read_at, other_user_apparels, owned_apparels, unread_messages_count, total_messages_count, last_message_sent, last_message_sent_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", values);
      };

      // _active_chats

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

      resource.prototype.saveLocally = function() {
        saveToDB(this);
      };

      resource.prototype.getLastMessage = function() {
        return this.last_message_sent;
      };

      resource.new_chat_created = function(chat) {
        saveToDB(chat);
      };

      resource.local_active_by_id = function(id) {      
        return DBA.query("SELECT * FROM chats where id = ?", [ id ]).then(function(chatRows){ 
          return DBA.processFirstOrNull(chatRows, readFromDB); 
        });
      };

      resource.online_active_by_id = function(id) {
        return $q(function(resolve, reject) {
          resource.get(id)
            .then(function(data) {
              saveToDB(data);
              resolve(data);
            }, reject);
        });
      };

      function reloadActive(resolve, reject) {
        resource.query({}).then(function(data) {
          if (data != null) {
            for (var i = data.length - 1; i >= 0; i--) {
              saveToDB(data[i]);
            }

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
          DBA.query("SELECT * FROM chats order by last_message_sent_at desc").then(function(chatRows){ 
            var chats = DBA.processAll(chatRows, readFromDB); 
            if (chats.length == 0) {
              reloadActive(resolve, reject);
            } else {
              resolve(chats);
            }
          }, reject);
        });
      };

      return resource;
  }])

  .factory('ChatMessage', ['$resource', '$auth', '$q', '$rootScope', 'railsResourceFactory', '$cordovaSQLite','DBA', 
    function($resource, $auth, $q, $rootScope, railsResourceFactory, $cordovaSQLite, DBA) {
      var resource = railsResourceFactory({
        url: $auth.apiUrl() + '/chat_messages', 
        name: 'chat_message'
      });

      function readFromDB(dbData) {
        return new resource(dbData);
      };

      function saveToDB(chat_message) {
        var values = [chat_message.id, chat_message.user_id, chat_message.chat_id, chat_message.message, chat_message.created_at];
        DBA.query("INSERT OR REPLACE INTO chat_messages (id, user_id, chat_id, message, created_at) VALUES (?, ?, ?, ?, ?)", values);
      };

      function saveAllToDB(chat_messages) {
        for (var i = chat_messages.length - 1; i >= 0; i--) {
          saveToDB(chat_messages[i]);
        }
      }

      resource.current = function(chat) {
        return $q(function(resolve, reject) {
          DBA.query("SELECT * FROM chat_messages where chat_id = ? order by created_at desc LIMIT 20", [chat.id]).then(function(messageRows){ 
            var messages = DBA.processAll(messageRows, readFromDB); 
            resolve(reverse(messages));
          }, reject);
        });
      };

      resource.latest = function(chat) {
        return $q(function(resolve, reject) {
          resource.query({ chat_id: chat.id }).then(function(data) {
            saveAllToDB(data);
            resolve(data);
          }, reject);
        });
      };

      resource.latestAfterRead = function(chat, lastReadAt) {
        return $q(function(resolve, reject) {
          resource.query({ chat_id: chat.id, last_read_at: lastReadAt }).then(function(data) {
            saveAllToDB(data);
            resolve(data);
          }, reject);
        });
      };

      resource.previousMessages = function(chat, base_message) {
        return $q(function(resolve, reject) {
          resource.query({ chat_id: chat.id, base_message_id: base_message.id }).then(function(data) {
            saveAllToDB(data);
            resolve(data);
          }, reject);
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
  }]);

