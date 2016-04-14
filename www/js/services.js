angular.module('app.services', ['ngResource', 'rails'])
  .config(["railsSerializerProvider", "RailsResourceProvider", function(railsSerializerProvider, RailsResourceProvider) {
      // RailsResourceProvider.extensions('snapshots');

      railsSerializerProvider.underscore(angular.identity).camelize(angular.identity);
  }])

  .factory('Apparel', ['$resource', '$auth', 'railsResourceFactory', 
    function($resource, $auth, railsResourceFactory) {
      var resource = railsResourceFactory({
        url: $auth.apiUrl() + '/apparels', 
        name: 'apparel'
      });

      resource.search = function (params) {
        return resource.$get(resource.$url('search'), params);
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

