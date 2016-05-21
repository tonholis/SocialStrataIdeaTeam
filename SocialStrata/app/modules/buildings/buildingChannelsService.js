(function () {
    'use strict';

    angular
        .module('app.buildings')
        .service('buildingChannelsService', buildingChannelsService);

    function buildingChannelsService(firebaseService) {

        return {
            getChannelsFrom: function (building) {
                return firebaseService.fb.database().ref('buildings/' + building + "/channels");
            }
        }
    }
})();

