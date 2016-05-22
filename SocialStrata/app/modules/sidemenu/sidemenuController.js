(function() {
    'use strict';

    angular.module("app.sidemenu")

        .controller("sidemenuController", sidemenuController);


    function sidemenuController($scope, $state) {
		// $scope.$on('name-changed', function() {
		// 	$scope.displayName = authService.user().displayName;
		// });
		
		$scope.building = {
			name: "Select a building",
			address: "",
		};
		
		$scope.$on('building-selected', function(event, data) {
			$scope.building.name = data.name;
			$scope.building.address = data.address;
			
		});
		
		$scope.channel = function(channelKey) {
			$state.go('app.channel', { channelId: channelKey});
		};
    }
})();
