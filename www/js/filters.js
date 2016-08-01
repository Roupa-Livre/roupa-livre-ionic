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

function timeToDate(time) {
  return new Date(time.getFullYear(), time.getMonth(), time.getDate(), 0,0,0);
}

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
  .filter('timeToString', function () {
    return function (time) {
      var timeMoment = moment(time);
      var nowMoment = moment();
      // var nowDate = timeToDate(now);
      // var timeDate = timeToDate(time);
      var days = 24 * 3600 * 1000;
      var diff = nowMoment.diff(timeMoment);
      var diffInDays = diff / days;
      console.log(diff)
      console.log(diffInDays)
      // var diffInHours = diffInDays / 24;
      if (diffInDays > 1) {
        if (diffInDays < 2 && nowMoment.date() == (timeMoment.date() - 1))
          return 'ontem';
        else {
          return Math.floor(diffInDays) + ' dias atrás';
        }
      } else {
        if (nowMoment.date() == timeMoment.date())
          return timeMoment.format('h:mm')
        else
          return 'ontem';
      }
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