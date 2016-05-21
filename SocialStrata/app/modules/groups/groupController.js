(function () {
    'use strict';

    angular.module("app.groups")

        .controller("groupController", groupController);


    function groupController($scope, $stateParams) {
        $scope.channels = [
            { name: 'Channel 1', id: 1 },
            { name: 'Channel 2', id: 2 },
            { name: 'Channel 3', id: 3 },
            { name: 'Channel 4', id: 4 },
            { name: 'Channel 5', id: 5 },
            { name: 'Channel 6', id: 6 }
        ];
    }
})();