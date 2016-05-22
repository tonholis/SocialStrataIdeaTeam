(function () {
    'use strict';

    angular.module("app.auth", []);
})();
(function () {
    'use strict';

    angular.module("app.buildings", ['app.firebase']);
})();
(function () {
    'use strict';

    angular.module("app.channels", []);
})();
(function () {
    'use strict';

    angular
        .module('app.directmessages', []);
})();





(function() {
    'use strict';

    angular
        .module('app.firebase', []);
})();





(function () {
    'use strict';

    angular
        .module('monospaced.elastic', [])
        .constant('msdElasticConfig', {
            append: ''
        })
        .directive('msdElastic', [
            '$timeout', '$window', 'msdElasticConfig',
            function ($timeout, $window, config) {
                'use strict';

                return {
                    require: 'ngModel',
                    restrict: 'A, C',
                    link: function (scope, element, attrs, ngModel) {

                        // cache a reference to the DOM element
                        var ta = element[0],
                            $ta = element;

                        // ensure the element is a textarea, and browser is capable
                        if (ta.nodeName !== 'TEXTAREA' || !$window.getComputedStyle) {
                            return;
                        }

                        // set these properties before measuring dimensions
                        $ta.css({
                            'overflow': 'hidden',
                            'overflow-y': 'hidden',
                            'word-wrap': 'break-word'
                        });

                        // force text reflow
                        var text = ta.value;
                        ta.value = '';
                        ta.value = text;

                        var append = attrs.msdElastic ? attrs.msdElastic.replace(/\\n/g, '\n') : config.append,
                            $win = angular.element($window),
                            mirrorInitStyle = 'position: absolute; top: -999px; right: auto; bottom: auto;' +
                                'left: 0; overflow: hidden; -webkit-box-sizing: content-box;' +
                                '-moz-box-sizing: content-box; box-sizing: content-box;' +
                                'min-height: 0 !important; height: 0 !important; padding: 0;' +
                                'word-wrap: break-word; border: 0;',
                            $mirror = angular.element('<textarea aria-hidden="true" tabindex="-1" ' +
                                'style="' + mirrorInitStyle + '"/>').data('elastic', true),
                            mirror = $mirror[0],
                            taStyle = getComputedStyle(ta),
                            resize = taStyle.getPropertyValue('resize'),
                            borderBox = taStyle.getPropertyValue('box-sizing') === 'border-box' ||
                                taStyle.getPropertyValue('-moz-box-sizing') === 'border-box' ||
                                taStyle.getPropertyValue('-webkit-box-sizing') === 'border-box',
                            boxOuter = !borderBox ? {width: 0, height: 0} : {
                                width: parseInt(taStyle.getPropertyValue('border-right-width'), 10) +
                                parseInt(taStyle.getPropertyValue('padding-right'), 10) +
                                parseInt(taStyle.getPropertyValue('padding-left'), 10) +
                                parseInt(taStyle.getPropertyValue('border-left-width'), 10),
                                height: parseInt(taStyle.getPropertyValue('border-top-width'), 10) +
                                parseInt(taStyle.getPropertyValue('padding-top'), 10) +
                                parseInt(taStyle.getPropertyValue('padding-bottom'), 10) +
                                parseInt(taStyle.getPropertyValue('border-bottom-width'), 10)
                            },
                            minHeightValue = parseInt(taStyle.getPropertyValue('min-height'), 10),
                            heightValue = parseInt(taStyle.getPropertyValue('height'), 10),
                            minHeight = Math.max(minHeightValue, heightValue) - boxOuter.height,
                            maxHeight = parseInt(taStyle.getPropertyValue('max-height'), 10),
                            mirrored,
                            active,
                            copyStyle = ['font-family',
                                'font-size',
                                'font-weight',
                                'font-style',
                                'letter-spacing',
                                'line-height',
                                'text-transform',
                                'word-spacing',
                                'text-indent'];

                        // exit if elastic already applied (or is the mirror element)
                        if ($ta.data('elastic')) {
                            return;
                        }

                        // Opera returns max-height of -1 if not set
                        maxHeight = maxHeight && maxHeight > 0 ? maxHeight : 9e4;

                        // append mirror to the DOM
                        if (mirror.parentNode !== document.body) {
                            angular.element(document.body).append(mirror);
                        }

                        // set resize and apply elastic
                        $ta.css({
                            'resize': (resize === 'none' || resize === 'vertical') ? 'none' : 'horizontal'
                        }).data('elastic', true);

                        /*
                         * methods
                         */

                        function initMirror() {
                            var mirrorStyle = mirrorInitStyle;

                            mirrored = ta;
                            // copy the essential styles from the textarea to the mirror
                            taStyle = getComputedStyle(ta);
                            angular.forEach(copyStyle, function (val) {
                                mirrorStyle += val + ':' + taStyle.getPropertyValue(val) + ';';
                            });
                            mirror.setAttribute('style', mirrorStyle);
                        }

                        function adjust() {
                            var taHeight,
                                taComputedStyleWidth,
                                mirrorHeight,
                                width,
                                overflow;

                            if (mirrored !== ta) {
                                initMirror();
                            }

                            // active flag prevents actions in function from calling adjust again
                            if (!active) {
                                active = true;

                                mirror.value = ta.value + append; // optional whitespace to improve animation
                                mirror.style.overflowY = ta.style.overflowY;

                                taHeight = ta.style.height === '' ? 'auto' : parseInt(ta.style.height, 10);

                                taComputedStyleWidth = getComputedStyle(ta).getPropertyValue('width');

                                // ensure getComputedStyle has returned a readable 'used value' pixel width
                                if (taComputedStyleWidth.substr(taComputedStyleWidth.length - 2, 2) === 'px') {
                                    // update mirror width in case the textarea width has changed
                                    width = parseInt(taComputedStyleWidth, 10) - boxOuter.width;
                                    mirror.style.width = width + 'px';
                                }

                                mirrorHeight = mirror.scrollHeight;

                                if (mirrorHeight > maxHeight) {
                                    mirrorHeight = maxHeight;
                                    overflow = 'scroll';
                                } else if (mirrorHeight < minHeight) {
                                    mirrorHeight = minHeight;
                                }
                                mirrorHeight += boxOuter.height;
                                ta.style.overflowY = overflow || 'hidden';

                                if (taHeight !== mirrorHeight) {
                                    scope.$emit('elastic:resize', $ta, taHeight, mirrorHeight);
                                    ta.style.height = mirrorHeight + 'px';
                                }

                                // small delay to prevent an infinite loop
                                $timeout(function () {
                                    active = false;
                                }, 1, false);

                            }
                        }

                        function forceAdjust() {
                            active = false;
                            adjust();
                        }

                        /*
                         * initialise
                         */

                        // listen
                        if ('onpropertychange' in ta && 'oninput' in ta) {
                            // IE9
                            ta['oninput'] = ta.onkeyup = adjust;
                        } else {
                            ta['oninput'] = adjust;
                        }

                        $win.bind('resize', forceAdjust);

                        scope.$watch(function () {
                            return ngModel.$modelValue;
                        }, function (newValue) {
                            forceAdjust();
                        });

                        scope.$on('elastic:adjust', function () {
                            initMirror();
                            forceAdjust();
                        });

                        $timeout(adjust, 0, false);

                        /*
                         * destroy
                         */

                        scope.$on('$destroy', function () {
                            $mirror.remove();
                            $win.unbind('resize', forceAdjust);
                        });
                    }
                };
            }
        ]);

    angular
        .module('app.messages', ['monospaced.elastic']);
})();





(function () {
    'use strict';

    angular.module("app.profiles", ['app.auth']);
})();
(function () {
    'use strict';

    angular.module("app.sidemenu", []);
})();
(function () {
    'use strict';

    angular.module("app.users", ['app.auth']);
})();
(function() {
    'use strict';

    authController.$inject = ["$scope", "authService", "$ionicPopup", "$ionicLoading", "$state", "$timeout"];
    angular.module("app.auth")

        .controller("authController", authController);


    function authController($scope, authService, $ionicPopup, $ionicLoading, $state, $timeout) {

        $scope.data = {};

        $scope.login = function() {
			$ionicLoading.show();

			authService.login($scope.data.username, $scope.data.password).success(function(user) {
				$ionicLoading.hide();
				$state.go('app.buildings');

            }).error(function(error) {
				$timeout(function() {
					$ionicLoading.hide();
				}, 100);

                var alertPopup = $ionicPopup.alert({
                    title: 'Login failed!',
                    template: error.message //'Please check your credentials!'
                });
            });
        }

		$scope.facebookLogin = function() {
			var alertPopup = $ionicPopup.alert({
				title: 'Facebook login',
				template: 'Planned!'
			});
        }
    }
})();
(function() {
    'use strict';

    authService.$inject = ["$q", "$rootScope", "buildingsService", "globalsService"];
    angular.module("app.auth")

        .service("authService", authService);

	function createUser(username, password) {
		var deferred = $q.defer();
		var auth = firebaseService.fb.auth();

		return auth.createUserWithEmailAndPassword(email, password);
	}
	
    function authService($q, $rootScope, buildingsService, globalsService) {
		var auth = firebase.auth();
		
		$rootScope.$on('user-changed', function() {
			var usr = firebase.auth().currentUser;
			if (usr == null) {
				globalsService.user = null;
				return
			};
			
			globalsService.user = usr;
			
			var ref = firebase.database().ref('users/' + usr.uid);
			ref.child('name').set(usr.displayName);
			ref.child('email').set(usr.email);
			ref.child('lastActivity').set(new Date().getTime());
		});

		return {
            login: function(username, password) {
                var deferred = $q.defer();
                var promise = deferred.promise;

				var successHandler = function(info) {
					info.isNew = info.displayName == null;
					deferred.resolve(info);
									
					$rootScope.$emit('user-changed');
				};

				var errorHandler = function(error) {
					deferred.reject(error);
				};

				auth.signInWithEmailAndPassword(username, password)
					.then(successHandler, function error(error) {
						if (error.code == "auth/user-not-found") {
							auth.createUserWithEmailAndPassword(username, password)
								.then(successHandler, errorHandler);
						}
						else {
							errorHandler(error);
						}
					});

                promise.success = function(fn) {
                    promise.then(fn);
                    return promise;
                }
                promise.error = function(fn) {
                    promise.then(null, fn);
                    return promise;
                }
                return promise;
            },

			logout: function () {
				auth.signOut();
				globalsService.user = null;
			},

            user: function() {
				return firebase.auth().currentUser;
            }
        }
    }
})();

