(function() {
    'use strict';

    angular.module("app.sidemenu")

        .controller("sidemenuController", sidemenuController);


    function sidemenuController($scope, authService, messagesService) {
		$scope.$on('name-changed', function() {
			$scope.displayName = authService.user().displayName;
		});
		
		var user = authService.user();
		$scope.displayName = user ? user.displayName : "Edit Name";
    }
})();
