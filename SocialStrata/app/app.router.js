(function () {
    'use strict';

    angular

        .module('app')

        .config(function($stateProvider, $urlRouterProvider) {

            $stateProvider

                .state('app', {
                    url: '/app',
                    abstract: true,
                    templateUrl: 'views/sidemenu.html',
                })

                .state('app.buildings', {
                    url: '/buildings',
                    views: {
                        'menuContent': {
                            templateUrl: 'views/buildings.html'
                        }
                    }
                })

                .state('app.building', {
                    url: '/buildings/:buildingId',
                    views: {
                        'menuContent': {
                            templateUrl: 'views/building.html'
                        }
                    }
                })

                .state('login', {
                    url:"/login",
                    templateUrl:"views/auth/login.html"
                });

            //fallback
            $urlRouterProvider.otherwise('/login');

        });
})();




