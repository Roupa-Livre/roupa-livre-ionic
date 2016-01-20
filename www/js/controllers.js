angular.module('app.controllers', [])

.controller('carnavalNazarePaulista2016Ctrl', function($scope) {
  $scope.images = [];

  $scope.loadImages = function() {
      for(var i = 0; i < 10; i++) {
          $scope.images.push({id: i, src: "http://placehold.it/50x50"});
      }
  }
})

.controller('programacaoCtrl', function($scope) {

})

.controller('transitoCtrl', function($scope, $state, $cordovaGeolocation){

  var options = {timeout: 10000, enableHighAccuracy: true};

    $cordovaGeolocation.getCurrentPosition(options).then(function(position){

      var latLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

      var mapOptions = {
        center: latLng,
        zoom: 15,
        mapTypeId: google.maps.MapTypeId.ROADMAP
      };

      $scope.map = new google.maps.Map(document.getElementById("map"), mapOptions);

    }, function(error){
      console.log("Could not get location");
    });

})


.controller('mapaDoCircuitoCtrl', function($scope) {

})

.controller('musicasDosBlocosCtrl', function($scope) {

})

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

