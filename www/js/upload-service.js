// Upload Service

angular.module('app')
	.factory('CurrentCamera', ['$q', function($q) {

    function doCropWithPlugin(result, options) {
      var q = $q.defer();
      plugins.crop(function(path) {
        // path looks like 'file:///storage/emulated/0/Android/data/com.foo.bar/cache/1477008080626-cropped.jpg?1477008106566'
        console.log('Cropped Image Path!: ' + path);
        // Do whatever you want with new path such as read in a file
        // Here we resolve the path to finish, but normally you would now want to read in the file
        if (options.destinationType == Camera.DestinationType.DATA_URL)
          toDataUrl(path, function(dataUrl) {
            q.resolve(dataUrl);  
          });
        else
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

      var oldDestinationType = options.destinationType;
      var allowEdit = options.hasOwnProperty('allowEdit') ? options.allowEdit : false;
      var targetWidth = options.hasOwnProperty('targetWidth') ? options.targetWidth : false;
      var targetHeight = options.hasOwnProperty('targetHeight') ? options.targetHeight : false;;
      if (allowEdit || targetWidth || targetHeight) {
        if (ionic.Platform.isIOS()) {
          options.destinationType = Camera.DestinationType.FILE_URI;
          options.allowEdit = false;
          if (targetWidth)
            delete options["targetWidth"];
          if (targetHeight)
            delete options["targetHeight"];
        }
      }
      
      navigator.camera.getPicture(function(result) {
        if (ionic.Platform.isIOS()) {
          options.destinationType = oldDestinationType;
          options.allowEdit = allowEdit;
          if (targetWidth)
            options.targetWidth = targetWidth;
          if (targetHeight)
            options.targetHeight = targetHeight;
          doCropWithPlugin(result, options).then(q.resolve, q.reject);
        } else {
          q.resolve(result);
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