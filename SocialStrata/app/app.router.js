(function () {
    'use strict';

    angular

        .module('app')

        .config(function ($stateProvider, $urlRouterProvider) {

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

                .state('app.profile', {
                    url: '/profile',
                    resolve: {
                        user: function (authService) {
                            return authService.user()
                        }
                    },
                    views: {
                        'menuContent': {
                            templateProvider: function ($timeout, $stateParams, user) {
                                console.log(user);
                                var view = null;

                                if (user.type == 1) {
                                    view = 'views/profile/landlord.html'
                                } else {
                                    view = 'views/profile/tenant.html'
                                }

                                console.log(view);

                                return view;
                            }
                        }
                    }
                })

                .state('login', {
                    url: "/login",
                    templateUrl: "views/auth/login.html"
                });

            //fallback
            $urlRouterProvider.otherwise('/login');

        });
})();




