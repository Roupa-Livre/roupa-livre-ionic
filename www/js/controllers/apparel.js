angular.module('app.controllers')
  .controller('apparelCtrl', function($scope, $rootScope, $cordovaGeolocation, $ionicHistory, $state, $auth, $q, $ionicSlideBoxDelegate, Apparel, ApparelRating, Chat, ApparelMatcher, $ionicLoading, $log, ionicToast) {
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
      // $scope.showLoading('Carregando roupas ...');
      ApparelMatcher.getNextAvailableApparel().then(function(apparel) {
        setCurrentApparel(apparel);
        setTimeout(function() { 
          ApparelMatcher.loadApparelsIfNeededAsync();
        }, 500);
        // $scope.hideLoading();
      }, function(error) {
        $log.debug(error);
        ionicToast.show('Erro carregando mais opções', 'top', false, 1000);
        // $scope.hideLoading();
      })
    }

    function nextAfterMatch(chat_data) {
      $ionicHistory.nextViewOptions({ disableBack: true });
      $state.go('menu.match_warning', { chat_id: chat_data.id });
    };

    function nextAfterRating() {
      // agora só marca
      // goToNextApparel();
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
      }, failAfterRating);

      goToNextApparel();
    };

    $scope.dislike = function() {
      var rating = new ApparelRating({apparel_id: $scope.entry.id, liked: false})
      rating.save().then(function(data) {
        ApparelMatcher.markAsRated(data.id);
      }, failAfterRating);
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