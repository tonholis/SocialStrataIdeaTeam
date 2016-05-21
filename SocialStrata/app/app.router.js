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

                .state('app.groups', {
                    url: '/groups',
                    views: {
                        'menuContent': {
                            templateUrl: 'views/groups.html'
                        }
                    }
                })

                .state('app.group', {
                    url: '/groups/:groupId',
                    views: {
                        'menuContent': {
                            templateUrl: 'views/group.html'
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




