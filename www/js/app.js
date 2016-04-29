// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('app', ['ionic', 'app.controllers', 'app.routes', 'app.services', 'app.directives', 'ngCordova', 'ionic-native-transitions', 'ngSanitize', 'ng-token-auth', 'ngTagsInput'])
.config(function($authProvider) {
  var isMob = window.cordova !== undefined;
  $authProvider.configure({
    //apiUrl: isMob ? 'http://roupa-livre-api-staging.herokuapp.com' : 'http://localhost:3000',
    apiUrl: 'http://localhost:3000',
    storage: isMob ? 'localStorage' : 'localStorage',
    validateOnPageLoad: false
  });      
})
.config(function($compileProvider){
  $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|ftp|mailto|file|tel|content|data):/);
})
.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
  });
})

.config(function($ionicNativeTransitionsProvider){
    $ionicNativeTransitionsProvider.setDefaultOptions({
        duration: 350 // in milliseconds (ms), default 400,
        // slowdownfactor: 4, // overlap views (higher number is more) or no overlap (1), default 4
        // iosdelay: -1, // ms to wait for the iOS webview to update before animation kicks in, default -1
        // androiddelay: -1, // same as above but for Android, default -1
        // winphonedelay: -1, // same as above but for Windows Phone, default -1,
        // fixedPixelsTop: 0, // the number of pixels of your fixed header, default 0 (iOS and Android)
        // fixedPixelsBottom: 0, // the number of pixels of your fixed footer (f.i. a tab bar), default 0 (iOS and Android)
        // triggerTransitionEvent: '$ionicView.afterEnter', // internal ionic-native-transitions option
        // backInOppositeDirection: false // Takes over default back transition and state back transition to use the opposite direction transition to go back
    });
});
