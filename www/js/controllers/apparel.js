angular.module('app.controllers')
  .controller('apparelCtrl', function($scope, $rootScope, $cordovaGeolocation, $ionicHistory, $state, $auth, $q, $ionicSlideBoxDelegate, Apparel, ApparelRating, Chat, ApparelMatcher, $ionicLoading, $log, ionicToast, config) {
    $scope.showLoading = function(message) {
      $rootScope.showLoading(message);
    };
    $scope.hideLoading = function(){
      $rootScope.hideLoading();
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
        $ionicSlideBoxDelegate.update();
      } else {
        $ionicHistory.nextViewOptions({ disableBack: true });
        $state.go('menu.not_found');
      }
    }

    function loadNextApparel() {
      var loadingShownAt = null;
      if (!ApparelMatcher.isNextAlreadyLoaded()) {
        loadingShownAt = new Date();
        $scope.showLoading(t('apparel.loading.message'));
      }

      ApparelMatcher.getNextAvailableApparel().then(function(apparel) {
        setCurrentApparel(apparel);
        setTimeout(function() { 
          ApparelMatcher.loadApparelsIfNeededAsync();
        }, 500);
        if (loadingShownAt != null)
          sleepToBeReadbleIfNeeded(loadingShownAt, config, function() {
            $scope.hideLoading();
            loadingShownAt = null;
          });
      }, function(error) {
        $log.debug(error);
        if (loadingShownAt != null)
          sleepToBeReadbleIfNeeded(loadingShownAt, config, function() {
            $scope.hideLoading();
            loadingShownAt = null;
          });
        ionicToast.show('Erro carregando mais opções', 'top', false, 1000);
      })
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
      // ionicToast.show('Erro carregando salvando rating', 'top', false, 1000);
    };

    $scope.like = function() {
      var rating = new ApparelRating({apparel_id: $scope.entry.id, liked: true})
      // $scope.showLoading('Opa, será que deu match?');

      rating.save().then(function(data) {
        ApparelMatcher.markAsRated(data.id);
        
        if (data.hasOwnProperty('chat') && data.chat != null)
          nextAfterMatch(data.chat);

      }, failAfterRating);

      goToNextApparel();
    };

    $scope.dislike = function() {
      var rating = new ApparelRating({apparel_id: $scope.entry.id, liked: false})
      rating.save().then(function(data) {
        ApparelMatcher.markAsRated(data.id);
      }, failAfterRating);

      goToNextApparel();
    }

    loadNextApparel();
    
    updateLatLng($cordovaGeolocation, $auth, $q)
      .then(function(resp) {
        // $scope.getApparels().then(function(data){
        //   // TODO
        //   $scope.hide();
        // });
      }, function(resp) {
        // $scope.hide();
      });

  });