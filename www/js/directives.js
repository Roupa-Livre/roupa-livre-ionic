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
});
