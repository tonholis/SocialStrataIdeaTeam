(function () {
    'use strict';

    angular.module("app.buildings")

        .controller("buildingsController", buildingsController);


    function buildingsController($scope) {
        $scope.buildings = [
            { name: 'Building 1', id: 1 },
            { name: 'Building 2', id: 2 },
            { name: 'Building 3', id: 3 },
            { name: 'Building 4', id: 4 },
            { name: 'Building 5', id: 5 },
            { name: 'Building 6', id: 6 }
        ];
    }
})();