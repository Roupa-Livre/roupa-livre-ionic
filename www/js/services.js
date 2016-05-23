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
        return resource.$get(resource.$url('search'), params);
      };

      resource.owned = function() {
        return $q(function(resolve, reject) {
          if (!resource.hasOwnProperty('_owned_apparels')) {
            resource.$get(resource.$url('owned'), params).then(function(data) {
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

  .factory('BlankFactory', [function(){
    return {
      teste: function() {
        
      }
    }
  }])

  .service('BlankService', [function(){

  }]);

