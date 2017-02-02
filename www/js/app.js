// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('app', ['ionic', 'app.controllers', 'app.filters', 'app.routes', 'app.services', 'app.directives', 'ngCordova', 'ionic-native-transitions', 'ngSanitize', 'ng-token-auth', 'ngTagsInput', 'btford.socket-io', 'ksSwiper', 'angular.filter'])
  .constant('config', {
      SHOWS_STACK: true,
      // REALTIME_URL: 'http://roupa-livre-realtime-staging.herokuapp.com:80',
      // API_URL: 'http://roupa-livre-api-staging.herokuapp.com',
      REALTIME_URL: 'http://roupa-livre-realtime-live.herokuapp.com:80',
      API_URL: 'http://roupa-livre-api-live.herokuapp.com',
      SENDER_ID: '468184339406',
      // REALTIME_URL: 'http://localhost:5001',
      // API_URL: 'http://localhost:3000',
      MIN_READING_TIMEOUT: (2 * 1000),
      MIN_TOAST_READING_TIMEOUT: (3 * 1000)
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
  .factory('BackgroundCheck', function($ionicPlatform){
    var service = {};
    var inBackground = false;

    $ionicPlatform.ready(function() {        
        document.addEventListener("resume", function(){inBackground = false;}, false);
        document.addEventListener("pause", function(){inBackground = true;}, false);
    });

    service.isActive = function(){
        return inBackground == false;
    }
    return service;
  })
  .run(function($ionicPlatform, $rootScope, $ionicLoading, $ionicHistory, $state, $auth, Chat, $q, config, $http, BackgroundCheck, $cordovaDevice, $ionicPopup, $sce) {
    $rootScope.cleanInitialState = function(fallbackState) {
      $rootScope.initialState = null;
      $rootScope.initialStateParams = null;
    }

    $rootScope.gotToInitialState = function(fallbackState) {
      if ($rootScope.initialState != null) {
        var initialState = $rootScope.initialState;
        var initialStateParams = $rootScope.initialStateParams;

        $ionicHistory.nextViewOptions({ disableBack: true });
        $state.go(initialState, initialStateParams);
      } else {
        $ionicHistory.nextViewOptions({ disableBack: true });
        $state.go(fallbackState);
      }
    };
    function setupPush() {
      function onRegistration(data) {
        var postData = { registration_id: data.registrationId, provider: null, device_uid: $cordovaDevice.getUUID() }
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
        var postData = { registration_id: registrationID, provider: null, device_uid: $cordovaDevice.getUUID() }
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
            if (!BackgroundCheck.isActive() || $ionicHistory.viewHistory().histories.root.stack.length < 2) {
              $rootScope.initialState = 'menu.chat';
              $rootScope.initialStateParams = { id: data.additionalData.chat_id };
              $rootScope.gotToInitialState();
            }
          } else if (data.additionalData.type == 'match') {
            $rootScope.initialState = 'menu.match_warning';
            $rootScope.initialStateParams = { chat_id: data.additionalData.chat_id };
            $rootScope.gotToInitialState();
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
      $rootScope.isMainState = function() {
        return ($ionicHistory.currentStateName() == 'menu.apparel');
      };

      $rootScope.goChats = function() {
        $ionicHistory.nextViewOptions({ disableBack: true });
        $state.go('menu.chats');
      };
      $rootScope.isChatState = function() {
        var stateName = $ionicHistory.currentStateName();
        return (stateName == 'menu.chats' || stateName == 'menu.chat');
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
      $rootScope.isMenuState = function() {
        var stateName = $ionicHistory.currentStateName();
        return (stateName == 'menu.menu');
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

      $rootScope.loadingShownAt = null;
      $rootScope.showReadableLoading = function(message) {
        $rootScope.loadingShownAt = new Date();
        $rootScope.showLoading(message);
      };

      $rootScope.hideReadableLoading = function() {
        if ($rootScope.loadingShownAt != null) {
          sleepToBeReadbleIfNeeded($rootScope.loadingShownAt, config, function() {
            $rootScope.hideLoading();
            $rootScope.loadingShownAt = null;
          });
        }
      };

      $rootScope.showConfirmPopup = function(title, subTitle, template, cancelText, confirmText) {
        var options = { title: title, cssClass: 'popup-confirm' };
        if (subTitle && subTitle.length > 0)
          options.subTitle = subTitle;
        if (template && template.length > 0)
          options.template = template;

        options.cancelText = (cancelText && cancelText.length > 0 ) ? cancelText : t('shared.buttons.cancel');
        options.okText = (confirmText && confirmText.length > 0 ) ? confirmText : t('shared.buttons.confirm');

        return $ionicPopup.confirm(options);
      }

      $rootScope.showToastMessage = function(message, timeout, fixed, messageBody) {
        var messageTimeout = timeout && timeout > 0 ? timeout : config.MIN_TOAST_READING_TIMEOUT;
        var messagedFixed = (fixed == true);
        // messagedFixed = true; // para testes

        var options = { title: message, cssClass: 'popup-show' };
        if (messageBody && messageBody.length > 0)
          options.template = messageBody;

        if (messagedFixed)
          options.buttons = [ { text: t('shared.buttons.close') } ];

        var popup = $ionicPopup.show(options);
        if (!messagedFixed) {
          setTimeout(function() {
            popup.close();
          }, messageTimeout);
        }
      };

      $rootScope.getLocalizedMessage = getLocalizedMessage;
      $rootScope.t = t;
      $rootScope.trustAsHtml = function(value) {
        return $sce.trustAsHtml(value);
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
