// Upload Service

angular.module('app')
	.factory('CurrentCamera', ['$q', function($q) {
    function checkDataUrlFormat(imageSrc) {
      if (!imageSrc.startsWith('data:image'))
        return 'data:image/jpg;base64,' + imageSrc;
      else
        return imageSrc;
    }
    function enforceRatio(ratio, imageSrc, callbackSameRatio, callbackDifferentRatio) {
      getImageDimmesions(imageSrc, function(width, height) {
        var imageRatio = width / height;
        if (imageRatio == ratio)
          callbackSameRatio(imageRatio);
        else
          callbackDifferentRatio(imageRatio);
      })
    }

    function doCropWithPlugin(result, options) {
      var q = $q.defer();
      plugins.crop(function(path) {
        // path looks like 'file:///storage/emulated/0/Android/data/com.foo.bar/cache/1477008080626-cropped.jpg?1477008106566'
        console.log('Cropped Image Path!: ' + path);
        // Do whatever you want with new path such as read in a file
        // Here we resolve the path to finish, but normally you would now want to read in the file
        q.resolve(path);  
      }, function(error) {
        q.reject(error);
      }, result, options);
      return q.promise;
    };

	  function getPicture(options) {
      var q = $q.defer();

      if (!options || options == null)
      	options = {};

      if (!options.hasOwnProperty('quality'))
      	options.quality = 100;
      if (!options.hasOwnProperty('destinationType'))
      	options.destinationType = Camera.DestinationType.FILE_URI;
      if (!options.hasOwnProperty('sourceType'))
      	options.sourceType = Camera.PictureSourceType.PHOTOLIBRARY;
      if (!options.hasOwnProperty('encodingType'))
      	options.encodingType = Camera.EncodingType.JPEG;
      if (!options.hasOwnProperty('enforceRatio'))
        options.enforceRatio = true;

      // Troca para File URI para garantir que Crop funcionará
      var oldDestinationType = options.destinationType;
      options.destinationType = Camera.DestinationType.FILE_URI;

      var allowEdit = options.hasOwnProperty('allowEdit') ? options.allowEdit : false;
      var targetWidth = options.hasOwnProperty('targetWidth') ? options.targetWidth : false;
      var targetHeight = options.hasOwnProperty('targetHeight') ? options.targetHeight : false;;
      
      if (allowEdit || targetWidth || targetHeight) {
        if (ionic.Platform.isIOS()) {
          // alteramos para não abrir Cropper Nativo
          options.allowEdit = false;
          if (targetWidth)
            delete options["targetWidth"];
          if (targetHeight)
            delete options["targetHeight"];
        }
      }
      
      navigator.camera.getPicture(function(result) {
        options.destinationType = oldDestinationType;
        function finalResolve(finalResult) {
          if (options.destinationType == Camera.DestinationType.DATA_URL)
            toDataUrl(finalResult, q.resolve);
          else
            q.resolve(finalResult);
        };

        if (ionic.Platform.isIOS()) {
          options.allowEdit = allowEdit;
          if (targetWidth)
            options.targetWidth = targetWidth;
          if (targetHeight)
            options.targetHeight = targetHeight;

          doCropWithPlugin(result, options).then(finalResolve, q.reject);
        } else {
          if (targetWidth && targetHeight && targetWidth > 0 && targetHeight > 0 && options.enforceRatio)
            enforceRatio(targetWidth / targetHeight, result, function() {
              finalResolve(result);
            }, function() {
              doCropWithPlugin(result, options).then(finalResolve, q.reject);
            });
          else
            finalResolve(result);
        }
      }, function(err) {
        q.reject(err);
      }, options);
      
      return q.promise;
    };

	  return {
      cropWithPlugin: doCropWithPlugin,
	  	getPictureFromLibrary: function(options) {
	  		if (!options || options == null)
      		options = {};
      	options.sourceType = Camera.PictureSourceType.PHOTOLIBRARY;
      	return getPicture(options);
	  	},
	  	getPictureFromCamera: function(options) {
	  		if (!options || options == null)
      		options = {};
      	options.sourceType = Camera.PictureSourceType.CAMERA;
      	return getPicture(options);
	  	},
	    getPicture: getPicture
	  }
	}])
.factory('Upload', function($q, $cordovaCamera, $cordovaFileTransfer, CurrentCamera) {
		function uploadFile(serverURL, fileURL, deferred) {
			var uploadOptions = new FileUploadOptions();
			uploadOptions.fileKey = "file";
			uploadOptions.fileName = fileURL.substr(fileURL.lastIndexOf('/') + 1);
			uploadOptions.mimeType = "image/jpeg";
			uploadOptions.chunkedMode = false;

			$cordovaFileTransfer.upload(serverURL, fileURL, uploadOptions).then(
				function(result) {
					deferred.resolve(result);
				}, function(err) {
					deferred.reject(err);
				});
		};

    return {
    		uploadFile: function(serverURL, fileURL) {
    			var deferred = $q.defer();
    			uploadFile(serverURL, fileURL, deferred);
					return deferred.promise;
    		},
        uploadFromCamera: function(serverURL, options) {
        	var deferred = $q.defer();
        	// if (ionic.Platform.isWebView()) {
					
					CurrentCamera.getPicture(options).then(
						function(fileURL) {
							uploadFile(serverURL, fileURL, deferred);
						}, function(err){
							deferred.reject(err);
						});

					// }
					// else {
					// 	deferred.reject('Uploading not supported in browser');
					// }

					return deferred.promise;
        }

    }

})