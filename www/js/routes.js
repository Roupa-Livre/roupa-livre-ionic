angular.module('app.routes', [])

.config(function($stateProvider, $urlRouterProvider) {

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider

    .state('menu', {
      url: '/menu',
      abstract:true,
      templateUrl: 'templates/menu.html'
    })

    .state('menu.carnavalNazarePaulista2016', {
      url: '/inicio',
      views: {
        'side-menu21': {
          templateUrl: 'templates/carnavalNazarePaulista2016.html',
          controller: 'carnavalNazarePaulista2016Ctrl'
        }
      }
    })

    .state('menu.programacao', {
      url: '/programacao',
      views: {
        'side-menu21': {
          templateUrl: 'templates/programacao.html',
          controller: 'programacaoCtrl'
        }
      }
    })

    .state('menu.transito', {
      url: '/transito',
      views: {
        'side-menu21': {
          templateUrl: 'templates/transito.html',
          controller: 'transitoCtrl'
        }
      }
    })

    .state('menu.mapaDoCircuito', {
      url: '/mapa',
      views: {
        'side-menu21': {
          templateUrl: 'templates/mapaDoCircuito.html',
          controller: 'mapaDoCircuitoCtrl'
        }
      }
    })

    .state('menu.musicas', {
      url: '/musicas',
      views: {
        'side-menu21': {
          templateUrl: 'templates/musicasDosBlocos.html',
          controller: 'musicasDosBlocosCtrl'
        }
      }
    })

    .state('menu.musica', {
      url: "/musica/:musicaId",  // here is what you annouce the params
      views: {
        'side-menu21': {
          templateUrl: "templates/musica.html",
          controller: 'musicaPageCtrl'
        }
      }
    })

    .state('menu.pontosDeEncontro', {
      url: '/pontos',
      views: {
        'side-menu21': {
          templateUrl: 'templates/pontosDeEncontro.html',
          controller: 'pontosDeEncontroCtrl'
        }
      }
    })

    .state('menu.telefonesUteis', {
      url: '/telefones',
      views: {
        'side-menu21': {
          templateUrl: 'templates/telefonesUteis.html',
          controller: 'telefonesUteisCtrl'
        }
      }
    })

    .state('menu.conhecaNazare', {
      url: '/conheca',
      views: {
        'side-menu21': {
          templateUrl: 'templates/conhecaNazare.html',
          controller: 'conhecaNazareCtrl'
        }
      }
    })

    .state('menu.alimentacao', {
      url: '/alimentacao',
      views: {
        'side-menu21': {
          templateUrl: 'templates/alimentacao.html',
          controller: 'alimentacaoCtrl'
        }
      }
    })

    .state('menu.carnavalConsciente', {
      url: '/conscientizacao',
      views: {
        'side-menu21': {
          templateUrl: 'templates/carnavalConsciente.html',
          controller: 'carnavalConscienteCtrl'
        }
      }
    })

    .state('menu.mandamentos', {
      url: '/mandatamentos',
      views: {
        'side-menu21': {
          templateUrl: 'templates/mandamentos.html',
          controller: 'mandamentosCtrl'
        }
      }
    })

  ;

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/menu/programacao');

});
