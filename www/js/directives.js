angular.module('app.directives', [])

.directive('blankDirective', [function(){

}])

.directive('heightAsWidth', function() {
    return function(scope, element, attr) {
      var firstElement = element[0];
      var offsetWidth = firstElement.offsetWidth;
      if (offsetWidth > 0) {
        var computedStyle = getComputedStyle(firstElement, null);
        var bottomBottom = parseInt(computedStyle.getPropertyValue('border-bottom-width'));
        var bottomTop = parseInt(computedStyle.getPropertyValue('border-top-width'));
        element.css( { height: (offsetWidth + bottomBottom + bottomTop) + 'px' } );
      }
    };
})
.directive('browseTo', function ($ionicGesture) {
 return {
  restrict: 'A',
  link: function ($scope, $element, $attrs) {
   var handleTap = function (e) {
    // todo: capture Google Analytics here
    var inAppBrowser = window.open(encodeURI($attrs.browseTo), '_system');
    return false;
   };
   var tapGesture = $ionicGesture.on('tap', handleTap, $element);
   $scope.$on('$destroy', function () {
    // Clean up - unbind drag gesture handler
    $ionicGesture.off(tapGesture, 'tap', handleTap);
   });
  }
 }
});
