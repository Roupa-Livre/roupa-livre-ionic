var MainPushSystem = null;
function PushSystem(onRegisterCallback, onNotificationCallback, onErrorCallback, onUnregisterCallback) {
  this.registrationID = null;
  this.pushNotificationService = null;
  this.onRegister = onRegisterCallback;
  this.onUnregister = onUnregisterCallback;
  this.onNotification = onNotificationCallback;
  this.onError = onErrorCallback;
}
PushSystem.tryRegister = function(senderID, onRegisterCallback, onNotificationCallback, onErrorCallback, onUnregisterCallback) {
  if (MainPushSystem == null)
    MainPushSystem = new PushSystem(onRegisterCallback, onNotificationCallback, onErrorCallback, onUnregisterCallback);
  MainPushSystem.register(senderID);
};
PushSystem.tryUnregister = function($q) {
  var deferred = $q.defer();
  if (MainPushSystem != null) {
    MainPushSystem.unregister(deferred);
    MainPushSystem = null;
  }
  else
    deferred.resolve(true);

  return deferred.promise;
};
PushSystem.prototype.persistRegistration = function(registrationID) {
  this.registrationID = registrationID;
};
PushSystem.prototype.unregister = function(deferred) {
  this.pushNotificationService.unregister(function() {
    console.log('unregister success');
    var oldId = this.registrationID;
    this.registrationID = null;
    if (this.onUnregister)
      this.onUnregister(oldId);
    deferred.resolve(true);
  }, function() {
    console.log('unregister error');
    deferred.reject(false);
  });
};

PushSystem.prototype.register = function(senderID) {
  var self = this;

  this.pushNotificationService = PushNotification.init({
    android: { senderID: senderID },
    ios: {
      alert: "true",
      badge: "true",
      sound: "true"
    }
  });

  this.pushNotificationService.on('registration', function(data) {
    self.persistRegistration(data.registrationId);

    if (self.onRegister)
      self.onRegister(data);
  });

  this.pushNotificationService.on('notification', function(data) {
    console.log(data);
    if (self.onNotification)
      self.onNotification(data);
    // data.message,
    // data.title,
    // data.count,
    // data.sound,
    // data.image,
    // data.additionalData
  });

  this.pushNotificationService.on('error', function(e) {
    console.log(e);
    if (self.onError)
      self.onError(e);  
  });
}