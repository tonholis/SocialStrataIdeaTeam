(function () {
    'use strict';

    angular

        .module('app')

        .run(['$rootScope', '$location', 'authService', function ($rootScope, $state, authService) {
            $rootScope.$on('$routeChangeStart', function (event) {

                if (authService.user() == null) {
                    event.preventDefault();
                    $state.go('login');
                }
            });
        }])
})();
