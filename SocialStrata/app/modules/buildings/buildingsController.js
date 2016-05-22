(function () {
    'use strict';

    angular.module("app.buildings")

        .controller("buildingsController", buildingsController);


    function buildingsController($scope, $ionicLoading, buildingsService, selectedBuilding) {
        var ref = buildingsService.getBuildings();
		
		$scope.selectedKey = selectedBuilding ? selectedBuilding.key : null;
		
		$scope.select = function(key, building) {
			$scope.selectedKey = building.key = key;
			selectedBuilding = building;
			$scope.$emit("building-selected", selectedBuilding);
		};		

        $ionicLoading.show();
        ref.on("value", function (snapshot) {
            $scope.buildings = snapshot.val();
            $ionicLoading.hide();
        }, function (errorObject) {
            console.log("error reading: " + errorObject.code);
            var alertPopup = $ionicPopup.alert({
                title: 'Ops!',
                template: 'Sorry! An error ocurred'
            });
            $ionicLoading.hide();
        });
    }
})();