(function () {
    'use strict';

    angular

        .module('app', [
            'ionic',

            'app.auth'
        ])

        .run(function ($ionicPlatform) {
            $ionicPlatform.ready(function () {
                if (window.cordova && window.cordova.plugins.Keyboard) {
                    cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

                    cordova.plugins.Keyboard.disableScroll(true);
                }
                if (window.StatusBar) {
                    StatusBar.styleDefault();
                }
            });
        });
})();


