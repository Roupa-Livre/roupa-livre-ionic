;(function () {
  "use strict";

  angular.module('app.services')

    .factory('NotificationManager', function ($q, $rootScope, $ionicHistory, $state, UserCheck) {
      var manager = this;
      manager.apparelsSeenCount = 0;

      manager.apparelFetched = function() {
        manager.apparelsSeenCount = manager.apparelsSeenCount + 1;
      };
      manager.shouldShowApparelNotification = function(apparel) {
        if (manager.apparelsSeenCount < 3) {
          return false;
        } else {
          manager.apparelsSeenCount = 0;

          var q = $q.defer();
          // é invertido mesmo, pois caso tenha apparels não mostra mensagem e o oposto tb
          UserCheck.doOwnsApparels().then(function() {
            q.reject();
          }, function() {
            q.resolve();
          });
        return q.promise;
        }
      };
      manager.showApparelsNotificationIfNeeded = function() {
        var result = manager.shouldShowApparelNotification();
        if (result) {
          result.then(function() {
            $rootScope.showConfirmPopup(t('apparel.confirmations.add_apparels.title'), null, null, t('shared.buttons.continue'), t('apparel.confirmations.add_apparels.add_new_button')).then(function(res) {
              if(res) {
                $ionicHistory.nextViewOptions({ disableBack: true });
                $state.go('menu.new');
              }
            });
          });
        }

        manager.apparelFetched();
      }
      return manager;
    });
}());