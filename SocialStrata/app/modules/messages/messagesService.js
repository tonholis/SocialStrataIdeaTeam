(function () {
    'use strict';

    angular
        .module('app.message')
        .service('messagesService', messagesService);

    function messagesService() {
		var obj = {};
		
		obj.getMessagesRef = function () {
			return firebase.database().ref('messages');
		};
		
		obj.getMessagesRef = function () {
			return firebase.database().ref('messages');
		};
		
        return obj;
    }
})();
