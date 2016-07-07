function getProbableApiUrl($auth, url) {
  if (url[0] == '/')
    return $auth.apiUrl() + url;
  else
    return url;
};

function getImageAsSource($auth, image) {
  if (image.hasOwnProperty('image'))
    image = image.image;

  if (image.hasOwnProperty('file_url'))
    return getProbableApiUrl($auth, image.file_url);
  else if (image.hasOwnProperty('data'))
    return image.data;
  else if (image.hasOwnProperty('url')) {
    if (image.url)
      return getProbableApiUrl($auth, image.url);
    else
      return null;
  }
  else
    return image;
};

angular.module('app.filters', [])
  .filter('imageSrc', function ($auth) {
    return function (image) {
      return getImageAsSource($auth, image);
    };
  })
  .filter('userImageSrc', function ($auth) {
    return function (user) {
      var result = null
      if (user) {
        if (user.image)
          result =  getImageAsSource($auth, user.image);  
        if (!result)
          result = getProbableApiUrl($auth, user.social_image);
      }
      return result;
    };
  })
  .filter('shortName', function () {
    return function (user) {
      if (user) {
        if (user.hasOwnProperty('nickname') && user.nickname)
          return user.nickname;
        if (user.hasOwnProperty('name') && user.name) {
          var spaceIndex = user.name.indexOf(' ');
          if (spaceIndex > -1) {
            user.nickname = user.name.substring(0, spaceIndex);
            return user.nickname;
          }
          else
            return user.name;
        }
        else
          return 'anônimo';
      } else
        return '-';
    };
  });