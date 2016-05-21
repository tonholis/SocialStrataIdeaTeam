(function() {
    'use strict';

    angular
        .module('app.firebase')
		.factory('FirebaseService', function() {
			var config = {
				apiKey: "AIzaSyB5q81AGGox4i8-QL2KOtnDDfi05irgcHE",
				authDomain: "socialstrataideateam.firebaseapp.com",
				databaseURL: "https://socialstrataideateam.firebaseio.com",
				storageBucket: "",
			};
			return firebase.initializeApp(config);
		});

})();




