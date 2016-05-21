(function () {
    'use strict';

    angular
        .module('app.buildings')
        .service('buildingsService', buildingsService);

    function buildingsService(firebaseService) {

        return {
            getBuildings: function () {
                return firebaseService.fb.database().ref('buildings')
            }
        }
    }
})();
