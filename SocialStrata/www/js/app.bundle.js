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

    angular.module("app.users", ['app.auth']);
})();
(function () {
    'use strict';

    angular.module("app.sidemenu", []);
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

        this.mode = $stateParams.userId ? "chat" : "channel";
        if (!this.validate())
            return false;

        //custom properties
        this.buildingKey = globalsService.building ? globalsService.building.key : null;
        this.channelKey = $stateParams.channelId;
        this.toUserId = $stateParams.userId;
        this.messageRef;

        $scope.user = {
            id: $scope.user.uid,
            pic: 'http://ionicframework.com/img/docs/mcfly.jpg',
            name: globalsService.user.displayName ? globalsService.user.displayName : 'Undefined'
        };

        $scope.title = "...";
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

        if (!this.globalsService.building && this.mode == "channel") {
            this.$state.go('app.buildings');
            return false;
        }

        return true;
    };

    //Check if is a Common Room or Direct Message
    MessagesController.prototype.init = function() {
        var self = this;

        if (self.mode == "channel") {
            self.$scope.title = this.channelsService.channels[this.$stateParams.channelId];
            
			var channelPath = ['buildings', this.buildingKey, 'channels', this.$stateParams.channelId].join('/');
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
			self.$scope.title = this.$stateParams.name;
            self.setContact(self.toUserId);
        }

    };

    MessagesController.prototype.setContact = function(uid) {
        var self = this;

        var contactPath = ['users', uid].join('/');

        firebase.database().ref(contactPath).once('value', function(snapshot) {
            var contact = snapshot.val();
            var name = contact && contact.displayName ? contact.displayName : 'Undentified';
            self.$scope.toUser = self.toUser = {
                userId: uid,
                userPic: 'http://ionicframework.com/img/docs/venkman.jpg',
                userName: name
            };
			
            self.getLastMessages();
        });
    };

    MessagesController.prototype.getLastMessages = function() {
        var self = this;
        var query;

        if (self.mode == "chat") {
            self.messageRef = firebase.database().ref("messages");
            query = self.messageRef.orderByChild('to').equalTo(self.toUserId);
        }
        else {
            var msgPath = ['buildings', self.buildingKey, 'messages'].join('/');
            self.messageRef = firebase.database().ref(msgPath);

            query = self.messageRef.orderByChild('channel').equalTo(self.channelKey);
        }

        query
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
            text: msg,
            userName: self.$scope.user.name,
            userId: self.$scope.user.id,
            userPic: self.$scope.user.pic
        };

        if (self.toUser)
            message.to = self.toUser.userId;

        if (self.mode == "channel")
            message.channel = self.channelKey;

        var msgPath = (self.mode == "chat")
            ? "messages"
            : ['buildings', self.buildingKey, 'messages'].join('/');

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
                    url: '/message/:userId/:name',
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





//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImF1dGgvYXV0aC5tb2R1bGUuanMiLCJidWlsZGluZ3MvYnVpbGRpbmdzLm1vZHVsZS5qcyIsImNoYW5uZWxzL2NoYW5uZWxzLm1vZHVsZS5qcyIsImRpcmVjdG1lc3NhZ2VzL2RpcmVjdG1lc3NhZ2VzLm1vZHVsZS5qcyIsImZpcmViYXNlL2ZpcmViYXNlLm1vZHVsZS5qcyIsIm1lc3NhZ2VzL21lc3NhZ2VzLm1vZHVsZS5qcyIsInByb2ZpbGUvcHJvZmlsZXMubW9kdWxlLmpzIiwidXNlcnMvdXNlcnMubW9kdWxlLmpzIiwic2lkZW1lbnUvc2lkZW1lbnUubW9kdWxlLmpzIiwiYXV0aC9hdXRoQ29udHJvbGxlci5qcyIsImF1dGgvYXV0aFNlcnZpY2UuanMiLCJidWlsZGluZ3MvYnVpbGRpbmdDb250cm9sbGVyLmpzIiwiYnVpbGRpbmdzL2J1aWxkaW5nc0NvbnRyb2xsZXIuanMiLCJidWlsZGluZ3MvYnVpbGRpbmdzU2VydmljZS5qcyIsImNoYW5uZWxzL2NoYW5uZWxzU2VydmljZS5qcyIsImRpcmVjdG1lc3NhZ2VzL2RpcmVjdE1lc3NhZ2VzQ29udHJvbGxlci5qcyIsImRpcmVjdG1lc3NhZ2VzL2RpcmVjdE1lc3NhZ2VzU2VydmljZS5qcyIsImZpcmViYXNlL2ZpcmViYXNlU2VydmljZS5qcyIsIm1lc3NhZ2VzL21lc3NhZ2VzQ29udHJvbGxlci5qcyIsIm1lc3NhZ2VzL21lc3NhZ2VzRmlsdGVycy5qcyIsIm1lc3NhZ2VzL21lc3NhZ2VzU2VydmljZS5qcyIsInByb2ZpbGUvcHJvZmlsZUNvbnRyb2xsZXIuanMiLCJwcm9maWxlL3Byb2ZpbGVzU2VydmljZS5qcyIsInVzZXJzL3VzZXJzU2VydmljZS5qcyIsInNpZGVtZW51L3NpZGVtZW51Q29udHJvbGxlci5qcyIsImFwcC5tb2R1bGUuanMiLCJhcHAuZ2xvYmFscy5qcyIsImFwcC5yb3V0ZXIuZmlsdGVyLmpzIiwiYXBwLnJvdXRlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxDQUFBLFlBQUE7SUFDQTs7SUFFQSxRQUFBLE9BQUEsWUFBQTs7QUNIQSxDQUFBLFlBQUE7SUFDQTs7SUFFQSxRQUFBLE9BQUEsaUJBQUEsQ0FBQTs7QUNIQSxDQUFBLFlBQUE7SUFDQTs7SUFFQSxRQUFBLE9BQUEsZ0JBQUE7O0FDSEEsQ0FBQSxZQUFBO0lBQ0E7O0lBRUE7U0FDQSxPQUFBLHNCQUFBLENBQUE7Ozs7Ozs7QUNKQSxDQUFBLFdBQUE7SUFDQTs7SUFFQTtTQUNBLE9BQUEsZ0JBQUE7Ozs7Ozs7QUNKQSxDQUFBLFlBQUE7SUFDQTs7SUFFQTtTQUNBLE9BQUEsc0JBQUE7U0FDQSxTQUFBLG9CQUFBO1lBQ0EsUUFBQTs7U0FFQSxVQUFBLGNBQUE7WUFDQSxZQUFBLFdBQUE7WUFDQSxVQUFBLFVBQUEsU0FBQSxRQUFBO2dCQUNBOztnQkFFQSxPQUFBO29CQUNBLFNBQUE7b0JBQ0EsVUFBQTtvQkFDQSxNQUFBLFVBQUEsT0FBQSxTQUFBLE9BQUEsU0FBQTs7O3dCQUdBLElBQUEsS0FBQSxRQUFBOzRCQUNBLE1BQUE7Ozt3QkFHQSxJQUFBLEdBQUEsYUFBQSxjQUFBLENBQUEsUUFBQSxrQkFBQTs0QkFDQTs7Ozt3QkFJQSxJQUFBLElBQUE7NEJBQ0EsWUFBQTs0QkFDQSxjQUFBOzRCQUNBLGFBQUE7Ozs7d0JBSUEsSUFBQSxPQUFBLEdBQUE7d0JBQ0EsR0FBQSxRQUFBO3dCQUNBLEdBQUEsUUFBQTs7d0JBRUEsSUFBQSxTQUFBLE1BQUEsYUFBQSxNQUFBLFdBQUEsUUFBQSxRQUFBLFFBQUEsT0FBQTs0QkFDQSxPQUFBLFFBQUEsUUFBQTs0QkFDQSxrQkFBQTtnQ0FDQTtnQ0FDQTtnQ0FDQTtnQ0FDQTs0QkFDQSxVQUFBLFFBQUEsUUFBQTtnQ0FDQSxZQUFBLGtCQUFBLE9BQUEsS0FBQSxXQUFBOzRCQUNBLFNBQUEsUUFBQTs0QkFDQSxVQUFBLGlCQUFBOzRCQUNBLFNBQUEsUUFBQSxpQkFBQTs0QkFDQSxZQUFBLFFBQUEsaUJBQUEsa0JBQUE7Z0NBQ0EsUUFBQSxpQkFBQSx1QkFBQTtnQ0FDQSxRQUFBLGlCQUFBLDBCQUFBOzRCQUNBLFdBQUEsQ0FBQSxZQUFBLENBQUEsT0FBQSxHQUFBLFFBQUEsS0FBQTtnQ0FDQSxPQUFBLFNBQUEsUUFBQSxpQkFBQSx1QkFBQTtnQ0FDQSxTQUFBLFFBQUEsaUJBQUEsa0JBQUE7Z0NBQ0EsU0FBQSxRQUFBLGlCQUFBLGlCQUFBO2dDQUNBLFNBQUEsUUFBQSxpQkFBQSxzQkFBQTtnQ0FDQSxRQUFBLFNBQUEsUUFBQSxpQkFBQSxxQkFBQTtnQ0FDQSxTQUFBLFFBQUEsaUJBQUEsZ0JBQUE7Z0NBQ0EsU0FBQSxRQUFBLGlCQUFBLG1CQUFBO2dDQUNBLFNBQUEsUUFBQSxpQkFBQSx3QkFBQTs7NEJBRUEsaUJBQUEsU0FBQSxRQUFBLGlCQUFBLGVBQUE7NEJBQ0EsY0FBQSxTQUFBLFFBQUEsaUJBQUEsV0FBQTs0QkFDQSxZQUFBLEtBQUEsSUFBQSxnQkFBQSxlQUFBLFNBQUE7NEJBQ0EsWUFBQSxTQUFBLFFBQUEsaUJBQUEsZUFBQTs0QkFDQTs0QkFDQTs0QkFDQSxZQUFBLENBQUE7Z0NBQ0E7Z0NBQ0E7Z0NBQ0E7Z0NBQ0E7Z0NBQ0E7Z0NBQ0E7Z0NBQ0E7Z0NBQ0E7Ozt3QkFHQSxJQUFBLElBQUEsS0FBQSxZQUFBOzRCQUNBOzs7O3dCQUlBLFlBQUEsYUFBQSxZQUFBLElBQUEsWUFBQTs7O3dCQUdBLElBQUEsT0FBQSxlQUFBLFNBQUEsTUFBQTs0QkFDQSxRQUFBLFFBQUEsU0FBQSxNQUFBLE9BQUE7Ozs7d0JBSUEsSUFBQSxJQUFBOzRCQUNBLFVBQUEsQ0FBQSxXQUFBLFVBQUEsV0FBQSxjQUFBLFNBQUE7MkJBQ0EsS0FBQSxXQUFBOzs7Ozs7d0JBTUEsU0FBQSxhQUFBOzRCQUNBLElBQUEsY0FBQTs7NEJBRUEsV0FBQTs7NEJBRUEsVUFBQSxpQkFBQTs0QkFDQSxRQUFBLFFBQUEsV0FBQSxVQUFBLEtBQUE7Z0NBQ0EsZUFBQSxNQUFBLE1BQUEsUUFBQSxpQkFBQSxPQUFBOzs0QkFFQSxPQUFBLGFBQUEsU0FBQTs7O3dCQUdBLFNBQUEsU0FBQTs0QkFDQSxJQUFBO2dDQUNBO2dDQUNBO2dDQUNBO2dDQUNBOzs0QkFFQSxJQUFBLGFBQUEsSUFBQTtnQ0FDQTs7Ozs0QkFJQSxJQUFBLENBQUEsUUFBQTtnQ0FDQSxTQUFBOztnQ0FFQSxPQUFBLFFBQUEsR0FBQSxRQUFBO2dDQUNBLE9BQUEsTUFBQSxZQUFBLEdBQUEsTUFBQTs7Z0NBRUEsV0FBQSxHQUFBLE1BQUEsV0FBQSxLQUFBLFNBQUEsU0FBQSxHQUFBLE1BQUEsUUFBQTs7Z0NBRUEsdUJBQUEsaUJBQUEsSUFBQSxpQkFBQTs7O2dDQUdBLElBQUEscUJBQUEsT0FBQSxxQkFBQSxTQUFBLEdBQUEsT0FBQSxNQUFBOztvQ0FFQSxRQUFBLFNBQUEsc0JBQUEsTUFBQSxTQUFBO29DQUNBLE9BQUEsTUFBQSxRQUFBLFFBQUE7OztnQ0FHQSxlQUFBLE9BQUE7O2dDQUVBLElBQUEsZUFBQSxXQUFBO29DQUNBLGVBQUE7b0NBQ0EsV0FBQTt1Q0FDQSxJQUFBLGVBQUEsV0FBQTtvQ0FDQSxlQUFBOztnQ0FFQSxnQkFBQSxTQUFBO2dDQUNBLEdBQUEsTUFBQSxZQUFBLFlBQUE7O2dDQUVBLElBQUEsYUFBQSxjQUFBO29DQUNBLE1BQUEsTUFBQSxrQkFBQSxLQUFBLFVBQUE7b0NBQ0EsR0FBQSxNQUFBLFNBQUEsZUFBQTs7OztnQ0FJQSxTQUFBLFlBQUE7b0NBQ0EsU0FBQTttQ0FDQSxHQUFBOzs7Ozt3QkFLQSxTQUFBLGNBQUE7NEJBQ0EsU0FBQTs0QkFDQTs7Ozs7Ozs7d0JBUUEsSUFBQSxzQkFBQSxNQUFBLGFBQUEsSUFBQTs7NEJBRUEsR0FBQSxhQUFBLEdBQUEsVUFBQTsrQkFDQTs0QkFDQSxHQUFBLGFBQUE7Ozt3QkFHQSxLQUFBLEtBQUEsVUFBQTs7d0JBRUEsTUFBQSxPQUFBLFlBQUE7NEJBQ0EsT0FBQSxRQUFBOzJCQUNBLFVBQUEsVUFBQTs0QkFDQTs7O3dCQUdBLE1BQUEsSUFBQSxrQkFBQSxZQUFBOzRCQUNBOzRCQUNBOzs7d0JBR0EsU0FBQSxRQUFBLEdBQUE7Ozs7Ozt3QkFNQSxNQUFBLElBQUEsWUFBQSxZQUFBOzRCQUNBLFFBQUE7NEJBQ0EsS0FBQSxPQUFBLFVBQUE7Ozs7Ozs7SUFPQTtTQUNBLE9BQUEsZ0JBQUEsQ0FBQTs7Ozs7OztBQ3JOQSxDQUFBLFlBQUE7SUFDQTs7SUFFQSxRQUFBLE9BQUEsZ0JBQUEsQ0FBQTs7QUNIQSxDQUFBLFlBQUE7SUFDQTs7SUFFQSxRQUFBLE9BQUEsYUFBQSxDQUFBOztBQ0hBLENBQUEsWUFBQTtJQUNBOztJQUVBLFFBQUEsT0FBQSxnQkFBQTs7QUNIQSxDQUFBLFdBQUE7SUFDQTs7O0lBRUEsUUFBQSxPQUFBOztTQUVBLFdBQUEsa0JBQUE7OztJQUdBLFNBQUEsZUFBQSxRQUFBLGFBQUEsYUFBQSxlQUFBLFFBQUEsVUFBQTs7UUFFQSxPQUFBLE9BQUE7O1FBRUEsT0FBQSxRQUFBLFdBQUE7R0FDQSxjQUFBOztHQUVBLFlBQUEsTUFBQSxPQUFBLEtBQUEsVUFBQSxPQUFBLEtBQUEsVUFBQSxRQUFBLFNBQUEsTUFBQTtJQUNBLGNBQUE7SUFDQSxPQUFBLEdBQUE7O2VBRUEsTUFBQSxTQUFBLE9BQUE7SUFDQSxTQUFBLFdBQUE7S0FDQSxjQUFBO09BQ0E7O2dCQUVBLElBQUEsYUFBQSxZQUFBLE1BQUE7b0JBQ0EsT0FBQTtvQkFDQSxVQUFBLE1BQUE7Ozs7O0VBS0EsT0FBQSxnQkFBQSxXQUFBO0dBQ0EsSUFBQSxhQUFBLFlBQUEsTUFBQTtJQUNBLE9BQUE7SUFDQSxVQUFBOzs7OztBQ2xDQSxDQUFBLFdBQUE7SUFDQTs7O0lBRUEsUUFBQSxPQUFBOztTQUVBLFFBQUEsZUFBQTs7Q0FFQSxTQUFBLFdBQUEsVUFBQSxVQUFBO0VBQ0EsSUFBQSxXQUFBLEdBQUE7RUFDQSxJQUFBLE9BQUEsZ0JBQUEsR0FBQTs7RUFFQSxPQUFBLEtBQUEsK0JBQUEsT0FBQTs7O0lBR0EsU0FBQSxZQUFBLElBQUEsWUFBQSxrQkFBQSxnQkFBQTtFQUNBLElBQUEsT0FBQSxTQUFBOztFQUVBLFdBQUEsSUFBQSxnQkFBQSxXQUFBO0dBQ0EsSUFBQSxNQUFBLFNBQUEsT0FBQTtHQUNBLElBQUEsT0FBQSxNQUFBO0lBQ0EsZUFBQSxPQUFBO0lBQ0E7SUFDQTs7R0FFQSxlQUFBLE9BQUE7O0dBRUEsSUFBQSxNQUFBLFNBQUEsV0FBQSxJQUFBLFdBQUEsSUFBQTtHQUNBLElBQUEsTUFBQSxRQUFBLElBQUEsSUFBQTtHQUNBLElBQUEsTUFBQSxTQUFBLElBQUEsSUFBQTtHQUNBLElBQUEsTUFBQSxnQkFBQSxJQUFBLElBQUEsT0FBQTs7O0VBR0EsT0FBQTtZQUNBLE9BQUEsU0FBQSxVQUFBLFVBQUE7Z0JBQ0EsSUFBQSxXQUFBLEdBQUE7Z0JBQ0EsSUFBQSxVQUFBLFNBQUE7O0lBRUEsSUFBQSxpQkFBQSxTQUFBLE1BQUE7S0FDQSxLQUFBLFFBQUEsS0FBQSxlQUFBO0tBQ0EsU0FBQSxRQUFBOztLQUVBLFdBQUEsTUFBQTs7O0lBR0EsSUFBQSxlQUFBLFNBQUEsT0FBQTtLQUNBLFNBQUEsT0FBQTs7O0lBR0EsS0FBQSwyQkFBQSxVQUFBO01BQ0EsS0FBQSxnQkFBQSxTQUFBLE1BQUEsT0FBQTtNQUNBLElBQUEsTUFBQSxRQUFBLHVCQUFBO09BQ0EsS0FBQSwrQkFBQSxVQUFBO1NBQ0EsS0FBQSxnQkFBQTs7V0FFQTtPQUNBLGFBQUE7Ozs7Z0JBSUEsUUFBQSxVQUFBLFNBQUEsSUFBQTtvQkFDQSxRQUFBLEtBQUE7b0JBQ0EsT0FBQTs7Z0JBRUEsUUFBQSxRQUFBLFNBQUEsSUFBQTtvQkFDQSxRQUFBLEtBQUEsTUFBQTtvQkFDQSxPQUFBOztnQkFFQSxPQUFBOzs7R0FHQSxRQUFBLFlBQUE7SUFDQSxLQUFBO0lBQ0EsZUFBQSxPQUFBOzs7WUFHQSxNQUFBLFdBQUE7SUFDQSxPQUFBLFNBQUEsT0FBQTs7Ozs7O0FDNUVBLENBQUEsWUFBQTtJQUNBOzs7SUFFQSxRQUFBLE9BQUE7O1NBRUEsV0FBQSxzQkFBQTs7O0lBR0EsU0FBQSxtQkFBQSxRQUFBLGVBQUEsY0FBQSxpQkFBQTs7UUFFQSxJQUFBLE1BQUEsZ0JBQUEsZ0JBQUEsYUFBQTs7UUFFQSxjQUFBO1FBQ0EsSUFBQSxHQUFBLFNBQUEsVUFBQSxVQUFBO1lBQ0EsSUFBQSxNQUFBLFNBQUE7O1lBRUEsSUFBQSxLQUFBO2dCQUNBLE9BQUEsV0FBQSxJQUFBOztpQkFFQTs7O1lBR0EsY0FBQTs7V0FFQSxVQUFBLGFBQUE7WUFDQSxRQUFBLElBQUEsb0JBQUEsWUFBQTtZQUNBLElBQUEsYUFBQSxZQUFBLE1BQUE7Z0JBQ0EsT0FBQTtnQkFDQSxVQUFBOztZQUVBLGNBQUE7Ozs7O0FDOUJBLENBQUEsWUFBQTtJQUNBOzs7SUFFQSxRQUFBLE9BQUE7O1NBRUEsV0FBQSx1QkFBQTs7O0lBR0EsU0FBQSxvQkFBQSxRQUFBLGVBQUEsa0JBQUEsZ0JBQUE7UUFDQSxJQUFBLE1BQUEsaUJBQUE7O0VBRUEsT0FBQSxjQUFBLGVBQUEsV0FBQSxlQUFBLFNBQUEsTUFBQTs7RUFFQSxPQUFBLFNBQUEsU0FBQSxLQUFBLFVBQUE7R0FDQSxPQUFBLGNBQUEsU0FBQSxNQUFBO0dBQ0EsZUFBQSxXQUFBO0dBQ0EsT0FBQSxNQUFBLHFCQUFBOzs7UUFHQSxjQUFBO1FBQ0EsSUFBQSxHQUFBLFNBQUEsVUFBQSxVQUFBO1lBQ0EsT0FBQSxZQUFBLFNBQUE7WUFDQSxjQUFBO1dBQ0EsVUFBQSxhQUFBO1lBQ0EsUUFBQSxJQUFBLG9CQUFBLFlBQUE7WUFDQSxJQUFBLGFBQUEsWUFBQSxNQUFBO2dCQUNBLE9BQUE7Z0JBQ0EsVUFBQTs7WUFFQSxjQUFBOzs7O0FDN0JBLENBQUEsWUFBQTtJQUNBOzs7SUFFQTtTQUNBLE9BQUE7U0FDQSxRQUFBLG9CQUFBOztJQUVBLFNBQUEsaUJBQUEsaUJBQUEsWUFBQTs7UUFFQSxPQUFBO1lBQ0EsY0FBQSxZQUFBO2dCQUNBLE9BQUEsU0FBQSxXQUFBLElBQUE7Ozs7OztBQ1hBLENBQUEsWUFBQTtJQUNBOzs7SUFFQTtTQUNBLE9BQUE7U0FDQSxRQUFBLG1CQUFBOztJQUVBLFNBQUEsZ0JBQUEsWUFBQTtFQUNBLElBQUEsVUFBQTs7RUFFQSxRQUFBLFdBQUE7R0FDQSxZQUFBO0dBQ0EsV0FBQTtHQUNBLFdBQUE7R0FDQSxVQUFBO0dBQ0EsYUFBQTtHQUNBLGVBQUE7OztFQUdBLFdBQUEsSUFBQSxxQkFBQSxTQUFBLFVBQUE7Ozs7RUFJQSxRQUFBLGtCQUFBLFVBQUEsVUFBQTtHQUNBLE9BQUEsU0FBQSxXQUFBLElBQUEsZUFBQSxXQUFBOzs7UUFHQSxPQUFBOzs7OztBQzNCQSxDQUFBLFlBQUE7SUFDQTs7SUFFQTtTQUNBLE9BQUE7U0FDQSxXQUFBLDRCQUFBO1lBQ0E7WUFDQTtZQUNBO1lBQ0E7WUFDQTtZQUNBOzs7SUFHQSxTQUFBLHlCQUFBLFFBQUEsUUFBQSxlQUFBLGlCQUFBLGdCQUFBOztRQUVBLFlBQUE7O1FBRUEsU0FBQSxVQUFBOztZQUVBLElBQUEsQ0FBQSxlQUFBLE1BQUE7Z0JBQ0EsT0FBQSxHQUFBO2dCQUNBOzs7WUFHQSxPQUFBLGVBQUE7OztRQUdBLFNBQUEsWUFBQSxNQUFBO1lBQ0EsY0FBQTtZQUNBLElBQUEsTUFBQSxnQkFBQSxnQkFBQSxLQUFBOztZQUVBLElBQUEsR0FBQSxTQUFBLFVBQUEsVUFBQTtnQkFDQSxPQUFBLFdBQUEsU0FBQTtnQkFDQSxjQUFBOztlQUVBLFVBQUEsYUFBQTtnQkFDQSxRQUFBLElBQUEsb0JBQUEsWUFBQTtnQkFDQSxjQUFBO2dCQUNBLElBQUEsYUFBQSxZQUFBLE1BQUE7b0JBQ0EsT0FBQTtvQkFDQSxVQUFBOzs7Ozs7QUN6Q0EsQ0FBQSxZQUFBO0lBQ0E7OztJQUVBO1NBQ0EsT0FBQTtTQUNBLFFBQUEseUJBQUE7O0lBRUEsU0FBQSxzQkFBQSxpQkFBQTtRQUNBLElBQUEsVUFBQTs7UUFFQSxRQUFBLGtCQUFBLFVBQUEsTUFBQTtZQUNBLE9BQUEsZ0JBQUEsR0FBQSxXQUFBLElBQUEsV0FBQSxPQUFBOzs7UUFHQSxPQUFBOzs7O0FDZEEsQ0FBQSxZQUFBO0lBQ0E7O0lBRUE7U0FDQSxPQUFBO1NBQ0EsUUFBQSxtQkFBQTs7O0lBR0EsU0FBQSxrQkFBQTtRQUNBLElBQUEsU0FBQTtZQUNBLFFBQUE7WUFDQSxZQUFBO1lBQ0EsYUFBQTtZQUNBLGVBQUE7OztRQUdBLEtBQUEsS0FBQSxTQUFBLGNBQUE7Ozs7QUNoQkEsQ0FBQSxXQUFBO0lBQ0E7O0lBRUE7U0FDQSxPQUFBO1NBQ0EsV0FBQSxzQkFBQTtZQUNBO1lBQ0E7WUFDQTtZQUNBO1lBQ0E7WUFDQTtZQUNBO1lBQ0E7OztJQUdBLFNBQUEsbUJBQUEsUUFBQSxRQUFBLGNBQUEsc0JBQUEsVUFBQSxpQkFBQSxnQkFBQTtRQUNBLElBQUEsT0FBQTs7O1FBR0EsS0FBQSxTQUFBO1FBQ0EsS0FBQSxTQUFBO1FBQ0EsS0FBQSxlQUFBO1FBQ0EsS0FBQSx1QkFBQTtRQUNBLEtBQUEsV0FBQTtRQUNBLEtBQUEsa0JBQUE7UUFDQSxLQUFBLGlCQUFBOztRQUVBLEtBQUEsT0FBQSxhQUFBLFNBQUEsU0FBQTtRQUNBLElBQUEsQ0FBQSxLQUFBO1lBQ0EsT0FBQTs7O1FBR0EsS0FBQSxjQUFBLGVBQUEsV0FBQSxlQUFBLFNBQUEsTUFBQTtRQUNBLEtBQUEsYUFBQSxhQUFBO1FBQ0EsS0FBQSxXQUFBLGFBQUE7UUFDQSxLQUFBOztRQUVBLE9BQUEsT0FBQTtZQUNBLElBQUEsT0FBQSxLQUFBO1lBQ0EsS0FBQTtZQUNBLE1BQUEsZUFBQSxLQUFBLGNBQUEsZUFBQSxLQUFBLGNBQUE7OztRQUdBLE9BQUEsUUFBQTtRQUNBLE9BQUEsYUFBQSxLQUFBO1FBQ0EsT0FBQTtRQUNBLE9BQUEsV0FBQTtRQUNBLE9BQUEsZUFBQTtRQUNBLE9BQUEsY0FBQSxTQUFBLEtBQUE7WUFDQSxLQUFBLGNBQUEsTUFBQTs7OztRQUlBLEtBQUEsYUFBQSxxQkFBQSxhQUFBO1FBQ0EsS0FBQSxZQUFBLFNBQUEsS0FBQSxjQUFBO1FBQ0EsS0FBQSxXQUFBLFNBQUEsS0FBQSxjQUFBO1FBQ0EsS0FBQSxXQUFBLFFBQUEsUUFBQSxLQUFBLFVBQUEsY0FBQTs7O1FBR0EsT0FBQSxJQUFBLHdCQUFBLEtBQUE7O1FBRUEsT0FBQSxJQUFBLDBCQUFBLFdBQUE7WUFDQSxLQUFBLFdBQUEsSUFBQTs7O1FBR0EsS0FBQTs7O0lBR0EsbUJBQUEsVUFBQSxXQUFBLFdBQUE7UUFDQSxJQUFBLENBQUEsS0FBQSxlQUFBLE1BQUE7WUFDQSxLQUFBLE9BQUEsR0FBQTtZQUNBLE9BQUE7OztRQUdBLElBQUEsQ0FBQSxLQUFBLGVBQUEsWUFBQSxLQUFBLFFBQUEsV0FBQTtZQUNBLEtBQUEsT0FBQSxHQUFBO1lBQ0EsT0FBQTs7O1FBR0EsT0FBQTs7OztJQUlBLG1CQUFBLFVBQUEsT0FBQSxXQUFBO1FBQ0EsSUFBQSxPQUFBOztRQUVBLElBQUEsS0FBQSxRQUFBLFdBQUE7WUFDQSxLQUFBLE9BQUEsUUFBQSxLQUFBLGdCQUFBLFNBQUEsS0FBQSxhQUFBOztHQUVBLElBQUEsY0FBQSxDQUFBLGFBQUEsS0FBQSxhQUFBLFlBQUEsS0FBQSxhQUFBLFdBQUEsS0FBQTtHQUNBLElBQUEsYUFBQSxTQUFBLFdBQUEsSUFBQTtZQUNBLFdBQUEsS0FBQSxTQUFBLFNBQUEsVUFBQTtnQkFDQSxLQUFBLFVBQUEsU0FBQTs7Z0JBRUEsSUFBQSxLQUFBLFFBQUEsUUFBQSxVQUFBO29CQUNBLEtBQUEsV0FBQSxLQUFBLFFBQUE7O3FCQUVBO29CQUNBLEtBQUE7Ozs7YUFJQTtHQUNBLEtBQUEsT0FBQSxRQUFBLEtBQUEsYUFBQTtZQUNBLEtBQUEsV0FBQSxLQUFBOzs7OztJQUtBLG1CQUFBLFVBQUEsYUFBQSxTQUFBLEtBQUE7UUFDQSxJQUFBLE9BQUE7O1FBRUEsSUFBQSxjQUFBLENBQUEsU0FBQSxLQUFBLEtBQUE7O1FBRUEsU0FBQSxXQUFBLElBQUEsYUFBQSxLQUFBLFNBQUEsU0FBQSxVQUFBO1lBQ0EsSUFBQSxVQUFBLFNBQUE7WUFDQSxJQUFBLE9BQUEsV0FBQSxRQUFBLGNBQUEsUUFBQSxjQUFBO1lBQ0EsS0FBQSxPQUFBLFNBQUEsS0FBQSxTQUFBO2dCQUNBLFFBQUE7Z0JBQ0EsU0FBQTtnQkFDQSxVQUFBOzs7WUFHQSxLQUFBOzs7O0lBSUEsbUJBQUEsVUFBQSxrQkFBQSxXQUFBO1FBQ0EsSUFBQSxPQUFBO1FBQ0EsSUFBQTs7UUFFQSxJQUFBLEtBQUEsUUFBQSxRQUFBO1lBQ0EsS0FBQSxhQUFBLFNBQUEsV0FBQSxJQUFBO1lBQ0EsUUFBQSxLQUFBLFdBQUEsYUFBQSxNQUFBLFFBQUEsS0FBQTs7YUFFQTtZQUNBLElBQUEsVUFBQSxDQUFBLGFBQUEsS0FBQSxhQUFBLFlBQUEsS0FBQTtZQUNBLEtBQUEsYUFBQSxTQUFBLFdBQUEsSUFBQTs7WUFFQSxRQUFBLEtBQUEsV0FBQSxhQUFBLFdBQUEsUUFBQSxLQUFBOzs7UUFHQTthQUNBLFlBQUE7YUFDQSxHQUFBLFNBQUEsU0FBQSxHQUFBO2dCQUNBLEtBQUEsT0FBQSxXQUFBLEVBQUE7O2dCQUVBLEtBQUEsU0FBQSxXQUFBO29CQUNBLEtBQUEsV0FBQSxhQUFBO21CQUNBOzs7O0lBSUEsbUJBQUEsVUFBQSxnQkFBQSxTQUFBLE1BQUEsS0FBQTtRQUNBLElBQUEsVUFBQTtZQUNBLE1BQUEsSUFBQSxPQUFBO1lBQ0EsTUFBQTtZQUNBLFVBQUEsS0FBQSxPQUFBLEtBQUE7WUFDQSxRQUFBLEtBQUEsT0FBQSxLQUFBO1lBQ0EsU0FBQSxLQUFBLE9BQUEsS0FBQTs7O1FBR0EsSUFBQSxLQUFBO1lBQ0EsUUFBQSxLQUFBLEtBQUEsT0FBQTs7UUFFQSxJQUFBLEtBQUEsUUFBQTtZQUNBLFFBQUEsVUFBQSxLQUFBOztRQUVBLElBQUEsVUFBQSxDQUFBLEtBQUEsUUFBQTtjQUNBO2NBQ0EsQ0FBQSxhQUFBLEtBQUEsYUFBQSxZQUFBLEtBQUE7O1FBRUEsU0FBQSxXQUFBLElBQUEsU0FBQSxLQUFBOztRQUVBLEtBQUEsT0FBQSxlQUFBOztRQUVBLEtBQUEsU0FBQSxXQUFBO1lBQ0EsS0FBQTtZQUNBLEtBQUEsV0FBQSxhQUFBO1dBQ0E7OztJQUdBLG1CQUFBLFVBQUEsbUJBQUEsV0FBQTtRQUNBLElBQUEsT0FBQTtRQUNBLEtBQUEsU0FBQSxJQUFBLFFBQUEsV0FBQTtZQUNBLFFBQUEsSUFBQTtZQUNBLEtBQUEsU0FBQSxHQUFBOzs7O0lBSUEsbUJBQUEsVUFBQSxvQkFBQSxTQUFBLEtBQUE7UUFDQSxLQUFBLElBQUEsTUFBQTs7Ozs7Ozs7QUNoTUEsQ0FBQSxZQUFBO0lBQ0E7O0lBRUE7U0FDQSxPQUFBOztTQUVBLE9BQUEsU0FBQSxDQUFBLFdBQUE7O0lBRUEsU0FBQSxNQUFBLFNBQUE7UUFDQSxPQUFBLFVBQUEsTUFBQTtZQUNBLElBQUEsQ0FBQSxNQUFBLE9BQUE7WUFDQSxPQUFBLEtBQUEsUUFBQSxVQUFBOzs7O0FDWEEsQ0FBQSxZQUFBO0lBQ0E7OztJQUVBO1NBQ0EsT0FBQTtTQUNBLFFBQUEsbUJBQUE7O0lBRUEsU0FBQSxnQkFBQSxpQkFBQTtRQUNBLElBQUEsVUFBQTs7UUFFQSxRQUFBLGlCQUFBLFlBQUE7WUFDQSxPQUFBLGdCQUFBLEdBQUEsV0FBQSxJQUFBOzs7UUFHQSxRQUFBLGFBQUEsVUFBQSxTQUFBO1lBQ0EsT0FBQSxnQkFBQSxHQUFBLFdBQUEsS0FBQTs7O1FBR0EsT0FBQTs7OztBQ2xCQSxDQUFBLFdBQUE7SUFDQTs7O0lBRUEsUUFBQSxPQUFBOztTQUVBLFdBQUEscUJBQUE7OztJQUdBLFNBQUEsa0JBQUEsUUFBQSxlQUFBLGFBQUEsYUFBQSxpQkFBQTs7RUFFQSxJQUFBLE9BQUEsWUFBQTs7RUFFQSxPQUFBLE9BQUE7R0FDQSxjQUFBLE9BQUEsS0FBQSxjQUFBO0dBQ0EsUUFBQSxPQUFBLEtBQUEsUUFBQTs7O1FBR0EsT0FBQSxTQUFBLFdBQUE7R0FDQSxjQUFBOztZQUVBLGdCQUFBLGNBQUEsT0FBQSxNQUFBLEtBQUEsU0FBQSxRQUFBLEtBQUE7SUFDQSxjQUFBOztJQUVBLFlBQUEsTUFBQTtvQkFDQSxPQUFBO29CQUNBLFVBQUE7OztlQUdBLFNBQUEsTUFBQSxPQUFBO0lBQ0EsY0FBQTs7SUFFQSxZQUFBLE1BQUE7b0JBQ0EsT0FBQTtvQkFDQSxVQUFBLE1BQUE7Ozs7OztBQ2pDQSxDQUFBLFdBQUE7SUFDQTs7O0lBRUEsUUFBQSxPQUFBOztTQUVBLFFBQUEsbUJBQUE7OztJQUdBLFNBQUEsZ0JBQUEsSUFBQSxZQUFBLGFBQUE7O1FBRUEsT0FBQTtZQUNBLGVBQUEsU0FBQSxNQUFBO2dCQUNBLElBQUEsV0FBQSxHQUFBOztnQkFFQSxZQUFBLE9BQUEsY0FBQTtxQkFDQSxLQUFBLFNBQUEsVUFBQTt3QkFDQSxTQUFBLFFBQUE7d0JBQ0EsV0FBQSxXQUFBO3VCQUNBLFNBQUEsTUFBQSxPQUFBO3dCQUNBLFNBQUEsT0FBQTs7O2dCQUdBLE9BQUEsU0FBQTs7Ozs7QUN0QkEsQ0FBQSxXQUFBO0lBQ0E7OztJQUVBLFFBQUEsT0FBQTs7U0FFQSxRQUFBLGdCQUFBOzs7SUFHQSxTQUFBLGFBQUEsSUFBQSxhQUFBO0tBQ0EsT0FBQTtZQUNBLGVBQUEsU0FBQSxNQUFBO2dCQUNBLElBQUEsV0FBQSxHQUFBOztnQkFFQSxZQUFBLE9BQUEsY0FBQTtxQkFDQSxLQUFBLFNBQUEsVUFBQTt3QkFDQSxTQUFBLFFBQUE7d0JBQ0EsT0FBQSxTQUFBLE9BQUE7d0JBQ0EsV0FBQSxXQUFBO3VCQUNBLFNBQUEsTUFBQSxPQUFBO3dCQUNBLFNBQUEsT0FBQTs7O2dCQUdBLE9BQUEsU0FBQTs7Ozs7QUN0QkEsQ0FBQSxZQUFBO0lBQ0E7OztJQUVBLFFBQUEsT0FBQTs7U0FFQSxXQUFBLHNCQUFBOzs7SUFHQSxTQUFBLG1CQUFBLFFBQUEsUUFBQSxpQkFBQSxhQUFBO1FBQ0EsT0FBQSxPQUFBLFlBQUE7UUFDQSxPQUFBLFdBQUEsZ0JBQUE7UUFDQSxPQUFBLFdBQUE7WUFDQSxNQUFBO1lBQ0EsU0FBQTs7O1FBR0EsT0FBQSxJQUFBLHFCQUFBLFVBQUEsT0FBQSxNQUFBO1lBQ0EsT0FBQSxTQUFBLE9BQUEsS0FBQTtZQUNBLE9BQUEsU0FBQSxVQUFBLEtBQUE7Ozs7UUFJQSxPQUFBLGNBQUEsVUFBQSxLQUFBO1lBQ0EsT0FBQSxHQUFBLGVBQUEsQ0FBQSxXQUFBOzs7OztBQ3ZCQSxDQUFBLFdBQUE7SUFDQTs7SUFFQTs7U0FFQSxPQUFBLE9BQUE7WUFDQTtZQUNBOztZQUVBO1lBQ0E7WUFDQTtZQUNBO1lBQ0E7WUFDQTtZQUNBO1lBQ0E7WUFDQTs7O1NBR0EsaURBQUEsU0FBQSxnQkFBQSxVQUFBLFlBQUE7WUFDQSxlQUFBLE1BQUEsV0FBQTtnQkFDQSxJQUFBLE9BQUEsV0FBQSxPQUFBLFFBQUEsUUFBQSxVQUFBO29CQUNBLFFBQUEsUUFBQSxTQUFBLHlCQUFBOztvQkFFQSxRQUFBLFFBQUEsU0FBQSxjQUFBOztnQkFFQSxJQUFBLE9BQUEsV0FBQTtvQkFDQSxVQUFBOzs7Z0JBR0EsV0FBQSxNQUFBOzs7Ozs7O0FDL0JBLENBQUEsWUFBQTtJQUNBOztJQUVBO1NBQ0EsT0FBQTtTQUNBLFFBQUEsa0JBQUE7O0lBRUEsU0FBQSxpQkFBQTtRQUNBLElBQUEsVUFBQTtHQUNBLE9BQUE7R0FDQSxXQUFBOzs7UUFHQSxPQUFBOzs7O0FDYkEsQ0FBQSxZQUFBO0lBQ0E7O0lBRUE7O1NBRUEsT0FBQTs7U0FFQSxJQUFBLENBQUEsY0FBQSxhQUFBLGVBQUEsVUFBQSxZQUFBLFFBQUEsYUFBQTtZQUNBLFdBQUEsSUFBQSxxQkFBQSxVQUFBLE9BQUE7O2dCQUVBLElBQUEsWUFBQSxVQUFBLE1BQUE7b0JBQ0EsTUFBQTtvQkFDQSxPQUFBLEdBQUE7Ozs7OztBQ1pBLENBQUEsWUFBQTtJQUNBOztJQUVBOztTQUVBLE9BQUE7O1NBRUEsZ0RBQUEsVUFBQSxnQkFBQSxvQkFBQTtZQUNBOztpQkFFQSxNQUFBLE9BQUE7b0JBQ0EsS0FBQTtvQkFDQSxPQUFBO29CQUNBLFVBQUE7b0JBQ0EsYUFBQTs7O2lCQUdBLE1BQUEsaUJBQUE7b0JBQ0EsS0FBQTtvQkFDQSxPQUFBO3dCQUNBLGVBQUE7NEJBQ0EsYUFBQTs7Ozs7aUJBS0EsTUFBQSxnQkFBQTtvQkFDQSxLQUFBO29CQUNBLE9BQUE7d0JBQ0EsZUFBQTs0QkFDQSxhQUFBOzs7OztpQkFLQSxNQUFBLGVBQUE7b0JBQ0EsS0FBQTtvQkFDQSxPQUFBO3dCQUNBLGVBQUE7NEJBQ0EsYUFBQTs7Ozs7aUJBS0EsTUFBQSxlQUFBO29CQUNBLEtBQUE7b0JBQ0EsT0FBQTtvQkFDQSxPQUFBO3dCQUNBLGVBQUE7NEJBQ0EsYUFBQTs7Ozs7aUJBS0EsTUFBQSxnQkFBQTtvQkFDQSxLQUFBO29CQUNBLE9BQUE7b0JBQ0EsT0FBQTt3QkFDQSxlQUFBOzRCQUNBLGFBQUE7Ozs7O2lCQUtBLE1BQUEsZUFBQTtvQkFDQSxLQUFBO29CQUNBLE9BQUE7b0JBQ0EsT0FBQTt3QkFDQSxlQUFBOzRCQUNBLGFBQUE7Ozs7O2lCQUtBLE1BQUEsY0FBQTtvQkFDQSxLQUFBO29CQUNBLDRDQUFBLFVBQUEsYUFBQSxRQUFBO3dCQUNBLFlBQUE7d0JBQ0EsT0FBQSxHQUFBOzs7aUJBR0EsTUFBQSxTQUFBO29CQUNBLEtBQUE7b0JBQ0EsYUFBQTs7Ozs7WUFLQSxtQkFBQSxVQUFBOzs7Ozs7OztBQVFBIiwiZmlsZSI6ImFwcC5idW5kbGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGFuZ3VsYXIubW9kdWxlKFwiYXBwLmF1dGhcIiwgW10pO1xufSkoKTsiLCIoZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGFuZ3VsYXIubW9kdWxlKFwiYXBwLmJ1aWxkaW5nc1wiLCBbJ2FwcC5maXJlYmFzZSddKTtcbn0pKCk7IiwiKGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBhbmd1bGFyLm1vZHVsZShcImFwcC5jaGFubmVsc1wiLCBbXSk7XG59KSgpOyIsIihmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgYW5ndWxhclxuICAgICAgICAubW9kdWxlKCdhcHAuZGlyZWN0bWVzc2FnZXMnLCBbJ2FwcC5tZXNzYWdlcyddKTtcbn0pKCk7XG5cblxuXG5cbiIsIihmdW5jdGlvbigpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBhbmd1bGFyXG4gICAgICAgIC5tb2R1bGUoJ2FwcC5maXJlYmFzZScsIFtdKTtcbn0pKCk7XG5cblxuXG5cbiIsIihmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgYW5ndWxhclxuICAgICAgICAubW9kdWxlKCdtb25vc3BhY2VkLmVsYXN0aWMnLCBbXSlcbiAgICAgICAgLmNvbnN0YW50KCdtc2RFbGFzdGljQ29uZmlnJywge1xuICAgICAgICAgICAgYXBwZW5kOiAnJ1xuICAgICAgICB9KVxuICAgICAgICAuZGlyZWN0aXZlKCdtc2RFbGFzdGljJywgW1xuICAgICAgICAgICAgJyR0aW1lb3V0JywgJyR3aW5kb3cnLCAnbXNkRWxhc3RpY0NvbmZpZycsXG4gICAgICAgICAgICBmdW5jdGlvbiAoJHRpbWVvdXQsICR3aW5kb3csIGNvbmZpZykge1xuICAgICAgICAgICAgICAgICd1c2Ugc3RyaWN0JztcblxuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmU6ICduZ01vZGVsJyxcbiAgICAgICAgICAgICAgICAgICAgcmVzdHJpY3Q6ICdBLCBDJyxcbiAgICAgICAgICAgICAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50LCBhdHRycywgbmdNb2RlbCkge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBjYWNoZSBhIHJlZmVyZW5jZSB0byB0aGUgRE9NIGVsZW1lbnRcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0YSA9IGVsZW1lbnRbMF0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHRhID0gZWxlbWVudDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZW5zdXJlIHRoZSBlbGVtZW50IGlzIGEgdGV4dGFyZWEsIGFuZCBicm93c2VyIGlzIGNhcGFibGVcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0YS5ub2RlTmFtZSAhPT0gJ1RFWFRBUkVBJyB8fCAhJHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBzZXQgdGhlc2UgcHJvcGVydGllcyBiZWZvcmUgbWVhc3VyaW5nIGRpbWVuc2lvbnNcbiAgICAgICAgICAgICAgICAgICAgICAgICR0YS5jc3Moe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdvdmVyZmxvdyc6ICdoaWRkZW4nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdvdmVyZmxvdy15JzogJ2hpZGRlbicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ3dvcmQtd3JhcCc6ICdicmVhay13b3JkJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGZvcmNlIHRleHQgcmVmbG93XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdGV4dCA9IHRhLnZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGEudmFsdWUgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhLnZhbHVlID0gdGV4dDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGFwcGVuZCA9IGF0dHJzLm1zZEVsYXN0aWMgPyBhdHRycy5tc2RFbGFzdGljLnJlcGxhY2UoL1xcXFxuL2csICdcXG4nKSA6IGNvbmZpZy5hcHBlbmQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHdpbiA9IGFuZ3VsYXIuZWxlbWVudCgkd2luZG93KSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaXJyb3JJbml0U3R5bGUgPSAncG9zaXRpb246IGFic29sdXRlOyB0b3A6IC05OTlweDsgcmlnaHQ6IGF1dG87IGJvdHRvbTogYXV0bzsnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2xlZnQ6IDA7IG92ZXJmbG93OiBoaWRkZW47IC13ZWJraXQtYm94LXNpemluZzogY29udGVudC1ib3g7JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICctbW96LWJveC1zaXppbmc6IGNvbnRlbnQtYm94OyBib3gtc2l6aW5nOiBjb250ZW50LWJveDsnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ21pbi1oZWlnaHQ6IDAgIWltcG9ydGFudDsgaGVpZ2h0OiAwICFpbXBvcnRhbnQ7IHBhZGRpbmc6IDA7JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICd3b3JkLXdyYXA6IGJyZWFrLXdvcmQ7IGJvcmRlcjogMDsnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRtaXJyb3IgPSBhbmd1bGFyLmVsZW1lbnQoJzx0ZXh0YXJlYSBhcmlhLWhpZGRlbj1cInRydWVcIiB0YWJpbmRleD1cIi0xXCIgJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdzdHlsZT1cIicgKyBtaXJyb3JJbml0U3R5bGUgKyAnXCIvPicpLmRhdGEoJ2VsYXN0aWMnLCB0cnVlKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaXJyb3IgPSAkbWlycm9yWzBdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhU3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlKHRhKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNpemUgPSB0YVN0eWxlLmdldFByb3BlcnR5VmFsdWUoJ3Jlc2l6ZScpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJvcmRlckJveCA9IHRhU3R5bGUuZ2V0UHJvcGVydHlWYWx1ZSgnYm94LXNpemluZycpID09PSAnYm9yZGVyLWJveCcgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFTdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKCctbW96LWJveC1zaXppbmcnKSA9PT0gJ2JvcmRlci1ib3gnIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhU3R5bGUuZ2V0UHJvcGVydHlWYWx1ZSgnLXdlYmtpdC1ib3gtc2l6aW5nJykgPT09ICdib3JkZXItYm94JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBib3hPdXRlciA9ICFib3JkZXJCb3ggPyB7d2lkdGg6IDAsIGhlaWdodDogMH0gOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiBwYXJzZUludCh0YVN0eWxlLmdldFByb3BlcnR5VmFsdWUoJ2JvcmRlci1yaWdodC13aWR0aCcpLCAxMCkgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJzZUludCh0YVN0eWxlLmdldFByb3BlcnR5VmFsdWUoJ3BhZGRpbmctcmlnaHQnKSwgMTApICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyc2VJbnQodGFTdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKCdwYWRkaW5nLWxlZnQnKSwgMTApICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyc2VJbnQodGFTdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKCdib3JkZXItbGVmdC13aWR0aCcpLCAxMCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodDogcGFyc2VJbnQodGFTdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKCdib3JkZXItdG9wLXdpZHRoJyksIDEwKSArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcnNlSW50KHRhU3R5bGUuZ2V0UHJvcGVydHlWYWx1ZSgncGFkZGluZy10b3AnKSwgMTApICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyc2VJbnQodGFTdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKCdwYWRkaW5nLWJvdHRvbScpLCAxMCkgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJzZUludCh0YVN0eWxlLmdldFByb3BlcnR5VmFsdWUoJ2JvcmRlci1ib3R0b20td2lkdGgnKSwgMTApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaW5IZWlnaHRWYWx1ZSA9IHBhcnNlSW50KHRhU3R5bGUuZ2V0UHJvcGVydHlWYWx1ZSgnbWluLWhlaWdodCcpLCAxMCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0VmFsdWUgPSBwYXJzZUludCh0YVN0eWxlLmdldFByb3BlcnR5VmFsdWUoJ2hlaWdodCcpLCAxMCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWluSGVpZ2h0ID0gTWF0aC5tYXgobWluSGVpZ2h0VmFsdWUsIGhlaWdodFZhbHVlKSAtIGJveE91dGVyLmhlaWdodCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXhIZWlnaHQgPSBwYXJzZUludCh0YVN0eWxlLmdldFByb3BlcnR5VmFsdWUoJ21heC1oZWlnaHQnKSwgMTApLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1pcnJvcmVkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGl2ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb3B5U3R5bGUgPSBbJ2ZvbnQtZmFtaWx5JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2ZvbnQtc2l6ZScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdmb250LXdlaWdodCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdmb250LXN0eWxlJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2xldHRlci1zcGFjaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2xpbmUtaGVpZ2h0JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ3RleHQtdHJhbnNmb3JtJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ3dvcmQtc3BhY2luZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICd0ZXh0LWluZGVudCddO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBleGl0IGlmIGVsYXN0aWMgYWxyZWFkeSBhcHBsaWVkIChvciBpcyB0aGUgbWlycm9yIGVsZW1lbnQpXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoJHRhLmRhdGEoJ2VsYXN0aWMnKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gT3BlcmEgcmV0dXJucyBtYXgtaGVpZ2h0IG9mIC0xIGlmIG5vdCBzZXRcbiAgICAgICAgICAgICAgICAgICAgICAgIG1heEhlaWdodCA9IG1heEhlaWdodCAmJiBtYXhIZWlnaHQgPiAwID8gbWF4SGVpZ2h0IDogOWU0O1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBhcHBlbmQgbWlycm9yIHRvIHRoZSBET01cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtaXJyb3IucGFyZW50Tm9kZSAhPT0gZG9jdW1lbnQuYm9keSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFuZ3VsYXIuZWxlbWVudChkb2N1bWVudC5ib2R5KS5hcHBlbmQobWlycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gc2V0IHJlc2l6ZSBhbmQgYXBwbHkgZWxhc3RpY1xuICAgICAgICAgICAgICAgICAgICAgICAgJHRhLmNzcyh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ3Jlc2l6ZSc6IChyZXNpemUgPT09ICdub25lJyB8fCByZXNpemUgPT09ICd2ZXJ0aWNhbCcpID8gJ25vbmUnIDogJ2hvcml6b250YWwnXG4gICAgICAgICAgICAgICAgICAgICAgICB9KS5kYXRhKCdlbGFzdGljJywgdHJ1ZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8qXG4gICAgICAgICAgICAgICAgICAgICAgICAgKiBtZXRob2RzXG4gICAgICAgICAgICAgICAgICAgICAgICAgKi9cblxuICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gaW5pdE1pcnJvcigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbWlycm9yU3R5bGUgPSBtaXJyb3JJbml0U3R5bGU7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaXJyb3JlZCA9IHRhO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNvcHkgdGhlIGVzc2VudGlhbCBzdHlsZXMgZnJvbSB0aGUgdGV4dGFyZWEgdG8gdGhlIG1pcnJvclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhU3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlKHRhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbmd1bGFyLmZvckVhY2goY29weVN0eWxlLCBmdW5jdGlvbiAodmFsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1pcnJvclN0eWxlICs9IHZhbCArICc6JyArIHRhU3R5bGUuZ2V0UHJvcGVydHlWYWx1ZSh2YWwpICsgJzsnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1pcnJvci5zZXRBdHRyaWJ1dGUoJ3N0eWxlJywgbWlycm9yU3R5bGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiBhZGp1c3QoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRhSGVpZ2h0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YUNvbXB1dGVkU3R5bGVXaWR0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWlycm9ySGVpZ2h0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3ZlcmZsb3c7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobWlycm9yZWQgIT09IHRhKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluaXRNaXJyb3IoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBhY3RpdmUgZmxhZyBwcmV2ZW50cyBhY3Rpb25zIGluIGZ1bmN0aW9uIGZyb20gY2FsbGluZyBhZGp1c3QgYWdhaW5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWFjdGl2ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3RpdmUgPSB0cnVlO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1pcnJvci52YWx1ZSA9IHRhLnZhbHVlICsgYXBwZW5kOyAvLyBvcHRpb25hbCB3aGl0ZXNwYWNlIHRvIGltcHJvdmUgYW5pbWF0aW9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1pcnJvci5zdHlsZS5vdmVyZmxvd1kgPSB0YS5zdHlsZS5vdmVyZmxvd1k7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFIZWlnaHQgPSB0YS5zdHlsZS5oZWlnaHQgPT09ICcnID8gJ2F1dG8nIDogcGFyc2VJbnQodGEuc3R5bGUuaGVpZ2h0LCAxMCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFDb21wdXRlZFN0eWxlV2lkdGggPSBnZXRDb21wdXRlZFN0eWxlKHRhKS5nZXRQcm9wZXJ0eVZhbHVlKCd3aWR0aCcpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGVuc3VyZSBnZXRDb21wdXRlZFN0eWxlIGhhcyByZXR1cm5lZCBhIHJlYWRhYmxlICd1c2VkIHZhbHVlJyBwaXhlbCB3aWR0aFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGFDb21wdXRlZFN0eWxlV2lkdGguc3Vic3RyKHRhQ29tcHV0ZWRTdHlsZVdpZHRoLmxlbmd0aCAtIDIsIDIpID09PSAncHgnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB1cGRhdGUgbWlycm9yIHdpZHRoIGluIGNhc2UgdGhlIHRleHRhcmVhIHdpZHRoIGhhcyBjaGFuZ2VkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aCA9IHBhcnNlSW50KHRhQ29tcHV0ZWRTdHlsZVdpZHRoLCAxMCkgLSBib3hPdXRlci53aWR0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1pcnJvci5zdHlsZS53aWR0aCA9IHdpZHRoICsgJ3B4JztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1pcnJvckhlaWdodCA9IG1pcnJvci5zY3JvbGxIZWlnaHQ7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1pcnJvckhlaWdodCA+IG1heEhlaWdodCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWlycm9ySGVpZ2h0ID0gbWF4SGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3ZlcmZsb3cgPSAnc2Nyb2xsJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChtaXJyb3JIZWlnaHQgPCBtaW5IZWlnaHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1pcnJvckhlaWdodCA9IG1pbkhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaXJyb3JIZWlnaHQgKz0gYm94T3V0ZXIuaGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YS5zdHlsZS5vdmVyZmxvd1kgPSBvdmVyZmxvdyB8fCAnaGlkZGVuJztcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGFIZWlnaHQgIT09IG1pcnJvckhlaWdodCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NvcGUuJGVtaXQoJ2VsYXN0aWM6cmVzaXplJywgJHRhLCB0YUhlaWdodCwgbWlycm9ySGVpZ2h0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhLnN0eWxlLmhlaWdodCA9IG1pcnJvckhlaWdodCArICdweCc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBzbWFsbCBkZWxheSB0byBwcmV2ZW50IGFuIGluZmluaXRlIGxvb3BcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0aXZlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIDEsIGZhbHNlKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gZm9yY2VBZGp1c3QoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0aXZlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWRqdXN0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8qXG4gICAgICAgICAgICAgICAgICAgICAgICAgKiBpbml0aWFsaXNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgKi9cblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gbGlzdGVuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoJ29ucHJvcGVydHljaGFuZ2UnIGluIHRhICYmICdvbmlucHV0JyBpbiB0YSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIElFOVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhWydvbmlucHV0J10gPSB0YS5vbmtleXVwID0gYWRqdXN0O1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YVsnb25pbnB1dCddID0gYWRqdXN0O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAkd2luLmJpbmQoJ3Jlc2l6ZScsIGZvcmNlQWRqdXN0KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgc2NvcGUuJHdhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmdNb2RlbC4kbW9kZWxWYWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChuZXdWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvcmNlQWRqdXN0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgc2NvcGUuJG9uKCdlbGFzdGljOmFkanVzdCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbml0TWlycm9yKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yY2VBZGp1c3QoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAkdGltZW91dChhZGp1c3QsIDAsIGZhbHNlKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLypcbiAgICAgICAgICAgICAgICAgICAgICAgICAqIGRlc3Ryb3lcbiAgICAgICAgICAgICAgICAgICAgICAgICAqL1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBzY29wZS4kb24oJyRkZXN0cm95JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRtaXJyb3IucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHdpbi51bmJpbmQoJ3Jlc2l6ZScsIGZvcmNlQWRqdXN0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgXSk7XG5cbiAgICBhbmd1bGFyXG4gICAgICAgIC5tb2R1bGUoJ2FwcC5tZXNzYWdlcycsIFsnbW9ub3NwYWNlZC5lbGFzdGljJ10pO1xufSkoKTtcblxuXG5cblxuIiwiKGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBhbmd1bGFyLm1vZHVsZShcImFwcC5wcm9maWxlc1wiLCBbJ2FwcC5hdXRoJ10pO1xufSkoKTsiLCIoZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGFuZ3VsYXIubW9kdWxlKFwiYXBwLnVzZXJzXCIsIFsnYXBwLmF1dGgnXSk7XG59KSgpOyIsIihmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgYW5ndWxhci5tb2R1bGUoXCJhcHAuc2lkZW1lbnVcIiwgW10pO1xufSkoKTsiLCIoZnVuY3Rpb24oKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgYW5ndWxhci5tb2R1bGUoXCJhcHAuYXV0aFwiKVxuXG4gICAgICAgIC5jb250cm9sbGVyKFwiYXV0aENvbnRyb2xsZXJcIiwgYXV0aENvbnRyb2xsZXIpO1xuXG5cbiAgICBmdW5jdGlvbiBhdXRoQ29udHJvbGxlcigkc2NvcGUsIGF1dGhTZXJ2aWNlLCAkaW9uaWNQb3B1cCwgJGlvbmljTG9hZGluZywgJHN0YXRlLCAkdGltZW91dCkge1xuXG4gICAgICAgICRzY29wZS5kYXRhID0ge307XG5cbiAgICAgICAgJHNjb3BlLmxvZ2luID0gZnVuY3Rpb24oKSB7XG5cdFx0XHQkaW9uaWNMb2FkaW5nLnNob3coKTtcblxuXHRcdFx0YXV0aFNlcnZpY2UubG9naW4oJHNjb3BlLmRhdGEudXNlcm5hbWUsICRzY29wZS5kYXRhLnBhc3N3b3JkKS5zdWNjZXNzKGZ1bmN0aW9uKHVzZXIpIHtcblx0XHRcdFx0JGlvbmljTG9hZGluZy5oaWRlKCk7XG5cdFx0XHRcdCRzdGF0ZS5nbygnYXBwLmJ1aWxkaW5ncycpO1xuXG4gICAgICAgICAgICB9KS5lcnJvcihmdW5jdGlvbihlcnJvcikge1xuXHRcdFx0XHQkdGltZW91dChmdW5jdGlvbigpIHtcblx0XHRcdFx0XHQkaW9uaWNMb2FkaW5nLmhpZGUoKTtcblx0XHRcdFx0fSwgMTAwKTtcblxuICAgICAgICAgICAgICAgIHZhciBhbGVydFBvcHVwID0gJGlvbmljUG9wdXAuYWxlcnQoe1xuICAgICAgICAgICAgICAgICAgICB0aXRsZTogJ0xvZ2luIGZhaWxlZCEnLFxuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZTogZXJyb3IubWVzc2FnZSAvLydQbGVhc2UgY2hlY2sgeW91ciBjcmVkZW50aWFscyEnXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG5cdFx0JHNjb3BlLmZhY2Vib29rTG9naW4gPSBmdW5jdGlvbigpIHtcblx0XHRcdHZhciBhbGVydFBvcHVwID0gJGlvbmljUG9wdXAuYWxlcnQoe1xuXHRcdFx0XHR0aXRsZTogJ0ZhY2Vib29rIGxvZ2luJyxcblx0XHRcdFx0dGVtcGxhdGU6ICdQbGFubmVkISdcblx0XHRcdH0pO1xuICAgICAgICB9XG4gICAgfVxufSkoKTsiLCIoZnVuY3Rpb24oKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgYW5ndWxhci5tb2R1bGUoXCJhcHAuYXV0aFwiKVxuXG4gICAgICAgIC5zZXJ2aWNlKFwiYXV0aFNlcnZpY2VcIiwgYXV0aFNlcnZpY2UpO1xuXG5cdGZ1bmN0aW9uIGNyZWF0ZVVzZXIodXNlcm5hbWUsIHBhc3N3b3JkKSB7XG5cdFx0dmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcblx0XHR2YXIgYXV0aCA9IGZpcmViYXNlU2VydmljZS5mYi5hdXRoKCk7XG5cblx0XHRyZXR1cm4gYXV0aC5jcmVhdGVVc2VyV2l0aEVtYWlsQW5kUGFzc3dvcmQoZW1haWwsIHBhc3N3b3JkKTtcblx0fVxuXHRcbiAgICBmdW5jdGlvbiBhdXRoU2VydmljZSgkcSwgJHJvb3RTY29wZSwgYnVpbGRpbmdzU2VydmljZSwgZ2xvYmFsc1NlcnZpY2UpIHtcblx0XHR2YXIgYXV0aCA9IGZpcmViYXNlLmF1dGgoKTtcblx0XHRcblx0XHQkcm9vdFNjb3BlLiRvbigndXNlci1jaGFuZ2VkJywgZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgdXNyID0gZmlyZWJhc2UuYXV0aCgpLmN1cnJlbnRVc2VyO1xuXHRcdFx0aWYgKHVzciA9PSBudWxsKSB7XG5cdFx0XHRcdGdsb2JhbHNTZXJ2aWNlLnVzZXIgPSBudWxsO1xuXHRcdFx0XHRyZXR1cm5cblx0XHRcdH07XG5cdFx0XHRcblx0XHRcdGdsb2JhbHNTZXJ2aWNlLnVzZXIgPSB1c3I7XG5cdFx0XHRcblx0XHRcdHZhciByZWYgPSBmaXJlYmFzZS5kYXRhYmFzZSgpLnJlZigndXNlcnMvJyArIHVzci51aWQpO1xuXHRcdFx0cmVmLmNoaWxkKCduYW1lJykuc2V0KHVzci5kaXNwbGF5TmFtZSk7XG5cdFx0XHRyZWYuY2hpbGQoJ2VtYWlsJykuc2V0KHVzci5lbWFpbCk7XG5cdFx0XHRyZWYuY2hpbGQoJ2xhc3RBY3Rpdml0eScpLnNldChuZXcgRGF0ZSgpLmdldFRpbWUoKSk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4ge1xuICAgICAgICAgICAgbG9naW46IGZ1bmN0aW9uKHVzZXJuYW1lLCBwYXNzd29yZCkge1xuICAgICAgICAgICAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgICAgICAgdmFyIHByb21pc2UgPSBkZWZlcnJlZC5wcm9taXNlO1xuXG5cdFx0XHRcdHZhciBzdWNjZXNzSGFuZGxlciA9IGZ1bmN0aW9uKGluZm8pIHtcblx0XHRcdFx0XHRpbmZvLmlzTmV3ID0gaW5mby5kaXNwbGF5TmFtZSA9PSBudWxsO1xuXHRcdFx0XHRcdGRlZmVycmVkLnJlc29sdmUoaW5mbyk7XG5cdFx0XHRcdFx0XHRcdFx0XHRcblx0XHRcdFx0XHQkcm9vdFNjb3BlLiRlbWl0KCd1c2VyLWNoYW5nZWQnKTtcblx0XHRcdFx0fTtcblxuXHRcdFx0XHR2YXIgZXJyb3JIYW5kbGVyID0gZnVuY3Rpb24oZXJyb3IpIHtcblx0XHRcdFx0XHRkZWZlcnJlZC5yZWplY3QoZXJyb3IpO1xuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdGF1dGguc2lnbkluV2l0aEVtYWlsQW5kUGFzc3dvcmQodXNlcm5hbWUsIHBhc3N3b3JkKVxuXHRcdFx0XHRcdC50aGVuKHN1Y2Nlc3NIYW5kbGVyLCBmdW5jdGlvbiBlcnJvcihlcnJvcikge1xuXHRcdFx0XHRcdFx0aWYgKGVycm9yLmNvZGUgPT0gXCJhdXRoL3VzZXItbm90LWZvdW5kXCIpIHtcblx0XHRcdFx0XHRcdFx0YXV0aC5jcmVhdGVVc2VyV2l0aEVtYWlsQW5kUGFzc3dvcmQodXNlcm5hbWUsIHBhc3N3b3JkKVxuXHRcdFx0XHRcdFx0XHRcdC50aGVuKHN1Y2Nlc3NIYW5kbGVyLCBlcnJvckhhbmRsZXIpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0XHRcdGVycm9ySGFuZGxlcihlcnJvcik7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSk7XG5cbiAgICAgICAgICAgICAgICBwcm9taXNlLnN1Y2Nlc3MgPSBmdW5jdGlvbihmbikge1xuICAgICAgICAgICAgICAgICAgICBwcm9taXNlLnRoZW4oZm4pO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcHJvbWlzZS5lcnJvciA9IGZ1bmN0aW9uKGZuKSB7XG4gICAgICAgICAgICAgICAgICAgIHByb21pc2UudGhlbihudWxsLCBmbik7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBwcm9taXNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICAgICAgICAgIH0sXG5cblx0XHRcdGxvZ291dDogZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRhdXRoLnNpZ25PdXQoKTtcblx0XHRcdFx0Z2xvYmFsc1NlcnZpY2UudXNlciA9IG51bGw7XG5cdFx0XHR9LFxuXG4gICAgICAgICAgICB1c2VyOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0cmV0dXJuIGZpcmViYXNlLmF1dGgoKS5jdXJyZW50VXNlcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn0pKCk7XG4iLCIoZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGFuZ3VsYXIubW9kdWxlKFwiYXBwLmJ1aWxkaW5nc1wiKVxuXG4gICAgICAgIC5jb250cm9sbGVyKFwiYnVpbGRpbmdDb250cm9sbGVyXCIsIGJ1aWxkaW5nQ29udHJvbGxlcik7XG5cblxuICAgIGZ1bmN0aW9uIGJ1aWxkaW5nQ29udHJvbGxlcigkc2NvcGUsICRpb25pY0xvYWRpbmcsICRzdGF0ZVBhcmFtcywgY2hhbm5lbHNTZXJ2aWNlKSB7XG5cbiAgICAgICAgdmFyIHJlZiA9IGNoYW5uZWxzU2VydmljZS5nZXRDaGFubmVsc0Zyb20oJHN0YXRlUGFyYW1zLmJ1aWxkaW5nSWQpO1xuXG4gICAgICAgICRpb25pY0xvYWRpbmcuc2hvdygpO1xuICAgICAgICByZWYub24oXCJ2YWx1ZVwiLCBmdW5jdGlvbiAoc25hcHNob3QpIHtcbiAgICAgICAgICAgIHZhciB2YWwgPSBzbmFwc2hvdC52YWwoKTtcblxuICAgICAgICAgICAgaWYgKHZhbCkge1xuICAgICAgICAgICAgICAgICRzY29wZS5jaGFubmVscyA9IHZhbC5jaGFubmVscztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAkaW9uaWNMb2FkaW5nLmhpZGUoKTtcblxuICAgICAgICB9LCBmdW5jdGlvbiAoZXJyb3JPYmplY3QpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiZXJyb3IgcmVhZGluZzogXCIgKyBlcnJvck9iamVjdC5jb2RlKTtcbiAgICAgICAgICAgIHZhciBhbGVydFBvcHVwID0gJGlvbmljUG9wdXAuYWxlcnQoe1xuICAgICAgICAgICAgICAgIHRpdGxlOiAnT3BzIScsXG4gICAgICAgICAgICAgICAgdGVtcGxhdGU6ICdTb3JyeSEgQW4gZXJyb3Igb2N1cnJlZC4nXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICRpb25pY0xvYWRpbmcuaGlkZSgpO1xuICAgICAgICB9KTtcblxuICAgIH1cbn0pKCk7IiwiKGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBhbmd1bGFyLm1vZHVsZShcImFwcC5idWlsZGluZ3NcIilcblxuICAgICAgICAuY29udHJvbGxlcihcImJ1aWxkaW5nc0NvbnRyb2xsZXJcIiwgYnVpbGRpbmdzQ29udHJvbGxlcik7XG5cblxuICAgIGZ1bmN0aW9uIGJ1aWxkaW5nc0NvbnRyb2xsZXIoJHNjb3BlLCAkaW9uaWNMb2FkaW5nLCBidWlsZGluZ3NTZXJ2aWNlLCBnbG9iYWxzU2VydmljZSkge1xuICAgICAgICB2YXIgcmVmID0gYnVpbGRpbmdzU2VydmljZS5nZXRCdWlsZGluZ3MoKTtcblx0XHRcblx0XHQkc2NvcGUuc2VsZWN0ZWRLZXkgPSBnbG9iYWxzU2VydmljZS5idWlsZGluZyA/IGdsb2JhbHNTZXJ2aWNlLmJ1aWxkaW5nLmtleSA6IG51bGw7XG5cdFx0XG5cdFx0JHNjb3BlLnNlbGVjdCA9IGZ1bmN0aW9uKGtleSwgYnVpbGRpbmcpIHtcblx0XHRcdCRzY29wZS5zZWxlY3RlZEtleSA9IGJ1aWxkaW5nLmtleSA9IGtleTtcblx0XHRcdGdsb2JhbHNTZXJ2aWNlLmJ1aWxkaW5nID0gYnVpbGRpbmc7XG5cdFx0XHQkc2NvcGUuJGVtaXQoXCJidWlsZGluZy1zZWxlY3RlZFwiLCBidWlsZGluZyk7XG5cdFx0fTtcdFx0XG5cbiAgICAgICAgJGlvbmljTG9hZGluZy5zaG93KCk7XG4gICAgICAgIHJlZi5vbihcInZhbHVlXCIsIGZ1bmN0aW9uIChzbmFwc2hvdCkge1xuICAgICAgICAgICAgJHNjb3BlLmJ1aWxkaW5ncyA9IHNuYXBzaG90LnZhbCgpO1xuICAgICAgICAgICAgJGlvbmljTG9hZGluZy5oaWRlKCk7XG4gICAgICAgIH0sIGZ1bmN0aW9uIChlcnJvck9iamVjdCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJlcnJvciByZWFkaW5nOiBcIiArIGVycm9yT2JqZWN0LmNvZGUpO1xuICAgICAgICAgICAgdmFyIGFsZXJ0UG9wdXAgPSAkaW9uaWNQb3B1cC5hbGVydCh7XG4gICAgICAgICAgICAgICAgdGl0bGU6ICdPcHMhJyxcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZTogJ1NvcnJ5ISBBbiBlcnJvciBvY3VycmVkJ1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAkaW9uaWNMb2FkaW5nLmhpZGUoKTtcbiAgICAgICAgfSk7XG4gICAgfVxufSkoKTsiLCIoZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGFuZ3VsYXJcbiAgICAgICAgLm1vZHVsZSgnYXBwLmJ1aWxkaW5ncycpXG4gICAgICAgIC5zZXJ2aWNlKCdidWlsZGluZ3NTZXJ2aWNlJywgYnVpbGRpbmdzU2VydmljZSk7XG5cbiAgICBmdW5jdGlvbiBidWlsZGluZ3NTZXJ2aWNlKGZpcmViYXNlU2VydmljZSwgJHJvb3RTY29wZSkge1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBnZXRCdWlsZGluZ3M6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmlyZWJhc2UuZGF0YWJhc2UoKS5yZWYoJ2J1aWxkaW5ncycpXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59KSgpO1xuIiwiKGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBhbmd1bGFyXG4gICAgICAgIC5tb2R1bGUoJ2FwcC5jaGFubmVscycpXG4gICAgICAgIC5zZXJ2aWNlKCdjaGFubmVsc1NlcnZpY2UnLCBjaGFubmVsc1NlcnZpY2UpO1xuXG4gICAgZnVuY3Rpb24gY2hhbm5lbHNTZXJ2aWNlKCRyb290U2NvcGUpIHtcblx0XHR2YXIgc2VydmljZSA9IHt9O1xuXHRcdFxuXHRcdHNlcnZpY2UuY2hhbm5lbHMgPSB7XG5cdFx0XHRcImxhbmRsb3JkXCI6IFwiVGFsayB0byBsYW5kbG9yZFwiLFxuXHRcdFx0XCJnZW5lcmFsXCI6IFwiR2VuZXJhbFwiLFxuXHRcdFx0XCJwYXJraW5nXCI6IFwiUGFya2luZyBHYXJhZ2VcIixcblx0XHRcdFwiZ2FyZGVuXCI6IFwiR2FyZGVuXCIsXG5cdFx0XHRcImxvc3Rmb3VuZFwiOiBcIkxvc3QgJiBGb3VuZFwiLFxuXHRcdFx0XCJtYWludGVuYW5jZVwiOiBcIlJlcXVlc3QgTWFpbnRlbmFuY2VcIlxuXHRcdH07XG5cdFx0XG5cdFx0JHJvb3RTY29wZS4kb24oXCJidWlsZGluZy1zZWxlY3RlZFwiLCBmdW5jdGlvbihidWlsZGluZykge1xuXHRcdFx0Ly9jb3VudCBob3cgbWFueSBuZXcgbWVzc2FnZXMgZWFjaCBjaGFubmVsIGhhc1xuXHRcdH0pO1xuXHRcdFxuXHRcdHNlcnZpY2UuZ2V0Q2hhbm5lbHNGcm9tID0gZnVuY3Rpb24gKGJ1aWxkaW5nKSB7XG5cdFx0XHRyZXR1cm4gZmlyZWJhc2UuZGF0YWJhc2UoKS5yZWYoJ2J1aWxkaW5ncy8nICsgYnVpbGRpbmcgKyBcIi9jaGFubmVsc1wiKTtcblx0XHR9O1xuXG4gICAgICAgIHJldHVybiBzZXJ2aWNlO1xuICAgIH1cbn0pKCk7XG5cbiIsIihmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgYW5ndWxhclxuICAgICAgICAubW9kdWxlKCdhcHAuZGlyZWN0bWVzc2FnZXMnKVxuICAgICAgICAuY29udHJvbGxlcignZGlyZWN0TWVzc2FnZXNDb250cm9sbGVyJywgW1xuICAgICAgICAgICAgJyRzY29wZScsXG4gICAgICAgICAgICAnJHN0YXRlJyxcbiAgICAgICAgICAgICckaW9uaWNMb2FkaW5nJyxcbiAgICAgICAgICAgICdkaXJlY3RNZXNzYWdlc1NlcnZpY2UnLFxuICAgICAgICAgICAgJ2dsb2JhbHNTZXJ2aWNlJyxcbiAgICAgICAgICAgIGRpcmVjdE1lc3NhZ2VzQ29udHJvbGxlclxuICAgICAgICBdKTtcblxuICAgIGZ1bmN0aW9uIGRpcmVjdE1lc3NhZ2VzQ29udHJvbGxlcigkc2NvcGUsICRzdGF0ZSwgJGlvbmljTG9hZGluZywgY29udGFjdHNTZXJ2aWNlLCBnbG9iYWxzU2VydmljZSkge1xuXG4gICAgICAgIGdldENvbnRhY3RzKGdldFVzZXIoKSk7XG5cbiAgICAgICAgZnVuY3Rpb24gZ2V0VXNlcigpIHtcblxuICAgICAgICAgICAgaWYgKCFnbG9iYWxzU2VydmljZS51c2VyKSB7XG4gICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdsb2dpbicpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGdsb2JhbHNTZXJ2aWNlLnVzZXI7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBnZXRDb250YWN0cyh1c2VyKSB7XG4gICAgICAgICAgICAkaW9uaWNMb2FkaW5nLnNob3coKTtcbiAgICAgICAgICAgIHZhciByZWYgPSBjb250YWN0c1NlcnZpY2UuZ2V0VXNlckNvbnRhY3RzKHVzZXIudWlkKTtcblxuICAgICAgICAgICAgcmVmLm9uKFwidmFsdWVcIiwgZnVuY3Rpb24gKHNuYXBzaG90KSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLmNvbnRhY3RzID0gc25hcHNob3QudmFsKCk7XG4gICAgICAgICAgICAgICAgJGlvbmljTG9hZGluZy5oaWRlKCk7XG5cbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChlcnJvck9iamVjdCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiZXJyb3IgcmVhZGluZzogXCIgKyBlcnJvck9iamVjdC5jb2RlKTtcbiAgICAgICAgICAgICAgICAkaW9uaWNMb2FkaW5nLmhpZGUoKTtcbiAgICAgICAgICAgICAgICB2YXIgYWxlcnRQb3B1cCA9ICRpb25pY1BvcHVwLmFsZXJ0KHtcbiAgICAgICAgICAgICAgICAgICAgdGl0bGU6ICdPcHMhJyxcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGU6ICdTb3JyeSEgQW4gZXJyb3Igb2N1cnJlZC4nXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbn0pKCk7IiwiKGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBhbmd1bGFyXG4gICAgICAgIC5tb2R1bGUoJ2FwcC5kaXJlY3RtZXNzYWdlcycpXG4gICAgICAgIC5zZXJ2aWNlKCdkaXJlY3RNZXNzYWdlc1NlcnZpY2UnLCBkaXJlY3RNZXNzYWdlc1NlcnZpY2UpO1xuXG4gICAgZnVuY3Rpb24gZGlyZWN0TWVzc2FnZXNTZXJ2aWNlKGZpcmViYXNlU2VydmljZSkge1xuICAgICAgICB2YXIgc2VydmljZSA9IHt9O1xuXG4gICAgICAgIHNlcnZpY2UuZ2V0VXNlckNvbnRhY3RzID0gZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBmaXJlYmFzZVNlcnZpY2UuZmIuZGF0YWJhc2UoKS5yZWYoJ3VzZXJzLycgKyB1c2VyICsgJy9jb250YWN0cycpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiBzZXJ2aWNlO1xuICAgIH1cbn0pKCk7XG4iLCIoZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGFuZ3VsYXJcbiAgICAgICAgLm1vZHVsZSgnYXBwLmZpcmViYXNlJylcbiAgICAgICAgLnNlcnZpY2UoJ2ZpcmViYXNlU2VydmljZScsIGZpcmViYXNlU2VydmljZSk7XG5cblxuICAgIGZ1bmN0aW9uIGZpcmViYXNlU2VydmljZSgpIHtcbiAgICAgICAgdmFyIGNvbmZpZyA9IHtcbiAgICAgICAgICAgIGFwaUtleTogXCJBSXphU3lCNXE4MUFHR294NGk4LVFMMktPdG5ERGZpMDVpcmdjSEVcIixcbiAgICAgICAgICAgIGF1dGhEb21haW46IFwic29jaWFsc3RyYXRhaWRlYXRlYW0uZmlyZWJhc2VhcHAuY29tXCIsXG4gICAgICAgICAgICBkYXRhYmFzZVVSTDogXCJodHRwczovL3NvY2lhbHN0cmF0YWlkZWF0ZWFtLmZpcmViYXNlaW8uY29tXCIsXG4gICAgICAgICAgICBzdG9yYWdlQnVja2V0OiBcIlwiLFxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZmIgPSBmaXJlYmFzZS5pbml0aWFsaXplQXBwKGNvbmZpZyk7XG4gICAgfVxufSkoKTtcbiIsIihmdW5jdGlvbigpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBhbmd1bGFyXG4gICAgICAgIC5tb2R1bGUoJ2FwcC5tZXNzYWdlcycpXG4gICAgICAgIC5jb250cm9sbGVyKCdtZXNzYWdlc0NvbnRyb2xsZXInLCBbXG4gICAgICAgICAgICAnJHNjb3BlJyxcbiAgICAgICAgICAgICckc3RhdGUnLFxuICAgICAgICAgICAgJyRzdGF0ZVBhcmFtcycsXG4gICAgICAgICAgICAnJGlvbmljU2Nyb2xsRGVsZWdhdGUnLFxuICAgICAgICAgICAgJyR0aW1lb3V0JyxcbiAgICAgICAgICAgICdjaGFubmVsc1NlcnZpY2UnLFxuICAgICAgICAgICAgJ2dsb2JhbHNTZXJ2aWNlJyxcbiAgICAgICAgICAgIE1lc3NhZ2VzQ29udHJvbGxlclxuICAgICAgICBdKTtcblxuICAgIGZ1bmN0aW9uIE1lc3NhZ2VzQ29udHJvbGxlcigkc2NvcGUsICRzdGF0ZSwgJHN0YXRlUGFyYW1zLCAkaW9uaWNTY3JvbGxEZWxlZ2F0ZSwgJHRpbWVvdXQsIGNoYW5uZWxzU2VydmljZSwgZ2xvYmFsc1NlcnZpY2UpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIC8vYXZhaWxhYmxlIHNlcnZpY2VzXG4gICAgICAgIHRoaXMuJHNjb3BlID0gJHNjb3BlO1xuICAgICAgICB0aGlzLiRzdGF0ZSA9ICRzdGF0ZTtcbiAgICAgICAgdGhpcy4kc3RhdGVQYXJhbXMgPSAkc3RhdGVQYXJhbXM7XG4gICAgICAgIHRoaXMuJGlvbmljU2Nyb2xsRGVsZWdhdGUgPSAkaW9uaWNTY3JvbGxEZWxlZ2F0ZTtcbiAgICAgICAgdGhpcy4kdGltZW91dCA9ICR0aW1lb3V0O1xuICAgICAgICB0aGlzLmNoYW5uZWxzU2VydmljZSA9IGNoYW5uZWxzU2VydmljZTtcbiAgICAgICAgdGhpcy5nbG9iYWxzU2VydmljZSA9IGdsb2JhbHNTZXJ2aWNlO1xuXG4gICAgICAgIHRoaXMubW9kZSA9ICRzdGF0ZVBhcmFtcy51c2VySWQgPyBcImNoYXRcIiA6IFwiY2hhbm5lbFwiO1xuICAgICAgICBpZiAoIXRoaXMudmFsaWRhdGUoKSlcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcblxuICAgICAgICAvL2N1c3RvbSBwcm9wZXJ0aWVzXG4gICAgICAgIHRoaXMuYnVpbGRpbmdLZXkgPSBnbG9iYWxzU2VydmljZS5idWlsZGluZyA/IGdsb2JhbHNTZXJ2aWNlLmJ1aWxkaW5nLmtleSA6IG51bGw7XG4gICAgICAgIHRoaXMuY2hhbm5lbEtleSA9ICRzdGF0ZVBhcmFtcy5jaGFubmVsSWQ7XG4gICAgICAgIHRoaXMudG9Vc2VySWQgPSAkc3RhdGVQYXJhbXMudXNlcklkO1xuICAgICAgICB0aGlzLm1lc3NhZ2VSZWY7XG5cbiAgICAgICAgJHNjb3BlLnVzZXIgPSB7XG4gICAgICAgICAgICBpZDogJHNjb3BlLnVzZXIudWlkLFxuICAgICAgICAgICAgcGljOiAnaHR0cDovL2lvbmljZnJhbWV3b3JrLmNvbS9pbWcvZG9jcy9tY2ZseS5qcGcnLFxuICAgICAgICAgICAgbmFtZTogZ2xvYmFsc1NlcnZpY2UudXNlci5kaXNwbGF5TmFtZSA/IGdsb2JhbHNTZXJ2aWNlLnVzZXIuZGlzcGxheU5hbWUgOiAnVW5kZWZpbmVkJ1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS50aXRsZSA9IFwiLi4uXCI7XG4gICAgICAgICRzY29wZS5jaGFubmVsS2V5ID0gdGhpcy5jaGFubmVsS2V5OyAvL3RvIHVzZSBpbiBzZW5kTWVzc2FnZVxuICAgICAgICAkc2NvcGUudG9Vc2VyO1xuICAgICAgICAkc2NvcGUubWVzc2FnZXMgPSBbXTtcbiAgICAgICAgJHNjb3BlLmlucHV0TWVzc2FnZSA9ICcnO1xuICAgICAgICAkc2NvcGUuc2VuZE1lc3NhZ2UgPSBmdW5jdGlvbihtc2cpIHtcbiAgICAgICAgICAgIHNlbGYuZG9TZW5kTWVzc2FnZShzZWxmLCBtc2cpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vVUkgZWxlbWVudHNcbiAgICAgICAgdGhpcy52aWV3U2Nyb2xsID0gJGlvbmljU2Nyb2xsRGVsZWdhdGUuJGdldEJ5SGFuZGxlKCd1c2VyTWVzc2FnZVNjcm9sbCcpO1xuICAgICAgICB0aGlzLmZvb3RlckJhciA9IGRvY3VtZW50LmJvZHkucXVlcnlTZWxlY3RvcignI3VzZXJNZXNzYWdlc1ZpZXcgLmJhci1mb290ZXInKTtcbiAgICAgICAgdGhpcy5zY3JvbGxlciA9IGRvY3VtZW50LmJvZHkucXVlcnlTZWxlY3RvcignI3VzZXJNZXNzYWdlc1ZpZXcgLnNjcm9sbC1jb250ZW50Jyk7XG4gICAgICAgIHRoaXMudHh0SW5wdXQgPSBhbmd1bGFyLmVsZW1lbnQodGhpcy5mb290ZXJCYXIucXVlcnlTZWxlY3RvcigndGV4dGFyZWEnKSk7XG5cbiAgICAgICAgLy9ldmVudHNcbiAgICAgICAgJHNjb3BlLiRvbihcImNoYXQtcmVjZWl2ZS1tZXNzYWdlXCIsIHRoaXMub25SZWNlaXZlTWVzc2FnZSk7XG5cbiAgICAgICAgJHNjb3BlLiRvbignJGlvbmljVmlldy5iZWZvcmVMZWF2ZScsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgc2VsZi5tZXNzYWdlUmVmLm9mZignY2hpbGRfYWRkZWQnKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5pbml0KCk7XG4gICAgfVxuXG4gICAgTWVzc2FnZXNDb250cm9sbGVyLnByb3RvdHlwZS52YWxpZGF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoIXRoaXMuZ2xvYmFsc1NlcnZpY2UudXNlcikge1xuICAgICAgICAgICAgdGhpcy4kc3RhdGUuZ28oJ2xvZ2luJyk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXRoaXMuZ2xvYmFsc1NlcnZpY2UuYnVpbGRpbmcgJiYgdGhpcy5tb2RlID09IFwiY2hhbm5lbFwiKSB7XG4gICAgICAgICAgICB0aGlzLiRzdGF0ZS5nbygnYXBwLmJ1aWxkaW5ncycpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfTtcblxuICAgIC8vQ2hlY2sgaWYgaXMgYSBDb21tb24gUm9vbSBvciBEaXJlY3QgTWVzc2FnZVxuICAgIE1lc3NhZ2VzQ29udHJvbGxlci5wcm90b3R5cGUuaW5pdCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgaWYgKHNlbGYubW9kZSA9PSBcImNoYW5uZWxcIikge1xuICAgICAgICAgICAgc2VsZi4kc2NvcGUudGl0bGUgPSB0aGlzLmNoYW5uZWxzU2VydmljZS5jaGFubmVsc1t0aGlzLiRzdGF0ZVBhcmFtcy5jaGFubmVsSWRdO1xuICAgICAgICAgICAgXG5cdFx0XHR2YXIgY2hhbm5lbFBhdGggPSBbJ2J1aWxkaW5ncycsIHRoaXMuYnVpbGRpbmdLZXksICdjaGFubmVscycsIHRoaXMuJHN0YXRlUGFyYW1zLmNoYW5uZWxJZF0uam9pbignLycpO1xuXHRcdFx0dmFyIGNoYW5uZWxSZWYgPSBmaXJlYmFzZS5kYXRhYmFzZSgpLnJlZihjaGFubmVsUGF0aCk7XG4gICAgICAgICAgICBjaGFubmVsUmVmLm9uY2UoJ3ZhbHVlJywgZnVuY3Rpb24oc25hcHNob3QpIHtcbiAgICAgICAgICAgICAgICBzZWxmLmNoYW5uZWwgPSBzbmFwc2hvdC52YWwoKTtcblxuICAgICAgICAgICAgICAgIGlmIChzZWxmLmNoYW5uZWwudHlwZSA9PSBcImRpcmVjdFwiKSB7IC8vZGlyZWN0IG1lc3NhZ2VcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5zZXRDb250YWN0KHNlbGYuY2hhbm5lbC51c2VyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7IC8vQ29tbW9uIHJvb21cbiAgICAgICAgICAgICAgICAgICAgc2VsZi5nZXRMYXN0TWVzc2FnZXMoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHsgLy9jaGF0XG5cdFx0XHRzZWxmLiRzY29wZS50aXRsZSA9IHRoaXMuJHN0YXRlUGFyYW1zLm5hbWU7XG4gICAgICAgICAgICBzZWxmLnNldENvbnRhY3Qoc2VsZi50b1VzZXJJZCk7XG4gICAgICAgIH1cblxuICAgIH07XG5cbiAgICBNZXNzYWdlc0NvbnRyb2xsZXIucHJvdG90eXBlLnNldENvbnRhY3QgPSBmdW5jdGlvbih1aWQpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIHZhciBjb250YWN0UGF0aCA9IFsndXNlcnMnLCB1aWRdLmpvaW4oJy8nKTtcblxuICAgICAgICBmaXJlYmFzZS5kYXRhYmFzZSgpLnJlZihjb250YWN0UGF0aCkub25jZSgndmFsdWUnLCBmdW5jdGlvbihzbmFwc2hvdCkge1xuICAgICAgICAgICAgdmFyIGNvbnRhY3QgPSBzbmFwc2hvdC52YWwoKTtcbiAgICAgICAgICAgIHZhciBuYW1lID0gY29udGFjdCAmJiBjb250YWN0LmRpc3BsYXlOYW1lID8gY29udGFjdC5kaXNwbGF5TmFtZSA6ICdVbmRlbnRpZmllZCc7XG4gICAgICAgICAgICBzZWxmLiRzY29wZS50b1VzZXIgPSBzZWxmLnRvVXNlciA9IHtcbiAgICAgICAgICAgICAgICB1c2VySWQ6IHVpZCxcbiAgICAgICAgICAgICAgICB1c2VyUGljOiAnaHR0cDovL2lvbmljZnJhbWV3b3JrLmNvbS9pbWcvZG9jcy92ZW5rbWFuLmpwZycsXG4gICAgICAgICAgICAgICAgdXNlck5hbWU6IG5hbWVcbiAgICAgICAgICAgIH07XG5cdFx0XHRcbiAgICAgICAgICAgIHNlbGYuZ2V0TGFzdE1lc3NhZ2VzKCk7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBNZXNzYWdlc0NvbnRyb2xsZXIucHJvdG90eXBlLmdldExhc3RNZXNzYWdlcyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHZhciBxdWVyeTtcblxuICAgICAgICBpZiAoc2VsZi5tb2RlID09IFwiY2hhdFwiKSB7XG4gICAgICAgICAgICBzZWxmLm1lc3NhZ2VSZWYgPSBmaXJlYmFzZS5kYXRhYmFzZSgpLnJlZihcIm1lc3NhZ2VzXCIpO1xuICAgICAgICAgICAgcXVlcnkgPSBzZWxmLm1lc3NhZ2VSZWYub3JkZXJCeUNoaWxkKCd0bycpLmVxdWFsVG8oc2VsZi50b1VzZXJJZCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB2YXIgbXNnUGF0aCA9IFsnYnVpbGRpbmdzJywgc2VsZi5idWlsZGluZ0tleSwgJ21lc3NhZ2VzJ10uam9pbignLycpO1xuICAgICAgICAgICAgc2VsZi5tZXNzYWdlUmVmID0gZmlyZWJhc2UuZGF0YWJhc2UoKS5yZWYobXNnUGF0aCk7XG5cbiAgICAgICAgICAgIHF1ZXJ5ID0gc2VsZi5tZXNzYWdlUmVmLm9yZGVyQnlDaGlsZCgnY2hhbm5lbCcpLmVxdWFsVG8oc2VsZi5jaGFubmVsS2V5KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHF1ZXJ5XG4gICAgICAgICAgICAubGltaXRUb0xhc3QoMTAwKVxuICAgICAgICAgICAgLm9uKCd2YWx1ZScsIGZ1bmN0aW9uKHMpIHtcbiAgICAgICAgICAgICAgICBzZWxmLiRzY29wZS5tZXNzYWdlcyA9IHMudmFsKCk7XG5cbiAgICAgICAgICAgICAgICBzZWxmLiR0aW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLnZpZXdTY3JvbGwuc2Nyb2xsQm90dG9tKHRydWUpO1xuICAgICAgICAgICAgICAgIH0sIDEwKTtcbiAgICAgICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBNZXNzYWdlc0NvbnRyb2xsZXIucHJvdG90eXBlLmRvU2VuZE1lc3NhZ2UgPSBmdW5jdGlvbihzZWxmLCBtc2cpIHtcbiAgICAgICAgdmFyIG1lc3NhZ2UgPSB7XG4gICAgICAgICAgICBkYXRlOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgICAgICB0ZXh0OiBtc2csXG4gICAgICAgICAgICB1c2VyTmFtZTogc2VsZi4kc2NvcGUudXNlci5uYW1lLFxuICAgICAgICAgICAgdXNlcklkOiBzZWxmLiRzY29wZS51c2VyLmlkLFxuICAgICAgICAgICAgdXNlclBpYzogc2VsZi4kc2NvcGUudXNlci5waWNcbiAgICAgICAgfTtcblxuICAgICAgICBpZiAoc2VsZi50b1VzZXIpXG4gICAgICAgICAgICBtZXNzYWdlLnRvID0gc2VsZi50b1VzZXIudXNlcklkO1xuXG4gICAgICAgIGlmIChzZWxmLm1vZGUgPT0gXCJjaGFubmVsXCIpXG4gICAgICAgICAgICBtZXNzYWdlLmNoYW5uZWwgPSBzZWxmLmNoYW5uZWxLZXk7XG5cbiAgICAgICAgdmFyIG1zZ1BhdGggPSAoc2VsZi5tb2RlID09IFwiY2hhdFwiKVxuICAgICAgICAgICAgPyBcIm1lc3NhZ2VzXCJcbiAgICAgICAgICAgIDogWydidWlsZGluZ3MnLCBzZWxmLmJ1aWxkaW5nS2V5LCAnbWVzc2FnZXMnXS5qb2luKCcvJyk7XG5cbiAgICAgICAgZmlyZWJhc2UuZGF0YWJhc2UoKS5yZWYobXNnUGF0aCkucHVzaChtZXNzYWdlKTtcblxuICAgICAgICBzZWxmLiRzY29wZS5pbnB1dE1lc3NhZ2UgPSAnJztcblxuICAgICAgICBzZWxmLiR0aW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgc2VsZi5rZWVwS2V5Ym9hcmRPcGVuKCk7XG4gICAgICAgICAgICBzZWxmLnZpZXdTY3JvbGwuc2Nyb2xsQm90dG9tKHRydWUpO1xuICAgICAgICB9LCAwKTtcbiAgICB9O1xuXG4gICAgTWVzc2FnZXNDb250cm9sbGVyLnByb3RvdHlwZS5rZWVwS2V5Ym9hcmRPcGVuID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgc2VsZi50eHRJbnB1dC5vbmUoJ2JsdXInLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCd0ZXh0YXJlYSBibHVyLCBmb2N1cyBiYWNrIG9uIGl0Jyk7XG4gICAgICAgICAgICBzZWxmLnR4dElucHV0WzBdLmZvY3VzKCk7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBNZXNzYWdlc0NvbnRyb2xsZXIucHJvdG90eXBlLm9uUHJvZmlsZVBpY0Vycm9yID0gZnVuY3Rpb24oZWxlKSB7XG4gICAgICAgIHRoaXMuZWxlLnNyYyA9ICcnOyAvL2ZhbGxiYWNrXG4gICAgfTtcbn0pKCk7XG5cblxuXG5cbiIsIihmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgYW5ndWxhclxuICAgICAgICAubW9kdWxlKCdhcHAubWVzc2FnZXMnKVxuXG4gICAgICAgIC5maWx0ZXIoJ25sMmJyJywgWyckZmlsdGVyJywgbmwyYnJdKVxuXG4gICAgZnVuY3Rpb24gbmwyYnIoJGZpbHRlcikge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgICAgIGlmICghZGF0YSkgcmV0dXJuIGRhdGE7XG4gICAgICAgICAgICByZXR1cm4gZGF0YS5yZXBsYWNlKC9cXG5cXHI/L2csICc8YnIgLz4nKTtcbiAgICAgICAgfTtcbiAgICB9XG59KSgpOyIsIihmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgYW5ndWxhclxuICAgICAgICAubW9kdWxlKCdhcHAubWVzc2FnZXMnKVxuICAgICAgICAuc2VydmljZSgnbWVzc2FnZXNTZXJ2aWNlJywgbWVzc2FnZXNTZXJ2aWNlKTtcblxuICAgIGZ1bmN0aW9uIG1lc3NhZ2VzU2VydmljZShmaXJlYmFzZVNlcnZpY2UpIHtcbiAgICAgICAgdmFyIHNlcnZpY2UgPSB7fTtcblx0XHRcbiAgICAgICAgc2VydmljZS5nZXRNZXNzYWdlc1JlZiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBmaXJlYmFzZVNlcnZpY2UuZmIuZGF0YWJhc2UoKS5yZWYoJ21lc3NhZ2VzJyk7XG4gICAgICAgIH07XG5cbiAgICAgICAgc2VydmljZS5hZGRNZXNzYWdlID0gZnVuY3Rpb24gKG1lc3NhZ2UpIHtcbiAgICAgICAgICAgIHJldHVybiBmaXJlYmFzZVNlcnZpY2UuZmIuZGF0YWJhc2UoKS5wdXNoKG1lc3NhZ2UpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHNlcnZpY2U7XG4gICAgfVxufSkoKTtcbiIsIihmdW5jdGlvbigpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBhbmd1bGFyLm1vZHVsZShcImFwcC5wcm9maWxlc1wiKVxuXG4gICAgICAgIC5jb250cm9sbGVyKFwicHJvZmlsZUNvbnRyb2xsZXJcIiwgcHJvZmlsZUNvbnRyb2xsZXIpO1xuXG5cbiAgICBmdW5jdGlvbiBwcm9maWxlQ29udHJvbGxlcigkc2NvcGUsICRpb25pY0xvYWRpbmcsICRpb25pY1BvcHVwLCBhdXRoU2VydmljZSwgcHJvZmlsZXNTZXJ2aWNlKSB7XG5cblx0XHR2YXIgdXNlciA9IGF1dGhTZXJ2aWNlLnVzZXIoKTtcblx0XHRcblx0XHQkc2NvcGUuZGF0YSA9IHtcblx0XHRcdGRpc3BsYXlOYW1lIDogdXNlciA/IHVzZXIuZGlzcGxheU5hbWUgOiBcIlwiLFxuXHRcdFx0ZW1haWwgOiB1c2VyID8gdXNlci5lbWFpbCA6IFwiXCJcblx0XHR9O1xuXG4gICAgICAgICRzY29wZS51cGRhdGUgPSBmdW5jdGlvbigpIHtcblx0XHRcdCRpb25pY0xvYWRpbmcuc2hvdygpO1xuXG4gICAgICAgICAgICBwcm9maWxlc1NlcnZpY2UudXBkYXRlUHJvZmlsZSgkc2NvcGUuZGF0YSkudGhlbihmdW5jdGlvbiBzdWNjZXNzKG1zZykge1xuXHRcdFx0XHQkaW9uaWNMb2FkaW5nLmhpZGUoKTtcblxuXHRcdFx0XHQkaW9uaWNQb3B1cC5hbGVydCh7XG4gICAgICAgICAgICAgICAgICAgIHRpdGxlOiAnUHJvZmlsZVVwZGF0ZSEnLFxuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZTogbXNnXG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uIGVycm9yKGVycm9yKSB7XG5cdFx0XHRcdCRpb25pY0xvYWRpbmcuaGlkZSgpO1xuXG5cdFx0XHRcdCRpb25pY1BvcHVwLmFsZXJ0KHtcbiAgICAgICAgICAgICAgICAgICAgdGl0bGU6ICdVcGRhdGUgZmFpbGVkIScsXG4gICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlOiBlcnJvci5tZXNzYWdlXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbn0pKCk7IiwiKGZ1bmN0aW9uKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGFuZ3VsYXIubW9kdWxlKFwiYXBwLnByb2ZpbGVzXCIpXG5cbiAgICAgICAgLnNlcnZpY2UoXCJwcm9maWxlc1NlcnZpY2VcIiwgcHJvZmlsZXNTZXJ2aWNlKTtcblxuXG4gICAgZnVuY3Rpb24gcHJvZmlsZXNTZXJ2aWNlKCRxLCAkcm9vdFNjb3BlLCBhdXRoU2VydmljZSkge1xuXHRcdFxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdXBkYXRlUHJvZmlsZTogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG5cbiAgICAgICAgICAgICAgICBhdXRoU2VydmljZS51c2VyKCkudXBkYXRlUHJvZmlsZShkYXRhKVxuICAgICAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbiBzdWNjZXNzKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShcIlByb2ZpbGUgdXBkYXRlZCFcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ3VzZXItY2hhbmdlZCcpO1xuICAgICAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiBlcnJvcihlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVmZXJyZWQucmVqZWN0KGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH1cbiAgICB9XG59KSgpOyIsIihmdW5jdGlvbigpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBhbmd1bGFyLm1vZHVsZShcImFwcC51c2Vyc1wiKVxuXG4gICAgICAgIC5zZXJ2aWNlKFwidXNlcnNTZXJ2aWNlXCIsIHVzZXJzU2VydmljZSk7XG5cblxuICAgIGZ1bmN0aW9uIHVzZXJzU2VydmljZSgkcSwgYXV0aFNlcnZpY2UpIHtcblx0ICAgIHJldHVybiB7XG4gICAgICAgICAgICB1cGRhdGVQcm9maWxlOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcblxuICAgICAgICAgICAgICAgIGF1dGhTZXJ2aWNlLnVzZXIoKS51cGRhdGVQcm9maWxlKGRhdGEpXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uIHN1Y2Nlc3MoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKFwiUHJvZmlsZSB1cGRhdGVkIVwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHVzZXIgPSBmaXJlYmFzZS5hdXRoKCkuY3VycmVudFVzZXI7XG4gICAgICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ3VzZXItY2hhbmdlZCcpO1xuICAgICAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiBlcnJvcihlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVmZXJyZWQucmVqZWN0KGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH1cbiAgICB9XG59KSgpOyIsIihmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgYW5ndWxhci5tb2R1bGUoXCJhcHAuc2lkZW1lbnVcIilcblxuICAgICAgICAuY29udHJvbGxlcihcInNpZGVtZW51Q29udHJvbGxlclwiLCBzaWRlbWVudUNvbnRyb2xsZXIpO1xuXG5cbiAgICBmdW5jdGlvbiBzaWRlbWVudUNvbnRyb2xsZXIoJHNjb3BlLCAkc3RhdGUsIGNoYW5uZWxzU2VydmljZSwgYXV0aFNlcnZpY2UpIHtcbiAgICAgICAgJHNjb3BlLnVzZXIgPSBhdXRoU2VydmljZS51c2VyKCk7XG4gICAgICAgICRzY29wZS5jaGFubmVscyA9IGNoYW5uZWxzU2VydmljZS5jaGFubmVscztcbiAgICAgICAgJHNjb3BlLmJ1aWxkaW5nID0ge1xuICAgICAgICAgICAgbmFtZTogXCJTZWxlY3QgYSBidWlsZGluZ1wiLFxuICAgICAgICAgICAgYWRkcmVzczogXCJcIixcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuJG9uKCdidWlsZGluZy1zZWxlY3RlZCcsIGZ1bmN0aW9uIChldmVudCwgZGF0YSkge1xuICAgICAgICAgICAgJHNjb3BlLmJ1aWxkaW5nLm5hbWUgPSBkYXRhLm5hbWU7XG4gICAgICAgICAgICAkc2NvcGUuYnVpbGRpbmcuYWRkcmVzcyA9IGRhdGEuYWRkcmVzcztcblxuICAgICAgICB9KTtcblxuICAgICAgICAkc2NvcGUub3BlbkNoYW5uZWwgPSBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICAkc3RhdGUuZ28oJ2FwcC5jaGFubmVsJywge2NoYW5uZWxJZDoga2V5fSk7XG4gICAgICAgIH07XG4gICAgfVxufSkoKTtcbiIsIihmdW5jdGlvbigpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBhbmd1bGFyXG5cbiAgICAgICAgLm1vZHVsZSgnYXBwJywgW1xuICAgICAgICAgICAgJ2lvbmljJyxcbiAgICAgICAgICAgICdtb25vc3BhY2VkLmVsYXN0aWMnLFxuXG4gICAgICAgICAgICAnYXBwLmZpcmViYXNlJyxcbiAgICAgICAgICAgICdhcHAuZmlyZWJhc2UnLFxuICAgICAgICAgICAgJ2FwcC5hdXRoJyxcbiAgICAgICAgICAgICdhcHAuY2hhbm5lbHMnLFxuICAgICAgICAgICAgJ2FwcC5zaWRlbWVudScsXG4gICAgICAgICAgICAnYXBwLmJ1aWxkaW5ncycsXG4gICAgICAgICAgICAnYXBwLnByb2ZpbGVzJyxcbiAgICAgICAgICAgICdhcHAubWVzc2FnZXMnLFxuICAgICAgICAgICAgJ2FwcC5kaXJlY3RtZXNzYWdlcydcbiAgICAgICAgXSlcblxuICAgICAgICAucnVuKGZ1bmN0aW9uKCRpb25pY1BsYXRmb3JtLCAkdGltZW91dCwgJHJvb3RTY29wZSkge1xuICAgICAgICAgICAgJGlvbmljUGxhdGZvcm0ucmVhZHkoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgaWYgKHdpbmRvdy5jb3Jkb3ZhICYmIHdpbmRvdy5jb3Jkb3ZhLnBsdWdpbnMuS2V5Ym9hcmQpIHtcbiAgICAgICAgICAgICAgICAgICAgY29yZG92YS5wbHVnaW5zLktleWJvYXJkLmhpZGVLZXlib2FyZEFjY2Vzc29yeUJhcih0cnVlKTtcblxuICAgICAgICAgICAgICAgICAgICBjb3Jkb3ZhLnBsdWdpbnMuS2V5Ym9hcmQuZGlzYWJsZVNjcm9sbCh0cnVlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHdpbmRvdy5TdGF0dXNCYXIpIHtcbiAgICAgICAgICAgICAgICAgICAgU3RhdHVzQmFyLnN0eWxlRGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgIH1cblx0XHRcdFx0Ly90byBnZXQgdXNlciBpbmZvXG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kZW1pdCgndXNlci1jaGFuZ2VkJyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG59KSgpO1xuXG5cbiIsIihmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgYW5ndWxhclxuICAgICAgICAubW9kdWxlKCdhcHAnKVxuICAgICAgICAuc2VydmljZSgnZ2xvYmFsc1NlcnZpY2UnLCBnbG9iYWxzU2VydmljZSk7XG5cbiAgICBmdW5jdGlvbiBnbG9iYWxzU2VydmljZSgpIHtcbiAgICAgICAgdmFyIHNlcnZpY2UgPSB7XG5cdFx0XHR1c2VyIDogbnVsbCwgLy9sb2dnZWQgdXNlclxuXHRcdFx0YnVpbGRpbmcgOiBudWxsIC8vc2VsZWN0ZWQgYnVpbGRpbmdcblx0XHR9O1xuXG4gICAgICAgIHJldHVybiBzZXJ2aWNlO1xuICAgIH1cbn0pKCk7XG4iLCIoZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGFuZ3VsYXJcblxuICAgICAgICAubW9kdWxlKCdhcHAnKVxuXG4gICAgICAgIC5ydW4oWyckcm9vdFNjb3BlJywgJyRsb2NhdGlvbicsICdhdXRoU2VydmljZScsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCAkc3RhdGUsIGF1dGhTZXJ2aWNlKSB7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRvbignJHJvdXRlQ2hhbmdlU3RhcnQnLCBmdW5jdGlvbiAoZXZlbnQpIHtcblxuICAgICAgICAgICAgICAgIGlmIChhdXRoU2VydmljZS51c2VyKCkgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2xvZ2luJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1dKVxufSkoKTtcbiIsIihmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgYW5ndWxhclxuXG4gICAgICAgIC5tb2R1bGUoJ2FwcCcpXG5cbiAgICAgICAgLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIsICR1cmxSb3V0ZXJQcm92aWRlcikge1xuICAgICAgICAgICAgJHN0YXRlUHJvdmlkZXJcblxuICAgICAgICAgICAgICAgIC5zdGF0ZSgnYXBwJywge1xuICAgICAgICAgICAgICAgICAgICB1cmw6ICcvYXBwJyxcbiAgICAgICAgICAgICAgICAgICAgY2FjaGU6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBhYnN0cmFjdDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICd2aWV3cy9zaWRlbWVudS5odG1sJyxcbiAgICAgICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICAgICAgLnN0YXRlKCdhcHAuYnVpbGRpbmdzJywge1xuICAgICAgICAgICAgICAgICAgICB1cmw6ICcvYnVpbGRpbmdzJyxcbiAgICAgICAgICAgICAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICdtZW51Q29udGVudCc6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3ZpZXdzL2J1aWxkaW5ncy5odG1sJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgICAgIC5zdGF0ZSgnYXBwLmJ1aWxkaW5nJywge1xuICAgICAgICAgICAgICAgICAgICB1cmw6ICcvYnVpbGRpbmdzLzpidWlsZGluZ0lkJyxcbiAgICAgICAgICAgICAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICdtZW51Q29udGVudCc6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3ZpZXdzL2J1aWxkaW5nLmh0bWwnXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICAgICAgLnN0YXRlKCdhcHAuY2hhbm5lbCcsIHtcbiAgICAgICAgICAgICAgICAgICAgdXJsOiAnL2NoYW5uZWwvOmNoYW5uZWxJZCcsXG4gICAgICAgICAgICAgICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAnbWVudUNvbnRlbnQnOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICd2aWV3cy9tZXNzYWdlcy9jaGF0Lmh0bWwnXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICAgICAgLnN0YXRlKCdhcHAucHJvZmlsZScsIHtcbiAgICAgICAgICAgICAgICAgICAgdXJsOiAnL3Byb2ZpbGUnLFxuICAgICAgICAgICAgICAgICAgICBjYWNoZTogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAnbWVudUNvbnRlbnQnOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICd2aWV3cy9wcm9maWxlL3Byb2ZpbGUuaHRtbCdcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgICAgICAuc3RhdGUoJ2FwcC5tZXNzYWdlcycsIHtcbiAgICAgICAgICAgICAgICAgICAgdXJsOiAnL21lc3NhZ2VzJyxcbiAgICAgICAgICAgICAgICAgICAgY2FjaGU6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgICAgICAgICAgICAgJ21lbnVDb250ZW50Jzoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAndmlld3MvbWVzc2FnZXMvbWVzc2FnZXMuaHRtbCdcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgICAgICAuc3RhdGUoJ2FwcC5tZXNzYWdlJywge1xuICAgICAgICAgICAgICAgICAgICB1cmw6ICcvbWVzc2FnZS86dXNlcklkLzpuYW1lJyxcbiAgICAgICAgICAgICAgICAgICAgY2FjaGU6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgICAgICAgICAgICAgJ21lbnVDb250ZW50Jzoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAndmlld3MvbWVzc2FnZXMvY2hhdC5odG1sJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgICAgIC5zdGF0ZSgnYXBwLmxvZ291dCcsIHtcbiAgICAgICAgICAgICAgICAgICAgdXJsOiBcIi9sb2dpblwiLFxuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVByb3ZpZGVyOiBmdW5jdGlvbiAoYXV0aFNlcnZpY2UsICRzdGF0ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXV0aFNlcnZpY2UubG9nb3V0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2xvZ2luJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5zdGF0ZSgnbG9naW4nLCB7XG4gICAgICAgICAgICAgICAgICAgIHVybDogXCIvbG9naW5cIixcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFwidmlld3MvYXV0aC9sb2dpbi5odG1sXCJcbiAgICAgICAgICAgICAgICB9KTtcblxuXG4gICAgICAgICAgICAvL2ZhbGxiYWNrXG4gICAgICAgICAgICAkdXJsUm91dGVyUHJvdmlkZXIub3RoZXJ3aXNlKCcvbG9naW4nKTtcblxuICAgICAgICB9KTtcbn0pKCk7XG5cblxuXG5cbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
