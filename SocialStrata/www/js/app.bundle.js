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
        .module('app.directmessages', ['app.messages']);
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


(function () {
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

        getContacts(getUser());

        function getUser() {

            if (!globalsService.user) {
                $state.go('login');
                return;
            }

            return globalsService.user;
        }

        function getContacts(user) {
            $ionicLoading.show();
            var ref = contactsService.getUserContacts(user.uid);

            ref.on("value", function (snapshot) {
                $scope.contacts = snapshot.val();
                $ionicLoading.hide();

            }, function (errorObject) {
                console.log("error reading: " + errorObject.code);
                $ionicLoading.hide();
                var alertPopup = $ionicPopup.alert({
                    title: 'Ops!',
                    template: 'Sorry! An error ocurred.'
                });
            });
        }
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
        this.channelKey = $stateParams.channelId;
		this.toUserId = $stateParams.userId;
		this.mode = $stateParams.userId ? "chat" : "channel";
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
		
		if (self.mode == "channel")
		{
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
		}
		else { //chat
			self.setContact(self.toUserId);
		}

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
		
		if (self.mode == "chat")
			msgPath = "messages";

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

                .state('app.message', {
                    url: '/message/:userId',
                    cache: false,
                    views: {
                        'menuContent': {
                            templateUrl: 'views/messages/chat.html'
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





//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImF1dGgvYXV0aC5tb2R1bGUuanMiLCJidWlsZGluZ3MvYnVpbGRpbmdzLm1vZHVsZS5qcyIsImNoYW5uZWxzL2NoYW5uZWxzLm1vZHVsZS5qcyIsImRpcmVjdG1lc3NhZ2VzL2RpcmVjdG1lc3NhZ2VzLm1vZHVsZS5qcyIsImZpcmViYXNlL2ZpcmViYXNlLm1vZHVsZS5qcyIsIm1lc3NhZ2VzL21lc3NhZ2VzLm1vZHVsZS5qcyIsInByb2ZpbGUvcHJvZmlsZXMubW9kdWxlLmpzIiwic2lkZW1lbnUvc2lkZW1lbnUubW9kdWxlLmpzIiwidXNlcnMvdXNlcnMubW9kdWxlLmpzIiwiYXV0aC9hdXRoQ29udHJvbGxlci5qcyIsImF1dGgvYXV0aFNlcnZpY2UuanMiLCJidWlsZGluZ3MvYnVpbGRpbmdDb250cm9sbGVyLmpzIiwiYnVpbGRpbmdzL2J1aWxkaW5nc0NvbnRyb2xsZXIuanMiLCJidWlsZGluZ3MvYnVpbGRpbmdzU2VydmljZS5qcyIsImNoYW5uZWxzL2NoYW5uZWxzU2VydmljZS5qcyIsImRpcmVjdG1lc3NhZ2VzL2RpcmVjdE1lc3NhZ2VzQ29udHJvbGxlci5qcyIsImRpcmVjdG1lc3NhZ2VzL2RpcmVjdE1lc3NhZ2VzU2VydmljZS5qcyIsImZpcmViYXNlL2ZpcmViYXNlU2VydmljZS5qcyIsIm1lc3NhZ2VzL21lc3NhZ2VzQ29udHJvbGxlci5qcyIsIm1lc3NhZ2VzL21lc3NhZ2VzRmlsdGVycy5qcyIsIm1lc3NhZ2VzL21lc3NhZ2VzU2VydmljZS5qcyIsInByb2ZpbGUvcHJvZmlsZUNvbnRyb2xsZXIuanMiLCJwcm9maWxlL3Byb2ZpbGVzU2VydmljZS5qcyIsInNpZGVtZW51L3NpZGVtZW51Q29udHJvbGxlci5qcyIsInVzZXJzL3VzZXJzU2VydmljZS5qcyIsImFwcC5tb2R1bGUuanMiLCJhcHAuZ2xvYmFscy5qcyIsImFwcC5yb3V0ZXIuZmlsdGVyLmpzIiwiYXBwLnJvdXRlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxD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QUEsR0FBQTtZQUNBLE9BQUE7OztRQUdBLElBQUEsQ0FBQSxLQUFBLGVBQUEsVUFBQTtZQUNBLEtBQUEsT0FBQSxHQUFBO1lBQ0EsT0FBQTs7O1FBR0EsT0FBQTs7OztJQUlBLG1CQUFBLFVBQUEsT0FBQSxXQUFBO1FBQ0EsSUFBQSxPQUFBOztFQUVBLElBQUEsS0FBQSxRQUFBO0VBQ0E7R0FDQSxJQUFBLGNBQUEsQ0FBQSxhQUFBLEtBQUEsYUFBQSxZQUFBLEtBQUEsYUFBQSxXQUFBLEtBQUE7R0FDQSxRQUFBLElBQUE7O0dBRUEsSUFBQSxhQUFBLFNBQUEsV0FBQSxJQUFBO0dBQ0EsV0FBQSxLQUFBLFNBQUEsU0FBQSxVQUFBO0lBQ0EsS0FBQSxVQUFBLFNBQUE7O0lBRUEsSUFBQSxLQUFBLFFBQUEsUUFBQSxVQUFBO0tBQ0EsS0FBQSxXQUFBLEtBQUEsUUFBQTs7U0FFQTtLQUNBLEtBQUE7Ozs7T0FJQTtHQUNBLEtBQUEsV0FBQSxLQUFBOzs7OztJQUtBLG1CQUFBLFVBQUEsYUFBQSxTQUFBLEtBQUE7UUFDQSxJQUFBLE9BQUE7O1FBRUEsSUFBQSxjQUFBLENBQUEsU0FBQSxLQUFBLEtBQUE7UUFDQSxRQUFBLElBQUE7O1FBRUEsU0FBQSxXQUFBLElBQUEsYUFBQSxLQUFBLFNBQUEsU0FBQSxVQUFBO1lBQ0EsSUFBQSxVQUFBLFNBQUE7WUFDQSxLQUFBLE9BQUEsU0FBQSxLQUFBLFNBQUE7Z0JBQ0EsUUFBQTtnQkFDQSxTQUFBO2dCQUNBLFVBQUEsV0FBQSxRQUFBLGNBQUEsUUFBQSxjQUFBOzs7WUFHQSxLQUFBOzs7O0lBSUEsbUJBQUEsVUFBQSxrQkFBQSxXQUFBO1FBQ0EsSUFBQSxPQUFBO1FBQ0EsSUFBQSxVQUFBLENBQUEsYUFBQSxLQUFBLGFBQUEsWUFBQSxLQUFBOztFQUVBLElBQUEsS0FBQSxRQUFBO0dBQ0EsVUFBQTs7UUFFQSxLQUFBLGFBQUEsU0FBQSxXQUFBLElBQUE7UUFDQSxLQUFBLFdBQUEsYUFBQSxXQUFBLFFBQUEsS0FBQTthQUNBLFlBQUE7YUFDQSxHQUFBLFNBQUEsU0FB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ZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgYW5ndWxhci5tb2R1bGUoXCJhcHAuYXV0aFwiLCBbXSk7XG59KSgpOyIsIihmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgYW5ndWxhci5tb2R1bGUoXCJhcHAuYnVpbGRpbmdzXCIsIFsnYXBwLmZpcmViYXNlJ10pO1xufSkoKTsiLCIoZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGFuZ3VsYXIubW9kdWxlKFwiYXBwLmNoYW5uZWxzXCIsIFtdKTtcbn0pKCk7IiwiKGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBhbmd1bGFyXG4gICAgICAgIC5tb2R1bGUoJ2FwcC5kaXJlY3RtZXNzYWdlcycsIFsnYXBwLm1lc3NhZ2VzJ10pO1xufSkoKTtcblxuXG5cblxuIiwiKGZ1bmN0aW9uKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGFuZ3VsYXJcbiAgICAgICAgLm1vZHVsZSgnYXBwLmZpcmViYXNlJywgW10pO1xufSkoKTtcblxuXG5cblxuIiwiKGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBhbmd1bGFyXG4gICAgICAgIC5tb2R1bGUoJ21vbm9zcGFjZWQuZWxhc3RpYycsIFtdKVxuICAgICAgICAuY29uc3RhbnQoJ21zZEVsYXN0aWNDb25maWcnLCB7XG4gICAgICAgICAgICBhcHBlbmQ6ICcnXG4gICAgICAgIH0pXG4gICAgICAgIC5kaXJlY3RpdmUoJ21zZEVsYXN0aWMnLCBbXG4gICAgICAgICAgICAnJHRpbWVvdXQnLCAnJHdpbmRvdycsICdtc2RFbGFzdGljQ29uZmlnJyxcbiAgICAgICAgICAgIGZ1bmN0aW9uICgkdGltZW91dCwgJHdpbmRvdywgY29uZmlnKSB7XG4gICAgICAgICAgICAgICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZTogJ25nTW9kZWwnLFxuICAgICAgICAgICAgICAgICAgICByZXN0cmljdDogJ0EsIEMnLFxuICAgICAgICAgICAgICAgICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBuZ01vZGVsKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNhY2hlIGEgcmVmZXJlbmNlIHRvIHRoZSBET00gZWxlbWVudFxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRhID0gZWxlbWVudFswXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdGEgPSBlbGVtZW50O1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBlbnN1cmUgdGhlIGVsZW1lbnQgaXMgYSB0ZXh0YXJlYSwgYW5kIGJyb3dzZXIgaXMgY2FwYWJsZVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRhLm5vZGVOYW1lICE9PSAnVEVYVEFSRUEnIHx8ICEkd2luZG93LmdldENvbXB1dGVkU3R5bGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHNldCB0aGVzZSBwcm9wZXJ0aWVzIGJlZm9yZSBtZWFzdXJpbmcgZGltZW5zaW9uc1xuICAgICAgICAgICAgICAgICAgICAgICAgJHRhLmNzcyh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ292ZXJmbG93JzogJ2hpZGRlbicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ292ZXJmbG93LXknOiAnaGlkZGVuJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnd29yZC13cmFwJzogJ2JyZWFrLXdvcmQnXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZm9yY2UgdGV4dCByZWZsb3dcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0ZXh0ID0gdGEudmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB0YS52YWx1ZSA9ICcnO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGEudmFsdWUgPSB0ZXh0O1xuXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgYXBwZW5kID0gYXR0cnMubXNkRWxhc3RpYyA/IGF0dHJzLm1zZEVsYXN0aWMucmVwbGFjZSgvXFxcXG4vZywgJ1xcbicpIDogY29uZmlnLmFwcGVuZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkd2luID0gYW5ndWxhci5lbGVtZW50KCR3aW5kb3cpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1pcnJvckluaXRTdHlsZSA9ICdwb3NpdGlvbjogYWJzb2x1dGU7IHRvcDogLTk5OXB4OyByaWdodDogYXV0bzsgYm90dG9tOiBhdXRvOycgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnbGVmdDogMDsgb3ZlcmZsb3c6IGhpZGRlbjsgLXdlYmtpdC1ib3gtc2l6aW5nOiBjb250ZW50LWJveDsnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJy1tb3otYm94LXNpemluZzogY29udGVudC1ib3g7IGJveC1zaXppbmc6IGNvbnRlbnQtYm94OycgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnbWluLWhlaWdodDogMCAhaW1wb3J0YW50OyBoZWlnaHQ6IDAgIWltcG9ydGFudDsgcGFkZGluZzogMDsnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ3dvcmQtd3JhcDogYnJlYWstd29yZDsgYm9yZGVyOiAwOycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJG1pcnJvciA9IGFuZ3VsYXIuZWxlbWVudCgnPHRleHRhcmVhIGFyaWEtaGlkZGVuPVwidHJ1ZVwiIHRhYmluZGV4PVwiLTFcIiAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ3N0eWxlPVwiJyArIG1pcnJvckluaXRTdHlsZSArICdcIi8+JykuZGF0YSgnZWxhc3RpYycsIHRydWUpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1pcnJvciA9ICRtaXJyb3JbMF0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFTdHlsZSA9IGdldENvbXB1dGVkU3R5bGUodGEpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc2l6ZSA9IHRhU3R5bGUuZ2V0UHJvcGVydHlWYWx1ZSgncmVzaXplJyksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYm9yZGVyQm94ID0gdGFTdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKCdib3gtc2l6aW5nJykgPT09ICdib3JkZXItYm94JyB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YVN0eWxlLmdldFByb3BlcnR5VmFsdWUoJy1tb3otYm94LXNpemluZycpID09PSAnYm9yZGVyLWJveCcgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFTdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKCctd2Via2l0LWJveC1zaXppbmcnKSA9PT0gJ2JvcmRlci1ib3gnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJveE91dGVyID0gIWJvcmRlckJveCA/IHt3aWR0aDogMCwgaGVpZ2h0OiAwfSA6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6IHBhcnNlSW50KHRhU3R5bGUuZ2V0UHJvcGVydHlWYWx1ZSgnYm9yZGVyLXJpZ2h0LXdpZHRoJyksIDEwKSArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcnNlSW50KHRhU3R5bGUuZ2V0UHJvcGVydHlWYWx1ZSgncGFkZGluZy1yaWdodCcpLCAxMCkgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJzZUludCh0YVN0eWxlLmdldFByb3BlcnR5VmFsdWUoJ3BhZGRpbmctbGVmdCcpLCAxMCkgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJzZUludCh0YVN0eWxlLmdldFByb3BlcnR5VmFsdWUoJ2JvcmRlci1sZWZ0LXdpZHRoJyksIDEwKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBwYXJzZUludCh0YVN0eWxlLmdldFByb3BlcnR5VmFsdWUoJ2JvcmRlci10b3Atd2lkdGgnKSwgMTApICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyc2VJbnQodGFTdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKCdwYWRkaW5nLXRvcCcpLCAxMCkgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJzZUludCh0YVN0eWxlLmdldFByb3BlcnR5VmFsdWUoJ3BhZGRpbmctYm90dG9tJyksIDEwKSArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcnNlSW50KHRhU3R5bGUuZ2V0UHJvcGVydHlWYWx1ZSgnYm9yZGVyLWJvdHRvbS13aWR0aCcpLCAxMClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1pbkhlaWdodFZhbHVlID0gcGFyc2VJbnQodGFTdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKCdtaW4taGVpZ2h0JyksIDEwKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHRWYWx1ZSA9IHBhcnNlSW50KHRhU3R5bGUuZ2V0UHJvcGVydHlWYWx1ZSgnaGVpZ2h0JyksIDEwKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaW5IZWlnaHQgPSBNYXRoLm1heChtaW5IZWlnaHRWYWx1ZSwgaGVpZ2h0VmFsdWUpIC0gYm94T3V0ZXIuaGVpZ2h0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1heEhlaWdodCA9IHBhcnNlSW50KHRhU3R5bGUuZ2V0UHJvcGVydHlWYWx1ZSgnbWF4LWhlaWdodCcpLCAxMCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWlycm9yZWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0aXZlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvcHlTdHlsZSA9IFsnZm9udC1mYW1pbHknLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnZm9udC1zaXplJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2ZvbnQtd2VpZ2h0JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2ZvbnQtc3R5bGUnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnbGV0dGVyLXNwYWNpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnbGluZS1oZWlnaHQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAndGV4dC10cmFuc2Zvcm0nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnd29yZC1zcGFjaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ3RleHQtaW5kZW50J107XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGV4aXQgaWYgZWxhc3RpYyBhbHJlYWR5IGFwcGxpZWQgKG9yIGlzIHRoZSBtaXJyb3IgZWxlbWVudClcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgkdGEuZGF0YSgnZWxhc3RpYycpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBPcGVyYSByZXR1cm5zIG1heC1oZWlnaHQgb2YgLTEgaWYgbm90IHNldFxuICAgICAgICAgICAgICAgICAgICAgICAgbWF4SGVpZ2h0ID0gbWF4SGVpZ2h0ICYmIG1heEhlaWdodCA+IDAgPyBtYXhIZWlnaHQgOiA5ZTQ7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGFwcGVuZCBtaXJyb3IgdG8gdGhlIERPTVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1pcnJvci5wYXJlbnROb2RlICE9PSBkb2N1bWVudC5ib2R5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYW5ndWxhci5lbGVtZW50KGRvY3VtZW50LmJvZHkpLmFwcGVuZChtaXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBzZXQgcmVzaXplIGFuZCBhcHBseSBlbGFzdGljXG4gICAgICAgICAgICAgICAgICAgICAgICAkdGEuY3NzKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAncmVzaXplJzogKHJlc2l6ZSA9PT0gJ25vbmUnIHx8IHJlc2l6ZSA9PT0gJ3ZlcnRpY2FsJykgPyAnbm9uZScgOiAnaG9yaXpvbnRhbCdcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pLmRhdGEoJ2VsYXN0aWMnLCB0cnVlKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLypcbiAgICAgICAgICAgICAgICAgICAgICAgICAqIG1ldGhvZHNcbiAgICAgICAgICAgICAgICAgICAgICAgICAqL1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiBpbml0TWlycm9yKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBtaXJyb3JTdHlsZSA9IG1pcnJvckluaXRTdHlsZTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1pcnJvcmVkID0gdGE7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gY29weSB0aGUgZXNzZW50aWFsIHN0eWxlcyBmcm9tIHRoZSB0ZXh0YXJlYSB0byB0aGUgbWlycm9yXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFTdHlsZSA9IGdldENvbXB1dGVkU3R5bGUodGEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFuZ3VsYXIuZm9yRWFjaChjb3B5U3R5bGUsIGZ1bmN0aW9uICh2YWwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWlycm9yU3R5bGUgKz0gdmFsICsgJzonICsgdGFTdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKHZhbCkgKyAnOyc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWlycm9yLnNldEF0dHJpYnV0ZSgnc3R5bGUnLCBtaXJyb3JTdHlsZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGFkanVzdCgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgdGFIZWlnaHQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhQ29tcHV0ZWRTdHlsZVdpZHRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaXJyb3JIZWlnaHQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvdmVyZmxvdztcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtaXJyb3JlZCAhPT0gdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5pdE1pcnJvcigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGFjdGl2ZSBmbGFnIHByZXZlbnRzIGFjdGlvbnMgaW4gZnVuY3Rpb24gZnJvbSBjYWxsaW5nIGFkanVzdCBhZ2FpblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghYWN0aXZlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGl2ZSA9IHRydWU7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWlycm9yLnZhbHVlID0gdGEudmFsdWUgKyBhcHBlbmQ7IC8vIG9wdGlvbmFsIHdoaXRlc3BhY2UgdG8gaW1wcm92ZSBhbmltYXRpb25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWlycm9yLnN0eWxlLm92ZXJmbG93WSA9IHRhLnN0eWxlLm92ZXJmbG93WTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YUhlaWdodCA9IHRhLnN0eWxlLmhlaWdodCA9PT0gJycgPyAnYXV0bycgOiBwYXJzZUludCh0YS5zdHlsZS5oZWlnaHQsIDEwKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YUNvbXB1dGVkU3R5bGVXaWR0aCA9IGdldENvbXB1dGVkU3R5bGUodGEpLmdldFByb3BlcnR5VmFsdWUoJ3dpZHRoJyk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gZW5zdXJlIGdldENvbXB1dGVkU3R5bGUgaGFzIHJldHVybmVkIGEgcmVhZGFibGUgJ3VzZWQgdmFsdWUnIHBpeGVsIHdpZHRoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0YUNvbXB1dGVkU3R5bGVXaWR0aC5zdWJzdHIodGFDb21wdXRlZFN0eWxlV2lkdGgubGVuZ3RoIC0gMiwgMikgPT09ICdweCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHVwZGF0ZSBtaXJyb3Igd2lkdGggaW4gY2FzZSB0aGUgdGV4dGFyZWEgd2lkdGggaGFzIGNoYW5nZWRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoID0gcGFyc2VJbnQodGFDb21wdXRlZFN0eWxlV2lkdGgsIDEwKSAtIGJveE91dGVyLndpZHRoO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWlycm9yLnN0eWxlLndpZHRoID0gd2lkdGggKyAncHgnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWlycm9ySGVpZ2h0ID0gbWlycm9yLnNjcm9sbEhlaWdodDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobWlycm9ySGVpZ2h0ID4gbWF4SGVpZ2h0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaXJyb3JIZWlnaHQgPSBtYXhIZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvdmVyZmxvdyA9ICdzY3JvbGwnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKG1pcnJvckhlaWdodCA8IG1pbkhlaWdodCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWlycm9ySGVpZ2h0ID0gbWluSGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1pcnJvckhlaWdodCArPSBib3hPdXRlci5oZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhLnN0eWxlLm92ZXJmbG93WSA9IG92ZXJmbG93IHx8ICdoaWRkZW4nO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0YUhlaWdodCAhPT0gbWlycm9ySGVpZ2h0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY29wZS4kZW1pdCgnZWxhc3RpYzpyZXNpemUnLCAkdGEsIHRhSGVpZ2h0LCBtaXJyb3JIZWlnaHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGEuc3R5bGUuaGVpZ2h0ID0gbWlycm9ySGVpZ2h0ICsgJ3B4JztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHNtYWxsIGRlbGF5IHRvIHByZXZlbnQgYW4gaW5maW5pdGUgbG9vcFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgMSwgZmFsc2UpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiBmb3JjZUFkanVzdCgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZGp1c3QoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgLypcbiAgICAgICAgICAgICAgICAgICAgICAgICAqIGluaXRpYWxpc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAqL1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBsaXN0ZW5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgnb25wcm9wZXJ0eWNoYW5nZScgaW4gdGEgJiYgJ29uaW5wdXQnIGluIHRhKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSUU5XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFbJ29uaW5wdXQnXSA9IHRhLm9ua2V5dXAgPSBhZGp1c3Q7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhWydvbmlucHV0J10gPSBhZGp1c3Q7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICR3aW4uYmluZCgncmVzaXplJywgZm9yY2VBZGp1c3QpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBzY29wZS4kd2F0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZ01vZGVsLiRtb2RlbFZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKG5ld1ZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yY2VBZGp1c3QoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBzY29wZS4kb24oJ2VsYXN0aWM6YWRqdXN0JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluaXRNaXJyb3IoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3JjZUFkanVzdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICR0aW1lb3V0KGFkanVzdCwgMCwgZmFsc2UpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvKlxuICAgICAgICAgICAgICAgICAgICAgICAgICogZGVzdHJveVxuICAgICAgICAgICAgICAgICAgICAgICAgICovXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHNjb3BlLiRvbignJGRlc3Ryb3knLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJG1pcnJvci5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkd2luLnVuYmluZCgncmVzaXplJywgZm9yY2VBZGp1c3QpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICBdKTtcblxuICAgIGFuZ3VsYXJcbiAgICAgICAgLm1vZHVsZSgnYXBwLm1lc3NhZ2VzJywgWydtb25vc3BhY2VkLmVsYXN0aWMnXSk7XG59KSgpO1xuXG5cblxuXG4iLCIoZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGFuZ3VsYXIubW9kdWxlKFwiYXBwLnByb2ZpbGVzXCIsIFsnYXBwLmF1dGgnXSk7XG59KSgpOyIsIihmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgYW5ndWxhci5tb2R1bGUoXCJhcHAuc2lkZW1lbnVcIiwgW10pO1xufSkoKTsiLCIoZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGFuZ3VsYXIubW9kdWxlKFwiYXBwLnVzZXJzXCIsIFsnYXBwLmF1dGgnXSk7XG59KSgpOyIsIihmdW5jdGlvbigpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBhbmd1bGFyLm1vZHVsZShcImFwcC5hdXRoXCIpXG5cbiAgICAgICAgLmNvbnRyb2xsZXIoXCJhdXRoQ29udHJvbGxlclwiLCBhdXRoQ29udHJvbGxlcik7XG5cblxuICAgIGZ1bmN0aW9uIGF1dGhDb250cm9sbGVyKCRzY29wZSwgYXV0aFNlcnZpY2UsICRpb25pY1BvcHVwLCAkaW9uaWNMb2FkaW5nLCAkc3RhdGUsICR0aW1lb3V0KSB7XG5cbiAgICAgICAgJHNjb3BlLmRhdGEgPSB7fTtcblxuICAgICAgICAkc2NvcGUubG9naW4gPSBmdW5jdGlvbigpIHtcblx0XHRcdCRpb25pY0xvYWRpbmcuc2hvdygpO1xuXG5cdFx0XHRhdXRoU2VydmljZS5sb2dpbigkc2NvcGUuZGF0YS51c2VybmFtZSwgJHNjb3BlLmRhdGEucGFzc3dvcmQpLnN1Y2Nlc3MoZnVuY3Rpb24odXNlcikge1xuXHRcdFx0XHQkaW9uaWNMb2FkaW5nLmhpZGUoKTtcblx0XHRcdFx0JHN0YXRlLmdvKCdhcHAuYnVpbGRpbmdzJyk7XG5cbiAgICAgICAgICAgIH0pLmVycm9yKGZ1bmN0aW9uKGVycm9yKSB7XG5cdFx0XHRcdCR0aW1lb3V0KGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdCRpb25pY0xvYWRpbmcuaGlkZSgpO1xuXHRcdFx0XHR9LCAxMDApO1xuXG4gICAgICAgICAgICAgICAgdmFyIGFsZXJ0UG9wdXAgPSAkaW9uaWNQb3B1cC5hbGVydCh7XG4gICAgICAgICAgICAgICAgICAgIHRpdGxlOiAnTG9naW4gZmFpbGVkIScsXG4gICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlOiBlcnJvci5tZXNzYWdlIC8vJ1BsZWFzZSBjaGVjayB5b3VyIGNyZWRlbnRpYWxzISdcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cblx0XHQkc2NvcGUuZmFjZWJvb2tMb2dpbiA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIGFsZXJ0UG9wdXAgPSAkaW9uaWNQb3B1cC5hbGVydCh7XG5cdFx0XHRcdHRpdGxlOiAnRmFjZWJvb2sgbG9naW4nLFxuXHRcdFx0XHR0ZW1wbGF0ZTogJ1BsYW5uZWQhJ1xuXHRcdFx0fSk7XG4gICAgICAgIH1cbiAgICB9XG59KSgpOyIsIihmdW5jdGlvbigpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBhbmd1bGFyLm1vZHVsZShcImFwcC5hdXRoXCIpXG5cbiAgICAgICAgLnNlcnZpY2UoXCJhdXRoU2VydmljZVwiLCBhdXRoU2VydmljZSk7XG5cblx0ZnVuY3Rpb24gY3JlYXRlVXNlcih1c2VybmFtZSwgcGFzc3dvcmQpIHtcblx0XHR2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuXHRcdHZhciBhdXRoID0gZmlyZWJhc2VTZXJ2aWNlLmZiLmF1dGgoKTtcblxuXHRcdHJldHVybiBhdXRoLmNyZWF0ZVVzZXJXaXRoRW1haWxBbmRQYXNzd29yZChlbWFpbCwgcGFzc3dvcmQpO1xuXHR9XG5cdFxuICAgIGZ1bmN0aW9uIGF1dGhTZXJ2aWNlKCRxLCAkcm9vdFNjb3BlLCBidWlsZGluZ3NTZXJ2aWNlLCBnbG9iYWxzU2VydmljZSkge1xuXHRcdHZhciBhdXRoID0gZmlyZWJhc2UuYXV0aCgpO1xuXHRcdFxuXHRcdCRyb290U2NvcGUuJG9uKCd1c2VyLWNoYW5nZWQnLCBmdW5jdGlvbigpIHtcblx0XHRcdHZhciB1c3IgPSBmaXJlYmFzZS5hdXRoKCkuY3VycmVudFVzZXI7XG5cdFx0XHRpZiAodXNyID09IG51bGwpIHtcblx0XHRcdFx0Z2xvYmFsc1NlcnZpY2UudXNlciA9IG51bGw7XG5cdFx0XHRcdHJldHVyblxuXHRcdFx0fTtcblx0XHRcdFxuXHRcdFx0Z2xvYmFsc1NlcnZpY2UudXNlciA9IHVzcjtcblx0XHRcdFxuXHRcdFx0dmFyIHJlZiA9IGZpcmViYXNlLmRhdGFiYXNlKCkucmVmKCd1c2Vycy8nICsgdXNyLnVpZCk7XG5cdFx0XHRyZWYuY2hpbGQoJ25hbWUnKS5zZXQodXNyLmRpc3BsYXlOYW1lKTtcblx0XHRcdHJlZi5jaGlsZCgnZW1haWwnKS5zZXQodXNyLmVtYWlsKTtcblx0XHRcdHJlZi5jaGlsZCgnbGFzdEFjdGl2aXR5Jykuc2V0KG5ldyBEYXRlKCkuZ2V0VGltZSgpKTtcblx0XHR9KTtcblxuXHRcdHJldHVybiB7XG4gICAgICAgICAgICBsb2dpbjogZnVuY3Rpb24odXNlcm5hbWUsIHBhc3N3b3JkKSB7XG4gICAgICAgICAgICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICAgICAgICB2YXIgcHJvbWlzZSA9IGRlZmVycmVkLnByb21pc2U7XG5cblx0XHRcdFx0dmFyIHN1Y2Nlc3NIYW5kbGVyID0gZnVuY3Rpb24oaW5mbykge1xuXHRcdFx0XHRcdGluZm8uaXNOZXcgPSBpbmZvLmRpc3BsYXlOYW1lID09IG51bGw7XG5cdFx0XHRcdFx0ZGVmZXJyZWQucmVzb2x2ZShpbmZvKTtcblx0XHRcdFx0XHRcdFx0XHRcdFxuXHRcdFx0XHRcdCRyb290U2NvcGUuJGVtaXQoJ3VzZXItY2hhbmdlZCcpO1xuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdHZhciBlcnJvckhhbmRsZXIgPSBmdW5jdGlvbihlcnJvcikge1xuXHRcdFx0XHRcdGRlZmVycmVkLnJlamVjdChlcnJvcik7XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0YXV0aC5zaWduSW5XaXRoRW1haWxBbmRQYXNzd29yZCh1c2VybmFtZSwgcGFzc3dvcmQpXG5cdFx0XHRcdFx0LnRoZW4oc3VjY2Vzc0hhbmRsZXIsIGZ1bmN0aW9uIGVycm9yKGVycm9yKSB7XG5cdFx0XHRcdFx0XHRpZiAoZXJyb3IuY29kZSA9PSBcImF1dGgvdXNlci1ub3QtZm91bmRcIikge1xuXHRcdFx0XHRcdFx0XHRhdXRoLmNyZWF0ZVVzZXJXaXRoRW1haWxBbmRQYXNzd29yZCh1c2VybmFtZSwgcGFzc3dvcmQpXG5cdFx0XHRcdFx0XHRcdFx0LnRoZW4oc3VjY2Vzc0hhbmRsZXIsIGVycm9ySGFuZGxlcik7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRcdFx0ZXJyb3JIYW5kbGVyKGVycm9yKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9KTtcblxuICAgICAgICAgICAgICAgIHByb21pc2Uuc3VjY2VzcyA9IGZ1bmN0aW9uKGZuKSB7XG4gICAgICAgICAgICAgICAgICAgIHByb21pc2UudGhlbihmbik7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBwcm9taXNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBwcm9taXNlLmVycm9yID0gZnVuY3Rpb24oZm4pIHtcbiAgICAgICAgICAgICAgICAgICAgcHJvbWlzZS50aGVuKG51bGwsIGZuKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBwcm9taXNlO1xuICAgICAgICAgICAgfSxcblxuXHRcdFx0bG9nb3V0OiBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdGF1dGguc2lnbk91dCgpO1xuXHRcdFx0XHRnbG9iYWxzU2VydmljZS51c2VyID0gbnVsbDtcblx0XHRcdH0sXG5cbiAgICAgICAgICAgIHVzZXI6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRyZXR1cm4gZmlyZWJhc2UuYXV0aCgpLmN1cnJlbnRVc2VyO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufSkoKTtcbiIsIihmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgYW5ndWxhci5tb2R1bGUoXCJhcHAuYnVpbGRpbmdzXCIpXG5cbiAgICAgICAgLmNvbnRyb2xsZXIoXCJidWlsZGluZ0NvbnRyb2xsZXJcIiwgYnVpbGRpbmdDb250cm9sbGVyKTtcblxuXG4gICAgZnVuY3Rpb24gYnVpbGRpbmdDb250cm9sbGVyKCRzY29wZSwgJGlvbmljTG9hZGluZywgJHN0YXRlUGFyYW1zLCBjaGFubmVsc1NlcnZpY2UpIHtcblxuICAgICAgICB2YXIgcmVmID0gY2hhbm5lbHNTZXJ2aWNlLmdldENoYW5uZWxzRnJvbSgkc3RhdGVQYXJhbXMuYnVpbGRpbmdJZCk7XG5cbiAgICAgICAgJGlvbmljTG9hZGluZy5zaG93KCk7XG4gICAgICAgIHJlZi5vbihcInZhbHVlXCIsIGZ1bmN0aW9uIChzbmFwc2hvdCkge1xuICAgICAgICAgICAgdmFyIHZhbCA9IHNuYXBzaG90LnZhbCgpO1xuXG4gICAgICAgICAgICBpZiAodmFsKSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLmNoYW5uZWxzID0gdmFsLmNoYW5uZWxzO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG5cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgICRpb25pY0xvYWRpbmcuaGlkZSgpO1xuXG4gICAgICAgIH0sIGZ1bmN0aW9uIChlcnJvck9iamVjdCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJlcnJvciByZWFkaW5nOiBcIiArIGVycm9yT2JqZWN0LmNvZGUpO1xuICAgICAgICAgICAgdmFyIGFsZXJ0UG9wdXAgPSAkaW9uaWNQb3B1cC5hbGVydCh7XG4gICAgICAgICAgICAgICAgdGl0bGU6ICdPcHMhJyxcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZTogJ1NvcnJ5ISBBbiBlcnJvciBvY3VycmVkLidcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgJGlvbmljTG9hZGluZy5oaWRlKCk7XG4gICAgICAgIH0pO1xuXG4gICAgfVxufSkoKTsiLCIoZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGFuZ3VsYXIubW9kdWxlKFwiYXBwLmJ1aWxkaW5nc1wiKVxuXG4gICAgICAgIC5jb250cm9sbGVyKFwiYnVpbGRpbmdzQ29udHJvbGxlclwiLCBidWlsZGluZ3NDb250cm9sbGVyKTtcblxuXG4gICAgZnVuY3Rpb24gYnVpbGRpbmdzQ29udHJvbGxlcigkc2NvcGUsICRpb25pY0xvYWRpbmcsIGJ1aWxkaW5nc1NlcnZpY2UsIGdsb2JhbHNTZXJ2aWNlKSB7XG4gICAgICAgIHZhciByZWYgPSBidWlsZGluZ3NTZXJ2aWNlLmdldEJ1aWxkaW5ncygpO1xuXHRcdFxuXHRcdCRzY29wZS5zZWxlY3RlZEtleSA9IGdsb2JhbHNTZXJ2aWNlLmJ1aWxkaW5nID8gZ2xvYmFsc1NlcnZpY2UuYnVpbGRpbmcua2V5IDogbnVsbDtcblx0XHRcblx0XHQkc2NvcGUuc2VsZWN0ID0gZnVuY3Rpb24oa2V5LCBidWlsZGluZykge1xuXHRcdFx0JHNjb3BlLnNlbGVjdGVkS2V5ID0gYnVpbGRpbmcua2V5ID0ga2V5O1xuXHRcdFx0Z2xvYmFsc1NlcnZpY2UuYnVpbGRpbmcgPSBidWlsZGluZztcblx0XHRcdCRzY29wZS4kZW1pdChcImJ1aWxkaW5nLXNlbGVjdGVkXCIsIGJ1aWxkaW5nKTtcblx0XHR9O1x0XHRcblxuICAgICAgICAkaW9uaWNMb2FkaW5nLnNob3coKTtcbiAgICAgICAgcmVmLm9uKFwidmFsdWVcIiwgZnVuY3Rpb24gKHNuYXBzaG90KSB7XG4gICAgICAgICAgICAkc2NvcGUuYnVpbGRpbmdzID0gc25hcHNob3QudmFsKCk7XG4gICAgICAgICAgICAkaW9uaWNMb2FkaW5nLmhpZGUoKTtcbiAgICAgICAgfSwgZnVuY3Rpb24gKGVycm9yT2JqZWN0KSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcImVycm9yIHJlYWRpbmc6IFwiICsgZXJyb3JPYmplY3QuY29kZSk7XG4gICAgICAgICAgICB2YXIgYWxlcnRQb3B1cCA9ICRpb25pY1BvcHVwLmFsZXJ0KHtcbiAgICAgICAgICAgICAgICB0aXRsZTogJ09wcyEnLFxuICAgICAgICAgICAgICAgIHRlbXBsYXRlOiAnU29ycnkhIEFuIGVycm9yIG9jdXJyZWQnXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICRpb25pY0xvYWRpbmcuaGlkZSgpO1xuICAgICAgICB9KTtcbiAgICB9XG59KSgpOyIsIihmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgYW5ndWxhclxuICAgICAgICAubW9kdWxlKCdhcHAuYnVpbGRpbmdzJylcbiAgICAgICAgLnNlcnZpY2UoJ2J1aWxkaW5nc1NlcnZpY2UnLCBidWlsZGluZ3NTZXJ2aWNlKTtcblxuICAgIGZ1bmN0aW9uIGJ1aWxkaW5nc1NlcnZpY2UoZmlyZWJhc2VTZXJ2aWNlLCAkcm9vdFNjb3BlKSB7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGdldEJ1aWxkaW5nczogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmaXJlYmFzZS5kYXRhYmFzZSgpLnJlZignYnVpbGRpbmdzJylcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn0pKCk7XG4iLCIoZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGFuZ3VsYXJcbiAgICAgICAgLm1vZHVsZSgnYXBwLmNoYW5uZWxzJylcbiAgICAgICAgLnNlcnZpY2UoJ2NoYW5uZWxzU2VydmljZScsIGNoYW5uZWxzU2VydmljZSk7XG5cbiAgICBmdW5jdGlvbiBjaGFubmVsc1NlcnZpY2UoJHJvb3RTY29wZSkge1xuXHRcdHZhciBzZXJ2aWNlID0ge307XG5cdFx0XG5cdFx0c2VydmljZS5jaGFubmVscyA9IHtcblx0XHRcdFwibGFuZGxvcmRcIjogXCJUYWxrIHRvIGxhbmRsb3JkXCIsXG5cdFx0XHRcImdlbmVyYWxcIjogXCJHZW5lcmFsXCIsXG5cdFx0XHRcInBhcmtpbmdcIjogXCJQYXJraW5nIEdhcmFnZVwiLFxuXHRcdFx0XCJnYXJkZW5cIjogXCJHYXJkZW5cIixcblx0XHRcdFwibG9zdGZvdW5kXCI6IFwiTG9zdCAmIEZvdW5kXCIsXG5cdFx0XHRcIm1haW50ZW5hbmNlXCI6IFwiUmVxdWVzdCBNYWludGVuYW5jZVwiXG5cdFx0fTtcblx0XHRcblx0XHQkcm9vdFNjb3BlLiRvbihcImJ1aWxkaW5nLXNlbGVjdGVkXCIsIGZ1bmN0aW9uKGJ1aWxkaW5nKSB7XG5cdFx0XHQvL2NvdW50IGhvdyBtYW55IG5ldyBtZXNzYWdlcyBlYWNoIGNoYW5uZWwgaGFzXG5cdFx0fSk7XG5cdFx0XG5cdFx0c2VydmljZS5nZXRDaGFubmVsc0Zyb20gPSBmdW5jdGlvbiAoYnVpbGRpbmcpIHtcblx0XHRcdHJldHVybiBmaXJlYmFzZS5kYXRhYmFzZSgpLnJlZignYnVpbGRpbmdzLycgKyBidWlsZGluZyArIFwiL2NoYW5uZWxzXCIpO1xuXHRcdH07XG5cbiAgICAgICAgcmV0dXJuIHNlcnZpY2U7XG4gICAgfVxufSkoKTtcblxuIiwiKGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBhbmd1bGFyXG4gICAgICAgIC5tb2R1bGUoJ2FwcC5kaXJlY3RtZXNzYWdlcycpXG4gICAgICAgIC5jb250cm9sbGVyKCdkaXJlY3RNZXNzYWdlc0NvbnRyb2xsZXInLCBbXG4gICAgICAgICAgICAnJHNjb3BlJyxcbiAgICAgICAgICAgICckc3RhdGUnLFxuICAgICAgICAgICAgJyRpb25pY0xvYWRpbmcnLFxuICAgICAgICAgICAgJ2RpcmVjdE1lc3NhZ2VzU2VydmljZScsXG4gICAgICAgICAgICAnZ2xvYmFsc1NlcnZpY2UnLFxuICAgICAgICAgICAgZGlyZWN0TWVzc2FnZXNDb250cm9sbGVyXG4gICAgICAgIF0pO1xuXG4gICAgZnVuY3Rpb24gZGlyZWN0TWVzc2FnZXNDb250cm9sbGVyKCRzY29wZSwgJHN0YXRlLCAkaW9uaWNMb2FkaW5nLCBjb250YWN0c1NlcnZpY2UsIGdsb2JhbHNTZXJ2aWNlKSB7XG5cbiAgICAgICAgZ2V0Q29udGFjdHMoZ2V0VXNlcigpKTtcblxuICAgICAgICBmdW5jdGlvbiBnZXRVc2VyKCkge1xuXG4gICAgICAgICAgICBpZiAoIWdsb2JhbHNTZXJ2aWNlLnVzZXIpIHtcbiAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2xvZ2luJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gZ2xvYmFsc1NlcnZpY2UudXNlcjtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGdldENvbnRhY3RzKHVzZXIpIHtcbiAgICAgICAgICAgICRpb25pY0xvYWRpbmcuc2hvdygpO1xuICAgICAgICAgICAgdmFyIHJlZiA9IGNvbnRhY3RzU2VydmljZS5nZXRVc2VyQ29udGFjdHModXNlci51aWQpO1xuXG4gICAgICAgICAgICByZWYub24oXCJ2YWx1ZVwiLCBmdW5jdGlvbiAoc25hcHNob3QpIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUuY29udGFjdHMgPSBzbmFwc2hvdC52YWwoKTtcbiAgICAgICAgICAgICAgICAkaW9uaWNMb2FkaW5nLmhpZGUoKTtcblxuICAgICAgICAgICAgfSwgZnVuY3Rpb24gKGVycm9yT2JqZWN0KSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJlcnJvciByZWFkaW5nOiBcIiArIGVycm9yT2JqZWN0LmNvZGUpO1xuICAgICAgICAgICAgICAgICRpb25pY0xvYWRpbmcuaGlkZSgpO1xuICAgICAgICAgICAgICAgIHZhciBhbGVydFBvcHVwID0gJGlvbmljUG9wdXAuYWxlcnQoe1xuICAgICAgICAgICAgICAgICAgICB0aXRsZTogJ09wcyEnLFxuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZTogJ1NvcnJ5ISBBbiBlcnJvciBvY3VycmVkLidcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxufSkoKTsiLCIoZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGFuZ3VsYXJcbiAgICAgICAgLm1vZHVsZSgnYXBwLmRpcmVjdG1lc3NhZ2VzJylcbiAgICAgICAgLnNlcnZpY2UoJ2RpcmVjdE1lc3NhZ2VzU2VydmljZScsIGRpcmVjdE1lc3NhZ2VzU2VydmljZSk7XG5cbiAgICBmdW5jdGlvbiBkaXJlY3RNZXNzYWdlc1NlcnZpY2UoZmlyZWJhc2VTZXJ2aWNlKSB7XG4gICAgICAgIHZhciBzZXJ2aWNlID0ge307XG5cbiAgICAgICAgc2VydmljZS5nZXRVc2VyQ29udGFjdHMgPSBmdW5jdGlvbiAodXNlcikge1xuICAgICAgICAgICAgcmV0dXJuIGZpcmViYXNlU2VydmljZS5mYi5kYXRhYmFzZSgpLnJlZigndXNlcnMvJyArIHVzZXIgKyAnL2NvbnRhY3RzJyk7XG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIHNlcnZpY2U7XG4gICAgfVxufSkoKTtcbiIsIihmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgYW5ndWxhclxuICAgICAgICAubW9kdWxlKCdhcHAuZmlyZWJhc2UnKVxuICAgICAgICAuc2VydmljZSgnZmlyZWJhc2VTZXJ2aWNlJywgZmlyZWJhc2VTZXJ2aWNlKTtcblxuXG4gICAgZnVuY3Rpb24gZmlyZWJhc2VTZXJ2aWNlKCkge1xuICAgICAgICB2YXIgY29uZmlnID0ge1xuICAgICAgICAgICAgYXBpS2V5OiBcIkFJemFTeUI1cTgxQUdHb3g0aTgtUUwyS090bkREZmkwNWlyZ2NIRVwiLFxuICAgICAgICAgICAgYXV0aERvbWFpbjogXCJzb2NpYWxzdHJhdGFpZGVhdGVhbS5maXJlYmFzZWFwcC5jb21cIixcbiAgICAgICAgICAgIGRhdGFiYXNlVVJMOiBcImh0dHBzOi8vc29jaWFsc3RyYXRhaWRlYXRlYW0uZmlyZWJhc2Vpby5jb21cIixcbiAgICAgICAgICAgIHN0b3JhZ2VCdWNrZXQ6IFwiXCIsXG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5mYiA9IGZpcmViYXNlLmluaXRpYWxpemVBcHAoY29uZmlnKTtcbiAgICB9XG59KSgpO1xuIiwiKGZ1bmN0aW9uKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGFuZ3VsYXJcbiAgICAgICAgLm1vZHVsZSgnYXBwLm1lc3NhZ2VzJylcbiAgICAgICAgLmNvbnRyb2xsZXIoJ21lc3NhZ2VzQ29udHJvbGxlcicsIFtcbiAgICAgICAgICAgICckc2NvcGUnLFxuICAgICAgICAgICAgJyRzdGF0ZScsXG4gICAgICAgICAgICAnJHN0YXRlUGFyYW1zJyxcbiAgICAgICAgICAgICckaW9uaWNTY3JvbGxEZWxlZ2F0ZScsXG4gICAgICAgICAgICAnJHRpbWVvdXQnLFxuICAgICAgICAgICAgJ2NoYW5uZWxzU2VydmljZScsXG4gICAgICAgICAgICAnZ2xvYmFsc1NlcnZpY2UnLFxuICAgICAgICAgICAgTWVzc2FnZXNDb250cm9sbGVyXG4gICAgICAgIF0pO1xuXG4gICAgZnVuY3Rpb24gTWVzc2FnZXNDb250cm9sbGVyKCRzY29wZSwgJHN0YXRlLCAkc3RhdGVQYXJhbXMsICRpb25pY1Njcm9sbERlbGVnYXRlLCAkdGltZW91dCwgY2hhbm5lbHNTZXJ2aWNlLCBnbG9iYWxzU2VydmljZSkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgLy9hdmFpbGFibGUgc2VydmljZXNcbiAgICAgICAgdGhpcy4kc2NvcGUgPSAkc2NvcGU7XG4gICAgICAgIHRoaXMuJHN0YXRlID0gJHN0YXRlO1xuICAgICAgICB0aGlzLiRzdGF0ZVBhcmFtcyA9ICRzdGF0ZVBhcmFtcztcbiAgICAgICAgdGhpcy4kaW9uaWNTY3JvbGxEZWxlZ2F0ZSA9ICRpb25pY1Njcm9sbERlbGVnYXRlO1xuICAgICAgICB0aGlzLiR0aW1lb3V0ID0gJHRpbWVvdXQ7XG4gICAgICAgIHRoaXMuY2hhbm5lbHNTZXJ2aWNlID0gY2hhbm5lbHNTZXJ2aWNlO1xuICAgICAgICB0aGlzLmdsb2JhbHNTZXJ2aWNlID0gZ2xvYmFsc1NlcnZpY2U7XG5cbiAgICAgICAgaWYgKCF0aGlzLnZhbGlkYXRlKCkpXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG5cbiAgICAgICAgLy9jdXN0b20gcHJvcGVydGllc1xuICAgICAgICB0aGlzLmJ1aWxkaW5nS2V5ID0gZ2xvYmFsc1NlcnZpY2UuYnVpbGRpbmcua2V5O1xuICAgICAgICB0aGlzLmNoYW5uZWxLZXkgPSAkc3RhdGVQYXJhbXMuY2hhbm5lbElkO1xuXHRcdHRoaXMudG9Vc2VySWQgPSAkc3RhdGVQYXJhbXMudXNlcklkO1xuXHRcdHRoaXMubW9kZSA9ICRzdGF0ZVBhcmFtcy51c2VySWQgPyBcImNoYXRcIiA6IFwiY2hhbm5lbFwiO1xuICAgICAgICB0aGlzLm1lc3NhZ2VSZWY7XG5cbiAgICAgICAgJHNjb3BlLnVzZXIgPSB7XG4gICAgICAgICAgICBpZDogJHNjb3BlLnVzZXIudWlkLFxuICAgICAgICAgICAgcGljOiAnaHR0cDovL2lvbmljZnJhbWV3b3JrLmNvbS9pbWcvZG9jcy9tY2ZseS5qcGcnLFxuICAgICAgICAgICAgbmFtZTogZ2xvYmFsc1NlcnZpY2UudXNlci5kaXNwbGF5TmFtZSA/IGdsb2JhbHNTZXJ2aWNlLnVzZXIuZGlzcGxheU5hbWUgOiAnVW5kZWZpbmVkJ1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5jaGFubmVsS2V5ID0gdGhpcy5jaGFubmVsS2V5OyAvL3RvIHVzZSBpbiBzZW5kTWVzc2FnZVxuICAgICAgICAkc2NvcGUudG9Vc2VyO1xuICAgICAgICAkc2NvcGUubWVzc2FnZXMgPSBbXTtcbiAgICAgICAgJHNjb3BlLmlucHV0TWVzc2FnZSA9ICcnO1xuICAgICAgICAkc2NvcGUuc2VuZE1lc3NhZ2UgPSBmdW5jdGlvbihtc2cpIHtcbiAgICAgICAgICAgIHNlbGYuZG9TZW5kTWVzc2FnZShzZWxmLCBtc2cpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vVUkgZWxlbWVudHNcbiAgICAgICAgdGhpcy52aWV3U2Nyb2xsID0gJGlvbmljU2Nyb2xsRGVsZWdhdGUuJGdldEJ5SGFuZGxlKCd1c2VyTWVzc2FnZVNjcm9sbCcpO1xuICAgICAgICB0aGlzLmZvb3RlckJhciA9IGRvY3VtZW50LmJvZHkucXVlcnlTZWxlY3RvcignI3VzZXJNZXNzYWdlc1ZpZXcgLmJhci1mb290ZXInKTtcbiAgICAgICAgdGhpcy5zY3JvbGxlciA9IGRvY3VtZW50LmJvZHkucXVlcnlTZWxlY3RvcignI3VzZXJNZXNzYWdlc1ZpZXcgLnNjcm9sbC1jb250ZW50Jyk7XG4gICAgICAgIHRoaXMudHh0SW5wdXQgPSBhbmd1bGFyLmVsZW1lbnQodGhpcy5mb290ZXJCYXIucXVlcnlTZWxlY3RvcigndGV4dGFyZWEnKSk7XG5cbiAgICAgICAgLy9ldmVudHNcbiAgICAgICAgJHNjb3BlLiRvbihcImNoYXQtcmVjZWl2ZS1tZXNzYWdlXCIsIHRoaXMub25SZWNlaXZlTWVzc2FnZSk7XG5cbiAgICAgICAgJHNjb3BlLiRvbignJGlvbmljVmlldy5iZWZvcmVMZWF2ZScsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgc2VsZi5tZXNzYWdlUmVmLm9mZignY2hpbGRfYWRkZWQnKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5pbml0KCk7XG4gICAgfVxuXG4gICAgTWVzc2FnZXNDb250cm9sbGVyLnByb3RvdHlwZS52YWxpZGF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoIXRoaXMuZ2xvYmFsc1NlcnZpY2UudXNlcikge1xuICAgICAgICAgICAgdGhpcy4kc3RhdGUuZ28oJ2xvZ2luJyk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXRoaXMuZ2xvYmFsc1NlcnZpY2UuYnVpbGRpbmcpIHtcbiAgICAgICAgICAgIHRoaXMuJHN0YXRlLmdvKCdhcHAuYnVpbGRpbmdzJyk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9O1xuXG4gICAgLy9DaGVjayBpZiBpcyBhIENvbW1vbiBSb29tIG9yIERpcmVjdCBNZXNzYWdlXG4gICAgTWVzc2FnZXNDb250cm9sbGVyLnByb3RvdHlwZS5pbml0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcblx0XHRcblx0XHRpZiAoc2VsZi5tb2RlID09IFwiY2hhbm5lbFwiKVxuXHRcdHtcblx0XHRcdHZhciBjaGFubmVsUGF0aCA9IFsnYnVpbGRpbmdzJywgdGhpcy5idWlsZGluZ0tleSwgJ2NoYW5uZWxzJywgdGhpcy4kc3RhdGVQYXJhbXMuY2hhbm5lbElkXS5qb2luKCcvJyk7XG5cdFx0XHRjb25zb2xlLmxvZyhjaGFubmVsUGF0aCk7XG5cblx0XHRcdHZhciBjaGFubmVsUmVmID0gZmlyZWJhc2UuZGF0YWJhc2UoKS5yZWYoY2hhbm5lbFBhdGgpO1xuXHRcdFx0Y2hhbm5lbFJlZi5vbmNlKCd2YWx1ZScsIGZ1bmN0aW9uKHNuYXBzaG90KSB7XG5cdFx0XHRcdHNlbGYuY2hhbm5lbCA9IHNuYXBzaG90LnZhbCgpO1xuXG5cdFx0XHRcdGlmIChzZWxmLmNoYW5uZWwudHlwZSA9PSBcImRpcmVjdFwiKSB7IC8vZGlyZWN0IG1lc3NhZ2Vcblx0XHRcdFx0XHRzZWxmLnNldENvbnRhY3Qoc2VsZi5jaGFubmVsLnVzZXIpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGVsc2UgeyAvL0NvbW1vbiByb29tXG5cdFx0XHRcdFx0c2VsZi5nZXRMYXN0TWVzc2FnZXMoKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fVxuXHRcdGVsc2UgeyAvL2NoYXRcblx0XHRcdHNlbGYuc2V0Q29udGFjdChzZWxmLnRvVXNlcklkKTtcblx0XHR9XG5cbiAgICB9O1xuXG4gICAgTWVzc2FnZXNDb250cm9sbGVyLnByb3RvdHlwZS5zZXRDb250YWN0ID0gZnVuY3Rpb24odWlkKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgICB2YXIgY29udGFjdFBhdGggPSBbJ3VzZXJzJywgdWlkXS5qb2luKCcvJyk7XG4gICAgICAgIGNvbnNvbGUubG9nKGNvbnRhY3RQYXRoKTtcblxuICAgICAgICBmaXJlYmFzZS5kYXRhYmFzZSgpLnJlZihjb250YWN0UGF0aCkub25jZSgndmFsdWUnLCBmdW5jdGlvbihzbmFwc2hvdCkge1xuICAgICAgICAgICAgdmFyIGNvbnRhY3QgPSBzbmFwc2hvdC52YWwoKTtcbiAgICAgICAgICAgIHNlbGYuJHNjb3BlLnRvVXNlciA9IHNlbGYudG9Vc2VyID0ge1xuICAgICAgICAgICAgICAgIHVzZXJJZDogdWlkLFxuICAgICAgICAgICAgICAgIHVzZXJQaWM6ICdodHRwOi8vaW9uaWNmcmFtZXdvcmsuY29tL2ltZy9kb2NzL3ZlbmttYW4uanBnJyxcbiAgICAgICAgICAgICAgICB1c2VyTmFtZTogY29udGFjdCAmJiBjb250YWN0LmRpc3BsYXlOYW1lID8gY29udGFjdC5kaXNwbGF5TmFtZSA6ICdVbmRlZmluZWQnXG4gICAgICAgICAgICB9O1xuXHRcdFx0XG4gICAgICAgICAgICBzZWxmLmdldExhc3RNZXNzYWdlcygpO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgTWVzc2FnZXNDb250cm9sbGVyLnByb3RvdHlwZS5nZXRMYXN0TWVzc2FnZXMgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgbXNnUGF0aCA9IFsnYnVpbGRpbmdzJywgc2VsZi5idWlsZGluZ0tleSwgJ21lc3NhZ2VzJ10uam9pbignLycpO1xuXHRcdFxuXHRcdGlmIChzZWxmLm1vZGUgPT0gXCJjaGF0XCIpXG5cdFx0XHRtc2dQYXRoID0gXCJtZXNzYWdlc1wiO1xuXG4gICAgICAgIHNlbGYubWVzc2FnZVJlZiA9IGZpcmViYXNlLmRhdGFiYXNlKCkucmVmKG1zZ1BhdGgpO1xuICAgICAgICBzZWxmLm1lc3NhZ2VSZWYub3JkZXJCeUNoaWxkKCdjaGFubmVsJykuZXF1YWxUbyhzZWxmLmNoYW5uZWxLZXkpXG4gICAgICAgICAgICAubGltaXRUb0xhc3QoMTAwKVxuICAgICAgICAgICAgLm9uKCd2YWx1ZScsIGZ1bmN0aW9uKHMpIHtcbiAgICAgICAgICAgICAgICBzZWxmLiRzY29wZS5tZXNzYWdlcyA9IHMudmFsKCk7XG5cbiAgICAgICAgICAgICAgICBzZWxmLiR0aW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLnZpZXdTY3JvbGwuc2Nyb2xsQm90dG9tKHRydWUpO1xuICAgICAgICAgICAgICAgIH0sIDEwKTtcbiAgICAgICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBNZXNzYWdlc0NvbnRyb2xsZXIucHJvdG90eXBlLmRvU2VuZE1lc3NhZ2UgPSBmdW5jdGlvbihzZWxmLCBtc2cpIHtcbiAgICAgICAgdmFyIG1lc3NhZ2UgPSB7XG4gICAgICAgICAgICBkYXRlOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgICAgICBjaGFubmVsOiBzZWxmLmNoYW5uZWxLZXksXG4gICAgICAgICAgICB0ZXh0OiBtc2csXG4gICAgICAgICAgICB1c2VyTmFtZTogc2VsZi4kc2NvcGUudXNlci5uYW1lLFxuICAgICAgICAgICAgdXNlcklkOiBzZWxmLiRzY29wZS51c2VyLmlkLFxuICAgICAgICAgICAgdXNlclBpYzogc2VsZi4kc2NvcGUudXNlci5waWNcbiAgICAgICAgfTtcblxuICAgICAgICBpZiAoc2VsZi50b1VzZXIpXG4gICAgICAgICAgICBtZXNzYWdlLnRvID0gc2VsZi50b1VzZXIudXNlcklkO1xuXG4gICAgICAgIHZhciBtc2dQYXRoID0gWydidWlsZGluZ3MnLCBzZWxmLmJ1aWxkaW5nS2V5LCAnbWVzc2FnZXMnXS5qb2luKCcvJyk7XG4gICAgICAgIGZpcmViYXNlLmRhdGFiYXNlKCkucmVmKG1zZ1BhdGgpLnB1c2gobWVzc2FnZSk7XG5cbiAgICAgICAgc2VsZi4kc2NvcGUuaW5wdXRNZXNzYWdlID0gJyc7XG5cbiAgICAgICAgc2VsZi4kdGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHNlbGYua2VlcEtleWJvYXJkT3BlbigpO1xuICAgICAgICAgICAgc2VsZi52aWV3U2Nyb2xsLnNjcm9sbEJvdHRvbSh0cnVlKTtcbiAgICAgICAgfSwgMCk7XG4gICAgfTtcblxuICAgIE1lc3NhZ2VzQ29udHJvbGxlci5wcm90b3R5cGUua2VlcEtleWJvYXJkT3BlbiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHNlbGYudHh0SW5wdXQub25lKCdibHVyJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygndGV4dGFyZWEgYmx1ciwgZm9jdXMgYmFjayBvbiBpdCcpO1xuICAgICAgICAgICAgc2VsZi50eHRJbnB1dFswXS5mb2N1cygpO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgTWVzc2FnZXNDb250cm9sbGVyLnByb3RvdHlwZS5vblByb2ZpbGVQaWNFcnJvciA9IGZ1bmN0aW9uKGVsZSkge1xuICAgICAgICB0aGlzLmVsZS5zcmMgPSAnJzsgLy9mYWxsYmFja1xuICAgIH07XG59KSgpO1xuXG5cblxuXG4iLCIoZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGFuZ3VsYXJcbiAgICAgICAgLm1vZHVsZSgnYXBwLm1lc3NhZ2VzJylcblxuICAgICAgICAuZmlsdGVyKCdubDJicicsIFsnJGZpbHRlcicsIG5sMmJyXSlcblxuICAgIGZ1bmN0aW9uIG5sMmJyKCRmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICAgICBpZiAoIWRhdGEpIHJldHVybiBkYXRhO1xuICAgICAgICAgICAgcmV0dXJuIGRhdGEucmVwbGFjZSgvXFxuXFxyPy9nLCAnPGJyIC8+Jyk7XG4gICAgICAgIH07XG4gICAgfVxufSkoKTsiLCIoZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGFuZ3VsYXJcbiAgICAgICAgLm1vZHVsZSgnYXBwLm1lc3NhZ2VzJylcbiAgICAgICAgLnNlcnZpY2UoJ21lc3NhZ2VzU2VydmljZScsIG1lc3NhZ2VzU2VydmljZSk7XG5cbiAgICBmdW5jdGlvbiBtZXNzYWdlc1NlcnZpY2UoZmlyZWJhc2VTZXJ2aWNlKSB7XG4gICAgICAgIHZhciBzZXJ2aWNlID0ge307XG5cdFx0XG4gICAgICAgIHNlcnZpY2UuZ2V0TWVzc2FnZXNSZWYgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gZmlyZWJhc2VTZXJ2aWNlLmZiLmRhdGFiYXNlKCkucmVmKCdtZXNzYWdlcycpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHNlcnZpY2UuYWRkTWVzc2FnZSA9IGZ1bmN0aW9uIChtZXNzYWdlKSB7XG4gICAgICAgICAgICByZXR1cm4gZmlyZWJhc2VTZXJ2aWNlLmZiLmRhdGFiYXNlKCkucHVzaChtZXNzYWdlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBzZXJ2aWNlO1xuICAgIH1cbn0pKCk7XG4iLCIoZnVuY3Rpb24oKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgYW5ndWxhci5tb2R1bGUoXCJhcHAucHJvZmlsZXNcIilcblxuICAgICAgICAuY29udHJvbGxlcihcInByb2ZpbGVDb250cm9sbGVyXCIsIHByb2ZpbGVDb250cm9sbGVyKTtcblxuXG4gICAgZnVuY3Rpb24gcHJvZmlsZUNvbnRyb2xsZXIoJHNjb3BlLCAkaW9uaWNMb2FkaW5nLCAkaW9uaWNQb3B1cCwgYXV0aFNlcnZpY2UsIHByb2ZpbGVzU2VydmljZSkge1xuXG5cdFx0dmFyIHVzZXIgPSBhdXRoU2VydmljZS51c2VyKCk7XG5cdFx0XG5cdFx0JHNjb3BlLmRhdGEgPSB7XG5cdFx0XHRkaXNwbGF5TmFtZSA6IHVzZXIgPyB1c2VyLmRpc3BsYXlOYW1lIDogXCJcIixcblx0XHRcdGVtYWlsIDogdXNlciA/IHVzZXIuZW1haWwgOiBcIlwiXG5cdFx0fTtcblxuICAgICAgICAkc2NvcGUudXBkYXRlID0gZnVuY3Rpb24oKSB7XG5cdFx0XHQkaW9uaWNMb2FkaW5nLnNob3coKTtcblxuICAgICAgICAgICAgcHJvZmlsZXNTZXJ2aWNlLnVwZGF0ZVByb2ZpbGUoJHNjb3BlLmRhdGEpLnRoZW4oZnVuY3Rpb24gc3VjY2Vzcyhtc2cpIHtcblx0XHRcdFx0JGlvbmljTG9hZGluZy5oaWRlKCk7XG5cblx0XHRcdFx0JGlvbmljUG9wdXAuYWxlcnQoe1xuICAgICAgICAgICAgICAgICAgICB0aXRsZTogJ1Byb2ZpbGVVcGRhdGUhJyxcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGU6IG1zZ1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICB9LCBmdW5jdGlvbiBlcnJvcihlcnJvcikge1xuXHRcdFx0XHQkaW9uaWNMb2FkaW5nLmhpZGUoKTtcblxuXHRcdFx0XHQkaW9uaWNQb3B1cC5hbGVydCh7XG4gICAgICAgICAgICAgICAgICAgIHRpdGxlOiAnVXBkYXRlIGZhaWxlZCEnLFxuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZTogZXJyb3IubWVzc2FnZVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG59KSgpOyIsIihmdW5jdGlvbigpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBhbmd1bGFyLm1vZHVsZShcImFwcC5wcm9maWxlc1wiKVxuXG4gICAgICAgIC5zZXJ2aWNlKFwicHJvZmlsZXNTZXJ2aWNlXCIsIHByb2ZpbGVzU2VydmljZSk7XG5cblxuICAgIGZ1bmN0aW9uIHByb2ZpbGVzU2VydmljZSgkcSwgJHJvb3RTY29wZSwgYXV0aFNlcnZpY2UpIHtcblx0XHRcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHVwZGF0ZVByb2ZpbGU6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuXG4gICAgICAgICAgICAgICAgYXV0aFNlcnZpY2UudXNlcigpLnVwZGF0ZVByb2ZpbGUoZGF0YSlcbiAgICAgICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gc3VjY2VzcygpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUoXCJQcm9maWxlIHVwZGF0ZWQhXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KCd1c2VyLWNoYW5nZWQnKTtcbiAgICAgICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gZXJyb3IoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlamVjdChlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9XG4gICAgfVxufSkoKTsiLCIoZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGFuZ3VsYXIubW9kdWxlKFwiYXBwLnNpZGVtZW51XCIpXG5cbiAgICAgICAgLmNvbnRyb2xsZXIoXCJzaWRlbWVudUNvbnRyb2xsZXJcIiwgc2lkZW1lbnVDb250cm9sbGVyKTtcblxuXG4gICAgZnVuY3Rpb24gc2lkZW1lbnVDb250cm9sbGVyKCRzY29wZSwgJHN0YXRlLCBjaGFubmVsc1NlcnZpY2UsIGF1dGhTZXJ2aWNlKSB7XG4gICAgICAgICRzY29wZS51c2VyID0gYXV0aFNlcnZpY2UudXNlcigpO1xuICAgICAgICAkc2NvcGUuY2hhbm5lbHMgPSBjaGFubmVsc1NlcnZpY2UuY2hhbm5lbHM7XG4gICAgICAgICRzY29wZS5idWlsZGluZyA9IHtcbiAgICAgICAgICAgIG5hbWU6IFwiU2VsZWN0IGEgYnVpbGRpbmdcIixcbiAgICAgICAgICAgIGFkZHJlc3M6IFwiXCIsXG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLiRvbignYnVpbGRpbmctc2VsZWN0ZWQnLCBmdW5jdGlvbiAoZXZlbnQsIGRhdGEpIHtcbiAgICAgICAgICAgICRzY29wZS5idWlsZGluZy5uYW1lID0gZGF0YS5uYW1lO1xuICAgICAgICAgICAgJHNjb3BlLmJ1aWxkaW5nLmFkZHJlc3MgPSBkYXRhLmFkZHJlc3M7XG5cbiAgICAgICAgfSk7XG5cbiAgICAgICAgJHNjb3BlLm9wZW5DaGFubmVsID0gZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgJHN0YXRlLmdvKCdhcHAuY2hhbm5lbCcsIHtjaGFubmVsSWQ6IGtleX0pO1xuICAgICAgICB9O1xuICAgIH1cbn0pKCk7XG4iLCIoZnVuY3Rpb24oKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgYW5ndWxhci5tb2R1bGUoXCJhcHAudXNlcnNcIilcblxuICAgICAgICAuc2VydmljZShcInVzZXJzU2VydmljZVwiLCB1c2Vyc1NlcnZpY2UpO1xuXG5cbiAgICBmdW5jdGlvbiB1c2Vyc1NlcnZpY2UoJHEsIGF1dGhTZXJ2aWNlKSB7XG5cdCAgICByZXR1cm4ge1xuICAgICAgICAgICAgdXBkYXRlUHJvZmlsZTogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG5cbiAgICAgICAgICAgICAgICBhdXRoU2VydmljZS51c2VyKCkudXBkYXRlUHJvZmlsZShkYXRhKVxuICAgICAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbiBzdWNjZXNzKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShcIlByb2ZpbGUgdXBkYXRlZCFcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICB1c2VyID0gZmlyZWJhc2UuYXV0aCgpLmN1cnJlbnRVc2VyO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KCd1c2VyLWNoYW5nZWQnKTtcbiAgICAgICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gZXJyb3IoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlamVjdChlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9XG4gICAgfVxufSkoKTsiLCIoZnVuY3Rpb24oKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgYW5ndWxhclxuXG4gICAgICAgIC5tb2R1bGUoJ2FwcCcsIFtcbiAgICAgICAgICAgICdpb25pYycsXG4gICAgICAgICAgICAnbW9ub3NwYWNlZC5lbGFzdGljJyxcblxuICAgICAgICAgICAgJ2FwcC5maXJlYmFzZScsXG4gICAgICAgICAgICAnYXBwLmZpcmViYXNlJyxcbiAgICAgICAgICAgICdhcHAuYXV0aCcsXG4gICAgICAgICAgICAnYXBwLmNoYW5uZWxzJyxcbiAgICAgICAgICAgICdhcHAuc2lkZW1lbnUnLFxuICAgICAgICAgICAgJ2FwcC5idWlsZGluZ3MnLFxuICAgICAgICAgICAgJ2FwcC5wcm9maWxlcycsXG4gICAgICAgICAgICAnYXBwLm1lc3NhZ2VzJyxcbiAgICAgICAgICAgICdhcHAuZGlyZWN0bWVzc2FnZXMnXG4gICAgICAgIF0pXG5cbiAgICAgICAgLnJ1bihmdW5jdGlvbigkaW9uaWNQbGF0Zm9ybSwgJHRpbWVvdXQsICRyb290U2NvcGUpIHtcbiAgICAgICAgICAgICRpb25pY1BsYXRmb3JtLnJlYWR5KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGlmICh3aW5kb3cuY29yZG92YSAmJiB3aW5kb3cuY29yZG92YS5wbHVnaW5zLktleWJvYXJkKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvcmRvdmEucGx1Z2lucy5LZXlib2FyZC5oaWRlS2V5Ym9hcmRBY2Nlc3NvcnlCYXIodHJ1ZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgY29yZG92YS5wbHVnaW5zLktleWJvYXJkLmRpc2FibGVTY3JvbGwodHJ1ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh3aW5kb3cuU3RhdHVzQmFyKSB7XG4gICAgICAgICAgICAgICAgICAgIFN0YXR1c0Jhci5zdHlsZURlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICB9XG5cdFx0XHRcdC8vdG8gZ2V0IHVzZXIgaW5mb1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGVtaXQoJ3VzZXItY2hhbmdlZCcpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xufSkoKTtcblxuXG4iLCIoZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGFuZ3VsYXJcbiAgICAgICAgLm1vZHVsZSgnYXBwJylcbiAgICAgICAgLnNlcnZpY2UoJ2dsb2JhbHNTZXJ2aWNlJywgZ2xvYmFsc1NlcnZpY2UpO1xuXG4gICAgZnVuY3Rpb24gZ2xvYmFsc1NlcnZpY2UoKSB7XG4gICAgICAgIHZhciBzZXJ2aWNlID0ge1xuXHRcdFx0dXNlciA6IG51bGwsIC8vbG9nZ2VkIHVzZXJcblx0XHRcdGJ1aWxkaW5nIDogbnVsbCAvL3NlbGVjdGVkIGJ1aWxkaW5nXG5cdFx0fTtcblxuICAgICAgICByZXR1cm4gc2VydmljZTtcbiAgICB9XG59KSgpO1xuIiwiKGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBhbmd1bGFyXG5cbiAgICAgICAgLm1vZHVsZSgnYXBwJylcblxuICAgICAgICAucnVuKFsnJHJvb3RTY29wZScsICckbG9jYXRpb24nLCAnYXV0aFNlcnZpY2UnLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgJHN0YXRlLCBhdXRoU2VydmljZSkge1xuICAgICAgICAgICAgJHJvb3RTY29wZS4kb24oJyRyb3V0ZUNoYW5nZVN0YXJ0JywgZnVuY3Rpb24gKGV2ZW50KSB7XG5cbiAgICAgICAgICAgICAgICBpZiAoYXV0aFNlcnZpY2UudXNlcigpID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdsb2dpbicpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XSlcbn0pKCk7XG4iLCIoZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGFuZ3VsYXJcblxuICAgICAgICAubW9kdWxlKCdhcHAnKVxuXG4gICAgICAgIC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyLCAkdXJsUm91dGVyUHJvdmlkZXIpIHtcbiAgICAgICAgICAgICRzdGF0ZVByb3ZpZGVyXG5cbiAgICAgICAgICAgICAgICAuc3RhdGUoJ2FwcCcsIHtcbiAgICAgICAgICAgICAgICAgICAgdXJsOiAnL2FwcCcsXG4gICAgICAgICAgICAgICAgICAgIGNhY2hlOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgYWJzdHJhY3Q6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAndmlld3Mvc2lkZW1lbnUuaHRtbCcsXG4gICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgICAgIC5zdGF0ZSgnYXBwLmJ1aWxkaW5ncycsIHtcbiAgICAgICAgICAgICAgICAgICAgdXJsOiAnL2J1aWxkaW5ncycsXG4gICAgICAgICAgICAgICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAnbWVudUNvbnRlbnQnOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICd2aWV3cy9idWlsZGluZ3MuaHRtbCdcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgICAgICAuc3RhdGUoJ2FwcC5idWlsZGluZycsIHtcbiAgICAgICAgICAgICAgICAgICAgdXJsOiAnL2J1aWxkaW5ncy86YnVpbGRpbmdJZCcsXG4gICAgICAgICAgICAgICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAnbWVudUNvbnRlbnQnOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICd2aWV3cy9idWlsZGluZy5odG1sJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgICAgIC5zdGF0ZSgnYXBwLmNoYW5uZWwnLCB7XG4gICAgICAgICAgICAgICAgICAgIHVybDogJy9jaGFubmVsLzpjaGFubmVsSWQnLFxuICAgICAgICAgICAgICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgICAgICAgICAgICAgJ21lbnVDb250ZW50Jzoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAndmlld3MvbWVzc2FnZXMvY2hhdC5odG1sJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgICAgIC5zdGF0ZSgnYXBwLnByb2ZpbGUnLCB7XG4gICAgICAgICAgICAgICAgICAgIHVybDogJy9wcm9maWxlJyxcbiAgICAgICAgICAgICAgICAgICAgY2FjaGU6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgICAgICAgICAgICAgJ21lbnVDb250ZW50Jzoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAndmlld3MvcHJvZmlsZS9wcm9maWxlLmh0bWwnXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICAgICAgLnN0YXRlKCdhcHAubWVzc2FnZXMnLCB7XG4gICAgICAgICAgICAgICAgICAgIHVybDogJy9tZXNzYWdlcycsXG4gICAgICAgICAgICAgICAgICAgIGNhY2hlOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICdtZW51Q29udGVudCc6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3ZpZXdzL21lc3NhZ2VzL21lc3NhZ2VzLmh0bWwnXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICAgICAgLnN0YXRlKCdhcHAubWVzc2FnZScsIHtcbiAgICAgICAgICAgICAgICAgICAgdXJsOiAnL21lc3NhZ2UvOnVzZXJJZCcsXG4gICAgICAgICAgICAgICAgICAgIGNhY2hlOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICdtZW51Q29udGVudCc6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3ZpZXdzL21lc3NhZ2VzL2NoYXQuaHRtbCdcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgICAgICAuc3RhdGUoJ2FwcC5sb2dvdXQnLCB7XG4gICAgICAgICAgICAgICAgICAgIHVybDogXCIvbG9naW5cIixcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVQcm92aWRlcjogZnVuY3Rpb24gKGF1dGhTZXJ2aWNlLCAkc3RhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGF1dGhTZXJ2aWNlLmxvZ291dCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdsb2dpbicpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuc3RhdGUoJ2xvZ2luJywge1xuICAgICAgICAgICAgICAgICAgICB1cmw6IFwiL2xvZ2luXCIsXG4gICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBcInZpZXdzL2F1dGgvbG9naW4uaHRtbFwiXG4gICAgICAgICAgICAgICAgfSk7XG5cblxuICAgICAgICAgICAgLy9mYWxsYmFja1xuICAgICAgICAgICAgJHVybFJvdXRlclByb3ZpZGVyLm90aGVyd2lzZSgnL2xvZ2luJyk7XG5cbiAgICAgICAgfSk7XG59KSgpO1xuXG5cblxuXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
