(function() {
    'use strict';

    angular.module("app.auth")

        .service("authService", authService);

	function createUser(username, password) {
		var deferred = $q.defer();
		var auth = firebaseService.fb.auth();

		return auth.createUserWithEmailAndPassword(email, password);
	}
	
    function authService($q, $rootScope, user, buildingsService, selectedBuilding) {
		var auth = firebase.auth();
		
		$rootScope.$on('name-changed', function() {
			var usr = firebase.auth().currentUser;
			if (usr == null) return;
			
			firebase.database().ref('users/' + usr.uid).set({
				name: usr.displayName,
				email: usr.email,
				lastActivity: new Date().getTime()
			});
		});

		return {
            login: function(username, password) {
                var deferred = $q.defer();
                var promise = deferred.promise;

				var successHandler = function(info) {
					info.isNew = info.displayName == null;
					deferred.resolve(info);
									
					user = firebase.auth().currentUser;
					$rootScope.$emit('name-changed');
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

			logout: function () {
				auth.signOut();
				user = firebase.auth().currentUser;
			},

            user: function() {
				return firebase.auth().currentUser;
            }
        }
    }
})();
