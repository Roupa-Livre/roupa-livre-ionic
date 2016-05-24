angular.module('app.controllers')
  .controller('newApparelCtrl', function($scope, $rootScope, $cordovaGeolocation, $cordovaActionSheet, $ionicHistory, $ionicModal, $ionicPopup, $ionicLoading, $ionicSlideBoxDelegate, $timeout, $state, $auth, $q, Apparel, ApparelRating, Upload, CurrentCamera, FileManager, ionicToast) {
    var currentController = this;

    $scope.show = function() {
      $ionicLoading.show({
        template: 'Carregando roupas ...'
      });
    };
    $scope.hide = function(){
      $ionicLoading.hide();
    };

    $scope.getNewPhoto = function() {
      var deferred = $q.defer();

      var options = {
        title: 'Onde estão suas fotos?',
        buttonLabels: ['Nova Foto', 'Foto da Galeria'],
        addCancelButtonWithLabel: 'Cancelar',
        androidEnableCancelButton : true,
        winphoneEnableCancelButton : true
        // , addDestructiveButtonWithLabel : 'Delete it'
      };

      $cordovaActionSheet.show(options)
        .then(function(btnIndex) {
          console.log(btnIndex);
          var getPicture = false;
          if (btnIndex == 1)
            getPicture = CurrentCamera.getPictureFromCamera;
          else if (btnIndex == 2)
            getPicture = CurrentCamera.getPictureFromLibrary;

          if (getPicture)
            getPicture().then(
              function(res) {
                deferred.resolve(res);
              }, function(err) {
                deferred.reject(err);
              });
          else {
            deferred.reject('Cancelled');
          }
        }, function(err) {
          deferred.reject(err);
        });

      return deferred.promise;
    };

    $scope.editImage = function(url) {
      currentController.cropImage(url, 1);
    };

    $scope.newImage = function() {
      var isMob = window.cordova !== undefined;
      if (isMob) {
        $scope.getNewPhoto()
          .then(function(result) {
            return currentController.cropImage(result, 1);
          })
          .then(function(result) {
            $scope.entry.apparel_images.push({ data: result });
            console.log(result);
            $ionicSlideBoxDelegate.update();
          }, function(error) {
            console.log(error);
          });
        } else {
          $scope.entry.apparel_images.push({ data: 'data:image/gif;base64,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' });
        }
    };

    $scope.filterOnlyNotDestroyed = function(element) {
      return !element.hasOwnProperty('_destroy') || !element._destroy;
    };

    $scope.removeImage = function(image) {
      if (image.hasOwnProperty('id') && image.id > 0) {
        image['_destroy'] = true;
      } else {
        var index = $scope.entry.apparel_images.indexOf(image);
        if (index > -1)
          $scope.entry.apparel_images.splice(index, 1);
      }
      $ionicSlideBoxDelegate.update();
    };

    $scope.makeMainImage = function(image) {
      var index = $scope.entry.apparel_images.indexOf(image);
      // verifica se achou e se ja não é a primeira
      if (index > 0) {
        $scope.entry.apparel_images[0].sort_order = 2;
        $scope.entry.apparel_images.splice(index, 1);
        $scope.entry.apparel_images.unshift(image);
        image.sort_order = 1;
        $ionicSlideBoxDelegate.update();
      }
    };

    $scope.submit = function() {
      $scope.entry.save().then(function(data) {
        ionicToast.show('Tudo ok, vamos procurar roupas pra trocar agora?', 'top', false, 2500);
        $ionicHistory.nextViewOptions({ disableBack: true });
        $state.go('menu.apparel');
      });
    };

    // Upload.fileTo($auth.apiUrl() + '/apparels').then(
    //   function(res) {
    //     // Success
    //   }, function(err) {
    //     // Error
    //   });

    function setCurrentApparel() {
      //$scope.entry = new Apparel({apparel_images: [ {id:1, file_url: 'img/bg-new-image.png'}, { id:2,file_url: 'img/bg-new-image.png'}, { id:2,file_url: 'img/bg-new-image.png'}], apparel_tags: []});
      $scope.entry = new Apparel({apparel_images: [ ], apparel_tags: []});
      
      $ionicSlideBoxDelegate.update();
    }

    setCurrentApparel();
    
    updateLatLng($cordovaGeolocation, $auth, $q)
      .then(function(resp) { }, function(resp) { });

    addCroppingModal(currentController, $scope, $ionicModal, $q, $timeout);
  });