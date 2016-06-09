angular.module('app.filters', [])
  .filter('imageSrc', function ($auth) {
    function getUrl(url) {
      if (url[0] == '/')
        return $auth.apiUrl() + url;
      else
        return url;
    };

    return function (image) {
      if (image.hasOwnProperty('file_url'))
        return getUrl(image.file_url);
      else if (image.hasOwnProperty('data'))
        return image.data;
      else
        return image;
    };
  });