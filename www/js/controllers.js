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
 