angular.module('app.routes', [])

.config(function($stateProvider, $urlRouterProvider) {

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider
    .state('to_test', {
      url: '/to_test',
      templateUrl: 'templates/match/matched.html',
      controller: 'matchWarningCtrl'
    })
    .state('initial', {
      url: '/initial',
      templateUrl: 'templates/loading.html',
      controller: 'initialCtrl'
    })

    .state('login', {
      url: '/login',
      templateUrl: 'templates/login.html',
      controller: 'loginCtrl'
    })

    .state('logout', {
      url: '/logout',
      templateUrl: 'templates/loading.html',
      controller: 'logoutCtrl'
    })

    .state('starting', {
      url: '/start',
      templateUrl: 'templates/loading.html',
      controller: 'startCtrl'
    })
    
    .state('menu', {
      url: '/menu',
      abstract:true,
      templateUrl: 'templates/menu.html',
      resolve: {
        auth: function($auth, $location, $state) {
          var response = $auth.validateUser();
          response.then(function(result) { 
            return result; 
          }, function(result) {
            $state.go('login');
            return result;
          });
          return response;
        }
      }
    })

    .state('menu.new', {
      url: '/new_apparel',
      views: {
        'side-menu-content': {
          templateUrl: 'templates/apparels/new.html',
          controller: 'newApparelCtrl'
        }
      }
    })

    .state('menu.apparel', {
      url: '/apparel/:last_id',
      views: {
        'side-menu-content': {
          templateUrl: 'templates/match/apparel.html',
          controller: 'apparelCtrl'
        }
      }
    })

    .state('menu.match_warning', {
      url: '/match_warning/:chat_id',
      views: {
        'side-menu-content': {
          templateUrl: 'templates/match/matched.html',
          controller: 'matchWarningCtrl'
        }
      }
    })
    
    .state('menu.not_found', {
      url: '/notfound',
      views: {
        'side-menu-content': {
          templateUrl: 'templates/match/not_found.html',
          controller: 'matchNotFoundCtrl'
        }
      }
    })

    .state('menu.chats', {
      url: '/chats',
      views: {
        'side-menu-content': {
          templateUrl: 'templates/chats/index.html',
          controller: 'chatsCtrl'
        }
      }
    })

    .state('menu.chat', {
      url: '/chat/:id',
      views: {
        'side-menu-content': {
          templateUrl: 'templates/chats/show.html',
          controller: 'chatCtrl'
        }
      }
    });
    
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/initial');
  $urlRouterProvider.otherwise('/to_test');
  // $urlRouterProvider.otherwise('/menu/start');

});
