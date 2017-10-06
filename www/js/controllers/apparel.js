angular.module('app.controllers')
  .controller('apparelCtrl', function($scope, $rootScope, $cordovaGeolocation, $ionicHistory, $state, $auth, $q, $ionicSlideBoxDelegate, Apparel, ApparelRating, Chat, ApparelMatcher, $ionicLoading, $log, config, NotificationManager, $ionicPopup, $timeout) {
    $scope.showLoading = function(message) {
      $rootScope.showReadableLoading(message);
    };
    $scope.hideLoading = function(){
      $rootScope.hideReadableLoading();
    };

    $scope.apparelSwiper = {};
    $scope.apparelProperties = null;

    $scope.onReadySwiper = function(swiper) {
      $scope.apparelSwiper = swiper;
      $timeout(function() {
        if ($scope.apparelSwiper.update)
          $scope.apparelSwiper.update();
      }, 200);
    };

    function setApparelProperties() {
      $scope.apparelProperties = null;
      if ($scope.entry.apparel_property) {
        var apparelProperties = [];
        for (var prop_name in $scope.entry.apparel_property) {
          if ($scope.entry.apparel_property.hasOwnProperty(prop_name)) {
            if (prop_name.indexOf("_name") > -1) {
              var value = $scope.entry.apparel_property[prop_name];
              if (value)
                apparelProperties.push({ prop_name: prop_name, value: value });
            }
          }
        }
        $scope.apparelProperties = apparelProperties;
      }

    }

    function refereshApparelSwiper(onRefreshed) {
      if ($scope.apparelSwiper.update) {
        $timeout(function() {
            // $scope.apparelSwiper.update();
            $scope.apparelSwiper.update();
            if (onRefreshed)
              onRefreshed();
          }, 100);
      }
    };

    function setCurrentApparel(apparel) {
      if (apparel != null) {
        var entry = apparel;

        // sets dummy data
        if (!entry.hasOwnProperty('user') || !entry.user) {
          entry.user = {
            id: entry.user_id,
            nickname: 'giovana camargo',
            distance: '3km',
            social_image:null,
            image: null
          }
        }

        $scope.entry = entry;
        setApparelProperties();
        $ionicSlideBoxDelegate.update();
        refereshApparelSwiper();
      } else {
        $ionicHistory.nextViewOptions({ disableBack: true });
        $state.go('menu.apparels_not_found');
      }
    }

    function loadNextApparel() {
      if (!ApparelMatcher.isNextAlreadyLoaded()) {
        $timeout(function() {
          $scope.showLoading(t('apparel.loading.message'));
        });
      }

      ApparelMatcher.getNextAvailableApparel().then(function(apparel) {
        $timeout(function() {
          setCurrentApparel(apparel);
          setTimeout(function() {
            ApparelMatcher.loadApparelsIfNeededAsync();
          }, 500);
          $scope.hideLoading();
        });
      }, function(error) {
        $log.debug(error);
        $timeout(function() {
          $scope.hideLoading();
          $rootScope.showToastMessage(t('apparel.messages.error.loading'), 1000);
        });
      });
    }

    function nextAfterMatch(chat_data) {
      $ionicHistory.nextViewOptions({ disableBack: true });
      $state.go('menu.match_warning', { chat_id: chat_data.id });
    };

    function goToNextApparel() {
      $ionicHistory.nextViewOptions({ disableBack: true });
      $state.go($state.current, { last_id: $scope.entry.id }, {
        reload: false,
        inherit: false,
        notify: true
      });
    };

    function failAfterRating(error) {
      $log.debug(error);
      // não será necessario por enquanto ja que vamos fazer isso asincronamente
      // $rootScope.showToastMessage('Erro carregando salvando rating');
    };

    $scope.like = function() {
      if ($scope.entry) {
        var rating = new ApparelRating({apparel_id: $scope.entry.id, liked: true})

        rating.save().then(function(data) {
          ApparelMatcher.markAsRated(data.id);

          if (data.hasOwnProperty('chat') && data.chat != null) {
            $timeout(function() {
              nextAfterMatch(data.chat);
            });
          }
        }, failAfterRating);

        goToNextApparel();
      }
    };

    $scope.dislike = function() {
      if ($scope.entry) {
        var rating = new ApparelRating({apparel_id: $scope.entry.id, liked: false})
        rating.save().then(function(data) {
          ApparelMatcher.markAsRated(data.id);
        }, failAfterRating);

        goToNextApparel();
      }
    };

    $scope.report = function() {
      $scope.report_entry = { reason: null };
      var confirmPopup = $ionicPopup.show({
        title: t('apparel.report.title'),
        templateUrl: 'templates/match/_report.html',
        scope: $scope,
        buttons: [{ // Array[Object] (optional). Buttons to place in the popup footer.
          text: t('shared.buttons.cancel'),
          type: 'button-default'
        }, {
          text: t('shared.buttons.confirm'),
          type: 'button-positive',
          onTap: function(e) {
            $scope.invalid_report = false;
            if ($scope.report_entry.reason) {
              return $scope.report_entry.reason;
            } else {
              $scope.invalid_report = true;
              e.preventDefault();
            }
          }
        }]
      });

      confirmPopup.then(function(res, e) {
        if(res) {
          $rootScope.showReadableLoading(t('apparel.report.loading'));
          $scope.entry.report(res).then(function(data) {
            $timeout(function() {
              $rootScope.hideReadableLoading();
              goToNextApparel();
            });
          }, function(error) {
            $timeout(function() {
              $rootScope.hideReadableLoading();
            });
          });
        } else {
          console.log('You are not sure');
        }
      });
    };

    $scope.filters = angular.extend({ apparel_property: {} }, Apparel.getFilters());
    $scope.filteredTags = $scope.filters.apparel_tags ? $scope.filters.apparel_tags.toLowerCase().split(',') : [];
    $scope.isFilteredByTag = function(tag) {
      return $scope.filteredTags.indexOf(tag.name.toLowerCase()) > -1;
    }

    $scope.filterByTag = function(tag) {
      if ($scope.isFilteredByTag(tag))
        return;
      $scope.filteredTags.push(tag.name);

      $scope.filters = angular.extend({ apparel_property: {} }, Apparel.getFilters());
      $scope.filters.apparel_tags = $scope.filteredTags.join(",");

      Apparel.applyFilters($scope.filters);
      ApparelMatcher.clearCache();
      $state.reload();
    };

    loadNextApparel();

    updateLatLng($cordovaGeolocation, $auth, $q);

    NotificationManager.showApparelsNotificationIfNeeded();
  });
