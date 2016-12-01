function isEmptyObject(obj) {
  for(var prop in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, prop)) {
      return false;
    }
  }
  return true;
}

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

function reverse(arr) {
  var result = [],
       ii = arr.length;
   for (var i = ii - 1;i > -1;i--) {
       result.push(arr[i]);
   }
   return result;
};

if (!String.prototype.trim) {
  String.prototype.trim = function () {
    return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
  };
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

function cloneArray(list) {
  var newList = [];
  for (var i = 0; i < list.length; i++) {
    newList.push(list[i]);
  }
  return newList;
}

function encodeImageUri(imageUri)
{
     var c=document.createElement('canvas');
     var ctx=c.getContext("2d");
     var img=new Image();
     img.onload = function(){
       c.width=this.width;
       c.height=this.height;
       ctx.drawImage(img, 0,0);
     };
     img.src=imageUri;
     var dataURL = c.toDataURL("image/jpeg");
     return dataURL;
};

function getDiffInMilliseconds(date1, date2) {
  // TODO
  return date2 - date1;
}
function getDiffInMillisecondsFromNow(date1) {
  getDiffInMilliseconds(date1, new Date());
}
function sleepToBeReadbleIfNeeded(date1, config) {
  var waitingTime = getDiffInMillisecondsFromNow(newLastRead);
  if (waitingTime < config.MIN_READING_TIMEOUT){
    sleep(config.MIN_READING_TIMEOUT - waitingTime);
  }
}