(function () {
    'use strict';

    buildingController.$inject = ["$scope", "$ionicLoading", "$stateParams", "channelsService"];
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
(function () {
    'use strict';

    buildingsController.$inject = ["$scope", "$ionicLoading", "buildingsService", "globalsService"];
    angular.module("app.buildings")

        .controller("buildingsController", buildingsController);


    function buildingsController($scope, $ionicLoading, buildingsService, globalsService) {
        var ref = buildingsService.getBuildings();
		
		$scope.selectedKey = globalsService.building ? globalsService.building.key : null;
		
		$scope.select = function(key, building) {
			$scope.selectedKey = building.key = key;
			globalsService.building = building;
			$scope.$emit("building-selected", building);
		};		

        $ionicLoading.show();
        ref.on("value", function (snapshot) {
            $scope.buildings = snapshot.val();
            $ionicLoading.hide();
        }, function (errorObject) {
            console.log("error reading: " + errorObject.code);
            var alertPopup = $ionicPopup.alert({
                title: 'Ops!',
                template: 'Sorry! An error ocurred'
            });
            $ionicLoading.hide();
        });
    }
})();
(function () {
    'use strict';

    buildingsService.$inject = ["firebaseService", "$rootScope"];
    angular
        .module('app.buildings')
        .service('buildingsService', buildingsService);

    function buildingsService(firebaseService, $rootScope) {

        return {
            getBuildings: function () {
                return firebase.database().ref('buildings')
            }
        }
    }
})();

(function () {
    'use strict';

    channelsService.$inject = ["$rootScope"];
    angular
        .module('app.channels')
        .service('channelsService', channelsService);

    function channelsService($rootScope) {
		var service = {};
		
		service.channels = {
			"landlord": "Talk to landlord",
			"general": "General",
			"parking": "Parking Garage",
			"garden": "Garden",
			"lostfound": "Lost & Found",
			"maintenance": "Request Maintenance"
		};
		
		$rootScope.$on("building-selected", function(building) {
			//count how many new messages each channel has
		});
		
		service.getChannelsFrom = function (building) {
			return firebase.database().ref('buildings/' + building + "/channels");
		};

        return service;
    }
})();


(function() {
    'use strict';

    angular
        .module('app.directmessages')
        .controller('directMessagesController', [
            '$scope',
			'$state',
            '$ionicLoading',
            'directMessagesService',
            'globalsService',
            directMessagesController
        ]);

    function directMessagesController($scope, $state, $ionicLoading, contactsService, globalsService) {
		if (!globalsService.user) {
			$state.go('login');
			return;
		}
        
		var user = globalsService.user;
		console.log(user.uid);

        $ionicLoading.show();

        var ref = contactsService.getUserContacts(user.uid);
        ref.on("value", function(snapshot) {
			$scope.contacts = snapshot.val();
            $ionicLoading.hide();
			
			console.log($scope.contacts);
        }, function(errorObject) {
            console.log("error reading: " + errorObject.code);
            $ionicLoading.hide();
            var alertPopup = $ionicPopup.alert({
                title: 'Ops!',
                template: 'Sorry! An error ocurred.'
            });
        });

        
    }
})();
(function () {
    'use strict';

    directMessagesService.$inject = ["firebaseService"];
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

(function () {
    'use strict';

    angular
        .module('app.firebase')
        .service('firebaseService', firebaseService);


    function firebaseService() {
        var config = {
            apiKey: "AIzaSyB5q81AGGox4i8-QL2KOtnDDfi05irgcHE",
            authDomain: "socialstrataideateam.firebaseapp.com",
            databaseURL: "https://socialstrataideateam.firebaseio.com",
            storageBucket: "",
        };

        this.fb = firebase.initializeApp(config);
    }
})();

(function() {
    'use strict';

    angular
        .module('app.messages')
        .controller('messagesController', [
            '$scope',
            '$state',
            '$stateParams',
            '$ionicScrollDelegate',
            '$timeout',
            'channelsService',
            'globalsService',
            MessagesController
        ]);

    function MessagesController($scope, $state, $stateParams, $ionicScrollDelegate, $timeout, channelsService, globalsService) {
        var self = this;

        //available services
        this.$scope = $scope;
        this.$state = $state;
        this.$stateParams = $stateParams;
        this.$ionicScrollDelegate = $ionicScrollDelegate;
        this.$timeout = $timeout;
        this.channelsService = channelsService;
        this.globalsService = globalsService;

        if (!this.validate())
            return false;

        //custom properties
        this.buildingKey = globalsService.building.key;
        this.channelKey = this.$stateParams.channelId;
        this.messageRef;

        $scope.user = {
            id: $scope.user.uid,
            pic: 'http://ionicframework.com/img/docs/mcfly.jpg',
            name: globalsService.user.displayName ? globalsService.user.displayName : 'Undefined'
        };

        $scope.channelKey = this.channelKey; //to use in sendMessage
        $scope.toUser;
        $scope.messages = [];
        $scope.inputMessage = '';
        $scope.sendMessage = function(msg) {
            self.doSendMessage(self, msg);
        };

        //UI elements
        this.viewScroll = $ionicScrollDelegate.$getByHandle('userMessageScroll');
        this.footerBar = document.body.querySelector('#userMessagesView .bar-footer');
        this.scroller = document.body.querySelector('#userMessagesView .scroll-content');
        this.txtInput = angular.element(this.footerBar.querySelector('textarea'));

        //events
        $scope.$on("chat-receive-message", this.onReceiveMessage);

        $scope.$on('$ionicView.beforeLeave', function() {
            self.messageRef.off('child_added');
        });

        this.init();
    }

    MessagesController.prototype.validate = function() {
        if (!this.globalsService.user) {
            this.$state.go('login');
            return false;
        }

        if (!this.globalsService.building) {
            this.$state.go('app.buildings');
            return false;
        }

        return true;
    };

    //Check if is a Common Room or Direct Message
    MessagesController.prototype.init = function() {
        var self = this;

        var channelPath = ['buildings', this.buildingKey, 'channels', this.$stateParams.channelId].join('/');
        console.log(channelPath);

        var channelRef = firebase.database().ref(channelPath);
        channelRef.once('value', function(snapshot) {
            self.channel = snapshot.val();

            if (self.channel.type == "direct") { //direct message
                self.setContact(self.channel.user);
            }
            else { //Common room
                self.getLastMessages();
            }
        });
    };

    MessagesController.prototype.setContact = function(uid) {
        var self = this;

        var contactPath = ['users', uid].join('/');
        console.log(contactPath);

        firebase.database().ref(contactPath).once('value', function(snapshot) {
            var contact = snapshot.val();
            self.$scope.toUser = self.toUser = {
                userId: uid,
                userPic: 'http://ionicframework.com/img/docs/venkman.jpg',
                userName: contact && contact.displayName ? contact.displayName : 'Undefined'
            };
			
            self.getLastMessages();
        });
    };

    MessagesController.prototype.getLastMessages = function() {
        var self = this;
        var msgPath = ['buildings', self.buildingKey, 'messages'].join('/');

        self.messageRef = firebase.database().ref(msgPath);
        self.messageRef.orderByChild('channel').equalTo(self.channelKey)
            .limitToLast(100)
            .on('value', function(s) {
                self.$scope.messages = s.val();

                self.$timeout(function() {
                    self.viewScroll.scrollBottom(true);
                }, 10);
            });
    };

    MessagesController.prototype.doSendMessage = function(self, msg) {
        var message = {
            date: new Date().toISOString(),
            channel: self.channelKey,
            text: msg,
            userName: self.$scope.user.name,
            userId: self.$scope.user.id,
            userPic: self.$scope.user.pic
        };

        if (self.toUser)
            message.to = self.toUser.userId;

        var msgPath = ['buildings', self.buildingKey, 'messages'].join('/');
        firebase.database().ref(msgPath).push(message);

        self.$scope.inputMessage = '';

        self.$timeout(function() {
            self.keepKeyboardOpen();
            self.viewScroll.scrollBottom(true);
        }, 0);
    };

    MessagesController.prototype.keepKeyboardOpen = function() {
        var self = this;
        self.txtInput.one('blur', function() {
            console.log('textarea blur, focus back on it');
            self.txtInput[0].focus();
        });
    };

    MessagesController.prototype.onProfilePicError = function(ele) {
        this.ele.src = ''; //fallback
    };
})();





(function () {
    'use strict';

    angular
        .module('app.messages')

        .filter('nl2br', ['$filter', nl2br])

    function nl2br($filter) {
        return function (data) {
            if (!data) return data;
            return data.replace(/\n\r?/g, '<br />');
        };
    }
})();
(function () {
    'use strict';

    messagesService.$inject = ["firebaseService"];
    angular
        .module('app.messages')
        .service('messagesService', messagesService);

    function messagesService(firebaseService) {
        var service = {};
		
        service.getMessagesRef = function () {
            return firebaseService.fb.database().ref('messages');
        };

        service.addMessage = function (message) {
            return firebaseService.fb.database().push(message);
        }

        return service;
    }
})();

(function() {
    'use strict';

    profileController.$inject = ["$scope", "$ionicLoading", "$ionicPopup", "authService", "profilesService"];
    angular.module("app.profiles")

        .controller("profileController", profileController);


    function profileController($scope, $ionicLoading, $ionicPopup, authService, profilesService) {

		var user = authService.user();
		
		$scope.data = {
			displayName : user ? user.displayName : "",
			email : user ? user.email : ""
		};

        $scope.update = function() {
			$ionicLoading.show();

            profilesService.updateProfile($scope.data).then(function success(msg) {
				$ionicLoading.hide();

				$ionicPopup.alert({
                    title: 'ProfileUpdate!',
                    template: msg
                });

            }, function error(error) {
				$ionicLoading.hide();

				$ionicPopup.alert({
                    title: 'Update failed!',
                    template: error.message
                });
            });
        }
    }
})();
(function() {
    'use strict';

    profilesService.$inject = ["$q", "$rootScope", "authService"];
    angular.module("app.profiles")

        .service("profilesService", profilesService);


    function profilesService($q, $rootScope, authService) {
		
        return {
            updateProfile: function(data) {
                var deferred = $q.defer();

                authService.user().updateProfile(data)
                    .then(function success() {
                        deferred.resolve("Profile updated!");
                        $rootScope.$broadcast('user-changed');
                    }, function error(error) {
                        deferred.reject(error);
                    });

                return deferred.promise;
            },
        }
    }
})();
(function () {
    'use strict';

    sidemenuController.$inject = ["$scope", "$state", "channelsService", "authService"];
    angular.module("app.sidemenu")

        .controller("sidemenuController", sidemenuController);


    function sidemenuController($scope, $state, channelsService, authService) {
        $scope.user = authService.user();
        $scope.channels = channelsService.channels;
        $scope.building = {
            name: "Select a building",
            address: "",
        };

        $scope.$on('building-selected', function (event, data) {
            $scope.building.name = data.name;
            $scope.building.address = data.address;

        });

        $scope.openChannel = function (key) {
            $state.go('app.channel', {channelId: key});
        };
    }
})();

(function() {
    'use strict';

    usersService.$inject = ["$q", "authService"];
    angular.module("app.users")

        .service("usersService", usersService);


    function usersService($q, authService) {
	    return {
            updateProfile: function(data) {
                var deferred = $q.defer();

                authService.user().updateProfile(data)
                    .then(function success() {
                        deferred.resolve("Profile updated!");
                        user = firebase.auth().currentUser;
                        $rootScope.$broadcast('user-changed');
                    }, function error(error) {
                        deferred.reject(error);
                    });

                return deferred.promise;
            },
        }
    }
})();
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
            'app.messages',
            'app.directmessages'
        ])

        .run(["$ionicPlatform", "$timeout", "$rootScope", function($ionicPlatform, $timeout, $rootScope) {
            $ionicPlatform.ready(function() {
                if (window.cordova && window.cordova.plugins.Keyboard) {
                    cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

                    cordova.plugins.Keyboard.disableScroll(true);
                }
                if (window.StatusBar) {
                    StatusBar.styleDefault();
                }
				//to get user info
                $rootScope.$emit('user-changed');
            });
        }]);
})();



(function () {
    'use strict';

    angular
        .module('app')
        .service('globalsService', globalsService);

    function globalsService() {
        var service = {
			user : null, //logged user
			building : null //selected building
		};

        return service;
    }
})();

(function () {
    'use strict';

    angular

        .module('app')

        .run(['$rootScope', '$location', 'authService', function ($rootScope, $state, authService) {
            $rootScope.$on('$routeChangeStart', function (event) {

                if (authService.user() == null) {
                    event.preventDefault();
                    $state.go('login');
                }
            });
        }])
})();

(function () {
    'use strict';

    angular

        .module('app')

        .config(["$stateProvider", "$urlRouterProvider", function ($stateProvider, $urlRouterProvider) {
            $stateProvider

                .state('app', {
                    url: '/app',
                    cache: false,
                    abstract: true,
                    templateUrl: 'views/sidemenu.html',
                })

                .state('app.buildings', {
                    url: '/buildings',
                    views: {
                        'menuContent': {
                            templateUrl: 'views/buildings.html'
                        }
                    }
                })

                .state('app.building', {
                    url: '/buildings/:buildingId',
                    views: {
                        'menuContent': {
                            templateUrl: 'views/building.html'
                        }
                    }
                })

                .state('app.channel', {
                    url: '/channel/:channelId',
                    views: {
                        'menuContent': {
                            templateUrl: 'views/messages/chat.html'
                        }
                    }
                })

                .state('app.profile', {
                    url: '/profile',
                    cache: false,
                    views: {
                        'menuContent': {
                            templateUrl: 'views/profile/profile.html'
                        }
                    }
                })

                .state('app.messages', {
                    url: '/messages',
                    cache: false,
                    views: {
                        'menuContent': {
                            templateUrl: 'views/messages/messages.html'
                        }
                    }
                })


                .state('app.logout', {
                    url: "/login",
                    templateProvider: ["authService", "$state", function (authService, $state) {
                        authService.logout();
                        $state.go('login');
                    }]
                })
                .state('login', {
                    url: "/login",
                    templateUrl: "views/auth/login.html"
                });


            //fallback
            $urlRouterProvider.otherwise('/login');

        }]);
})();





