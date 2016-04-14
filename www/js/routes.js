angular.module('app.routes', [])

.config(function($stateProvider, $urlRouterProvider) {

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider

    .state('login', {
      url: '/login',
      templateUrl: 'templates/start.html',
      controller: 'loginCtrl'
    })

    .state('logout', {
      url: '/logout',
      templateUrl: 'templates/start.html',
      controller: 'logoutCtrl'
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

    .state('menu.start', {
      url: '/start',
      views: {
        'side-menu21': {
          templateUrl: 'templates/start.html',
          controller: 'startCtrl' // TODO Mudar pra 
        }
      }
    })

    .state('menu.apparel', {
      url: '/apparel/:last_id',
      views: {
        'side-menu21': {
          templateUrl: 'templates/apparel.html',
          controller: 'apparelCtrl' // TODO Mudar pra 
        }
      }
    });

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/login');
  // $urlRouterProvider.otherwise('/menu/start');

});
