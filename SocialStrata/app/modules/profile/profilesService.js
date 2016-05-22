(function() {
    'use strict';

    angular.module("app.profiles")

        .service("profilesService", profilesService);


    function profilesService($q, $rootScope, authService, user) {

        return {
            updateProfile: function(data) {
                var deferred = $q.defer();

                authService.user().updateProfile(data)
                    .then(function success() {
                        deferred.resolve("Profile updated!");
                        user = firebase.auth().currentUser;
                        $rootScope.$broadcast('name-changed');
                    }, function error(error) {
                        deferred.reject(error);
                    });

                return deferred.promise;
            },
        }
    }
})();