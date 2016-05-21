(function () {
    'use strict';

    angular.module("app.groups")

        .controller("groupsController", groupsController);


    function groupsController($scope) {
        $scope.groups = [
            { name: 'Group 1', id: 1 },
            { name: 'Group 2', id: 2 },
            { name: 'Group 3', id: 3 },
            { name: 'Group 4', id: 4 },
            { name: 'Group 5', id: 5 },
            { name: 'Group 6', id: 6 }
        ];
    }
})();