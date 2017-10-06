angular.module('app.controllers')
  .controller('searchCtrl', function($scope, $rootScope, $cordovaGeolocation, $cordovaDevice, $ionicHistory, $state, $auth, $q, $timeout, Apparel, ApparelMatcher, PropertyGroup) {
    $scope.groupPropertySelectionChanged = function(group) {
      if (!$scope.loadingRootGroups) {
        doGroupPropertySelectionChanged(group, $scope.filters.apparel_property[group.prop_name], $scope.filters);
      }
    }

    function fixForDynamicSelects() {
      for (var i = 0; i < $scope.propertyGroups.length; i++) {
        var group = $scope.propertyGroups[i];
        if ($scope.filters.apparel_property[group.prop_name]) {
          var select = document.getElementById(group.prop_name);
          if (select)
            select.value = $scope.filters.apparel_property[group.prop_name].toString();
        }
      }
    }

    function doGroupPropertySelectionChanged(group, newValue, entry) {
      if (group.childrenGroups) {
        for (var i = 0; i < group.childrenGroups.length; i++) {;
          var childGroup = group.childrenGroups[i];
          var childIndex = $scope.propertyGroups.indexOf(childGroup);
          if (childIndex > -1) {
            $scope.propertyGroups.splice(childIndex, 1);
            doGroupPropertySelectionChanged(childGroup, null, entry);
          }
          if (childGroup.unregister) {
            childGroup.unregister();
            delete childGroup['unregister'];
          }
        }
      }

      if (newValue) {
        if (!group.loading) {
          group.loading = true;
          loadChildGroups(group, newValue, entry).then(function() {
            group.loading = false;
          }, function() {
            group.loading = false;
          });
        }
      } else {
        // caso o valor da propriedade esteja preenchida entao limpa
        entry.apparel_property[group.prop_name] = null;
      }
    };

    function doAddPropertyGroup(group, parentGroup, entry) {
      return $q(function(resolve, reject) {
        $scope.propertyGroups.push(group);
        var groupIndex = $scope.propertyGroups.length - 1;
        if (parentGroup) {
          if (!parentGroup.childrenGroups)
            parentGroup.childrenGroups = [];
          parentGroup.childrenGroups.push(group);
        }

        // group.unregister = $scope.$watch('entry.apparel_property.' + group.prop_name, function(newValue) {
        //   if (!$scope.loadingRootGroups)
        //     groupPropertySelectionChanged(group, newValue, $scope.entry || entry);
        // });
        var selectedId = entry.apparel_property[group.prop_name];
        if (selectedId) {
          loadChildGroups(group, selectedId, entry).then(function(childrenGroups) {
            resolve(group);
          }, reject);
        } else {
          entry.apparel_property[group.prop_name] = null;
          resolve(group);
        }
      });
    }

    function loadRootGroups(entry) {
      return $q(function(resolve, reject) {
        PropertyGroup.root().then(function(groups) {
          var promises = [];
          for (var i = 0; i < groups.length; i++) {
            promises.push(doAddPropertyGroup(groups[i], null, entry));
          }
          Promise.all(promises).then(resolve, reject);
        }, reject);
      });
    }

    function loadChildGroups(parentGroup, selectedId, entry) {
      return $q(function(resolve, reject) {
        PropertyGroup.children(parentGroup.id, selectedId).then(function(groups) {
          var promises = [];
          for (var i = 0; i < groups.length; i++) {
            promises.push(doAddPropertyGroup(groups[i], parentGroup, entry));
          }
          Promise.all(promises).then(function(data) {
            resolve(groups);
          }, reject);
        }, reject);
      });
    }

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
      $scope.initFilters();
    };

    $scope.initFilters = function() {
      $scope.filters = angular.extend({ apparel_property: {} }, Apparel.getFilters());
      $scope.propertyGroups = [];
      $scope.loadingRootGroups = false;
      loadRootGroups($scope.filters).then(function() {
        $timeout(function() {
          fixForDynamicSelects();
        })
      })
    }
    $scope.initFilters();
  })
