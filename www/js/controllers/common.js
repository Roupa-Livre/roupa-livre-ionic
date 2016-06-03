function updateLatLng($cordovaGeolocation, $auth, $q) {
  var deferred = $q.defer();
  var posOptions = {timeout: 10000, enableHighAccuracy: true};
  $cordovaGeolocation.getCurrentPosition(posOptions)
    .then(function (position) {
      var lat  = position.coords.latitude;
      var lng = position.coords.longitude;
      
      $auth.updateAccount({lat: lat, lng: lng})
        .then(function(resp) {
          deferred.resolve(resp);
        }, function(resp) {
          console.log(resp)
          deferred.reject(resp);
        });
    }, function(resp) { 
      console.log(resp); 
      deferred.reject(resp);
    });
  return deferred.promise;
}

// ---- IMAGE CROP MODAL ----
function addCroppingModal(controller, $scope, $ionicModal, $q, $timeout) {
  if (!(typeof controller.cropImage === 'function'))
  {
    controller.cropImage  = function(fileUrl, widthHeightRatio) {
      var deferred = $q.defer();

      controller.imageCropSaveCallback = function (croppedImage) {
        deferred.resolve(croppedImage);
      };

      controller.imageCropCancelCallback = function () {
        deferred.reject('cancelled');
      };

      controller.showImageCropModal(fileUrl, widthHeightRatio);

      return deferred.promise;
    }

    $ionicModal.fromTemplateUrl('templates/common/image-crop-modal.html', {scope: $scope, animation: 'slide-in-up'})
      .then(function(modal) {

        controller.imageCropModal = modal;
        controller.imageCropSaveCallback = null;
        controller.imageCropCancelCallback = null;
      });

    controller.showImageCropModal = function(image, widthHeightRatio) {
      controller.imageCropModal.show().then(function () {

        //
        // NOTE: for cropping to work, the source (original) and target (cropped) image variables should be put in a
        // container object (see below, $scope.image), NOT directly in the $scope variable itself; for background see:
        //
        // https://github.com/alexk111/ngImgCrop/issues/18#issuecomment-78911464
        //

        // add an object to $scope which wraps the to-be-cropped image and the cropped (result) image; otherwise it
        // will not work (see https://github.com/alexk111/ngImgCrop/issues/18). We also add config properties to it.
        
        $timeout(function() {
          $scope.image = {
            title: 'AAAAA',
            originalImage: image,
            croppedImage: '',
            aspectRatio: widthHeightRatio + "x" + 1
          };
        }, 400);
      });
    };

    $scope.saveImageCropModal = function() {
      if (controller.imageCropSaveCallback) {
        controller.imageCropSaveCallback($scope.image.croppedImage);
        controller.imageCropSaveCallback = null;
      }
      controller.imageCropModal.hide();
    };

    $scope.closeImageCropModal = function() {
      if (controller.imageCropCancelCallback) {
        controller.imageCropCancelCallback();
        controller.imageCropCancelCallback = null;
      }
      controller.imageCropModal.hide();
    };

    $scope.$on('$destroy', function() {
      if (controller.imageCropModal) {
        controller.imageCropModal.remove();
        controller.imageCropModal = null;
      }
    });
  }
};

function addOrReplaceValues(list, entry) {
  var foundList = [];
  angular.forEach(list, function(value, key) {
    if (value.id == entry.id)
      foundList.push(value);
  });
  
  if (foundList.length > 0) {
    var index = list.indexOf(foundList[0]);
    var current = list[index];
    angular.extend(current, entry);
  }
  else if (foundList[0] != entry)
    list.push(entry);
}