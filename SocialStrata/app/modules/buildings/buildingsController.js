(function() {
    'use strict';

    angular.module("app.buildings")

        .controller("buildingsController", buildingsController);


    function buildingsController($scope, $ionicLoading, FirebaseService) {
		var ref = FirebaseService.fb.database().ref('buildings');

		$ionicLoading.show();
		ref.on("value", function(snapshot) {
			$scope.buildings = snapshot.val();
			$ionicLoading.hide();
		}, function(errorObject) {
			console.log("error reading: " + errorObject.code);
			var alertPopup = $ionicPopup.alert({
				title: 'Ops!',
				template: 'Sorry! An error ocurred'
			});
			$ionicLoading.hide();
		});

        // $scope.buildings = [
        //     { name: 'Building 1', id: 1 },
        //     { name: 'Building 2', id: 2 },
        //     { name: 'Building 3', id: 3 },
        //     { name: 'Building 4', id: 4 },
        //     { name: 'Building 5', id: 5 },
        //     { name: 'Building 6', id: 6 }
        // ];
    }
})();