(function() {
    'use strict';

    angular
        .module('app.firebase', [])
		.service('FirebaseService', function() {
			
			var config = {
				apiKey: "AIzaSyB5q81AGGox4i8-QL2KOtnDDfi05irgcHE",
				authDomain: "socialstrataideateam.firebaseapp.com",
				databaseURL: "https://socialstrataideateam.firebaseio.com",
				storageBucket: "",
			};
			this.fb = firebase.initializeApp(config);
		});

})();




