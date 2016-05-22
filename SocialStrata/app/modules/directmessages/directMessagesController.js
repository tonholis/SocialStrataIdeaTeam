(function() {
    'use strict';

    angular
        .module('app.directmessages')
        .controller('directMessagesController', [
            '$scope',
			'$state',
            '$ionicLoading',
            'directMessagesService',
            'globalsService',
            directMessagesController
        ]);

    function directMessagesController($scope, $state, $ionicLoading, contactsService, globalsService) {
		if (!globalsService.user) {
			$state.go('login');
			return;
		}
        
		var user = globalsService.user;
		console.log(user.uid);

        $ionicLoading.show();

        var ref = contactsService.getUserContacts(user.uid);
        ref.on("value", function(snapshot) {
			$scope.contacts = snapshot.val();
            $ionicLoading.hide();
			
			console.log($scope.contacts);
        }, function(errorObject) {
            console.log("error reading: " + errorObject.code);
            $ionicLoading.hide();
            var alertPopup = $ionicPopup.alert({
                title: 'Ops!',
                template: 'Sorry! An error ocurred.'
            });
        });

        
    }
})();