(function () {
    'use strict';

    angular

        .module('app', [
            'ionic',
			
			'app.firebase',
            'app.auth',
            'app.message',
			'app.sidemenu',
            'app.buildings',
            'app.profiles'
        ])
		
		.value("user", null)
		.value("selectedBuilding", null)

        .run(function ($ionicPlatform, $timeout, $rootScope) {
			$ionicPlatform.ready(function () {
                if (window.cordova && window.cordova.plugins.Keyboard) {
                    cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

                    cordova.plugins.Keyboard.disableScroll(true);
                }
                if (window.StatusBar) {
                    StatusBar.styleDefault();
                }
				
				$rootScope.$broadcast('name-changed');
            });
        });
})();


