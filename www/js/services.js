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
        // $cordovaSQLite.execute(db, 'DROP TABLE chats');
        $cordovaSQLite.execute(db, CHATS_TABLE_QUERY);

        // $cordovaSQLite.execute(db, 'DROP TABLE chat_messages');
        var MESSAGES_TABLE_QUERY = "CREATE TABLE IF NOT EXISTS chat_messages (id integer primary key, chat_id integer, user_id integer, message text, created_at date)";
        // $cordovaSQLite.execute(db, 'DROP TABLE chat_messages');
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

    self.queryAndFetchIfEmpty = function(queryText, parameters, fetchDeferredDelegate) {
      var q = $q.defer();
      self.query(queryText, parameters).then(function(initialResult) {
        if (initialResult.rows.length == 0) {
          fetchDeferredDelegate().then(function(fetchResult) {
            self.query(queryText, parameters).then(q.resolve, q.reject);
          }, q.reject);
        } else {
          q.resolve(initialResult);
        }
      }, q.reject)
      return q.promise;
    }

    return self;
  }])

  .factory('ApparelProperty', ['$resource', '$auth', 'railsResourceFactory', '$q',
    function($resource, $auth, railsResourceFactory) {
      return railsResourceFactory({
        url: $auth.apiUrl() + '/apparel_properties',
        name: 'apparel_property'
      });
  }])
  .factory('ApparelSerializer', ['railsSerializer', function (railsSerializer) {
    return railsSerializer(function () {
      this.nestedAttribute('apparel_images');
      this.nestedAttribute('apparel_tags');
      this.nestedAttribute('apparel_property');
        this.resource('apparel_property', 'ApparelProperty');
    });
  }])

  .factory('Apparel', ['$resource', '$auth', 'railsResourceFactory', 'ApparelSerializer', '$q',
    function($resource, $auth, railsResourceFactory, ApparelSerializer, $q) {
      var resource = railsResourceFactory({
        url: $auth.apiUrl() + '/apparels',
        name: 'apparel',
        serializer: 'ApparelSerializer'
      });

      var filters = { range: 100 };

      resource.hasFilters = function() {
        return !isEmptyObject(filters) && filters.range != 100;
      };

      resource.applyFilters = function(newFilters) {
        filters = newFilters;
      };

      resource.clearFilters = function() {
        filters = { range: 100 };
      };

      resource.getFilters = function() {
        return filters;
      };

      resource.search = function (params) {
        params = params || {};
        filters = filters || {};
        var mergedParams = angular.extend({}, params, filters)
        if (mergedParams.range && mergedParams.range >= 100)
          delete mergedParams["range"];

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

      resource.clear_owned_cache = function() {
        if (resource.hasOwnProperty('_owned_apparels'))
          delete resource['_owned_apparels'];
      };

      resource.prototype.update_owned_cache = function() {
        var item = this;
        if (resource.hasOwnProperty('_owned_apparels'))
          addOrReplaceValues(resource._owned_apparels, item);
      };

      resource.prototype.hasGender = function() {
        return this.gender != null && this.gender != "SKIP";
      }

      resource.prototype.hasAgeInfo = function() {
        return this.age_info != null;
      }

      resource.prototype.hasImages = function() {
        if (!this.apparel_images || this.apparel_images == null || this.apparel_images.length == 0)
          return false;

        for (var i = 0; i < this.apparel_images.length; i++) {
          var image = this.apparel_images[i];
          if (!image.hasOwnProperty('_destroy') || !image._destroy)
            return true;
        }
        return false;
      }

      resource.prototype.report = function(reason) {
        return resource.$post(this.$url('report'), { reason: reason });
      }

      return resource;
  }])

  .factory('ApparelMatcher', ['Apparel', '$q',
    function(Apparel, $q) {
      var matcher = self;
      self.apparels = [];
      self.already_seen = [];

      function getPageSize() {
        if (window.Connection) {
          // console.log(navigator.connection.type);
          if (navigator.connection.type == Connection.ETHERNET || navigator.connection.type == Connection.WIFI)
            return 3;
        }

        return 1;
      };

      function getFirstAndDequeue() {
        var apparel = matcher.apparels.shift();;
        matcher.already_seen.push(apparel.id);
        return apparel;
      }

      function loadApparels() {
        return $q(function(resolve, reject) {
          var ignore = matcher.already_seen.join(',');
          var params = { page_size: getPageSize(), ignore: ignore };
          Apparel.search(params).then(function(data) {
            if (data && data.length > 0) {
              matcher.apparels = data;
              resolve(data);
            } else
              resolve(null);
          }, reject);
        });
      }

      self.isNextAlreadyLoaded = function() {
        return (matcher.apparels.length > 0)
      }

      self.loadApparelsIfNeededAsync = function() {
        if (!matcher.isNextAlreadyLoaded())
          loadApparels();
      }

      self.getNextAvailableApparel = function() {
        return $q(function(resolve, reject) {
          if (matcher.apparels.length > 0)
            resolve(getFirstAndDequeue());
          else
            loadApparels().then(function(data) {
              if (data != null)
                resolve(getFirstAndDequeue());
              else
                resolve(data)
            }, reject);
        });
      };

      self.markAsRated = function(apparelId) {
        if (matcher.already_seen.length > 0) {
          for (var i = 0; i < matcher.already_seen.length; i++) {
            var auxId = matcher.already_seen[i];
            if (auxId == apparelId) {
              matcher.already_seen.splice(i, 1);
              break;
            }
          }
        }
      };

      self.clearCache = function() {
        matcher.apparels = [];
        matcher.already_seen = [];
      }

      return self;
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

      resource.clearCache = function() {
        return DBA.query("DELETE FROM chats", []);
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

          resource.active(true).then(resolve, reject);
        }, reject);
      };

      resource.force_reload_active = function() {
        return $q(function(resolve, reject) {
          reloadActive(resolve, reject);
        });
      };

      resource.active = function(wasReloading) {
        return $q(function(resolve, reject) {
          DBA.query("SELECT * FROM chats order by last_message_sent_at desc").then(function(chatRows){
            var chats = DBA.processAll(chatRows, readFromDB);
            if (chats.length == 0 && !wasReloading) {
              reloadActive(resolve, reject);
            } else {
              resolve(chats);
            }
          }, reject);
        });
      };

      resource.prototype.block = function() {
        return resource.$post(this.$url('block'), { });
      }

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

      resource.prototype.saveAndPersist = function() {
        return this.save().then(function(savedMessage) {
          saveToDB(savedMessage);
          return savedMessage;
        });
      };

      resource.clearCache = function(chat) {
        return DBA.query("DELETE FROM chat_messages where chat_id = ?", [chat.id]);
      };

      resource.retrieveLastMessage = function(chat) {
        var QUERY = "SELECT * FROM chat_messages where chat_id = ? order by created_at desc LIMIT 1";
        var ARGS = [chat.id];

        function fetch() {
          return resource.latestOnline(chat, 1);
        }

        return $q(function(resolve, reject) {
          DBA.queryAndFetchIfEmpty(QUERY, ARGS, fetch).then(function(messageRows){
            var messages = DBA.processAll(messageRows, readFromDB);
            return messages.length > 0 ? messages[0] : null;
          }, reject);
        });
      };

      resource.latest = function(chat, pageSize, onBeforeFetchOnline) {
        var QUERY = "SELECT * FROM chat_messages where chat_id = ? order by created_at desc LIMIT " + pageSize;
        var ARGS = [chat.id];

        function fetch() {
          onBeforeFetchOnline();
          return resource.latestOnline(chat, pageSize);
        }

        return $q(function(resolve, reject) {
          DBA.queryAndFetchIfEmpty(QUERY, ARGS, fetch).then(function(messageRows){
            resolve(reverse(DBA.processAll(messageRows, readFromDB)));
          }, reject);
        });
      };

      resource.latestOnline = function(chat, pageSize) {
        return $q(function(resolve, reject) {
          resource.query({ chat_id: chat.id, page_size: pageSize }).then(function(data) {
            saveAllToDB(data);
            resolve(data);
          }, reject);
        });
      };

      resource.latestAfterReadOnline = function(chat, lastReadAt) {
        return $q(function(resolve, reject) {
          resource.query({ chat_id: chat.id, last_read_at: lastReadAt }).then(function(data) {
            saveAllToDB(data);
            resolve(data);
          }, reject);
        });
      };

      resource.latestAfterRead = function(chat, lastReadAt) {
        var QUERY = "SELECT * FROM chat_messages where chat_id = ? and created_at > ? order by created_at desc";
        var ARGS = [chat.id, lastReadAt];

        function fetch() {
          return resource.latestAfterReadOnline(chat, lastReadAt);
        }

        return $q(function(resolve, reject) {
          DBA.queryAndFetchIfEmpty(QUERY, ARGS, fetch).then(function(messageRows){
            var messages = DBA.processAll(messageRows, readFromDB);
            resolve(reverse(messages));
          }, reject);
        });
      };

      resource.loadPreviousOnline = function(chat, base_message, pageSize) {
        return $q(function(resolve, reject) {
          resource.query({ chat_id: chat.id, base_message_id: base_message.id, page_size: pageSize }).then(function(data) {
            saveAllToDB(data);
            resolve(data);
          }, reject);
        });
      };

      resource.previousMessages = function(chat, base_message, pageSize) {
        var QUERY = "SELECT * FROM chat_messages where chat_id = ? and created_at < ? order by created_at desc LIMIT " + pageSize;
        var ARGS = [chat.id, base_message.created_at];

        function fetch() {
          return resource.loadPreviousOnline(chat, base_message, pageSize);
        }

        return $q(function(resolve, reject) {
          DBA.queryAndFetchIfEmpty(QUERY, ARGS, fetch).then(function(messageRows){
            var messages = DBA.processAll(messageRows, readFromDB);
            resolve(reverse(messages));
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
