(function() {
    'use strict';

    angular

        .module('app', [
            'ionic',
            'monospaced.elastic',

            'app.firebase',
            'app.firebase',
            'app.auth',
            'app.channels',
            'app.sidemenu',
            'app.buildings',
            'app.profiles',
            'app.messages'
        ])

        .run(function($ionicPlatform, $timeout, $rootScope) {
            $ionicPlatform.ready(function() {
                if (window.cordova && window.cordova.plugins.Keyboard) {
                    cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

                    cordova.plugins.Keyboard.disableScroll(true);
                }
                if (window.StatusBar) {
                    StatusBar.styleDefault();
                }

                $rootScope.$emit('user-changed');
            });
        });
})();


