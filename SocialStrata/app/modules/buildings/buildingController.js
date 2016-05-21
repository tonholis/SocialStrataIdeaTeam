(function () {
    'use strict';

    angular.module("app.buildings")

        .controller("buildingController", buildingController);


    function buildingController($scope, $ionicLoading, $stateParams, FirebaseService) {
		var ref = FirebaseService.fb.database().ref('buildings/' + $stateParams.buildingId + "/channels");

		$ionicLoading.show();
		ref.on("value", function(snapshot) {
			var val = snapshot.val();
			
			if (val) {
				$scope.channels = angular.extend(val.common, val.services);
			}
			else {
				
			}
			$ionicLoading.hide();
		}, function(errorObject) {
			console.log("error reading: " + errorObject.code);
			var alertPopup = $ionicPopup.alert({
				title: 'Ops!',
				template: 'Sorry! An error ocurred.'
			});
			$ionicLoading.hide();
		});
		
    }
})();