// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('app', ['ionic', 'app.controllers', 'app.filters', 'app.routes', 'app.services', 'app.directives', 'ngCordova', 'ionic-native-transitions', 'ngSanitize', 'ng-token-auth', 'ngTagsInput', 'ionic-toast', 'btford.socket-io', 'ksSwiper', 'angular.filter'])
  .constant('config', {
      SHOWS_STACK: true,
      REALTIME_URL: 'http://roupa-livre-realtime-staging.herokuapp.com:80',
      API_URL: 'http://roupa-livre-api-staging.herokuapp.com',
      SENDER_ID: '468184339406',
      // REALTIME_URL: 'http://localhost:5001',
      // API_URL: 'http://localhost:3000',
  })
  .config(function($authProvider, $ionicConfigProvider, config) {
    var isMob = window.cordova !== undefined;
    $authProvider.configure({
      apiUrl: config.API_URL,
      // apiUrl: 'http://localhost:3000',
      storage: isMob ? 'localStorage' : 'cookies',
      validateOnPageLoad: false,
      omniauthWindowType: isMob ? 'inAppBrowser' : 'newWindow',
      authProviderPaths: {
        facebook: '/auth/facebook'
      }
    });

    $ionicConfigProvider.views.maxCache(0);
  })
  .config(function($compileProvider, $sceDelegateProvider, config){
    $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|ftp|mailto|file|tel|content|assets-library|data):/);
    // $sceDelegateProvider.resourceUrlWhitelist(/^\s*(https?|ftp|mailto|file|tel|content|assets-library|data):/);
  })
  .run(function($ionicPlatform, $rootScope, $ionicLoading, $ionicHistory, $state, $auth, Chat, $q, config, $http) {
    function setupPush() {
      function onRegistration(data) {
        var postData = { registration_id: data.registrationId, provider: null }
        if (ionic.Platform.isIOS()) {
          postData.provider = 'ios';
        } else if (ionic.Platform.isAndroid()) {
          postData.provider = 'android';
        }

        if (postData.provider != null) {
          $http({ 
            method: 'POST', 
            data: postData,
            headers: $auth.retrieveData('auth_headers'),
            url: config.API_URL + '/users/register_device'
          });
        }
      }
      function onUnregistration(registrationID) {
        var postData = { registration_id: registrationID, provider: null }
        if (ionic.Platform.isIOS()) {
          postData.provider = 'ios';
        } else if (ionic.Platform.isAndroid()) {
          postData.provider = 'android';
        }

        if (postData.provider != null) {
          $http({ 
            method: 'POST', 
            data: postData,
            headers: $auth.retrieveData('auth_headers'),
            url: config.API_URL + '/users/unregister_device'
          });
        }
      }
      function pushReceived(data) {
        if (data.hasOwnProperty('additionalData')) {
          if (data.additionalData.type == 'message') {
            $ionicHistory.nextViewOptions({ disableBack: true });
            $state.go('menu.chat', { id: data.additionalData.chat_id });
          } else if (data.additionalData.type == 'match') {
            $ionicHistory.nextViewOptions({ disableBack: true });
            $state.go('menu.match_warning', { chat_id: data.additionalData.chat_id });
          }
        }
      }

      function tryRegisterOnPush() {
        if(ionic.Platform.is('cordova')){
          PushSystem.tryRegister(config.SENDER_ID, onRegistration, pushReceived, null, onUnregistration);
          PushSystem.tryClearBadgeCount();
        }
      }
      if ($rootScope.user && $rootScope.user.hasOwnProperty('id') && $rootScope.user.id > 0) {
        tryRegisterOnPush();
      }

      $rootScope.$on('auth:login-success', function(ev, user) {
        tryRegisterOnPush();
      });

      $rootScope.$on('auth:logout-success', function(ev) {
        PushSystem.tryUnregister($q);
      });

      $rootScope.$on('auth:validation-success', function(ev, user) {
        if (MainPushSystem == null) {
          tryRegisterOnPush();
        }
      });
    }
    $ionicPlatform.ready(function(readyEventData) {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      if(window.cordova && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      }
      if(window.StatusBar) {
        // org.apache.cordova.statusbar required
        StatusBar.styleDefault();
      }

      $rootScope.goMain = function() {
        $ionicHistory.nextViewOptions({ disableBack: true });
        $state.go('menu.apparel');
      };

      $rootScope.goChats = function() {
        $ionicHistory.nextViewOptions({ disableBack: true });
        $state.go('menu.chats');
      };

      $rootScope.goMenu = function() {
        if ($ionicHistory.currentStateName() == 'menu.menu') {
          var backView = $ionicHistory.backView()
          if (backView && backView.name != 'menu.menu')
            $ionicHistory.goBack();
          else
            $state.go('menu.apparel');
        } else {
          $ionicHistory.nextViewOptions({ disableBack: false });
          $state.go('menu.menu');
        }
      };

      $rootScope.showLoading = function(message) {
        $rootScope.loadingMessage = message;
        $ionicLoading.show({ 
          templateUrl: 'templates/loading.html', 
          scope: $rootScope
        });
        
      };

      $rootScope.hideLoading = function() {
        $ionicLoading.hide();
      };
      
      console.log('READY')
      if ($rootScope.user && $rootScope.user.hasOwnProperty('id') && $rootScope.user.id > 0) {
        Chat.force_reload_active().then(function() {
          $rootScope.GlobalChatNotifications = Chat.GlobalNotifications;
        });
      }

      setupPush();
    });

    $ionicPlatform.on('resume', function(){
      //rock on
      console.log('RESUME')

      if ($rootScope.user && $rootScope.user.hasOwnProperty('id') && $rootScope.user.id > 0) {
        Chat.force_reload_active().then(function() {
          $rootScope.GlobalChatNotifications = Chat.GlobalNotifications;
        });
      }

      setupPush();
    });
  })
  .run(function($ionicPlatform) {
    $ionicPlatform.ready(function(readyEventData) {
      if(window.cordova && window.cordova.plugins.Keyboard) {
        if (ionic.Platform.isIOS()) {
          cordova.plugins.Keyboard.disableScroll(true);
        }
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
