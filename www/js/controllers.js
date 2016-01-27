angular.module('app.controllers', [])

.controller('carnavalNazarePaulista2016Ctrl', function($scope) {
  $scope.images = [
    { src: 'img/inicio/1-carnaval.png', title: 'Destaque', url: '#/menu/programacao'},
    { src: 'img/inicio/2-esporte.jpg', title: 'Conheça Nazaré', url: '#/menu/conheca'},
    { src: 'img/inicio/3-restaurante.jpg', title: 'Restaurantes', url: '#/menu/alimentacao'},
    { src: 'img/inicio/4-HOTEL.jpg', title: 'Hotéis/Pousadas e Marinas', url: '#/menu/conheca'},
    { src: 'img/inicio/5-cidade.jpg', title: 'A Cidade', url: false},
    { src: 'img/inicio/6-festas.jpg', title: 'Festejos e Calendário', url: false}
  ];

  $scope.loadImages = function() {
      
  }
})

.controller('programacaoCtrl', function($scope) {

})

.controller('transitoCtrl', function($scope, $state, $cordovaGeolocation){

  // var options = {timeout: 10000, enableHighAccuracy: true};

  //   $cordovaGeolocation.getCurrentPosition(options).then(function(position){

  //     var latLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

  //     var mapOptions = {
  //       center: latLng,
  //       zoom: 15,
  //       mapTypeId: google.maps.MapTypeId.ROADMAP
  //     };

  //     $scope.map = new google.maps.Map(document.getElementById("map"), mapOptions);

  //   }, function(error){
  //     console.log("Could not get location");
  //   });

})


.controller('mapaDoCircuitoCtrl', function($scope) {
})

.controller('musicasDosBlocosCtrl', ['$scope', '$state', 'Musica', function($scope, $state, Musica) {
  $scope.entitiesList = Musica.query();
  $scope.entityClicked = function(entity) {
    $state.go('menu.musica', { musicaId: entity.id });
  };
}])

.controller('musicaPageCtrl', ['$scope', '$sce', '$stateParams', 'Musica', function($scope, $sce, $stateParams, Musica) {
  $scope.entity = Musica.get($stateParams.musicaId);
  $scope.videoUrl = 'http://www.youtube.com/embed/' + $scope.entity.videoCode + '?rel=0';
  $scope.trustSrc = function(src) {
    return $sce.trustAsResourceUrl(src);
  }
}])

.controller('pontosDeEncontroCtrl', function($scope) {

})

.controller('telefonesUteisCtrl', function($scope) {

})

.controller('conhecaNazareCtrl', function($scope) {

})

.controller('alimentacaoCtrl', function($scope) {

})

.controller('carnavalConscienteCtrl', function($scope) {

})

.controller('mandamentosCtrl', function($scope) {

})

