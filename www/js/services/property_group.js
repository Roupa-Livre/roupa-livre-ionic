angular.module('app.services')
  .factory('PropertyGroup', ['$resource', '$auth', 'railsResourceFactory', '$q',
    function($resource, $auth, railsResourceFactory, $q) {
      var resource = railsResourceFactory({
        url: $auth.apiUrl() + '/property_groups',
        name: 'property_group'
      });

      resource._rootCache = null;
      resource._cachedLists = {};

      function cacheData(parentId, propertyId, list) {
        var id = propertyId ? propertyId : '_'
        resource._cachedLists['p' + parentId + '_' + propertyId] = list;
      }

      function getCacheData(parentId, propertyId) {
        var id = propertyId ? propertyId : '_'
        return resource._cachedLists['p' + parentId + '_' + propertyId];
      }

      resource.root = function() {
        return $q(function(resolve, reject) {
          if (resource._rootCache) {
            resolve(resource._rootCache);
          } else {
            resource.query({ root: true }).then(function(data) {
              if (data != null)
                resource._rootCache = data;
              resolve(data);
            }, reject);
          }
        });
      }

      resource.children = function(parentId, propertyId) {
        return $q(function(resolve, reject) {
          var cachedData = getCacheData(parentId, propertyId)
          if (cachedData) {
            resolve(cachedData);
          } else {
            resource.query({ parent_id: parentId, property_id: propertyId }).then(function(data) {
              if (data != null)
                cacheData(parentId, propertyId, data);
              resolve(data);
            }, reject);
          }
        });
      }

      return resource;
  }])
