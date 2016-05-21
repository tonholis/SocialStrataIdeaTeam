(function() {
    'use strict';

    angular.module("app.auth")

        .service("authService", authService);

	function createUser(username, password) {
		var deferred = $q.defer();
		var auth = firebaseService.fb.auth();

		return auth.createUserWithEmailAndPassword(email, password);
	}

    function authService($q, firebaseService) {
		var auth = firebaseService.fb.auth();

		return {
            login: function(username, password) {
                var deferred = $q.defer();
                var promise = deferred.promise;

				var successHandler = function(info) {
					info.isNew = info.displayName == null;
					deferred.resolve(info);
				};

				var errorHandler = function(error) {
					deferred.reject(error);
				};

				auth.signInWithEmailAndPassword(username, password)
					.then(successHandler, function error(error) {
						if (error.code == "auth/user-not-found") {
							auth.createUserWithEmailAndPassword(username, password)
								.then(successHandler, errorHandler);
						}
						else {
							errorHandler(error);
						}
					});

                promise.success = function(fn) {
                    promise.then(fn);
                    return promise;
                }
                promise.error = function(fn) {
                    promise.then(null, fn);
                    return promise;
                }
                return promise;
            },

            user: function() {
				return auth.currentUser;
                // return {
                //     username: "user",
                //     password: "password",
                //     type: Math.floor(Math.random() * 2) + 1
                // }
            }
        }
    }
})();
