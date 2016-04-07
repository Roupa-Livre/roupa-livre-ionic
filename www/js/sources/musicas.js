angular.module('app')
  .factory('Musica', function() {
    return {
      query: function() {
        return angular.copy(musicas);
      },
      get: function(id) {
        return angular.copy(musicas[id - 1]);
      }
    };
  });