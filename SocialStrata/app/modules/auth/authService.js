(function () {
    'use strict';

    angular.module("app.auth")

        .service("authService", authService)


    function authService($q) {

        return {
            login: function (username, password) {
                var deferred = $q.defer();
                var promise = deferred.promise;

                if (username == 'user' && password == 'password') {
                    deferred.resolve('Welcome ' + username + '!');
                } else {
                    deferred.reject('Wrong credentials!');
                }
                promise.success = function (fn) {
                    promise.then(fn);
                    return promise;
                }
                promise.error = function (fn) {
                    promise.then(null, fn);
                    return promise;
                }
                return promise;
            },

            user: function () {
                return {
                    username: "user",
                    password: "password",
                    type: Math.floor(Math.random() * 2) + 1
                }
            }
        }
    }
})();
