(function () {
    'use strict';

    angular
        .module('app.directmessages')
        .controller('directMessagesController', [
            '$scope',
            '$ionicLoading',
            'directMessagesService',
            'authService',
            directMessagesController
        ]);

    function directMessagesController($scope, $ionicLoading, contactsService, authService) {
        var user = authService.user();

        console.log(user.uid);

        var ref = contactsService.getUserContacts(user.uid);

        console.log(ref);

        $ionicLoading.show();
        ref.on("value", function (snapshot) {
            var val = snapshot.val();

            if (val) {
                $scope.contacts = angular.extend(val.common, val.services);
            }
            else {
                console.log(val);
            }
            $ionicLoading.hide();
        }, function (errorObject) {
            console.log("error reading: " + errorObject.code);
            $ionicLoading.hide();
            var alertPopup = $ionicPopup.alert({
                title: 'Ops!',
                template: 'Sorry! An error ocurred.'
            });
        });

        console.log($scope.contacts);
    }
})();