(function () {
    'use strict';

    angular.module("app.auth")

        .controller("authController", authController);


    function authController($scope, authService, $ionicPopup, $state) {

        $scope.data = {};

        $scope.login = function () {
            authService.login($scope.data.username, $scope.data.password).success(function(data) {
                $state.go('app.buildings');
            }).error(function(data) {
                var alertPopup = $ionicPopup.alert({
                    title: 'Login failed!',
                    template: 'Please check your credentials!'
                });
            });
        }
    }
})();