//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImF1dGgvYXV0aC5tb2R1bGUuanMiLCJidWlsZGluZ3MvYnVpbGRpbmdzLm1vZHVsZS5qcyIsImNoYW5uZWxzL2NoYW5uZWxzLm1vZHVsZS5qcyIsImRpcmVjdG1lc3NhZ2VzL2RpcmVjdG1lc3NhZ2VzLm1vZHVsZS5qcyIsImZpcmViYXNlL2ZpcmViYXNlLm1vZHVsZS5qcyIsIm1lc3NhZ2VzL21lc3NhZ2VzLm1vZHVsZS5qcyIsInByb2ZpbGUvcHJvZmlsZXMubW9kdWxlLmpzIiwic2lkZW1lbnUvc2lkZW1lbnUubW9kdWxlLmpzIiwidXNlcnMvdXNlcnMubW9kdWxlLmpzIiwiYXV0aC9hdXRoQ29udHJvbGxlci5qcyIsImF1dGgvYXV0aFNlcnZpY2UuanMiLCJidWlsZGluZ3MvYnVpbGRpbmdDb250cm9sbGVyLmpzIiwiYnVpbGRpbmdzL2J1aWxkaW5nc0NvbnRyb2xsZXIuanMiLCJidWlsZGluZ3MvYnVpbGRpbmdzU2VydmljZS5qcyIsImNoYW5uZWxzL2NoYW5uZWxzU2VydmljZS5qcyIsImRpcmVjdG1lc3NhZ2VzL2RpcmVjdE1lc3NhZ2VzQ29udHJvbGxlci5qcyIsImRpcmVjdG1lc3NhZ2VzL2RpcmVjdE1lc3NhZ2VzU2VydmljZS5qcyIsImZpcmViYXNlL2ZpcmViYXNlU2VydmljZS5qcyIsIm1lc3NhZ2VzL21lc3NhZ2VzQ29udHJvbGxlci5qcyIsIm1lc3NhZ2VzL21lc3NhZ2VzRmlsdGVycy5qcyIsIm1lc3NhZ2VzL21lc3NhZ2VzU2VydmljZS5qcyIsInByb2ZpbGUvcHJvZmlsZUNvbnRyb2xsZXIuanMiLCJwcm9maWxlL3Byb2ZpbGVzU2VydmljZS5qcyIsInNpZGVtZW51L3NpZGVtZW51Q29udHJvbGxlci5qcyIsInVzZXJzL3VzZXJzU2VydmljZS5qcyIsImFwcC5tb2R1bGUuanMiLCJhcHAuZ2xvYmFscy5qcyIsImFwcC5yb3V0ZXIuZmlsdGVyLmpzIiwiYXBwLnJvdXRlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxD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T0FBQSxHQUFBO1lBQ0EsT0FBQTs7O1FBR0EsT0FBQTs7OztJQUlBLG1CQUFBLFVBQUEsT0FBQSxXQUFBO1FBQ0EsSUFBQSxPQUFBOztRQUVBLElBQUEsY0FBQSxDQUFBLGFBQUEsS0FBQSxhQUFBLFlBQUEsS0FBQSxhQUFBLFdBQUEsS0FBQTtRQUNBLFFBQUEsSUFBQTs7UUFFQSxJQUFBLGFBQUEsU0FBQSxXQUFBLElBQUE7UUFDQSxXQUFBLEtBQUEsU0FBQSxTQUFBLFVBQUE7WUFDQSxLQUFBLFVBQUEsU0FBQTs7WUFFQSxJQUFBLEtBQUEsUUFBQSxRQUFBLFVBQUE7Z0JBQ0EsS0FBQSxXQUFBLEtBQUEsUUFBQTs7aUJBRUE7Z0JBQ0EsS0FBQTs7Ozs7SUFLQSxtQkFBQSxVQUFBLGFBQUEsU0FBQSxLQUFBO1FBQ0EsSUFBQSxPQUFBOztRQUVBLElBQUEsY0FBQSxDQUFBLFNBQUEsS0FBQSxLQUFBO1FBQ0EsUUFBQSxJQUFBOztRQUVBLFNBQUEsV0FBQSxJQUFBLGFBQUEsS0FBQSxTQUFBLFNBQUEsVUFBQTtZQUNBLElBQUEsVUFBQSxTQUFBO1lBQ0EsS0FBQSxPQUFBLFNBQUEsS0FBQSxTQUFBO2dCQUNBLFFBQUE7Z0JBQ0EsU0FBQTtnQkFDQSxVQUFBLFdBQUEsUUFBQSxjQUFBLFFBQUEsY0FBQTs7O1lBR0EsS0FBQTs7OztJQUlBLG1CQUFBLFVBQUEsa0JBQUEsV0FBQTtRQUNBLElBQUEsT0FBQTtRQUNBLElBQUEsVUFBQSxDQUFBLGFBQUEsS0FBQSxhQUFBLFlBQUEsS0FBQTs7UUFFQSxLQUFBLGFBQUEsU0FBQSxXQUFBLElBQUE7UUFDQSxLQUFBLFdBQUEsYUFBQSxXQUFBLFFBQUEsS0FBQTthQUNBLFlBQUE7YUFDQSxHQUFBLFNBQUEsU0FBQSxHQUFBO2dCQUNBLEtBQUEsT0FBQSxXQUFBLEVBQUE7O2dCQUVBLEtBQUEsU0FBQSxXQUFBO29CQUNBLEtBQUEsV0FBQSxhQUFBO21CQUNBOzs7O0lBSUEsbUJBQUEsVUFBQSxnQkFBQSxTQUFBLE1BQUEsS0FBQTtRQUNBLElBQUEsVUFBQTtZQUNBLE1BQUEsSUFBQSxPQUFBO1lBQ0EsU0FBQSxLQUFBO1lBQ0EsTUFBQTtZQUNBLFVBQUEsS0FBQSxPQUFBLEtBQUE7WUFDQSxRQUFBLEtBQUEsT0FBQSxLQUFBO1lBQ0EsU0FBQSxLQUFBLE9BQUEsS0FBQTs7O1FBR0EsSUFBQSxLQUFBO1lBQ0EsUUFBQSxLQUFBLEtBQUEsT0FBQTs7UUFFQSxJQUFBLFVBQUEsQ0FBQSxhQUFBLEtBQUEsYUFBQSxZQUFBLEtBQUE7UUFDQSxTQUFBLFdBQUEsSUFBQSxTQUFBLEtBQUE7O1FBRUEsS0FBQSxPQUFBLGVBQUE7O1FBRUEsS0FBQSxTQUFBLFdBQUE7WUFDQSxLQUFBO1lBQ0EsS0FBQSxXQUFBLGFBQUE7V0FDQTs7O0lBR0EsbUJBQUEsVUFBQSxtQkFBQSxXQUFBO1FBQ0EsSUFBQSxPQUFBO1FBQ0EsS0FBQSxTQUFBLElBQUEsUUFBQSxXQUFBO1lBQ0EsUUFBQSxJQUFBO1lBQ0EsS0FBQSxTQUFBLEdBQUE7Ozs7SUFJQSxtQkFBQSxVQUFBLG9CQUFBLFNBQUEsS0FBQTtRQUNBLEtBQUEsSUFBQSxNQUFBOzs7Ozs7OztBQ3ZLQSxDQUFBLFlBQUE7SUFDQTs7SUFFQTtTQUNBLE9BQUE7O1NBRUEsT0FBQSxTQUFBLENBQUEsV0FBQTs7SUFFQSxTQUFBLE1BQUEsU0FBQTtRQUNBLE9BQUEsVUFBQSxNQUFBO1lBQ0EsSUFBQSxDQUFBLE1BQUEsT0FBQTtZQUNBLE9BQUEsS0FBQSxRQUFBLFVBQUE7Ozs7QUNYQSxDQUFBLFlBQUE7SUFDQTs7O0lBRUE7U0FDQSxPQUFBO1NBQ0EsUUFBQSxtQkFBQTs7SUFFQSxTQUFBLGdCQUFBLGlCQUFBO1FBQ0EsSUFBQSxVQUFBOztRQUVBLFFBQUEsaUJBQUEsWUFBQTtZQUNBLE9BQUEsZ0JBQUEsR0FBQSxXQUFBLElBQUE7OztRQUdBLFFBQUEsYUFBQSxVQUFBLFNBQUE7WUFDQSxPQUFBLGdCQUFBLEdBQUEsV0FBQSxLQUFBOzs7UUFHQSxPQUFBOzs7O0FDbEJBLENBQUEsV0FBQTtJQUNBOzs7SUFFQSxRQUFBLE9BQUE7O1NBRUEs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QTtvQkFDQSxNQUFBO29CQUNBLE9BQUEsR0FBQTs7Ozs7O0FDWkEsQ0FBQSxZQUFBO0lBQ0E7O0lBRUE7O1NBRUEsT0FBQTs7U0FFQSxnREFBQSxVQUFBLGdCQUFBLG9CQUFBO1lBQ0E7O2lCQUVBLE1BQUEsT0FBQTtvQkFDQSxLQUFBO29CQUNBLE9BQUE7b0JBQ0EsVUFBQTtvQkFDQSxhQUFBOzs7aUJBR0EsTUFBQSxpQkFBQTtvQkFDQSxLQUFBO29CQUNBLE9BQUE7d0JBQ0EsZUFBQTs0QkFDQSxhQUFBOzs7OztpQkFLQSxNQUFBLGdCQUFBO29CQUNBLEtBQUE7b0JBQ0EsT0FBQTt3QkFDQSxlQUFBOzRCQUNBLGFBQUE7Ozs7O2lCQUtBLE1BQUEsZUFBQTtvQkFDQSxLQUFBO29CQUNBLE9BQUE7d0JBQ0EsZUFBQTs0QkFDQSxhQUFBOzs7OztpQkFLQSxNQUFBLGVBQUE7b0JBQ0EsS0FBQTtvQkFDQSxPQUFBO29CQUNBLE9BQUE7d0JBQ0EsZUFBQTs0QkFDQSxhQUFBOzs7OztpQkFLQSxNQUFBLGdCQUFBO29CQUNBLEtBQUE7b0JBQ0EsT0FBQTtvQkFDQSxPQUFBO3dCQUNBLGVBQUE7NEJBQ0EsYUFBQTs7Ozs7O2lCQU1BLE1BQUEsY0FBQTtvQkFDQSxLQUFBO29CQUNBLDRDQUFBLFVBQUEsYUFBQSxRQUFBO3dCQUNBLFlBQUE7d0JBQ0EsT0FBQSxHQUFBOzs7aUJBR0EsTUFBQSxTQUFBO29CQUNBLEtBQUE7b0JBQ0EsYUFBQTs7Ozs7WUFLQSxtQkFBQSxVQUFBOzs7Ozs7OztBQVFBIiwiZmlsZSI6ImFwcC5idW5kbGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGFuZ3VsYXIubW9kdWxlKFwiYXBwLmF1dGhcIiwgW10pO1xufSkoKTsiLCIoZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGFuZ3VsYXIubW9kdWxlKFwiYXBwLmJ1aWxkaW5nc1wiLCBbJ2FwcC5maXJlYmFzZSddKTtcbn0pKCk7IiwiKGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBhbmd1bGFyLm1vZHVsZShcImFwcC5jaGFubmVsc1wiLCBbXSk7XG59KSgpOyIsIihmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgYW5ndWxhclxuICAgICAgICAubW9kdWxlKCdhcHAuZGlyZWN0bWVzc2FnZXMnLCBbXSk7XG59KSgpO1xuXG5cblxuXG4iLCIoZnVuY3Rpb24oKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgYW5ndWxhclxuICAgICAgICAubW9kdWxlKCdhcHAuZmlyZWJhc2UnLCBbXSk7XG59KSgpO1xuXG5cblxuXG4iLCIoZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGFuZ3VsYXJcbiAgICAgICAgLm1vZHVsZSgnbW9ub3NwYWNlZC5lbGFzdGljJywgW10pXG4gICAgICAgIC5jb25zdGFudCgnbXNkRWxhc3RpY0NvbmZpZycsIHtcbiAgICAgICAgICAgIGFwcGVuZDogJydcbiAgICAgICAgfSlcbiAgICAgICAgLmRpcmVjdGl2ZSgnbXNkRWxhc3RpYycsIFtcbiAgICAgICAgICAgICckdGltZW91dCcsICckd2luZG93JywgJ21zZEVsYXN0aWNDb25maWcnLFxuICAgICAgICAgICAgZnVuY3Rpb24gKCR0aW1lb3V0LCAkd2luZG93LCBjb25maWcpIHtcbiAgICAgICAgICAgICAgICAndXNlIHN0cmljdCc7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICByZXF1aXJlOiAnbmdNb2RlbCcsXG4gICAgICAgICAgICAgICAgICAgIHJlc3RyaWN0OiAnQSwgQycsXG4gICAgICAgICAgICAgICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCwgYXR0cnMsIG5nTW9kZWwpIHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gY2FjaGUgYSByZWZlcmVuY2UgdG8gdGhlIERPTSBlbGVtZW50XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdGEgPSBlbGVtZW50WzBdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR0YSA9IGVsZW1lbnQ7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGVuc3VyZSB0aGUgZWxlbWVudCBpcyBhIHRleHRhcmVhLCBhbmQgYnJvd3NlciBpcyBjYXBhYmxlXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGEubm9kZU5hbWUgIT09ICdURVhUQVJFQScgfHwgISR3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gc2V0IHRoZXNlIHByb3BlcnRpZXMgYmVmb3JlIG1lYXN1cmluZyBkaW1lbnNpb25zXG4gICAgICAgICAgICAgICAgICAgICAgICAkdGEuY3NzKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnb3ZlcmZsb3cnOiAnaGlkZGVuJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnb3ZlcmZsb3cteSc6ICdoaWRkZW4nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICd3b3JkLXdyYXAnOiAnYnJlYWstd29yZCdcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBmb3JjZSB0ZXh0IHJlZmxvd1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRleHQgPSB0YS52YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhLnZhbHVlID0gJyc7XG4gICAgICAgICAgICAgICAgICAgICAgICB0YS52YWx1ZSA9IHRleHQ7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhcHBlbmQgPSBhdHRycy5tc2RFbGFzdGljID8gYXR0cnMubXNkRWxhc3RpYy5yZXBsYWNlKC9cXFxcbi9nLCAnXFxuJykgOiBjb25maWcuYXBwZW5kLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR3aW4gPSBhbmd1bGFyLmVsZW1lbnQoJHdpbmRvdyksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWlycm9ySW5pdFN0eWxlID0gJ3Bvc2l0aW9uOiBhYnNvbHV0ZTsgdG9wOiAtOTk5cHg7IHJpZ2h0OiBhdXRvOyBib3R0b206IGF1dG87JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdsZWZ0OiAwOyBvdmVyZmxvdzogaGlkZGVuOyAtd2Via2l0LWJveC1zaXppbmc6IGNvbnRlbnQtYm94OycgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnLW1vei1ib3gtc2l6aW5nOiBjb250ZW50LWJveDsgYm94LXNpemluZzogY29udGVudC1ib3g7JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdtaW4taGVpZ2h0OiAwICFpbXBvcnRhbnQ7IGhlaWdodDogMCAhaW1wb3J0YW50OyBwYWRkaW5nOiAwOycgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnd29yZC13cmFwOiBicmVhay13b3JkOyBib3JkZXI6IDA7JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkbWlycm9yID0gYW5ndWxhci5lbGVtZW50KCc8dGV4dGFyZWEgYXJpYS1oaWRkZW49XCJ0cnVlXCIgdGFiaW5kZXg9XCItMVwiICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnc3R5bGU9XCInICsgbWlycm9ySW5pdFN0eWxlICsgJ1wiLz4nKS5kYXRhKCdlbGFzdGljJywgdHJ1ZSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWlycm9yID0gJG1pcnJvclswXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YVN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZSh0YSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzaXplID0gdGFTdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKCdyZXNpemUnKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBib3JkZXJCb3ggPSB0YVN0eWxlLmdldFByb3BlcnR5VmFsdWUoJ2JveC1zaXppbmcnKSA9PT0gJ2JvcmRlci1ib3gnIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhU3R5bGUuZ2V0UHJvcGVydHlWYWx1ZSgnLW1vei1ib3gtc2l6aW5nJykgPT09ICdib3JkZXItYm94JyB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YVN0eWxlLmdldFByb3BlcnR5VmFsdWUoJy13ZWJraXQtYm94LXNpemluZycpID09PSAnYm9yZGVyLWJveCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYm94T3V0ZXIgPSAhYm9yZGVyQm94ID8ge3dpZHRoOiAwLCBoZWlnaHQ6IDB9IDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogcGFyc2VJbnQodGFTdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKCdib3JkZXItcmlnaHQtd2lkdGgnKSwgMTApICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyc2VJbnQodGFTdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKCdwYWRkaW5nLXJpZ2h0JyksIDEwKSArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcnNlSW50KHRhU3R5bGUuZ2V0UHJvcGVydHlWYWx1ZSgncGFkZGluZy1sZWZ0JyksIDEwKSArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcnNlSW50KHRhU3R5bGUuZ2V0UHJvcGVydHlWYWx1ZSgnYm9yZGVyLWxlZnQtd2lkdGgnKSwgMTApLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IHBhcnNlSW50KHRhU3R5bGUuZ2V0UHJvcGVydHlWYWx1ZSgnYm9yZGVyLXRvcC13aWR0aCcpLCAxMCkgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJzZUludCh0YVN0eWxlLmdldFByb3BlcnR5VmFsdWUoJ3BhZGRpbmctdG9wJyksIDEwKSArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcnNlSW50KHRhU3R5bGUuZ2V0UHJvcGVydHlWYWx1ZSgncGFkZGluZy1ib3R0b20nKSwgMTApICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyc2VJbnQodGFTdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKCdib3JkZXItYm90dG9tLXdpZHRoJyksIDEwKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWluSGVpZ2h0VmFsdWUgPSBwYXJzZUludCh0YVN0eWxlLmdldFByb3BlcnR5VmFsdWUoJ21pbi1oZWlnaHQnKSwgMTApLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodFZhbHVlID0gcGFyc2VJbnQodGFTdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKCdoZWlnaHQnKSwgMTApLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1pbkhlaWdodCA9IE1hdGgubWF4KG1pbkhlaWdodFZhbHVlLCBoZWlnaHRWYWx1ZSkgLSBib3hPdXRlci5oZWlnaHQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF4SGVpZ2h0ID0gcGFyc2VJbnQodGFTdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKCdtYXgtaGVpZ2h0JyksIDEwKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaXJyb3JlZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3RpdmUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29weVN0eWxlID0gWydmb250LWZhbWlseScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdmb250LXNpemUnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnZm9udC13ZWlnaHQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnZm9udC1zdHlsZScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdsZXR0ZXItc3BhY2luZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdsaW5lLWhlaWdodCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICd0ZXh0LXRyYW5zZm9ybScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICd3b3JkLXNwYWNpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAndGV4dC1pbmRlbnQnXTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZXhpdCBpZiBlbGFzdGljIGFscmVhZHkgYXBwbGllZCAob3IgaXMgdGhlIG1pcnJvciBlbGVtZW50KVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCR0YS5kYXRhKCdlbGFzdGljJykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIE9wZXJhIHJldHVybnMgbWF4LWhlaWdodCBvZiAtMSBpZiBub3Qgc2V0XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXhIZWlnaHQgPSBtYXhIZWlnaHQgJiYgbWF4SGVpZ2h0ID4gMCA/IG1heEhlaWdodCA6IDllNDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gYXBwZW5kIG1pcnJvciB0byB0aGUgRE9NXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobWlycm9yLnBhcmVudE5vZGUgIT09IGRvY3VtZW50LmJvZHkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbmd1bGFyLmVsZW1lbnQoZG9jdW1lbnQuYm9keSkuYXBwZW5kKG1pcnJvcik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHNldCByZXNpemUgYW5kIGFwcGx5IGVsYXN0aWNcbiAgICAgICAgICAgICAgICAgICAgICAgICR0YS5jc3Moe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdyZXNpemUnOiAocmVzaXplID09PSAnbm9uZScgfHwgcmVzaXplID09PSAndmVydGljYWwnKSA/ICdub25lJyA6ICdob3Jpem9udGFsJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSkuZGF0YSgnZWxhc3RpYycsIHRydWUpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvKlxuICAgICAgICAgICAgICAgICAgICAgICAgICogbWV0aG9kc1xuICAgICAgICAgICAgICAgICAgICAgICAgICovXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGluaXRNaXJyb3IoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG1pcnJvclN0eWxlID0gbWlycm9ySW5pdFN0eWxlO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWlycm9yZWQgPSB0YTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBjb3B5IHRoZSBlc3NlbnRpYWwgc3R5bGVzIGZyb20gdGhlIHRleHRhcmVhIHRvIHRoZSBtaXJyb3JcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YVN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZSh0YSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYW5ndWxhci5mb3JFYWNoKGNvcHlTdHlsZSwgZnVuY3Rpb24gKHZhbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaXJyb3JTdHlsZSArPSB2YWwgKyAnOicgKyB0YVN0eWxlLmdldFByb3BlcnR5VmFsdWUodmFsKSArICc7JztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaXJyb3Iuc2V0QXR0cmlidXRlKCdzdHlsZScsIG1pcnJvclN0eWxlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gYWRqdXN0KCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0YUhlaWdodCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFDb21wdXRlZFN0eWxlV2lkdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1pcnJvckhlaWdodCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG92ZXJmbG93O1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1pcnJvcmVkICE9PSB0YSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbml0TWlycm9yKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gYWN0aXZlIGZsYWcgcHJldmVudHMgYWN0aW9ucyBpbiBmdW5jdGlvbiBmcm9tIGNhbGxpbmcgYWRqdXN0IGFnYWluXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFhY3RpdmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0aXZlID0gdHJ1ZTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaXJyb3IudmFsdWUgPSB0YS52YWx1ZSArIGFwcGVuZDsgLy8gb3B0aW9uYWwgd2hpdGVzcGFjZSB0byBpbXByb3ZlIGFuaW1hdGlvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaXJyb3Iuc3R5bGUub3ZlcmZsb3dZID0gdGEuc3R5bGUub3ZlcmZsb3dZO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhSGVpZ2h0ID0gdGEuc3R5bGUuaGVpZ2h0ID09PSAnJyA/ICdhdXRvJyA6IHBhcnNlSW50KHRhLnN0eWxlLmhlaWdodCwgMTApO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhQ29tcHV0ZWRTdHlsZVdpZHRoID0gZ2V0Q29tcHV0ZWRTdHlsZSh0YSkuZ2V0UHJvcGVydHlWYWx1ZSgnd2lkdGgnKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBlbnN1cmUgZ2V0Q29tcHV0ZWRTdHlsZSBoYXMgcmV0dXJuZWQgYSByZWFkYWJsZSAndXNlZCB2YWx1ZScgcGl4ZWwgd2lkdGhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRhQ29tcHV0ZWRTdHlsZVdpZHRoLnN1YnN0cih0YUNvbXB1dGVkU3R5bGVXaWR0aC5sZW5ndGggLSAyLCAyKSA9PT0gJ3B4Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gdXBkYXRlIG1pcnJvciB3aWR0aCBpbiBjYXNlIHRoZSB0ZXh0YXJlYSB3aWR0aCBoYXMgY2hhbmdlZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGggPSBwYXJzZUludCh0YUNvbXB1dGVkU3R5bGVXaWR0aCwgMTApIC0gYm94T3V0ZXIud2lkdGg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaXJyb3Iuc3R5bGUud2lkdGggPSB3aWR0aCArICdweCc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaXJyb3JIZWlnaHQgPSBtaXJyb3Iuc2Nyb2xsSGVpZ2h0O1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtaXJyb3JIZWlnaHQgPiBtYXhIZWlnaHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1pcnJvckhlaWdodCA9IG1heEhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG92ZXJmbG93ID0gJ3Njcm9sbCc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobWlycm9ySGVpZ2h0IDwgbWluSGVpZ2h0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaXJyb3JIZWlnaHQgPSBtaW5IZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWlycm9ySGVpZ2h0ICs9IGJveE91dGVyLmhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGEuc3R5bGUub3ZlcmZsb3dZID0gb3ZlcmZsb3cgfHwgJ2hpZGRlbic7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRhSGVpZ2h0ICE9PSBtaXJyb3JIZWlnaHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjb3BlLiRlbWl0KCdlbGFzdGljOnJlc2l6ZScsICR0YSwgdGFIZWlnaHQsIG1pcnJvckhlaWdodCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YS5zdHlsZS5oZWlnaHQgPSBtaXJyb3JIZWlnaHQgKyAncHgnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gc21hbGwgZGVsYXkgdG8gcHJldmVudCBhbiBpbmZpbml0ZSBsb29wXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGl2ZSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCAxLCBmYWxzZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGZvcmNlQWRqdXN0KCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGl2ZSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFkanVzdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAvKlxuICAgICAgICAgICAgICAgICAgICAgICAgICogaW5pdGlhbGlzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICovXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGxpc3RlblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCdvbnByb3BlcnR5Y2hhbmdlJyBpbiB0YSAmJiAnb25pbnB1dCcgaW4gdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJRTlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YVsnb25pbnB1dCddID0gdGEub25rZXl1cCA9IGFkanVzdDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFbJ29uaW5wdXQnXSA9IGFkanVzdDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgJHdpbi5iaW5kKCdyZXNpemUnLCBmb3JjZUFkanVzdCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHNjb3BlLiR3YXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5nTW9kZWwuJG1vZGVsVmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiAobmV3VmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3JjZUFkanVzdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHNjb3BlLiRvbignZWxhc3RpYzphZGp1c3QnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5pdE1pcnJvcigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvcmNlQWRqdXN0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgJHRpbWVvdXQoYWRqdXN0LCAwLCBmYWxzZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8qXG4gICAgICAgICAgICAgICAgICAgICAgICAgKiBkZXN0cm95XG4gICAgICAgICAgICAgICAgICAgICAgICAgKi9cblxuICAgICAgICAgICAgICAgICAgICAgICAgc2NvcGUuJG9uKCckZGVzdHJveScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkbWlycm9yLnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR3aW4udW5iaW5kKCdyZXNpemUnLCBmb3JjZUFkanVzdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIF0pO1xuXG4gICAgYW5ndWxhclxuICAgICAgICAubW9kdWxlKCdhcHAubWVzc2FnZXMnLCBbJ21vbm9zcGFjZWQuZWxhc3RpYyddKTtcbn0pKCk7XG5cblxuXG5cbiIsIihmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgYW5ndWxhci5tb2R1bGUoXCJhcHAucHJvZmlsZXNcIiwgWydhcHAuYXV0aCddKTtcbn0pKCk7IiwiKGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBhbmd1bGFyLm1vZHVsZShcImFwcC5zaWRlbWVudVwiLCBbXSk7XG59KSgpOyIsIihmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgYW5ndWxhci5tb2R1bGUoXCJhcHAudXNlcnNcIiwgWydhcHAuYXV0aCddKTtcbn0pKCk7IiwiKGZ1bmN0aW9uKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGFuZ3VsYXIubW9kdWxlKFwiYXBwLmF1dGhcIilcblxuICAgICAgICAuY29udHJvbGxlcihcImF1dGhDb250cm9sbGVyXCIsIGF1dGhDb250cm9sbGVyKTtcblxuXG4gICAgZnVuY3Rpb24gYXV0aENvbnRyb2xsZXIoJHNjb3BlLCBhdXRoU2VydmljZSwgJGlvbmljUG9wdXAsICRpb25pY0xvYWRpbmcsICRzdGF0ZSwgJHRpbWVvdXQpIHtcblxuICAgICAgICAkc2NvcGUuZGF0YSA9IHt9O1xuXG4gICAgICAgICRzY29wZS5sb2dpbiA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0JGlvbmljTG9hZGluZy5zaG93KCk7XG5cblx0XHRcdGF1dGhTZXJ2aWNlLmxvZ2luKCRzY29wZS5kYXRhLnVzZXJuYW1lLCAkc2NvcGUuZGF0YS5wYXNzd29yZCkuc3VjY2VzcyhmdW5jdGlvbih1c2VyKSB7XG5cdFx0XHRcdCRpb25pY0xvYWRpbmcuaGlkZSgpO1xuXHRcdFx0XHQkc3RhdGUuZ28oJ2FwcC5idWlsZGluZ3MnKTtcblxuICAgICAgICAgICAgfSkuZXJyb3IoZnVuY3Rpb24oZXJyb3IpIHtcblx0XHRcdFx0JHRpbWVvdXQoZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0JGlvbmljTG9hZGluZy5oaWRlKCk7XG5cdFx0XHRcdH0sIDEwMCk7XG5cbiAgICAgICAgICAgICAgICB2YXIgYWxlcnRQb3B1cCA9ICRpb25pY1BvcHVwLmFsZXJ0KHtcbiAgICAgICAgICAgICAgICAgICAgdGl0bGU6ICdMb2dpbiBmYWlsZWQhJyxcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGU6IGVycm9yLm1lc3NhZ2UgLy8nUGxlYXNlIGNoZWNrIHlvdXIgY3JlZGVudGlhbHMhJ1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuXHRcdCRzY29wZS5mYWNlYm9va0xvZ2luID0gZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgYWxlcnRQb3B1cCA9ICRpb25pY1BvcHVwLmFsZXJ0KHtcblx0XHRcdFx0dGl0bGU6ICdGYWNlYm9vayBsb2dpbicsXG5cdFx0XHRcdHRlbXBsYXRlOiAnUGxhbm5lZCEnXG5cdFx0XHR9KTtcbiAgICAgICAgfVxuICAgIH1cbn0pKCk7IiwiKGZ1bmN0aW9uKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGFuZ3VsYXIubW9kdWxlKFwiYXBwLmF1dGhcIilcblxuICAgICAgICAuc2VydmljZShcImF1dGhTZXJ2aWNlXCIsIGF1dGhTZXJ2aWNlKTtcblxuXHRmdW5jdGlvbiBjcmVhdGVVc2VyKHVzZXJuYW1lLCBwYXNzd29yZCkge1xuXHRcdHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG5cdFx0dmFyIGF1dGggPSBmaXJlYmFzZVNlcnZpY2UuZmIuYXV0aCgpO1xuXG5cdFx0cmV0dXJuIGF1dGguY3JlYXRlVXNlcldpdGhFbWFpbEFuZFBhc3N3b3JkKGVtYWlsLCBwYXNzd29yZCk7XG5cdH1cblx0XG4gICAgZnVuY3Rpb24gYXV0aFNlcnZpY2UoJHEsICRyb290U2NvcGUsIGJ1aWxkaW5nc1NlcnZpY2UsIGdsb2JhbHNTZXJ2aWNlKSB7XG5cdFx0dmFyIGF1dGggPSBmaXJlYmFzZS5hdXRoKCk7XG5cdFx0XG5cdFx0JHJvb3RTY29wZS4kb24oJ3VzZXItY2hhbmdlZCcsIGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIHVzciA9IGZpcmViYXNlLmF1dGgoKS5jdXJyZW50VXNlcjtcblx0XHRcdGlmICh1c3IgPT0gbnVsbCkge1xuXHRcdFx0XHRnbG9iYWxzU2VydmljZS51c2VyID0gbnVsbDtcblx0XHRcdFx0cmV0dXJuXG5cdFx0XHR9O1xuXHRcdFx0XG5cdFx0XHRnbG9iYWxzU2VydmljZS51c2VyID0gdXNyO1xuXHRcdFx0XG5cdFx0XHR2YXIgcmVmID0gZmlyZWJhc2UuZGF0YWJhc2UoKS5yZWYoJ3VzZXJzLycgKyB1c3IudWlkKTtcblx0XHRcdHJlZi5jaGlsZCgnbmFtZScpLnNldCh1c3IuZGlzcGxheU5hbWUpO1xuXHRcdFx0cmVmLmNoaWxkKCdlbWFpbCcpLnNldCh1c3IuZW1haWwpO1xuXHRcdFx0cmVmLmNoaWxkKCdsYXN0QWN0aXZpdHknKS5zZXQobmV3IERhdGUoKS5nZXRUaW1lKCkpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIHtcbiAgICAgICAgICAgIGxvZ2luOiBmdW5jdGlvbih1c2VybmFtZSwgcGFzc3dvcmQpIHtcbiAgICAgICAgICAgICAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuICAgICAgICAgICAgICAgIHZhciBwcm9taXNlID0gZGVmZXJyZWQucHJvbWlzZTtcblxuXHRcdFx0XHR2YXIgc3VjY2Vzc0hhbmRsZXIgPSBmdW5jdGlvbihpbmZvKSB7XG5cdFx0XHRcdFx0aW5mby5pc05ldyA9IGluZm8uZGlzcGxheU5hbWUgPT0gbnVsbDtcblx0XHRcdFx0XHRkZWZlcnJlZC5yZXNvbHZlKGluZm8pO1xuXHRcdFx0XHRcdFx0XHRcdFx0XG5cdFx0XHRcdFx0JHJvb3RTY29wZS4kZW1pdCgndXNlci1jaGFuZ2VkJyk7XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0dmFyIGVycm9ySGFuZGxlciA9IGZ1bmN0aW9uKGVycm9yKSB7XG5cdFx0XHRcdFx0ZGVmZXJyZWQucmVqZWN0KGVycm9yKTtcblx0XHRcdFx0fTtcblxuXHRcdFx0XHRhdXRoLnNpZ25JbldpdGhFbWFpbEFuZFBhc3N3b3JkKHVzZXJuYW1lLCBwYXNzd29yZClcblx0XHRcdFx0XHQudGhlbihzdWNjZXNzSGFuZGxlciwgZnVuY3Rpb24gZXJyb3IoZXJyb3IpIHtcblx0XHRcdFx0XHRcdGlmIChlcnJvci5jb2RlID09IFwiYXV0aC91c2VyLW5vdC1mb3VuZFwiKSB7XG5cdFx0XHRcdFx0XHRcdGF1dGguY3JlYXRlVXNlcldpdGhFbWFpbEFuZFBhc3N3b3JkKHVzZXJuYW1lLCBwYXNzd29yZClcblx0XHRcdFx0XHRcdFx0XHQudGhlbihzdWNjZXNzSGFuZGxlciwgZXJyb3JIYW5kbGVyKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRlcnJvckhhbmRsZXIoZXJyb3IpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0pO1xuXG4gICAgICAgICAgICAgICAgcHJvbWlzZS5zdWNjZXNzID0gZnVuY3Rpb24oZm4pIHtcbiAgICAgICAgICAgICAgICAgICAgcHJvbWlzZS50aGVuKGZuKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHByb21pc2UuZXJyb3IgPSBmdW5jdGlvbihmbikge1xuICAgICAgICAgICAgICAgICAgICBwcm9taXNlLnRoZW4obnVsbCwgZm4pO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgICAgICAgICB9LFxuXG5cdFx0XHRsb2dvdXQ6IGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0YXV0aC5zaWduT3V0KCk7XG5cdFx0XHRcdGdsb2JhbHNTZXJ2aWNlLnVzZXIgPSBudWxsO1xuXHRcdFx0fSxcblxuICAgICAgICAgICAgdXNlcjogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHJldHVybiBmaXJlYmFzZS5hdXRoKCkuY3VycmVudFVzZXI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59KSgpO1xuIiwiKGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBhbmd1bGFyLm1vZHVsZShcImFwcC5idWlsZGluZ3NcIilcblxuICAgICAgICAuY29udHJvbGxlcihcImJ1aWxkaW5nQ29udHJvbGxlclwiLCBidWlsZGluZ0NvbnRyb2xsZXIpO1xuXG5cbiAgICBmdW5jdGlvbiBidWlsZGluZ0NvbnRyb2xsZXIoJHNjb3BlLCAkaW9uaWNMb2FkaW5nLCAkc3RhdGVQYXJhbXMsIGNoYW5uZWxzU2VydmljZSkge1xuXG4gICAgICAgIHZhciByZWYgPSBjaGFubmVsc1NlcnZpY2UuZ2V0Q2hhbm5lbHNGcm9tKCRzdGF0ZVBhcmFtcy5idWlsZGluZ0lkKTtcblxuICAgICAgICAkaW9uaWNMb2FkaW5nLnNob3coKTtcbiAgICAgICAgcmVmLm9uKFwidmFsdWVcIiwgZnVuY3Rpb24gKHNuYXBzaG90KSB7XG4gICAgICAgICAgICB2YXIgdmFsID0gc25hcHNob3QudmFsKCk7XG5cbiAgICAgICAgICAgIGlmICh2YWwpIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUuY2hhbm5lbHMgPSB2YWwuY2hhbm5lbHM7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcblxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgJGlvbmljTG9hZGluZy5oaWRlKCk7XG5cbiAgICAgICAgfSwgZnVuY3Rpb24gKGVycm9yT2JqZWN0KSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcImVycm9yIHJlYWRpbmc6IFwiICsgZXJyb3JPYmplY3QuY29kZSk7XG4gICAgICAgICAgICB2YXIgYWxlcnRQb3B1cCA9ICRpb25pY1BvcHVwLmFsZXJ0KHtcbiAgICAgICAgICAgICAgICB0aXRsZTogJ09wcyEnLFxuICAgICAgICAgICAgICAgIHRlbXBsYXRlOiAnU29ycnkhIEFuIGVycm9yIG9jdXJyZWQuJ1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAkaW9uaWNMb2FkaW5nLmhpZGUoKTtcbiAgICAgICAgfSk7XG5cbiAgICB9XG59KSgpOyIsIihmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgYW5ndWxhci5tb2R1bGUoXCJhcHAuYnVpbGRpbmdzXCIpXG5cbiAgICAgICAgLmNvbnRyb2xsZXIoXCJidWlsZGluZ3NDb250cm9sbGVyXCIsIGJ1aWxkaW5nc0NvbnRyb2xsZXIpO1xuXG5cbiAgICBmdW5jdGlvbiBidWlsZGluZ3NDb250cm9sbGVyKCRzY29wZSwgJGlvbmljTG9hZGluZywgYnVpbGRpbmdzU2VydmljZSwgZ2xvYmFsc1NlcnZpY2UpIHtcbiAgICAgICAgdmFyIHJlZiA9IGJ1aWxkaW5nc1NlcnZpY2UuZ2V0QnVpbGRpbmdzKCk7XG5cdFx0XG5cdFx0JHNjb3BlLnNlbGVjdGVkS2V5ID0gZ2xvYmFsc1NlcnZpY2UuYnVpbGRpbmcgPyBnbG9iYWxzU2VydmljZS5idWlsZGluZy5rZXkgOiBudWxsO1xuXHRcdFxuXHRcdCRzY29wZS5zZWxlY3QgPSBmdW5jdGlvbihrZXksIGJ1aWxkaW5nKSB7XG5cdFx0XHQkc2NvcGUuc2VsZWN0ZWRLZXkgPSBidWlsZGluZy5rZXkgPSBrZXk7XG5cdFx0XHRnbG9iYWxzU2VydmljZS5idWlsZGluZyA9IGJ1aWxkaW5nO1xuXHRcdFx0JHNjb3BlLiRlbWl0KFwiYnVpbGRpbmctc2VsZWN0ZWRcIiwgYnVpbGRpbmcpO1xuXHRcdH07XHRcdFxuXG4gICAgICAgICRpb25pY0xvYWRpbmcuc2hvdygpO1xuICAgICAgICByZWYub24oXCJ2YWx1ZVwiLCBmdW5jdGlvbiAoc25hcHNob3QpIHtcbiAgICAgICAgICAgICRzY29wZS5idWlsZGluZ3MgPSBzbmFwc2hvdC52YWwoKTtcbiAgICAgICAgICAgICRpb25pY0xvYWRpbmcuaGlkZSgpO1xuICAgICAgICB9LCBmdW5jdGlvbiAoZXJyb3JPYmplY3QpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiZXJyb3IgcmVhZGluZzogXCIgKyBlcnJvck9iamVjdC5jb2RlKTtcbiAgICAgICAgICAgIHZhciBhbGVydFBvcHVwID0gJGlvbmljUG9wdXAuYWxlcnQoe1xuICAgICAgICAgICAgICAgIHRpdGxlOiAnT3BzIScsXG4gICAgICAgICAgICAgICAgdGVtcGxhdGU6ICdTb3JyeSEgQW4gZXJyb3Igb2N1cnJlZCdcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgJGlvbmljTG9hZGluZy5oaWRlKCk7XG4gICAgICAgIH0pO1xuICAgIH1cbn0pKCk7IiwiKGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBhbmd1bGFyXG4gICAgICAgIC5tb2R1bGUoJ2FwcC5idWlsZGluZ3MnKVxuICAgICAgICAuc2VydmljZSgnYnVpbGRpbmdzU2VydmljZScsIGJ1aWxkaW5nc1NlcnZpY2UpO1xuXG4gICAgZnVuY3Rpb24gYnVpbGRpbmdzU2VydmljZShmaXJlYmFzZVNlcnZpY2UsICRyb290U2NvcGUpIHtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZ2V0QnVpbGRpbmdzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZpcmViYXNlLmRhdGFiYXNlKCkucmVmKCdidWlsZGluZ3MnKVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufSkoKTtcbiIsIihmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgYW5ndWxhclxuICAgICAgICAubW9kdWxlKCdhcHAuY2hhbm5lbHMnKVxuICAgICAgICAuc2VydmljZSgnY2hhbm5lbHNTZXJ2aWNlJywgY2hhbm5lbHNTZXJ2aWNlKTtcblxuICAgIGZ1bmN0aW9uIGNoYW5uZWxzU2VydmljZSgkcm9vdFNjb3BlKSB7XG5cdFx0dmFyIHNlcnZpY2UgPSB7fTtcblx0XHRcblx0XHRzZXJ2aWNlLmNoYW5uZWxzID0ge1xuXHRcdFx0XCJsYW5kbG9yZFwiOiBcIlRhbGsgdG8gbGFuZGxvcmRcIixcblx0XHRcdFwiZ2VuZXJhbFwiOiBcIkdlbmVyYWxcIixcblx0XHRcdFwicGFya2luZ1wiOiBcIlBhcmtpbmcgR2FyYWdlXCIsXG5cdFx0XHRcImdhcmRlblwiOiBcIkdhcmRlblwiLFxuXHRcdFx0XCJsb3N0Zm91bmRcIjogXCJMb3N0ICYgRm91bmRcIixcblx0XHRcdFwibWFpbnRlbmFuY2VcIjogXCJSZXF1ZXN0IE1haW50ZW5hbmNlXCJcblx0XHR9O1xuXHRcdFxuXHRcdCRyb290U2NvcGUuJG9uKFwiYnVpbGRpbmctc2VsZWN0ZWRcIiwgZnVuY3Rpb24oYnVpbGRpbmcpIHtcblx0XHRcdC8vY291bnQgaG93IG1hbnkgbmV3IG1lc3NhZ2VzIGVhY2ggY2hhbm5lbCBoYXNcblx0XHR9KTtcblx0XHRcblx0XHRzZXJ2aWNlLmdldENoYW5uZWxzRnJvbSA9IGZ1bmN0aW9uIChidWlsZGluZykge1xuXHRcdFx0cmV0dXJuIGZpcmViYXNlLmRhdGFiYXNlKCkucmVmKCdidWlsZGluZ3MvJyArIGJ1aWxkaW5nICsgXCIvY2hhbm5lbHNcIik7XG5cdFx0fTtcblxuICAgICAgICByZXR1cm4gc2VydmljZTtcbiAgICB9XG59KSgpO1xuXG4iLCIoZnVuY3Rpb24oKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgYW5ndWxhclxuICAgICAgICAubW9kdWxlKCdhcHAuZGlyZWN0bWVzc2FnZXMnKVxuICAgICAgICAuY29udHJvbGxlcignZGlyZWN0TWVzc2FnZXNDb250cm9sbGVyJywgW1xuICAgICAgICAgICAgJyRzY29wZScsXG5cdFx0XHQnJHN0YXRlJyxcbiAgICAgICAgICAgICckaW9uaWNMb2FkaW5nJyxcbiAgICAgICAgICAgICdkaXJlY3RNZXNzYWdlc1NlcnZpY2UnLFxuICAgICAgICAgICAgJ2dsb2JhbHNTZXJ2aWNlJyxcbiAgICAgICAgICAgIGRpcmVjdE1lc3NhZ2VzQ29udHJvbGxlclxuICAgICAgICBdKTtcblxuICAgIGZ1bmN0aW9uIGRpcmVjdE1lc3NhZ2VzQ29udHJvbGxlcigkc2NvcGUsICRzdGF0ZSwgJGlvbmljTG9hZGluZywgY29udGFjdHNTZXJ2aWNlLCBnbG9iYWxzU2VydmljZSkge1xuXHRcdGlmICghZ2xvYmFsc1NlcnZpY2UudXNlcikge1xuXHRcdFx0JHN0YXRlLmdvKCdsb2dpbicpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cbiAgICAgICAgXG5cdFx0dmFyIHVzZXIgPSBnbG9iYWxzU2VydmljZS51c2VyO1xuXHRcdGNvbnNvbGUubG9nKHVzZXIudWlkKTtcblxuICAgICAgICAkaW9uaWNMb2FkaW5nLnNob3coKTtcblxuICAgICAgICB2YXIgcmVmID0gY29udGFjdHNTZXJ2aWNlLmdldFVzZXJDb250YWN0cyh1c2VyLnVpZCk7XG4gICAgICAgIHJlZi5vbihcInZhbHVlXCIsIGZ1bmN0aW9uKHNuYXBzaG90KSB7XG5cdFx0XHQkc2NvcGUuY29udGFjdHMgPSBzbmFwc2hvdC52YWwoKTtcbiAgICAgICAgICAgICRpb25pY0xvYWRpbmcuaGlkZSgpO1xuXHRcdFx0XG5cdFx0XHRjb25zb2xlLmxvZygkc2NvcGUuY29udGFjdHMpO1xuICAgICAgICB9LCBmdW5jdGlvbihlcnJvck9iamVjdCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJlcnJvciByZWFkaW5nOiBcIiArIGVycm9yT2JqZWN0LmNvZGUpO1xuICAgICAgICAgICAgJGlvbmljTG9hZGluZy5oaWRlKCk7XG4gICAgICAgICAgICB2YXIgYWxlcnRQb3B1cCA9ICRpb25pY1BvcHVwLmFsZXJ0KHtcbiAgICAgICAgICAgICAgICB0aXRsZTogJ09wcyEnLFxuICAgICAgICAgICAgICAgIHRlbXBsYXRlOiAnU29ycnkhIEFuIGVycm9yIG9jdXJyZWQuJ1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIFxuICAgIH1cbn0pKCk7IiwiKGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBhbmd1bGFyXG4gICAgICAgIC5tb2R1bGUoJ2FwcC5kaXJlY3RtZXNzYWdlcycpXG4gICAgICAgIC5zZXJ2aWNlKCdkaXJlY3RNZXNzYWdlc1NlcnZpY2UnLCBkaXJlY3RNZXNzYWdlc1NlcnZpY2UpO1xuXG4gICAgZnVuY3Rpb24gZGlyZWN0TWVzc2FnZXNTZXJ2aWNlKGZpcmViYXNlU2VydmljZSkge1xuICAgICAgICB2YXIgc2VydmljZSA9IHt9O1xuXG4gICAgICAgIHNlcnZpY2UuZ2V0VXNlckNvbnRhY3RzID0gZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBmaXJlYmFzZVNlcnZpY2UuZmIuZGF0YWJhc2UoKS5yZWYoJ3VzZXJzLycgKyB1c2VyICsgJy9jb250YWN0cycpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiBzZXJ2aWNlO1xuICAgIH1cbn0pKCk7XG4iLCIoZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGFuZ3VsYXJcbiAgICAgICAgLm1vZHVsZSgnYXBwLmZpcmViYXNlJylcbiAgICAgICAgLnNlcnZpY2UoJ2ZpcmViYXNlU2VydmljZScsIGZpcmViYXNlU2VydmljZSk7XG5cblxuICAgIGZ1bmN0aW9uIGZpcmViYXNlU2VydmljZSgpIHtcbiAgICAgICAgdmFyIGNvbmZpZyA9IHtcbiAgICAgICAgICAgIGFwaUtleTogXCJBSXphU3lCNXE4MUFHR294NGk4LVFMMktPdG5ERGZpMDVpcmdjSEVcIixcbiAgICAgICAgICAgIGF1dGhEb21haW46IFwic29jaWFsc3RyYXRhaWRlYXRlYW0uZmlyZWJhc2VhcHAuY29tXCIsXG4gICAgICAgICAgICBkYXRhYmFzZVVSTDogXCJodHRwczovL3NvY2lhbHN0cmF0YWlkZWF0ZWFtLmZpcmViYXNlaW8uY29tXCIsXG4gICAgICAgICAgICBzdG9yYWdlQnVja2V0OiBcIlwiLFxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZmIgPSBmaXJlYmFzZS5pbml0aWFsaXplQXBwKGNvbmZpZyk7XG4gICAgfVxufSkoKTtcbiIsIihmdW5jdGlvbigpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBhbmd1bGFyXG4gICAgICAgIC5tb2R1bGUoJ2FwcC5tZXNzYWdlcycpXG4gICAgICAgIC5jb250cm9sbGVyKCdtZXNzYWdlc0NvbnRyb2xsZXInLCBbXG4gICAgICAgICAgICAnJHNjb3BlJyxcbiAgICAgICAgICAgICckc3RhdGUnLFxuICAgICAgICAgICAgJyRzdGF0ZVBhcmFtcycsXG4gICAgICAgICAgICAnJGlvbmljU2Nyb2xsRGVsZWdhdGUnLFxuICAgICAgICAgICAgJyR0aW1lb3V0JyxcbiAgICAgICAgICAgICdjaGFubmVsc1NlcnZpY2UnLFxuICAgICAgICAgICAgJ2dsb2JhbHNTZXJ2aWNlJyxcbiAgICAgICAgICAgIE1lc3NhZ2VzQ29udHJvbGxlclxuICAgICAgICBdKTtcblxuICAgIGZ1bmN0aW9uIE1lc3NhZ2VzQ29udHJvbGxlcigkc2NvcGUsICRzdGF0ZSwgJHN0YXRlUGFyYW1zLCAkaW9uaWNTY3JvbGxEZWxlZ2F0ZSwgJHRpbWVvdXQsIGNoYW5uZWxzU2VydmljZSwgZ2xvYmFsc1NlcnZpY2UpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIC8vYXZhaWxhYmxlIHNlcnZpY2VzXG4gICAgICAgIHRoaXMuJHNjb3BlID0gJHNjb3BlO1xuICAgICAgICB0aGlzLiRzdGF0ZSA9ICRzdGF0ZTtcbiAgICAgICAgdGhpcy4kc3RhdGVQYXJhbXMgPSAkc3RhdGVQYXJhbXM7XG4gICAgICAgIHRoaXMuJGlvbmljU2Nyb2xsRGVsZWdhdGUgPSAkaW9uaWNTY3JvbGxEZWxlZ2F0ZTtcbiAgICAgICAgdGhpcy4kdGltZW91dCA9ICR0aW1lb3V0O1xuICAgICAgICB0aGlzLmNoYW5uZWxzU2VydmljZSA9IGNoYW5uZWxzU2VydmljZTtcbiAgICAgICAgdGhpcy5nbG9iYWxzU2VydmljZSA9IGdsb2JhbHNTZXJ2aWNlO1xuXG4gICAgICAgIGlmICghdGhpcy52YWxpZGF0ZSgpKVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuXG4gICAgICAgIC8vY3VzdG9tIHByb3BlcnRpZXNcbiAgICAgICAgdGhpcy5idWlsZGluZ0tleSA9IGdsb2JhbHNTZXJ2aWNlLmJ1aWxkaW5nLmtleTtcbiAgICAgICAgdGhpcy5jaGFubmVsS2V5ID0gdGhpcy4kc3RhdGVQYXJhbXMuY2hhbm5lbElkO1xuICAgICAgICB0aGlzLm1lc3NhZ2VSZWY7XG5cbiAgICAgICAgJHNjb3BlLnVzZXIgPSB7XG4gICAgICAgICAgICBpZDogJHNjb3BlLnVzZXIudWlkLFxuICAgICAgICAgICAgcGljOiAnaHR0cDovL2lvbmljZnJhbWV3b3JrLmNvbS9pbWcvZG9jcy9tY2ZseS5qcGcnLFxuICAgICAgICAgICAgbmFtZTogZ2xvYmFsc1NlcnZpY2UudXNlci5kaXNwbGF5TmFtZSA/IGdsb2JhbHNTZXJ2aWNlLnVzZXIuZGlzcGxheU5hbWUgOiAnVW5kZWZpbmVkJ1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5jaGFubmVsS2V5ID0gdGhpcy5jaGFubmVsS2V5OyAvL3RvIHVzZSBpbiBzZW5kTWVzc2FnZVxuICAgICAgICAkc2NvcGUudG9Vc2VyO1xuICAgICAgICAkc2NvcGUubWVzc2FnZXMgPSBbXTtcbiAgICAgICAgJHNjb3BlLmlucHV0TWVzc2FnZSA9ICcnO1xuICAgICAgICAkc2NvcGUuc2VuZE1lc3NhZ2UgPSBmdW5jdGlvbihtc2cpIHtcbiAgICAgICAgICAgIHNlbGYuZG9TZW5kTWVzc2FnZShzZWxmLCBtc2cpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vVUkgZWxlbWVudHNcbiAgICAgICAgdGhpcy52aWV3U2Nyb2xsID0gJGlvbmljU2Nyb2xsRGVsZWdhdGUuJGdldEJ5SGFuZGxlKCd1c2VyTWVzc2FnZVNjcm9sbCcpO1xuICAgICAgICB0aGlzLmZvb3RlckJhciA9IGRvY3VtZW50LmJvZHkucXVlcnlTZWxlY3RvcignI3VzZXJNZXNzYWdlc1ZpZXcgLmJhci1mb290ZXInKTtcbiAgICAgICAgdGhpcy5zY3JvbGxlciA9IGRvY3VtZW50LmJvZHkucXVlcnlTZWxlY3RvcignI3VzZXJNZXNzYWdlc1ZpZXcgLnNjcm9sbC1jb250ZW50Jyk7XG4gICAgICAgIHRoaXMudHh0SW5wdXQgPSBhbmd1bGFyLmVsZW1lbnQodGhpcy5mb290ZXJCYXIucXVlcnlTZWxlY3RvcigndGV4dGFyZWEnKSk7XG5cbiAgICAgICAgLy9ldmVudHNcbiAgICAgICAgJHNjb3BlLiRvbihcImNoYXQtcmVjZWl2ZS1tZXNzYWdlXCIsIHRoaXMub25SZWNlaXZlTWVzc2FnZSk7XG5cbiAgICAgICAgJHNjb3BlLiRvbignJGlvbmljVmlldy5iZWZvcmVMZWF2ZScsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgc2VsZi5tZXNzYWdlUmVmLm9mZignY2hpbGRfYWRkZWQnKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5pbml0KCk7XG4gICAgfVxuXG4gICAgTWVzc2FnZXNDb250cm9sbGVyLnByb3RvdHlwZS52YWxpZGF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoIXRoaXMuZ2xvYmFsc1NlcnZpY2UudXNlcikge1xuICAgICAgICAgICAgdGhpcy4kc3RhdGUuZ28oJ2xvZ2luJyk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXRoaXMuZ2xvYmFsc1NlcnZpY2UuYnVpbGRpbmcpIHtcbiAgICAgICAgICAgIHRoaXMuJHN0YXRlLmdvKCdhcHAuYnVpbGRpbmdzJyk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9O1xuXG4gICAgLy9DaGVjayBpZiBpcyBhIENvbW1vbiBSb29tIG9yIERpcmVjdCBNZXNzYWdlXG4gICAgTWVzc2FnZXNDb250cm9sbGVyLnByb3RvdHlwZS5pbml0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgICB2YXIgY2hhbm5lbFBhdGggPSBbJ2J1aWxkaW5ncycsIHRoaXMuYnVpbGRpbmdLZXksICdjaGFubmVscycsIHRoaXMuJHN0YXRlUGFyYW1zLmNoYW5uZWxJZF0uam9pbignLycpO1xuICAgICAgICBjb25zb2xlLmxvZyhjaGFubmVsUGF0aCk7XG5cbiAgICAgICAgdmFyIGNoYW5uZWxSZWYgPSBmaXJlYmFzZS5kYXRhYmFzZSgpLnJlZihjaGFubmVsUGF0aCk7XG4gICAgICAgIGNoYW5uZWxSZWYub25jZSgndmFsdWUnLCBmdW5jdGlvbihzbmFwc2hvdCkge1xuICAgICAgICAgICAgc2VsZi5jaGFubmVsID0gc25hcHNob3QudmFsKCk7XG5cbiAgICAgICAgICAgIGlmIChzZWxmLmNoYW5uZWwudHlwZSA9PSBcImRpcmVjdFwiKSB7IC8vZGlyZWN0IG1lc3NhZ2VcbiAgICAgICAgICAgICAgICBzZWxmLnNldENvbnRhY3Qoc2VsZi5jaGFubmVsLnVzZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7IC8vQ29tbW9uIHJvb21cbiAgICAgICAgICAgICAgICBzZWxmLmdldExhc3RNZXNzYWdlcygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgTWVzc2FnZXNDb250cm9sbGVyLnByb3RvdHlwZS5zZXRDb250YWN0ID0gZnVuY3Rpb24odWlkKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgICB2YXIgY29udGFjdFBhdGggPSBbJ3VzZXJzJywgdWlkXS5qb2luKCcvJyk7XG4gICAgICAgIGNvbnNvbGUubG9nKGNvbnRhY3RQYXRoKTtcblxuICAgICAgICBmaXJlYmFzZS5kYXRhYmFzZSgpLnJlZihjb250YWN0UGF0aCkub25jZSgndmFsdWUnLCBmdW5jdGlvbihzbmFwc2hvdCkge1xuICAgICAgICAgICAgdmFyIGNvbnRhY3QgPSBzbmFwc2hvdC52YWwoKTtcbiAgICAgICAgICAgIHNlbGYuJHNjb3BlLnRvVXNlciA9IHNlbGYudG9Vc2VyID0ge1xuICAgICAgICAgICAgICAgIHVzZXJJZDogdWlkLFxuICAgICAgICAgICAgICAgIHVzZXJQaWM6ICdodHRwOi8vaW9uaWNmcmFtZXdvcmsuY29tL2ltZy9kb2NzL3ZlbmttYW4uanBnJyxcbiAgICAgICAgICAgICAgICB1c2VyTmFtZTogY29udGFjdCAmJiBjb250YWN0LmRpc3BsYXlOYW1lID8gY29udGFjdC5kaXNwbGF5TmFtZSA6ICdVbmRlZmluZWQnXG4gICAgICAgICAgICB9O1xuXHRcdFx0XG4gICAgICAgICAgICBzZWxmLmdldExhc3RNZXNzYWdlcygpO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgTWVzc2FnZXNDb250cm9sbGVyLnByb3RvdHlwZS5nZXRMYXN0TWVzc2FnZXMgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgbXNnUGF0aCA9IFsnYnVpbGRpbmdzJywgc2VsZi5idWlsZGluZ0tleSwgJ21lc3NhZ2VzJ10uam9pbignLycpO1xuXG4gICAgICAgIHNlbGYubWVzc2FnZVJlZiA9IGZpcmViYXNlLmRhdGFiYXNlKCkucmVmKG1zZ1BhdGgpO1xuICAgICAgICBzZWxmLm1lc3NhZ2VSZWYub3JkZXJCeUNoaWxkKCdjaGFubmVsJykuZXF1YWxUbyhzZWxmLmNoYW5uZWxLZXkpXG4gICAgICAgICAgICAubGltaXRUb0xhc3QoMTAwKVxuICAgICAgICAgICAgLm9uKCd2YWx1ZScsIGZ1bmN0aW9uKHMpIHtcbiAgICAgICAgICAgICAgICBzZWxmLiRzY29wZS5tZXNzYWdlcyA9IHMudmFsKCk7XG5cbiAgICAgICAgICAgICAgICBzZWxmLiR0aW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLnZpZXdTY3JvbGwuc2Nyb2xsQm90dG9tKHRydWUpO1xuICAgICAgICAgICAgICAgIH0sIDEwKTtcbiAgICAgICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBNZXNzYWdlc0NvbnRyb2xsZXIucHJvdG90eXBlLmRvU2VuZE1lc3NhZ2UgPSBmdW5jdGlvbihzZWxmLCBtc2cpIHtcbiAgICAgICAgdmFyIG1lc3NhZ2UgPSB7XG4gICAgICAgICAgICBkYXRlOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgICAgICBjaGFubmVsOiBzZWxmLmNoYW5uZWxLZXksXG4gICAgICAgICAgICB0ZXh0OiBtc2csXG4gICAgICAgICAgICB1c2VyTmFtZTogc2VsZi4kc2NvcGUudXNlci5uYW1lLFxuICAgICAgICAgICAgdXNlcklkOiBzZWxmLiRzY29wZS51c2VyLmlkLFxuICAgICAgICAgICAgdXNlclBpYzogc2VsZi4kc2NvcGUudXNlci5waWNcbiAgICAgICAgfTtcblxuICAgICAgICBpZiAoc2VsZi50b1VzZXIpXG4gICAgICAgICAgICBtZXNzYWdlLnRvID0gc2VsZi50b1VzZXIudXNlcklkO1xuXG4gICAgICAgIHZhciBtc2dQYXRoID0gWydidWlsZGluZ3MnLCBzZWxmLmJ1aWxkaW5nS2V5LCAnbWVzc2FnZXMnXS5qb2luKCcvJyk7XG4gICAgICAgIGZpcmViYXNlLmRhdGFiYXNlKCkucmVmKG1zZ1BhdGgpLnB1c2gobWVzc2FnZSk7XG5cbiAgICAgICAgc2VsZi4kc2NvcGUuaW5wdXRNZXNzYWdlID0gJyc7XG5cbiAgICAgICAgc2VsZi4kdGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHNlbGYua2VlcEtleWJvYXJkT3BlbigpO1xuICAgICAgICAgICAgc2VsZi52aWV3U2Nyb2xsLnNjcm9sbEJvdHRvbSh0cnVlKTtcbiAgICAgICAgfSwgMCk7XG4gICAgfTtcblxuICAgIE1lc3NhZ2VzQ29udHJvbGxlci5wcm90b3R5cGUua2VlcEtleWJvYXJkT3BlbiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHNlbGYudHh0SW5wdXQub25lKCdibHVyJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygndGV4dGFyZWEgYmx1ciwgZm9jdXMgYmFjayBvbiBpdCcpO1xuICAgICAgICAgICAgc2VsZi50eHRJbnB1dFswXS5mb2N1cygpO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgTWVzc2FnZXNDb250cm9sbGVyLnByb3RvdHlwZS5vblByb2ZpbGVQaWNFcnJvciA9IGZ1bmN0aW9uKGVsZSkge1xuICAgICAgICB0aGlzLmVsZS5zcmMgPSAnJzsgLy9mYWxsYmFja1xuICAgIH07XG59KSgpO1xuXG5cblxuXG4iLCIoZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGFuZ3VsYXJcbiAgICAgICAgLm1vZHVsZSgnYXBwLm1lc3NhZ2VzJylcblxuICAgICAgICAuZmlsdGVyKCdubDJicicsIFsnJGZpbHRlcicsIG5sMmJyXSlcblxuICAgIGZ1bmN0aW9uIG5sMmJyKCRmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICAgICBpZiAoIWRhdGEpIHJldHVybiBkYXRhO1xuICAgICAgICAgICAgcmV0dXJuIGRhdGEucmVwbGFjZSgvXFxuXFxyPy9nLCAnPGJyIC8+Jyk7XG4gICAgICAgIH07XG4gICAgfVxufSkoKTsiLCIoZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGFuZ3VsYXJcbiAgICAgICAgLm1vZHVsZSgnYXBwLm1lc3NhZ2VzJylcbiAgICAgICAgLnNlcnZpY2UoJ21lc3NhZ2VzU2VydmljZScsIG1lc3NhZ2VzU2VydmljZSk7XG5cbiAgICBmdW5jdGlvbiBtZXNzYWdlc1NlcnZpY2UoZmlyZWJhc2VTZXJ2aWNlKSB7XG4gICAgICAgIHZhciBzZXJ2aWNlID0ge307XG5cdFx0XG4gICAgICAgIHNlcnZpY2UuZ2V0TWVzc2FnZXNSZWYgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gZmlyZWJhc2VTZXJ2aWNlLmZiLmRhdGFiYXNlKCkucmVmKCdtZXNzYWdlcycpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHNlcnZpY2UuYWRkTWVzc2FnZSA9IGZ1bmN0aW9uIChtZXNzYWdlKSB7XG4gICAgICAgICAgICByZXR1cm4gZmlyZWJhc2VTZXJ2aWNlLmZiLmRhdGFiYXNlKCkucHVzaChtZXNzYWdlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBzZXJ2aWNlO1xuICAgIH1cbn0pKCk7XG4iLCIoZnVuY3Rpb24oKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgYW5ndWxhci5tb2R1bGUoXCJhcHAucHJvZmlsZXNcIilcblxuICAgICAgICAuY29udHJvbGxlcihcInByb2ZpbGVDb250cm9sbGVyXCIsIHByb2ZpbGVDb250cm9sbGVyKTtcblxuXG4gICAgZnVuY3Rpb24gcHJvZmlsZUNvbnRyb2xsZXIoJHNjb3BlLCAkaW9uaWNMb2FkaW5nLCAkaW9uaWNQb3B1cCwgYXV0aFNlcnZpY2UsIHByb2ZpbGVzU2VydmljZSkge1xuXG5cdFx0dmFyIHVzZXIgPSBhdXRoU2VydmljZS51c2VyKCk7XG5cdFx0XG5cdFx0JHNjb3BlLmRhdGEgPSB7XG5cdFx0XHRkaXNwbGF5TmFtZSA6IHVzZXIgPyB1c2VyLmRpc3BsYXlOYW1lIDogXCJcIixcblx0XHRcdGVtYWlsIDogdXNlciA/IHVzZXIuZW1haWwgOiBcIlwiXG5cdFx0fTtcblxuICAgICAgICAkc2NvcGUudXBkYXRlID0gZnVuY3Rpb24oKSB7XG5cdFx0XHQkaW9uaWNMb2FkaW5nLnNob3coKTtcblxuICAgICAgICAgICAgcHJvZmlsZXNTZXJ2aWNlLnVwZGF0ZVByb2ZpbGUoJHNjb3BlLmRhdGEpLnRoZW4oZnVuY3Rpb24gc3VjY2Vzcyhtc2cpIHtcblx0XHRcdFx0JGlvbmljTG9hZGluZy5oaWRlKCk7XG5cblx0XHRcdFx0JGlvbmljUG9wdXAuYWxlcnQoe1xuICAgICAgICAgICAgICAgICAgICB0aXRsZTogJ1Byb2ZpbGVVcGRhdGUhJyxcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGU6IG1zZ1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICB9LCBmdW5jdGlvbiBlcnJvcihlcnJvcikge1xuXHRcdFx0XHQkaW9uaWNMb2FkaW5nLmhpZGUoKTtcblxuXHRcdFx0XHQkaW9uaWNQb3B1cC5hbGVydCh7XG4gICAgICAgICAgICAgICAgICAgIHRpdGxlOiAnVXBkYXRlIGZhaWxlZCEnLFxuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZTogZXJyb3IubWVzc2FnZVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG59KSgpOyIsIihmdW5jdGlvbigpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBhbmd1bGFyLm1vZHVsZShcImFwcC5wcm9maWxlc1wiKVxuXG4gICAgICAgIC5zZXJ2aWNlKFwicHJvZmlsZXNTZXJ2aWNlXCIsIHByb2ZpbGVzU2VydmljZSk7XG5cblxuICAgIGZ1bmN0aW9uIHByb2ZpbGVzU2VydmljZSgkcSwgJHJvb3RTY29wZSwgYXV0aFNlcnZpY2UpIHtcblx0XHRcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHVwZGF0ZVByb2ZpbGU6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuXG4gICAgICAgICAgICAgICAgYXV0aFNlcnZpY2UudXNlcigpLnVwZGF0ZVByb2ZpbGUoZGF0YSlcbiAgICAgICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gc3VjY2VzcygpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUoXCJQcm9maWxlIHVwZGF0ZWQhXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KCd1c2VyLWNoYW5nZWQnKTtcbiAgICAgICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gZXJyb3IoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlamVjdChlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9XG4gICAgfVxufSkoKTsiLCIoZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGFuZ3VsYXIubW9kdWxlKFwiYXBwLnNpZGVtZW51XCIpXG5cbiAgICAgICAgLmNvbnRyb2xsZXIoXCJzaWRlbWVudUNvbnRyb2xsZXJcIiwgc2lkZW1lbnVDb250cm9sbGVyKTtcblxuXG4gICAgZnVuY3Rpb24gc2lkZW1lbnVDb250cm9sbGVyKCRzY29wZSwgJHN0YXRlLCBjaGFubmVsc1NlcnZpY2UsIGF1dGhTZXJ2aWNlKSB7XG4gICAgICAgICRzY29wZS51c2VyID0gYXV0aFNlcnZpY2UudXNlcigpO1xuICAgICAgICAkc2NvcGUuY2hhbm5lbHMgPSBjaGFubmVsc1NlcnZpY2UuY2hhbm5lbHM7XG4gICAgICAgICRzY29wZS5idWlsZGluZyA9IHtcbiAgICAgICAgICAgIG5hbWU6IFwiU2VsZWN0IGEgYnVpbGRpbmdcIixcbiAgICAgICAgICAgIGFkZHJlc3M6IFwiXCIsXG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLiRvbignYnVpbGRpbmctc2VsZWN0ZWQnLCBmdW5jdGlvbiAoZXZlbnQsIGRhdGEpIHtcbiAgICAgICAgICAgICRzY29wZS5idWlsZGluZy5uYW1lID0gZGF0YS5uYW1lO1xuICAgICAgICAgICAgJHNjb3BlLmJ1aWxkaW5nLmFkZHJlc3MgPSBkYXRhLmFkZHJlc3M7XG5cbiAgICAgICAgfSk7XG5cbiAgICAgICAgJHNjb3BlLm9wZW5DaGFubmVsID0gZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgJHN0YXRlLmdvKCdhcHAuY2hhbm5lbCcsIHtjaGFubmVsSWQ6IGtleX0pO1xuICAgICAgICB9O1xuICAgIH1cbn0pKCk7XG4iLCIoZnVuY3Rpb24oKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgYW5ndWxhci5tb2R1bGUoXCJhcHAudXNlcnNcIilcblxuICAgICAgICAuc2VydmljZShcInVzZXJzU2VydmljZVwiLCB1c2Vyc1NlcnZpY2UpO1xuXG5cbiAgICBmdW5jdGlvbiB1c2Vyc1NlcnZpY2UoJHEsIGF1dGhTZXJ2aWNlKSB7XG5cdCAgICByZXR1cm4ge1xuICAgICAgICAgICAgdXBkYXRlUHJvZmlsZTogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG5cbiAgICAgICAgICAgICAgICBhdXRoU2VydmljZS51c2VyKCkudXBkYXRlUHJvZmlsZShkYXRhKVxuICAgICAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbiBzdWNjZXNzKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShcIlByb2ZpbGUgdXBkYXRlZCFcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICB1c2VyID0gZmlyZWJhc2UuYXV0aCgpLmN1cnJlbnRVc2VyO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KCd1c2VyLWNoYW5nZWQnKTtcbiAgICAgICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gZXJyb3IoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlamVjdChlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9XG4gICAgfVxufSkoKTsiLCIoZnVuY3Rpb24oKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgYW5ndWxhclxuXG4gICAgICAgIC5tb2R1bGUoJ2FwcCcsIFtcbiAgICAgICAgICAgICdpb25pYycsXG4gICAgICAgICAgICAnbW9ub3NwYWNlZC5lbGFzdGljJyxcblxuICAgICAgICAgICAgJ2FwcC5maXJlYmFzZScsXG4gICAgICAgICAgICAnYXBwLmZpcmViYXNlJyxcbiAgICAgICAgICAgICdhcHAuYXV0aCcsXG4gICAgICAgICAgICAnYXBwLmNoYW5uZWxzJyxcbiAgICAgICAgICAgICdhcHAuc2lkZW1lbnUnLFxuICAgICAgICAgICAgJ2FwcC5idWlsZGluZ3MnLFxuICAgICAgICAgICAgJ2FwcC5wcm9maWxlcycsXG4gICAgICAgICAgICAnYXBwLm1lc3NhZ2VzJyxcbiAgICAgICAgICAgICdhcHAuZGlyZWN0bWVzc2FnZXMnXG4gICAgICAgIF0pXG5cbiAgICAgICAgLnJ1bihmdW5jdGlvbigkaW9uaWNQbGF0Zm9ybSwgJHRpbWVvdXQsICRyb290U2NvcGUpIHtcbiAgICAgICAgICAgICRpb25pY1BsYXRmb3JtLnJlYWR5KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGlmICh3aW5kb3cuY29yZG92YSAmJiB3aW5kb3cuY29yZG92YS5wbHVnaW5zLktleWJvYXJkKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvcmRvdmEucGx1Z2lucy5LZXlib2FyZC5oaWRlS2V5Ym9hcmRBY2Nlc3NvcnlCYXIodHJ1ZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgY29yZG92YS5wbHVnaW5zLktleWJvYXJkLmRpc2FibGVTY3JvbGwodHJ1ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh3aW5kb3cuU3RhdHVzQmFyKSB7XG4gICAgICAgICAgICAgICAgICAgIFN0YXR1c0Jhci5zdHlsZURlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICB9XG5cdFx0XHRcdC8vdG8gZ2V0IHVzZXIgaW5mb1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGVtaXQoJ3VzZXItY2hhbmdlZCcpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xufSkoKTtcblxuXG4iLCIoZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGFuZ3VsYXJcbiAgICAgICAgLm1vZHVsZSgnYXBwJylcbiAgICAgICAgLnNlcnZpY2UoJ2dsb2JhbHNTZXJ2aWNlJywgZ2xvYmFsc1NlcnZpY2UpO1xuXG4gICAgZnVuY3Rpb24gZ2xvYmFsc1NlcnZpY2UoKSB7XG4gICAgICAgIHZhciBzZXJ2aWNlID0ge1xuXHRcdFx0dXNlciA6IG51bGwsIC8vbG9nZ2VkIHVzZXJcblx0XHRcdGJ1aWxkaW5nIDogbnVsbCAvL3NlbGVjdGVkIGJ1aWxkaW5nXG5cdFx0fTtcblxuICAgICAgICByZXR1cm4gc2VydmljZTtcbiAgICB9XG59KSgpO1xuIiwiKGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBhbmd1bGFyXG5cbiAgICAgICAgLm1vZHVsZSgnYXBwJylcblxuICAgICAgICAucnVuKFsnJHJvb3RTY29wZScsICckbG9jYXRpb24nLCAnYXV0aFNlcnZpY2UnLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgJHN0YXRlLCBhdXRoU2VydmljZSkge1xuICAgICAgICAgICAgJHJvb3RTY29wZS4kb24oJyRyb3V0ZUNoYW5nZVN0YXJ0JywgZnVuY3Rpb24gKGV2ZW50KSB7XG5cbiAgICAgICAgICAgICAgICBpZiAoYXV0aFNlcnZpY2UudXNlcigpID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdsb2dpbicpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XSlcbn0pKCk7XG4iLCIoZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGFuZ3VsYXJcblxuICAgICAgICAubW9kdWxlKCdhcHAnKVxuXG4gICAgICAgIC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyLCAkdXJsUm91dGVyUHJvdmlkZXIpIHtcbiAgICAgICAgICAgICRzdGF0ZVByb3ZpZGVyXG5cbiAgICAgICAgICAgICAgICAuc3RhdGUoJ2FwcCcsIHtcbiAgICAgICAgICAgICAgICAgICAgdXJsOiAnL2FwcCcsXG4gICAgICAgICAgICAgICAgICAgIGNhY2hlOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgYWJzdHJhY3Q6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAndmlld3Mvc2lkZW1lbnUuaHRtbCcsXG4gICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgICAgIC5zdGF0ZSgnYXBwLmJ1aWxkaW5ncycsIHtcbiAgICAgICAgICAgICAgICAgICAgdXJsOiAnL2J1aWxkaW5ncycsXG4gICAgICAgICAgICAgICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAnbWVudUNvbnRlbnQnOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICd2aWV3cy9idWlsZGluZ3MuaHRtbCdcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgICAgICAuc3RhdGUoJ2FwcC5idWlsZGluZycsIHtcbiAgICAgICAgICAgICAgICAgICAgdXJsOiAnL2J1aWxkaW5ncy86YnVpbGRpbmdJZCcsXG4gICAgICAgICAgICAgICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAnbWVudUNvbnRlbnQnOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICd2aWV3cy9idWlsZGluZy5odG1sJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgICAgIC5zdGF0ZSgnYXBwLmNoYW5uZWwnLCB7XG4gICAgICAgICAgICAgICAgICAgIHVybDogJy9jaGFubmVsLzpjaGFubmVsSWQnLFxuICAgICAgICAgICAgICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgICAgICAgICAgICAgJ21lbnVDb250ZW50Jzoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAndmlld3MvbWVzc2FnZXMvY2hhdC5odG1sJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgICAgIC5zdGF0ZSgnYXBwLnByb2ZpbGUnLCB7XG4gICAgICAgICAgICAgICAgICAgIHVybDogJy9wcm9maWxlJyxcbiAgICAgICAgICAgICAgICAgICAgY2FjaGU6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgICAgICAgICAgICAgJ21lbnVDb250ZW50Jzoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAndmlld3MvcHJvZmlsZS9wcm9maWxlLmh0bWwnXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICAgICAgLnN0YXRlKCdhcHAubWVzc2FnZXMnLCB7XG4gICAgICAgICAgICAgICAgICAgIHVybDogJy9tZXNzYWdlcycsXG4gICAgICAgICAgICAgICAgICAgIGNhY2hlOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICdtZW51Q29udGVudCc6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3ZpZXdzL21lc3NhZ2VzL21lc3NhZ2VzLmh0bWwnXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KVxuXG5cbiAgICAgICAgICAgICAgICAuc3RhdGUoJ2FwcC5sb2dvdXQnLCB7XG4gICAgICAgICAgICAgICAgICAgIHVybDogXCIvbG9naW5cIixcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVQcm92aWRlcjogZnVuY3Rpb24gKGF1dGhTZXJ2aWNlLCAkc3RhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGF1dGhTZXJ2aWNlLmxvZ291dCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdsb2dpbicpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuc3RhdGUoJ2xvZ2luJywge1xuICAgICAgICAgICAgICAgICAgICB1cmw6IFwiL2xvZ2luXCIsXG4gICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBcInZpZXdzL2F1dGgvbG9naW4uaHRtbFwiXG4gICAgICAgICAgICAgICAgfSk7XG5cblxuICAgICAgICAgICAgLy9mYWxsYmFja1xuICAgICAgICAgICAgJHVybFJvdXRlclByb3ZpZGVyLm90aGVyd2lzZSgnL2xvZ2luJyk7XG5cbiAgICAgICAgfSk7XG59KSgpO1xuXG5cblxuXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
