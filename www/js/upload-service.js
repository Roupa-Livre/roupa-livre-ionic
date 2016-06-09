// Upload Service

angular.module('app')
	.factory('CurrentCamera', ['$q', function($q) {
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
      
      navigator.camera.getPicture(function(result) {
        // Do any magic you need
        q.resolve(result);
      }, function(err) {
        q.reject(err);
      }, options);
      
      return q.promise;
    };

	  return {
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