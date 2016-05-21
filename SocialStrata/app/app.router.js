(function () {
    'use strict';

    angular

        .module('app')

        .config(function($stateProvider, $urlRouterProvider) {

            $stateProvider


                .state('login', {
                    url:"/login",
                    templateUrl:"views/auth/login.html",
                    controller: 'authController'
                })

            //fallback
            $urlRouterProvider.otherwise('/login');

        });
})();




