function getProbableApiUrl($auth, url) {
  if (url[0] == '/')
    return $auth.apiUrl() + url;
  else
    return url;
};

function trimStartChar(value, charValue) {
  while (value.length > 0 && value[0] == charValue) {
    value = value.substring(1);
  }
  return value;
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
  .filter('distanceToString', function () {
    return function (distance) {
      var rounded = Math.round(distance * 10) / 10;
      if (rounded < 1) {
        if (rounded < 0.5)
          return 'pertinho';
        else
          return 'há menos de 1km';
      }
      else
        return 'há ' + rounded + 'km';
    };
  })
  .filter('trimStartChar', function () {
    return trimStartChar;
  })
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
        if (!result && user.social_image)
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