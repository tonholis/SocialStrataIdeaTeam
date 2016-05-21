(function() {
    'use strict';

    angular.module("app.buildings")

        .controller("buildingsController", buildingsController);


    function buildingsController($scope, $ionicLoading, FirebaseService) {
		var ref = FirebaseService.fb.database().ref('buildings');

		$ionicLoading.show();
		ref.on("value", function(snapshot) {
			console.log(snapshot.val());
			$scope.buildings = snapshot.val();
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