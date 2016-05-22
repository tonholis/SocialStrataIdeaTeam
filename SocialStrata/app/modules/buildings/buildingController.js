(function () {
    'use strict';

    angular.module("app.buildings")

        .controller("buildingController", buildingController);


    function buildingController($scope, $ionicLoading, $stateParams, channelsService) {

        var ref = channelsService.getChannelsFrom($stateParams.buildingId);

        $ionicLoading.show();
        ref.on("value", function (snapshot) {
            var val = snapshot.val();

            if (val) {
                $scope.channels = val.channels;
            }
            else {

            }
            $ionicLoading.hide();

        }, function (errorObject) {
            console.log("error reading: " + errorObject.code);
            var alertPopup = $ionicPopup.alert({
                title: 'Ops!',
                template: 'Sorry! An error ocurred.'
            });
            $ionicLoading.hide();
        });

    }
})();