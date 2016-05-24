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

  .factory('Chat', ['$resource', '$auth', 'railsResourceFactory', 
    function($resource, $auth, railsResourceFactory) {
      var resource = railsResourceFactory({
        url: $auth.apiUrl() + '/chats', 
        name: 'chat'
      });

      resource.new_chat_created = function(chat) {
        if (resource.hasOwnProperty('_active_chats')) {
          resource._active_chats.push(chat);
        }
      };

      resource.force_get_updated_chat = function(id) {
        return $q(function(resolve, reject) {
          resource.get(id)
            .then(function(data) {
              if (resource.hasOwnProperty('_active_chats'))
                resource._active_chats.push(data);

              resolve(data);
            }, reject);
        });
      };

      resource.active_by_id = function(id) {
        return $q(function(resolve, reject) {
          var found = null;
          if (resource.hasOwnProperty('_active_chats')) {
            for (var i = resource._active_chats.length - 1; i >= 0; i--) {
              var chat = resource._active_chats[i];
              if (chat.id == id) {
                found = chat;
                break;
              }
            }
          }

          if (found != null) {
            resolve(found);
          } else {
            resource.get(id)
              .then(function(data) {
                if (resource.hasOwnProperty('_active_chats'))
                  resource._active_chats.push(data);

                resolve(data);
              }, reject);
          }
        });
      };

      resource.active_by_user = function(user_id) {
        return $q(function(resolve, reject) {
          var found = null;
          if (resource.hasOwnProperty('_active_chats')) {
            for (var i = resource._active_chats.length - 1; i >= 0; i--) {
              var chat = resource._active_chats[i];
              if (chat.user_1_id == user.id || chat.user_2_id == user.id) {
                found = chat;
                break;
              }
            }
          }

          if (found != null) {
            resolve(found);
          } else {
            resource.$get(resource.$url('active_by_user'), { user_id: user_id })
              .then(function(data) {
                if (resource.hasOwnProperty('_active_chats'))
                  resource._active_chats.push(data);

                resolve(data);
              }, reject);
          }
        });
      };

      function reloadActive(resolve, reject) {
        resource.query().then(function(data) {
          if (data != null) {
            // TODO: Salvar em local storage
            resource._active_chats = data;
          }
          resolve(data);
        }, reject);
      }

      resource.force_reload_active = function() {      
        return $q(function(resolve, reject) {
          reloadActive(resolve, reject);
        });
      };

      resource.active = function() {
        return $q(function(resolve, reject) {
          if (!resource.hasOwnProperty('_active_chats')) {
            reloadActive(resolve, reject);
          } else {
            resolve(resource._active_chats);
          }
        });
      };

      return resource;
  }])

  .factory('BlankFactory', [function(){
    return {
      teste: function() {
        
      }
    }
  }])

  .service('BlankService', [function(){

  }]);

