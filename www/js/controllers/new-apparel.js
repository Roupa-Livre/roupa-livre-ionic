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