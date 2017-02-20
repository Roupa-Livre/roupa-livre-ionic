angular.module('app.routes', [])

.config(function($stateProvider, $urlRouterProvider) {

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider
    // .state('to_test', {
    //   url: '/to_test',
    //   templateUrl: 'templates/match/matched.html',
    //   controller: 'blankCtrl'
    // })
    .state('initial', {
      url: '/initial',
      templateUrl: 'templates/initial_loading.html',
      controller: 'initialCtrl'
    })

    .state('terms', {
      url: '/terms',
      templateUrl: 'templates/terms.html',
      controller: 'termsCtrl'
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
    
    .state('menu', {
      url: '/menu',
      abstract:true,
      templateUrl: 'templates/template.html',
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

    .state('menu.menu', {
      url: '/menu',
      views: {
        'view-content': {
          templateUrl: 'templates/menu.html',
          controller: 'menuCtrl'
        }
      }
    })

    .state('menu.new', {
      url: '/new_apparel',
      views: {
        'view-content': {
          templateUrl: 'templates/apparels/new.html',
          controller: 'editApparelCtrl'
        }
      }
    })

    .state('menu.edit_apparel', {
      url: '/edit_apparel/:id',
      views: {
        'view-content': {
          templateUrl: 'templates/apparels/edit.html',
          controller: 'editApparelCtrl'
        }
      }
    })

    .state('menu.search', {
      url: '/search',
      views: {
        'view-content': {
          templateUrl: 'templates/apparels/search.html',
          controller: 'filterCtrl'
        }
      }
    })

    .state('menu.apparel', {
      url: '/apparel/:last_id',
      views: {
        'view-content': {
          templateUrl: 'templates/match/apparel.html',
          controller: 'apparelCtrl'
        }
      }
    })

    .state('menu.apparel_list', {
      url: '/apparels/:user_id',
      views: {
        'view-content': {
          templateUrl: 'templates/apparels/index.html',
          controller: 'apparelListCtrl'
        }
      }
    })

    .state('menu.match_warning', {
      url: '/match_warning/:chat_id',
      views: {
        'view-content': {
          templateUrl: 'templates/match/matched.html',
          controller: 'matchWarningCtrl'
        }
      }
    })
    
    .state('menu.not_found', {
      url: '/notfound',
      views: {
        'view-content': {
          templateUrl: 'templates/match/not_found.html',
          controller: 'matchNotFoundCtrl'
        }
      }
    })
    
    .state('menu.apparels_not_found', {
      url: '/apparels_notfound',
      views: {
        'view-content': {
          templateUrl: 'templates/apparels/not_found.html',
          controller: 'apparelsNotFoundCtrl'
        }
      }
    })

    .state('menu.chats', {
      url: '/chats',
      views: {
        'view-content': {
          templateUrl: 'templates/chats/index.html',
          controller: 'chatsCtrl'
        }
      }
    })

    .state('menu.chat', {
      url: '/chat/:id',
      views: {
        'view-content': {
          templateUrl: 'templates/chats/show.html',
          controller: 'chatCtrl'
        }
      }
    })

    .state('menu.chat_details', {
      url: '/chat-details/:id',
      views: {
        'view-content': {
          templateUrl: 'templates/chats/details.html',
          controller: 'chatDetailsCtrl'
        }
      }
    })

    .state('menu.about', {
      url: '/about',
      views: {
        'view-content': {
          templateUrl: 'templates/about.html',
          controller: 'aboutCtrl'
        }
      }
    });

  // if none of the above states are matched, use this as the fallback
  // $urlRouterProvider.otherwise('/to_test');
  $urlRouterProvider.otherwise('/initial');

});
