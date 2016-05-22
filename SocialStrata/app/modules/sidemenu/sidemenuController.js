(function () {
    'use strict';

    angular.module("app.sidemenu")

        .controller("sidemenuController", sidemenuController);


    function sidemenuController($scope, $state, channelsService, authService) {

        $scope.user = authService.user();

        $scope.channels = channelsService.channels;

        $scope.building = {
            name: "Select a building",
            address: "",
        };

        $scope.$on('building-selected', function (event, data) {
            $scope.building.name = data.name;
            $scope.building.address = data.address;

        });

        $scope.openChannel = function (key) {
            $state.go('app.channel', {channelId: key});
        };
    }
})();
