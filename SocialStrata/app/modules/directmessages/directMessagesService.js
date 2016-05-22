(function () {
    'use strict';

    angular
        .module('app.directmessages')
        .service('directMessagesService', directMessagesService);

    function directMessagesService(firebaseService) {
        var service = {};

        service.getUserContacts = function (user) {
            return firebaseService.fb.database().ref('users/' + user + '/contacts');
        };

        return service;
    }
})();
