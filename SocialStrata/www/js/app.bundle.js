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
            'channelsService',
            'globalsService',
            MessagesController
        ]);

    function MessagesController($scope, $state, $stateParams, $ionicScrollDelegate, channelsService, globalsService) {
        //available services
        this.$scope = $scope;
        this.$state = $state;
        this.$stateParams = $stateParams;
        this.$ionicScrollDelegate = $ionicScrollDelegate;
        this.channelsService = channelsService;
		this.globalsService = globalsService;

		if (!this.validate())
			return false;
        
        //custom properties
        this.buildingKey = globalsService.building.key;
        this.channelKey = this.$stateParams.channelId;
        this.messagesRef = firebase.database().ref(['buildings', this.buildingKey, 'messages'].join('/'));
		this.messagesRef.on('child_added', function(s) {
			console.log(s.val());
		});
		
        $scope.user = {
            _id: "534b8fb2aa5e7afc1b23e69c", //$scope.user.uid,
            pic: 'http://ionicframework.com/img/docs/mcfly.jpg',
            username: globalsService.user.displayName ? globalsService.user.displayName : 'Anonymous'
        };

        $scope.toUser;

        //UI elements
        this.viewScroll = $ionicScrollDelegate.$getByHandle('userMessageScroll');

        //events
        $scope.$on("chat-receive-message", this.onReceiveMessage);

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
        channelRef.on('value', function(snapshot) {
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

        firebase.database().ref(contactPath).on('value', function(snapshot) {
            var contact = snapshot.val();
            self.$scope.toUser = {
                _id: "534b8e5aaa5e7afc1b23e69b", //user.uid,
                pic: 'http://ionicframework.com/img/docs/mcfly.jpg',
                username: contact && contact.displayName ? contact.displayName : 'Anonymous'
            };

            self.getLastMessages();
        });
    };

    MessagesController.prototype.getLastMessages = function() {
        
        //present last 30 messages
        this.$scope.messages = [{
            "_id": "535d625f898df4e80e2a125e",
            "text": "Ionic has changed the game for hybrid app development.",
            "userId": "534b8fb2aa5e7afc1b23e69c",
            "date": "2014-04-27T20:02:39.082Z",
            "read": true,
            "readDate": "2014-12-01T06:27:37.944Z"
        }, {
                "_id": "535f13ffee3b2a68112b9fc0",
                "text": "I like Ionic better than ice cream!",
                "userId": "534b8e5aaa5e7afc1b23e69b",
                "date": "2014-04-29T02:52:47.706Z",
                "read": true,
                "readDate": "2014-12-01T06:27:37.944Z"
            }, {
                "_id": "546a5843fd4c5d581efa263a",
                "text": "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
                "userId": "534b8fb2aa5e7afc1b23e69c",
                "date": "2014-11-17T20:19:15.289Z",
                "read": true,
                "readDate": "2014-12-01T06:27:38.328Z"
            }, {
                "_id": "54764399ab43d1d4113abfd1",
                "text": "Am I dreaming?",
                "userId": "534b8e5aaa5e7afc1b23e69b",
                "date": "2014-11-26T21:18:17.591Z",
                "read": true,
                "readDate": "2014-12-01T06:27:38.337Z"
            }, {
                "_id": "547643aeab43d1d4113abfd2",
                "text": "Is this magic?",
                "userId": "534b8fb2aa5e7afc1b23e69c",
                "date": "2014-11-26T21:18:38.549Z",
                "read": true,
                "readDate": "2014-12-01T06:27:38.338Z"
            }, {
                "_id": "547815dbab43d1d4113abfef",
                "text": "Gee wiz, this is something special.",
                "userId": "534b8e5aaa5e7afc1b23e69b",
                "date": "2014-11-28T06:27:40.001Z",
                "read": true,
                "readDate": "2014-12-01T06:27:38.338Z"
            }, {
                "_id": "54781c69ab43d1d4113abff0",
                "text": "I think I like Ionic more than I like ice cream!",
                "userId": "534b8fb2aa5e7afc1b23e69c",
                "date": "2014-11-28T06:55:37.350Z",
                "read": true,
                "readDate": "2014-12-01T06:27:38.338Z"
            }, {
                "_id": "54781ca4ab43d1d4113abff1",
                "text": "Yea, it's pretty sweet",
                "userId": "534b8e5aaa5e7afc1b23e69b",
                "date": "2014-11-28T06:56:36.472Z",
                "read": true,
                "readDate": "2014-12-01T06:27:38.338Z"
            }, {
                "_id": "5478df86ab43d1d4113abff4",
                "text": "Wow, this is really something huh?",
                "userId": "534b8fb2aa5e7afc1b23e69c",
                "date": "2014-11-28T20:48:06.572Z",
                "read": true,
                "readDate": "2014-12-01T06:27:38.339Z"
            }, {
                "_id": "54781ca4ab43d1d4113abff1",
                "text": "Create amazing apps - ionicframework.com",
                "userId": "534b8e5aaa5e7afc1b23e69b",
                "date": "2014-11-29T06:56:36.472Z",
                "read": true,
                "readDate": "2014-12-01T06:27:38.338Z"
            }];
    };

    MessagesController.prototype.onReceiveMessage = function() {

    };

    MessagesController.prototype.sendMessage = function(sendMessageForm) {
        var self = this;

        var message = {
            toId: $scope.toUser._id,
            text: $scope.input.message
        };

        // if you do a web service call this will be needed as well as before the viewScroll calls
        // you can't see the effect of this in the browser it needs to be used on a real device
        // for some reason the one time blur event is not firing in the browser but does on devices
        // keepKeyboardOpen();

        //MockService.sendMessage(message).then(function(data) {
        $scope.input.message = '';

        message._id = new Date().getTime(); // :~)
        message.date = new Date();
        message.username = $scope.user.username;
        message.userId = $scope.user._id;
        message.pic = $scope.user.picture;

        $scope.messages.push(message);

        $timeout(function() {
            keepKeyboardOpen();
            self.viewScroll.scrollBottom(true);
        }, 0);

        // $timeout(function() {
        //     $scope.messages.push(MockService.getMockMessage());
        //     keepKeyboardOpen();
        //     self.viewScroll.scrollBottom(true);
        // }, 2000);

    };










    /*
    angular
            .module('app.messages')
    
            .controller('messagesController', ['$scope', '$rootScope', '$state',
                '$stateParams', '$ionicActionSheet',
                '$ionicPopup', '$ionicScrollDelegate', '$timeout', '$interval',
                'channelsService', 'authService',
                messagesController
            ]);
        	
        function messagesController($scope, $rootScope, $state, $stateParams, $ionicActionSheet,
            $ionicPopup, $ionicScrollDelegate, $timeout, $interval, channelsService, authService) {
    
            $scope.channelId = $state.params.channelId;
            $scope.channelName = channelsService.channels[$scope.channelId];
            $scope.user = authService.user();
    
            if (!$scope.user) {
                $state.go('login');
                return;
            }
    
            $scope.user = {
                _id: $scope.user.uid,
                pic: 'http://ionicframework.com/img/docs/mcfly.jpg',
                username: $scope.user && $scope.user.displayName ? $scope.user.displayName ? 'Anonymous';
            };
    
            // mock acquiring data via $stateParams
            $scope.toUser = null;
            if ($scope.channelId == "landlord") {
                $
                $scope.toUser = {
                    _id: '534b8e5aaa5e7afc1b23e69b',
                    pic: 'http://ionicframework.com/img/docs/venkman.jpg',
                    channel: $scope.channelId
                }
            }
    
            $scope.input = {
                message: localStorage['userMessage-' + $scope.toUser._id] || ''
            };
    
            var messageCheckTimer;
    
            var viewScroll = $ionicScrollDelegate.$getByHandle('userMessageScroll');
            var footerBar; // gets set in $ionicView.enter
            var scroller;
            var txtInput; // ^^^
    
            $scope.$on('$ionicView.enter', function() {
                console.log('UserMessages $ionicView.enter');
    
                getMessages();
    
                $timeout(function() {
                    footerBar = document.body.querySelector('#userMessagesView .bar-footer');
                    scroller = document.body.querySelector('#userMessagesView .scroll-content');
                    txtInput = angular.element(footerBar.querySelector('textarea'));
                }, 0);
    
                messageCheckTimer = $interval(function() {
                    // here you could check for new messages if your app doesn't use push notifications or user disabled them
                }, 20000);
            });
    
            $scope.$on('$ionicView.leave', function() {
                console.log('leaving UserMessages view, destroying interval');
                // Make sure that the interval is destroyed
                if (angular.isDefined(messageCheckTimer)) {
                    $interval.cancel(messageCheckTimer);
                    messageCheckTimer = undefined;
                }
            });
    
            $scope.$on('$ionicView.beforeLeave', function() {
                if (!$scope.input.message || $scope.input.message === '') {
                    localStorage.removeItem('userMessage-' + $scope.toUser._id);
                }
            });
    
            function getMessages() {
                $scope.messages = [{
                    "_id": "535d625f898df4e80e2a125e",
                    "text": "Ionic has changed the game for hybrid app development.",
                    "userId": "534b8fb2aa5e7afc1b23e69c",
                    "date": "2014-04-27T20:02:39.082Z",
                    "read": true,
                    "readDate": "2014-12-01T06:27:37.944Z"
                }, {
                        "_id": "535f13ffee3b2a68112b9fc0",
                        "text": "I like Ionic better than ice cream!",
                        "userId": "534b8e5aaa5e7afc1b23e69b",
                        "date": "2014-04-29T02:52:47.706Z",
                        "read": true,
                        "readDate": "2014-12-01T06:27:37.944Z"
                    }, {
                        "_id": "546a5843fd4c5d581efa263a",
                        "text": "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
                        "userId": "534b8fb2aa5e7afc1b23e69c",
                        "date": "2014-11-17T20:19:15.289Z",
                        "read": true,
                        "readDate": "2014-12-01T06:27:38.328Z"
                    }, {
                        "_id": "54764399ab43d1d4113abfd1",
                        "text": "Am I dreaming?",
                        "userId": "534b8e5aaa5e7afc1b23e69b",
                        "date": "2014-11-26T21:18:17.591Z",
                        "read": true,
                        "readDate": "2014-12-01T06:27:38.337Z"
                    }, {
                        "_id": "547643aeab43d1d4113abfd2",
                        "text": "Is this magic?",
                        "userId": "534b8fb2aa5e7afc1b23e69c",
                        "date": "2014-11-26T21:18:38.549Z",
                        "read": true,
                        "readDate": "2014-12-01T06:27:38.338Z"
                    }, {
                        "_id": "547815dbab43d1d4113abfef",
                        "text": "Gee wiz, this is something special.",
                        "userId": "534b8e5aaa5e7afc1b23e69b",
                        "date": "2014-11-28T06:27:40.001Z",
                        "read": true,
                        "readDate": "2014-12-01T06:27:38.338Z"
                    }, {
                        "_id": "54781c69ab43d1d4113abff0",
                        "text": "I think I like Ionic more than I like ice cream!",
                        "userId": "534b8fb2aa5e7afc1b23e69c",
                        "date": "2014-11-28T06:55:37.350Z",
                        "read": true,
                        "readDate": "2014-12-01T06:27:38.338Z"
                    }, {
                        "_id": "54781ca4ab43d1d4113abff1",
                        "text": "Yea, it's pretty sweet",
                        "userId": "534b8e5aaa5e7afc1b23e69b",
                        "date": "2014-11-28T06:56:36.472Z",
                        "read": true,
                        "readDate": "2014-12-01T06:27:38.338Z"
                    }, {
                        "_id": "5478df86ab43d1d4113abff4",
                        "text": "Wow, this is really something huh?",
                        "userId": "534b8fb2aa5e7afc1b23e69c",
                        "date": "2014-11-28T20:48:06.572Z",
                        "read": true,
                        "readDate": "2014-12-01T06:27:38.339Z"
                    }, {
                        "_id": "54781ca4ab43d1d4113abff1",
                        "text": "Create amazing apps - ionicframework.com",
                        "userId": "534b8e5aaa5e7afc1b23e69b",
                        "date": "2014-11-29T06:56:36.472Z",
                        "read": true,
                        "readDate": "2014-12-01T06:27:38.338Z"
                    }];
            }
    
            $scope.$watch('input.message', function(newValue, oldValue) {
                console.log('input.message $watch, newValue ' + newValue);
                if (!newValue) newValue = '';
                localStorage['userMessage-' + $scope.toUser._id] = newValue;
            });
    
            $scope.sendMessage = function(sendMessageForm) {
                var message = {
                    toId: $scope.toUser._id,
                    text: $scope.input.message
                };
    
                // if you do a web service call this will be needed as well as before the viewScroll calls
                // you can't see the effect of this in the browser it needs to be used on a real device
                // for some reason the one time blur event is not firing in the browser but does on devices
                keepKeyboardOpen();
    
                //MockService.sendMessage(message).then(function(data) {
                $scope.input.message = '';
    
                message._id = new Date().getTime(); // :~)
                message.date = new Date();
                message.username = $scope.user.username;
                message.userId = $scope.user._id;
                message.pic = $scope.user.picture;
    
                $scope.messages.push(message);
    
                $timeout(function() {
                    keepKeyboardOpen();
                    viewScroll.scrollBottom(true);
                }, 0);
    
                $timeout(function() {
                    $scope.messages.push(MockService.getMockMessage());
                    keepKeyboardOpen();
                    viewScroll.scrollBottom(true);
                }, 2000);
    
                //});
            };
    
            // this keeps the keyboard open on a device only after sending a message, it is non obtrusive
            function keepKeyboardOpen() {
                console.log('keepKeyboardOpen');
                txtInput.one('blur', function() {
                    console.log('textarea blur, focus back on it');
                    txtInput[0].focus();
                });
            }
    
            function onProfilePicError(ele) {
                this.ele.src = ''; // set a fallback
            }
    
            $scope.onMessageHold = function(e, itemIndex, message) {
                console.log('onMessageHold');
                console.log('message: ' + JSON.stringify(message, null, 2));
                $ionicActionSheet.show({
                    buttons: [{
                        text: 'Copy Text'
                    }, {
                            text: 'Delete Message'
                        }],
                    buttonClicked: function(index) {
                        switch (index) {
                            case 0: // Copy Text
                                //cordova.plugins.clipboard.copy(message.text);
    
                                break;
                            case 1: // Delete
                                // no server side secrets here :~)
                                $scope.messages.splice(itemIndex, 1);
                                $timeout(function() {
                                    viewScroll.resize();
                                }, 0);
    
                                break;
                        }
    
                        return true;
                    }
                });
            };
    
            // this prob seems weird here but I have reasons for this in my app, secret!
            $scope.viewProfile = function(msg) {
                if (msg.userId === $scope.user._id) {
                    // go to your profile
                } else {
                    // go to other users profile
                }
            };
    
            // I emit this event from the monospaced.elastic directive, read line 480
            $scope.$on('taResize', function(e, ta) {
                console.log('taResize');
                if (!ta) return;
    
                var taHeight = ta[0].offsetHeight;
                console.log('taHeight: ' + taHeight);
    
                if (!footerBar) return;
    
                var newFooterHeight = taHeight + 10;
                newFooterHeight = (newFooterHeight > 44) ? newFooterHeight : 44;
    
                footerBar.style.height = newFooterHeight + 'px';
                scroller.style.bottom = newFooterHeight + 'px';
            });
    
        }
        */
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





//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImF1dGgvYXV0aC5tb2R1bGUuanMiLCJidWlsZGluZ3MvYnVpbGRpbmdzLm1vZHVsZS5qcyIsImNoYW5uZWxzL2NoYW5uZWxzLm1vZHVsZS5qcyIsImRpcmVjdG1lc3NhZ2VzL2RpcmVjdG1lc3NhZ2VzLm1vZHVsZS5qcyIsImZpcmViYXNlL2ZpcmViYXNlLm1vZHVsZS5qcyIsIm1lc3NhZ2VzL21lc3NhZ2VzLm1vZHVsZS5qcyIsInByb2ZpbGUvcHJvZmlsZXMubW9kdWxlLmpzIiwic2lkZW1lbnUvc2lkZW1lbnUubW9kdWxlLmpzIiwidXNlcnMvdXNlcnMubW9kdWxlLmpzIiwiYXV0aC9hdXRoQ29udHJvbGxlci5qcyIsImF1dGgvYXV0aFNlcnZpY2UuanMiLCJidWlsZGluZ3MvYnVpbGRpbmdDb250cm9sbGVyLmpzIiwiYnVpbGRpbmdzL2J1aWxkaW5nc0NvbnRyb2xsZXIuanMiLCJidWlsZGluZ3MvYnVpbGRpbmdzU2VydmljZS5qcyIsImNoYW5uZWxzL2NoYW5uZWxzU2VydmljZS5qcyIsImRpcmVjdG1lc3NhZ2VzL2RpcmVjdE1lc3NhZ2VzQ29udHJvbGxlci5qcyIsImRpcmVjdG1lc3NhZ2VzL2RpcmVjdE1lc3NhZ2VzU2VydmljZS5qcyIsImZpcmViYXNlL2ZpcmViYXNlU2VydmljZS5qcyIsIm1lc3NhZ2VzL21lc3NhZ2VzQ29udHJvbGxlci5qcyIsIm1lc3NhZ2VzL21lc3NhZ2VzRmlsdGVycy5qcyIsIm1lc3NhZ2VzL21lc3NhZ2VzU2VydmljZS5qcyIsInByb2ZpbGUvcHJvZmlsZUNvbnRyb2xsZXIuanMiLCJwcm9maWxlL3Byb2ZpbGVzU2VydmljZS5qcyIsInNpZGVtZW51L3NpZGVtZW51Q29udHJvbGxlci5qcyIsInVzZXJzL3VzZXJzU2VydmljZS5qcyIsImFwcC5tb2R1bGUuanMiLCJhcHAuZ2xvYmFscy5qcyIsImFwcC5yb3V0ZXIuZmlsdGVyLmpzIiwiYXBwLnJvdXRlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxD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Q0FBQSxXQUFBO0lBQ0E7O0lBRUE7U0FDQSxPQUFBO1NBQ0EsV0FBQSxzQkFBQTtZQUNBO1lBQ0E7WUFDQTtZQUNBO1lBQ0E7WUFDQTtZQUNBOzs7SUFHQSxTQUFBLG1CQUFBLFFBQUEsUUFBQSxjQUFBLHNCQUFBLGlCQUFBLGdCQUFBOztRQUVBLEtBQUEsU0FBQTtRQUNBLEtBQUEsU0FBQTtRQUNBLEtBQUEsZUFBQTtRQUNBLEtBQUEsdUJBQUE7UUFDQSxLQUFBLGtCQUFBO0VBQ0EsS0FBQSxpQkFBQTs7RUFFQSxJQUFBLENBQUEsS0FBQTtHQUNBLE9BQUE7OztRQUdBLEtBQUEsY0FBQSxlQUFBLFNBQUE7UUFDQSxLQUFBLGFBQUEsS0FBQSxhQUFBO1FBQ0EsS0FBQSxjQUFBLFNBQUEsV0FBQSxJQUFBLENBQUEsYUFBQSxLQUFBLGFBQUEsWUFBQSxLQUFBO0VBQ0EsS0FBQSxZQUFBLEdBQUEsZUFBQSxTQUFBLEdBQUE7R0FDQSxRQUFBLElBQUEsRUFBQTs7O1FBR0EsT0FBQSxPQUFBO1lBQ0EsS0FBQTtZQUNBLEtBQUE7WUFDQSxVQUFBLGVBQUEsS0FBQSxjQUFBLGVBQUEsS0FBQSxjQUFBOzs7UUFHQSxPQUFBOzs7UUFHQSxLQUFBLGFBQUEscUJBQUEsYUFBQTs7O1FBR0EsT0FBQSxJQUFBLHdCQUFBLEtBQUE7O1FBRUEsS0FBQTs7O0NBR0EsbUJBQUEsVUFBQSxXQUFBLFdBQUE7RUFDQSxJQUFBLENBQUEsS0FBQSxlQUFBLE1BQUE7WUFDQSxLQUFBLE9BQUEsR0FBQTtZQUNBLE9BQUE7OztFQUdBLElBQUEsQ0FBQSxLQUFBLGVBQUEsVUFBQTtZQUNBLEtBQUEsT0FBQSxHQUFBO1lBQ0EsT0FBQTs7O0VBR0EsT0FBQTs7OztJQUlBLG1CQUFBLFVBQUEsT0FBQSxXQUFBO1FBQ0EsSUFBQSxPQUFBOztRQUVBLElBQUEsY0FBQSxDQUFBLGFBQUEsS0FBQSxhQUFBLFlBQUEsS0FBQSxhQUFBLFdBQUEsS0FBQTtRQUNBLFFBQUEsSUFBQTs7UUFFQSxJQUFBLGFBQUEsU0FBQSxXQUFBLElBQUE7UUFDQSxXQUFBLEdBQUEsU0FBQSxTQUFBLFVBQUE7WUFDQSxLQUFBLFVBQUEsU0FBQTs7WUFFQSxJQUFBLEtBQUEsUUFBQSxRQUFBLFVBQUE7Z0JBQ0EsS0FBQSxXQUFBLEtBQUEsUUFBQTs7aUJBRUE7Z0JBQ0EsS0FBQTs7Ozs7SUFLQSxtQkFBQSxVQUFBLGFBQUEsU0FBQSxLQUFBO0VBQ0EsSUFBQSxPQUFBOztRQUVBLElBQUEsY0FBQSxDQUFBLFNBQUEsS0FBQSxLQUFBO1FBQ0EsUUFBQSxJQUFBOztRQUVBLFNBQUEsV0FBQSxJQUFBLGFBQUEsR0FBQSxTQUFBLFNBQUEsVUFBQTtZQUNBLElBQUEsVUFBQSxTQUFBO1lBQ0EsS0FBQSxPQUFBLFNBQUE7Z0JBQ0EsS0FBQTtnQkFDQSxLQUFBO2dCQUNBLFVBQUEsV0FBQSxRQUFBLGNBQUEsUUFBQSxjQUFBOzs7WUFHQSxLQUFBOzs7O0lBSUEsbUJBQUEsVUFBQSxrQkFBQSxXQUFBOzs7UUFHQSxLQUFBLE9BQUEsV0FBQSxDQUFBO1lBQ0EsT0FBQTtZQUNBLFFBQUE7WUFDQSxVQUFBO1lBQ0EsUUFBQTtZQUNBLFFBQUE7WUFDQSxZQUFBO1dBQ0E7Z0JBQ0EsT0FBQTtnQkFDQSxRQUFBO2dCQUNBLFVBQUE7Z0JBQ0EsUUFBQTtnQkFDQSxRQUFBO2dCQUNBLFlBQUE7ZUFDQTtnQkFDQSxPQUFBO2dCQUNBLFFBQUE7Z0JBQ0EsVUFBQTtnQkFDQSxRQUFBO2dCQUNBLFFBQUE7Z0JBQ0EsWUFBQTtlQUNBO2dCQUNBLE9BQUE7Z0JBQ0EsUUFBQTtnQkFDQSxVQUFBO2dCQUNBLFFBQUE7Z0JBQ0EsUUFBQTtnQkFDQSxZQUFBO2VBQ0E7Z0JBQ0EsT0FBQTtnQkFDQSxRQUFBO2dCQUNBLFVBQUE7Z0JBQ0EsUUFBQTtnQkFDQSxRQUFBO2dCQUNBLFlBQUE7ZUFDQTtnQkFDQSxPQUFBO2dCQUNBLFFBQUE7Z0JBQ0EsVUFBQTtnQkFDQSxRQUFBO2dCQUNBLFFBQUE7Z0JBQ0EsWUFBQTtlQUNBO2dCQUNBLE9BQUE7Z0JBQ0EsUUFBQTtnQkFDQSxVQUFBO2dCQUNBLFFBQUE7Z0JBQ0EsUUFBQTtnQkFDQSxZQUFBO2VBQ0E7Z0JBQ0EsT0FBQTtnQkFDQSxRQUFBO2dCQUNBLFVBQUE7Z0JBQ0EsUUFBQTtnQkFDQSxRQUFBO2dCQUNBLFlBQUE7ZUFDQTtnQkFDQSxPQUFBO2dCQUNBLFFBQUE7Z0JBQ0EsVUFBQTtnQkFDQSxRQUFBO2dCQUNBLFFBQUE7Z0JBQ0EsWUFBQTtlQUNBO2dCQUNBLE9BQUE7Z0JBQ0EsUUFBQTtnQkFDQSxVQUFBO2dCQUNBLFFBQUE7Z0JBQ0EsUUFBQTtnQkFDQSxZQUFBOzs7O0lBSUEsbUJBQUEsVUFBQSxtQkFBQSxXQUFBOzs7O0lBSUEsbUJBQUEsVUFBQSxjQUFBLFNBQUEsaUJBQUE7UUFDQSxJQUFBLE9BQUE7O1FBRUEsSUFBQSxVQUFBO1lBQ0EsTUFBQSxPQUFBLE9BQUE7WUFDQSxNQUFBLE9BQUEsTUFBQTs7Ozs7Ozs7O1FBU0EsT0FBQSxNQUFBLFVBQUE7O1FBRUEsUUFBQSxNQUFBLElBQUEsT0FBQTtRQUNBLFFBQUEsT0FBQSxJQUFBO1FBQ0EsUUFBQSxXQUFBLE9BQUEsS0FBQTtRQUNBLFFBQUEsU0FBQSxPQUFBLEtBQUE7UUFDQSxRQUFBLE1BQUEsT0FBQSxLQUFBOztRQUVBLE9BQUEsU0FBQSxLQUFBOztRQUVBLFNBQUEsV0FBQTtZQUNBO1lBQ0EsS0FBQSxXQUFBLGFBQUE7V0FDQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDbk5BLENBQUEsWUFBQTtJQUNBOztJ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QUFBOzs7Ozs7aUJBTUEsTUFBQSxjQUFBO29CQUNBLEtBQUE7b0JBQ0EsNENBQUEsVUFBQSxhQUFBLFFBQUE7d0JBQ0EsWUFBQTt3QkFDQSxPQUFBLEdBQUE7OztpQkFHQSxNQUFBLFNBQUE7b0JBQ0EsS0FBQTtvQkFDQSxhQUFBOzs7OztZQUtBLG1CQUFBLFVBQUE7Ozs7Ozs7O0FBUUEiLCJmaWxlIjoiYXBwLmJ1bmRsZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgYW5ndWxhci5tb2R1bGUoXCJhcHAuYXV0aFwiLCBbXSk7XG59KSgpOyIsIihmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgYW5ndWxhci5tb2R1bGUoXCJhcHAuYnVpbGRpbmdzXCIsIFsnYXBwLmZpcmViYXNlJ10pO1xufSkoKTsiLCIoZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGFuZ3VsYXIubW9kdWxlKFwiYXBwLmNoYW5uZWxzXCIsIFtdKTtcbn0pKCk7IiwiKGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBhbmd1bGFyXG4gICAgICAgIC5tb2R1bGUoJ2FwcC5kaXJlY3RtZXNzYWdlcycsIFtdKTtcbn0pKCk7XG5cblxuXG5cbiIsIihmdW5jdGlvbigpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBhbmd1bGFyXG4gICAgICAgIC5tb2R1bGUoJ2FwcC5maXJlYmFzZScsIFtdKTtcbn0pKCk7XG5cblxuXG5cbiIsIihmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgYW5ndWxhclxuICAgICAgICAubW9kdWxlKCdtb25vc3BhY2VkLmVsYXN0aWMnLCBbXSlcbiAgICAgICAgLmNvbnN0YW50KCdtc2RFbGFzdGljQ29uZmlnJywge1xuICAgICAgICAgICAgYXBwZW5kOiAnJ1xuICAgICAgICB9KVxuICAgICAgICAuZGlyZWN0aXZlKCdtc2RFbGFzdGljJywgW1xuICAgICAgICAgICAgJyR0aW1lb3V0JywgJyR3aW5kb3cnLCAnbXNkRWxhc3RpY0NvbmZpZycsXG4gICAgICAgICAgICBmdW5jdGlvbiAoJHRpbWVvdXQsICR3aW5kb3csIGNvbmZpZykge1xuICAgICAgICAgICAgICAgICd1c2Ugc3RyaWN0JztcblxuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmU6ICduZ01vZGVsJyxcbiAgICAgICAgICAgICAgICAgICAgcmVzdHJpY3Q6ICdBLCBDJyxcbiAgICAgICAgICAgICAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50LCBhdHRycywgbmdNb2RlbCkge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBjYWNoZSBhIHJlZmVyZW5jZSB0byB0aGUgRE9NIGVsZW1lbnRcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0YSA9IGVsZW1lbnRbMF0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHRhID0gZWxlbWVudDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZW5zdXJlIHRoZSBlbGVtZW50IGlzIGEgdGV4dGFyZWEsIGFuZCBicm93c2VyIGlzIGNhcGFibGVcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0YS5ub2RlTmFtZSAhPT0gJ1RFWFRBUkVBJyB8fCAhJHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBzZXQgdGhlc2UgcHJvcGVydGllcyBiZWZvcmUgbWVhc3VyaW5nIGRpbWVuc2lvbnNcbiAgICAgICAgICAgICAgICAgICAgICAgICR0YS5jc3Moe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdvdmVyZmxvdyc6ICdoaWRkZW4nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdvdmVyZmxvdy15JzogJ2hpZGRlbicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ3dvcmQtd3JhcCc6ICdicmVhay13b3JkJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGZvcmNlIHRleHQgcmVmbG93XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdGV4dCA9IHRhLnZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGEudmFsdWUgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhLnZhbHVlID0gdGV4dDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGFwcGVuZCA9IGF0dHJzLm1zZEVsYXN0aWMgPyBhdHRycy5tc2RFbGFzdGljLnJlcGxhY2UoL1xcXFxuL2csICdcXG4nKSA6IGNvbmZpZy5hcHBlbmQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHdpbiA9IGFuZ3VsYXIuZWxlbWVudCgkd2luZG93KSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaXJyb3JJbml0U3R5bGUgPSAncG9zaXRpb246IGFic29sdXRlOyB0b3A6IC05OTlweDsgcmlnaHQ6IGF1dG87IGJvdHRvbTogYXV0bzsnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2xlZnQ6IDA7IG92ZXJmbG93OiBoaWRkZW47IC13ZWJraXQtYm94LXNpemluZzogY29udGVudC1ib3g7JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICctbW96LWJveC1zaXppbmc6IGNvbnRlbnQtYm94OyBib3gtc2l6aW5nOiBjb250ZW50LWJveDsnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ21pbi1oZWlnaHQ6IDAgIWltcG9ydGFudDsgaGVpZ2h0OiAwICFpbXBvcnRhbnQ7IHBhZGRpbmc6IDA7JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICd3b3JkLXdyYXA6IGJyZWFrLXdvcmQ7IGJvcmRlcjogMDsnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRtaXJyb3IgPSBhbmd1bGFyLmVsZW1lbnQoJzx0ZXh0YXJlYSBhcmlhLWhpZGRlbj1cInRydWVcIiB0YWJpbmRleD1cIi0xXCIgJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdzdHlsZT1cIicgKyBtaXJyb3JJbml0U3R5bGUgKyAnXCIvPicpLmRhdGEoJ2VsYXN0aWMnLCB0cnVlKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaXJyb3IgPSAkbWlycm9yWzBdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhU3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlKHRhKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNpemUgPSB0YVN0eWxlLmdldFByb3BlcnR5VmFsdWUoJ3Jlc2l6ZScpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJvcmRlckJveCA9IHRhU3R5bGUuZ2V0UHJvcGVydHlWYWx1ZSgnYm94LXNpemluZycpID09PSAnYm9yZGVyLWJveCcgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFTdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKCctbW96LWJveC1zaXppbmcnKSA9PT0gJ2JvcmRlci1ib3gnIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhU3R5bGUuZ2V0UHJvcGVydHlWYWx1ZSgnLXdlYmtpdC1ib3gtc2l6aW5nJykgPT09ICdib3JkZXItYm94JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBib3hPdXRlciA9ICFib3JkZXJCb3ggPyB7d2lkdGg6IDAsIGhlaWdodDogMH0gOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiBwYXJzZUludCh0YVN0eWxlLmdldFByb3BlcnR5VmFsdWUoJ2JvcmRlci1yaWdodC13aWR0aCcpLCAxMCkgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJzZUludCh0YVN0eWxlLmdldFByb3BlcnR5VmFsdWUoJ3BhZGRpbmctcmlnaHQnKSwgMTApICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyc2VJbnQodGFTdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKCdwYWRkaW5nLWxlZnQnKSwgMTApICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyc2VJbnQodGFTdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKCdib3JkZXItbGVmdC13aWR0aCcpLCAxMCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodDogcGFyc2VJbnQodGFTdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKCdib3JkZXItdG9wLXdpZHRoJyksIDEwKSArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcnNlSW50KHRhU3R5bGUuZ2V0UHJvcGVydHlWYWx1ZSgncGFkZGluZy10b3AnKSwgMTApICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyc2VJbnQodGFTdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKCdwYWRkaW5nLWJvdHRvbScpLCAxMCkgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJzZUludCh0YVN0eWxlLmdldFByb3BlcnR5VmFsdWUoJ2JvcmRlci1ib3R0b20td2lkdGgnKSwgMTApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaW5IZWlnaHRWYWx1ZSA9IHBhcnNlSW50KHRhU3R5bGUuZ2V0UHJvcGVydHlWYWx1ZSgnbWluLWhlaWdodCcpLCAxMCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0VmFsdWUgPSBwYXJzZUludCh0YVN0eWxlLmdldFByb3BlcnR5VmFsdWUoJ2hlaWdodCcpLCAxMCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWluSGVpZ2h0ID0gTWF0aC5tYXgobWluSGVpZ2h0VmFsdWUsIGhlaWdodFZhbHVlKSAtIGJveE91dGVyLmhlaWdodCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXhIZWlnaHQgPSBwYXJzZUludCh0YVN0eWxlLmdldFByb3BlcnR5VmFsdWUoJ21heC1oZWlnaHQnKSwgMTApLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1pcnJvcmVkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGl2ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb3B5U3R5bGUgPSBbJ2ZvbnQtZmFtaWx5JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2ZvbnQtc2l6ZScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdmb250LXdlaWdodCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdmb250LXN0eWxlJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2xldHRlci1zcGFjaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2xpbmUtaGVpZ2h0JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ3RleHQtdHJhbnNmb3JtJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ3dvcmQtc3BhY2luZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICd0ZXh0LWluZGVudCddO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBleGl0IGlmIGVsYXN0aWMgYWxyZWFkeSBhcHBsaWVkIChvciBpcyB0aGUgbWlycm9yIGVsZW1lbnQpXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoJHRhLmRhdGEoJ2VsYXN0aWMnKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gT3BlcmEgcmV0dXJucyBtYXgtaGVpZ2h0IG9mIC0xIGlmIG5vdCBzZXRcbiAgICAgICAgICAgICAgICAgICAgICAgIG1heEhlaWdodCA9IG1heEhlaWdodCAmJiBtYXhIZWlnaHQgPiAwID8gbWF4SGVpZ2h0IDogOWU0O1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBhcHBlbmQgbWlycm9yIHRvIHRoZSBET01cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtaXJyb3IucGFyZW50Tm9kZSAhPT0gZG9jdW1lbnQuYm9keSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFuZ3VsYXIuZWxlbWVudChkb2N1bWVudC5ib2R5KS5hcHBlbmQobWlycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gc2V0IHJlc2l6ZSBhbmQgYXBwbHkgZWxhc3RpY1xuICAgICAgICAgICAgICAgICAgICAgICAgJHRhLmNzcyh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ3Jlc2l6ZSc6IChyZXNpemUgPT09ICdub25lJyB8fCByZXNpemUgPT09ICd2ZXJ0aWNhbCcpID8gJ25vbmUnIDogJ2hvcml6b250YWwnXG4gICAgICAgICAgICAgICAgICAgICAgICB9KS5kYXRhKCdlbGFzdGljJywgdHJ1ZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8qXG4gICAgICAgICAgICAgICAgICAgICAgICAgKiBtZXRob2RzXG4gICAgICAgICAgICAgICAgICAgICAgICAgKi9cblxuICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gaW5pdE1pcnJvcigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbWlycm9yU3R5bGUgPSBtaXJyb3JJbml0U3R5bGU7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaXJyb3JlZCA9IHRhO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNvcHkgdGhlIGVzc2VudGlhbCBzdHlsZXMgZnJvbSB0aGUgdGV4dGFyZWEgdG8gdGhlIG1pcnJvclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhU3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlKHRhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbmd1bGFyLmZvckVhY2goY29weVN0eWxlLCBmdW5jdGlvbiAodmFsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1pcnJvclN0eWxlICs9IHZhbCArICc6JyArIHRhU3R5bGUuZ2V0UHJvcGVydHlWYWx1ZSh2YWwpICsgJzsnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1pcnJvci5zZXRBdHRyaWJ1dGUoJ3N0eWxlJywgbWlycm9yU3R5bGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiBhZGp1c3QoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRhSGVpZ2h0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YUNvbXB1dGVkU3R5bGVXaWR0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWlycm9ySGVpZ2h0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3ZlcmZsb3c7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobWlycm9yZWQgIT09IHRhKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluaXRNaXJyb3IoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBhY3RpdmUgZmxhZyBwcmV2ZW50cyBhY3Rpb25zIGluIGZ1bmN0aW9uIGZyb20gY2FsbGluZyBhZGp1c3QgYWdhaW5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWFjdGl2ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3RpdmUgPSB0cnVlO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1pcnJvci52YWx1ZSA9IHRhLnZhbHVlICsgYXBwZW5kOyAvLyBvcHRpb25hbCB3aGl0ZXNwYWNlIHRvIGltcHJvdmUgYW5pbWF0aW9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1pcnJvci5zdHlsZS5vdmVyZmxvd1kgPSB0YS5zdHlsZS5vdmVyZmxvd1k7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFIZWlnaHQgPSB0YS5zdHlsZS5oZWlnaHQgPT09ICcnID8gJ2F1dG8nIDogcGFyc2VJbnQodGEuc3R5bGUuaGVpZ2h0LCAxMCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFDb21wdXRlZFN0eWxlV2lkdGggPSBnZXRDb21wdXRlZFN0eWxlKHRhKS5nZXRQcm9wZXJ0eVZhbHVlKCd3aWR0aCcpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGVuc3VyZSBnZXRDb21wdXRlZFN0eWxlIGhhcyByZXR1cm5lZCBhIHJlYWRhYmxlICd1c2VkIHZhbHVlJyBwaXhlbCB3aWR0aFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGFDb21wdXRlZFN0eWxlV2lkdGguc3Vic3RyKHRhQ29tcHV0ZWRTdHlsZVdpZHRoLmxlbmd0aCAtIDIsIDIpID09PSAncHgnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB1cGRhdGUgbWlycm9yIHdpZHRoIGluIGNhc2UgdGhlIHRleHRhcmVhIHdpZHRoIGhhcyBjaGFuZ2VkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aCA9IHBhcnNlSW50KHRhQ29tcHV0ZWRTdHlsZVdpZHRoLCAxMCkgLSBib3hPdXRlci53aWR0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1pcnJvci5zdHlsZS53aWR0aCA9IHdpZHRoICsgJ3B4JztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1pcnJvckhlaWdodCA9IG1pcnJvci5zY3JvbGxIZWlnaHQ7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1pcnJvckhlaWdodCA+IG1heEhlaWdodCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWlycm9ySGVpZ2h0ID0gbWF4SGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3ZlcmZsb3cgPSAnc2Nyb2xsJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChtaXJyb3JIZWlnaHQgPCBtaW5IZWlnaHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1pcnJvckhlaWdodCA9IG1pbkhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaXJyb3JIZWlnaHQgKz0gYm94T3V0ZXIuaGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YS5zdHlsZS5vdmVyZmxvd1kgPSBvdmVyZmxvdyB8fCAnaGlkZGVuJztcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGFIZWlnaHQgIT09IG1pcnJvckhlaWdodCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NvcGUuJGVtaXQoJ2VsYXN0aWM6cmVzaXplJywgJHRhLCB0YUhlaWdodCwgbWlycm9ySGVpZ2h0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhLnN0eWxlLmhlaWdodCA9IG1pcnJvckhlaWdodCArICdweCc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBzbWFsbCBkZWxheSB0byBwcmV2ZW50IGFuIGluZmluaXRlIGxvb3BcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0aXZlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIDEsIGZhbHNlKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gZm9yY2VBZGp1c3QoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0aXZlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWRqdXN0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8qXG4gICAgICAgICAgICAgICAgICAgICAgICAgKiBpbml0aWFsaXNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgKi9cblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gbGlzdGVuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoJ29ucHJvcGVydHljaGFuZ2UnIGluIHRhICYmICdvbmlucHV0JyBpbiB0YSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIElFOVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhWydvbmlucHV0J10gPSB0YS5vbmtleXVwID0gYWRqdXN0O1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YVsnb25pbnB1dCddID0gYWRqdXN0O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAkd2luLmJpbmQoJ3Jlc2l6ZScsIGZvcmNlQWRqdXN0KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgc2NvcGUuJHdhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmdNb2RlbC4kbW9kZWxWYWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChuZXdWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvcmNlQWRqdXN0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgc2NvcGUuJG9uKCdlbGFzdGljOmFkanVzdCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbml0TWlycm9yKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yY2VBZGp1c3QoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAkdGltZW91dChhZGp1c3QsIDAsIGZhbHNlKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLypcbiAgICAgICAgICAgICAgICAgICAgICAgICAqIGRlc3Ryb3lcbiAgICAgICAgICAgICAgICAgICAgICAgICAqL1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBzY29wZS4kb24oJyRkZXN0cm95JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRtaXJyb3IucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHdpbi51bmJpbmQoJ3Jlc2l6ZScsIGZvcmNlQWRqdXN0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgXSk7XG5cbiAgICBhbmd1bGFyXG4gICAgICAgIC5tb2R1bGUoJ2FwcC5tZXNzYWdlcycsIFsnbW9ub3NwYWNlZC5lbGFzdGljJ10pO1xufSkoKTtcblxuXG5cblxuIiwiKGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBhbmd1bGFyLm1vZHVsZShcImFwcC5wcm9maWxlc1wiLCBbJ2FwcC5hdXRoJ10pO1xufSkoKTsiLCIoZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGFuZ3VsYXIubW9kdWxlKFwiYXBwLnNpZGVtZW51XCIsIFtdKTtcbn0pKCk7IiwiKGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBhbmd1bGFyLm1vZHVsZShcImFwcC51c2Vyc1wiLCBbJ2FwcC5hdXRoJ10pO1xufSkoKTsiLCIoZnVuY3Rpb24oKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgYW5ndWxhci5tb2R1bGUoXCJhcHAuYXV0aFwiKVxuXG4gICAgICAgIC5jb250cm9sbGVyKFwiYXV0aENvbnRyb2xsZXJcIiwgYXV0aENvbnRyb2xsZXIpO1xuXG5cbiAgICBmdW5jdGlvbiBhdXRoQ29udHJvbGxlcigkc2NvcGUsIGF1dGhTZXJ2aWNlLCAkaW9uaWNQb3B1cCwgJGlvbmljTG9hZGluZywgJHN0YXRlLCAkdGltZW91dCkge1xuXG4gICAgICAgICRzY29wZS5kYXRhID0ge307XG5cbiAgICAgICAgJHNjb3BlLmxvZ2luID0gZnVuY3Rpb24oKSB7XG5cdFx0XHQkaW9uaWNMb2FkaW5nLnNob3coKTtcblxuXHRcdFx0YXV0aFNlcnZpY2UubG9naW4oJHNjb3BlLmRhdGEudXNlcm5hbWUsICRzY29wZS5kYXRhLnBhc3N3b3JkKS5zdWNjZXNzKGZ1bmN0aW9uKHVzZXIpIHtcblx0XHRcdFx0JGlvbmljTG9hZGluZy5oaWRlKCk7XG5cdFx0XHRcdCRzdGF0ZS5nbygnYXBwLmJ1aWxkaW5ncycpO1xuXG4gICAgICAgICAgICB9KS5lcnJvcihmdW5jdGlvbihlcnJvcikge1xuXHRcdFx0XHQkdGltZW91dChmdW5jdGlvbigpIHtcblx0XHRcdFx0XHQkaW9uaWNMb2FkaW5nLmhpZGUoKTtcblx0XHRcdFx0fSwgMTAwKTtcblxuICAgICAgICAgICAgICAgIHZhciBhbGVydFBvcHVwID0gJGlvbmljUG9wdXAuYWxlcnQoe1xuICAgICAgICAgICAgICAgICAgICB0aXRsZTogJ0xvZ2luIGZhaWxlZCEnLFxuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZTogZXJyb3IubWVzc2FnZSAvLydQbGVhc2UgY2hlY2sgeW91ciBjcmVkZW50aWFscyEnXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG5cdFx0JHNjb3BlLmZhY2Vib29rTG9naW4gPSBmdW5jdGlvbigpIHtcblx0XHRcdHZhciBhbGVydFBvcHVwID0gJGlvbmljUG9wdXAuYWxlcnQoe1xuXHRcdFx0XHR0aXRsZTogJ0ZhY2Vib29rIGxvZ2luJyxcblx0XHRcdFx0dGVtcGxhdGU6ICdQbGFubmVkISdcblx0XHRcdH0pO1xuICAgICAgICB9XG4gICAgfVxufSkoKTsiLCIoZnVuY3Rpb24oKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgYW5ndWxhci5tb2R1bGUoXCJhcHAuYXV0aFwiKVxuXG4gICAgICAgIC5zZXJ2aWNlKFwiYXV0aFNlcnZpY2VcIiwgYXV0aFNlcnZpY2UpO1xuXG5cdGZ1bmN0aW9uIGNyZWF0ZVVzZXIodXNlcm5hbWUsIHBhc3N3b3JkKSB7XG5cdFx0dmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcblx0XHR2YXIgYXV0aCA9IGZpcmViYXNlU2VydmljZS5mYi5hdXRoKCk7XG5cblx0XHRyZXR1cm4gYXV0aC5jcmVhdGVVc2VyV2l0aEVtYWlsQW5kUGFzc3dvcmQoZW1haWwsIHBhc3N3b3JkKTtcblx0fVxuXHRcbiAgICBmdW5jdGlvbiBhdXRoU2VydmljZSgkcSwgJHJvb3RTY29wZSwgYnVpbGRpbmdzU2VydmljZSwgZ2xvYmFsc1NlcnZpY2UpIHtcblx0XHR2YXIgYXV0aCA9IGZpcmViYXNlLmF1dGgoKTtcblx0XHRcblx0XHQkcm9vdFNjb3BlLiRvbigndXNlci1jaGFuZ2VkJywgZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgdXNyID0gZmlyZWJhc2UuYXV0aCgpLmN1cnJlbnRVc2VyO1xuXHRcdFx0aWYgKHVzciA9PSBudWxsKSB7XG5cdFx0XHRcdGdsb2JhbHNTZXJ2aWNlLnVzZXIgPSBudWxsO1xuXHRcdFx0XHRyZXR1cm5cblx0XHRcdH07XG5cdFx0XHRcblx0XHRcdGdsb2JhbHNTZXJ2aWNlLnVzZXIgPSB1c3I7XG5cdFx0XHRcblx0XHRcdHZhciByZWYgPSBmaXJlYmFzZS5kYXRhYmFzZSgpLnJlZigndXNlcnMvJyArIHVzci51aWQpO1xuXHRcdFx0cmVmLmNoaWxkKCduYW1lJykuc2V0KHVzci5kaXNwbGF5TmFtZSk7XG5cdFx0XHRyZWYuY2hpbGQoJ2VtYWlsJykuc2V0KHVzci5lbWFpbCk7XG5cdFx0XHRyZWYuY2hpbGQoJ2xhc3RBY3Rpdml0eScpLnNldChuZXcgRGF0ZSgpLmdldFRpbWUoKSk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4ge1xuICAgICAgICAgICAgbG9naW46IGZ1bmN0aW9uKHVzZXJuYW1lLCBwYXNzd29yZCkge1xuICAgICAgICAgICAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgICAgICAgdmFyIHByb21pc2UgPSBkZWZlcnJlZC5wcm9taXNlO1xuXG5cdFx0XHRcdHZhciBzdWNjZXNzSGFuZGxlciA9IGZ1bmN0aW9uKGluZm8pIHtcblx0XHRcdFx0XHRpbmZvLmlzTmV3ID0gaW5mby5kaXNwbGF5TmFtZSA9PSBudWxsO1xuXHRcdFx0XHRcdGRlZmVycmVkLnJlc29sdmUoaW5mbyk7XG5cdFx0XHRcdFx0XHRcdFx0XHRcblx0XHRcdFx0XHQkcm9vdFNjb3BlLiRlbWl0KCd1c2VyLWNoYW5nZWQnKTtcblx0XHRcdFx0fTtcblxuXHRcdFx0XHR2YXIgZXJyb3JIYW5kbGVyID0gZnVuY3Rpb24oZXJyb3IpIHtcblx0XHRcdFx0XHRkZWZlcnJlZC5yZWplY3QoZXJyb3IpO1xuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdGF1dGguc2lnbkluV2l0aEVtYWlsQW5kUGFzc3dvcmQodXNlcm5hbWUsIHBhc3N3b3JkKVxuXHRcdFx0XHRcdC50aGVuKHN1Y2Nlc3NIYW5kbGVyLCBmdW5jdGlvbiBlcnJvcihlcnJvcikge1xuXHRcdFx0XHRcdFx0aWYgKGVycm9yLmNvZGUgPT0gXCJhdXRoL3VzZXItbm90LWZvdW5kXCIpIHtcblx0XHRcdFx0XHRcdFx0YXV0aC5jcmVhdGVVc2VyV2l0aEVtYWlsQW5kUGFzc3dvcmQodXNlcm5hbWUsIHBhc3N3b3JkKVxuXHRcdFx0XHRcdFx0XHRcdC50aGVuKHN1Y2Nlc3NIYW5kbGVyLCBlcnJvckhhbmRsZXIpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0XHRcdGVycm9ySGFuZGxlcihlcnJvcik7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSk7XG5cbiAgICAgICAgICAgICAgICBwcm9taXNlLnN1Y2Nlc3MgPSBmdW5jdGlvbihmbikge1xuICAgICAgICAgICAgICAgICAgICBwcm9taXNlLnRoZW4oZm4pO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcHJvbWlzZS5lcnJvciA9IGZ1bmN0aW9uKGZuKSB7XG4gICAgICAgICAgICAgICAgICAgIHByb21pc2UudGhlbihudWxsLCBmbik7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBwcm9taXNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICAgICAgICAgIH0sXG5cblx0XHRcdGxvZ291dDogZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRhdXRoLnNpZ25PdXQoKTtcblx0XHRcdFx0Z2xvYmFsc1NlcnZpY2UudXNlciA9IG51bGw7XG5cdFx0XHR9LFxuXG4gICAgICAgICAgICB1c2VyOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0cmV0dXJuIGZpcmViYXNlLmF1dGgoKS5jdXJyZW50VXNlcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn0pKCk7XG4iLCIoZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGFuZ3VsYXIubW9kdWxlKFwiYXBwLmJ1aWxkaW5nc1wiKVxuXG4gICAgICAgIC5jb250cm9sbGVyKFwiYnVpbGRpbmdDb250cm9sbGVyXCIsIGJ1aWxkaW5nQ29udHJvbGxlcik7XG5cblxuICAgIGZ1bmN0aW9uIGJ1aWxkaW5nQ29udHJvbGxlcigkc2NvcGUsICRpb25pY0xvYWRpbmcsICRzdGF0ZVBhcmFtcywgY2hhbm5lbHNTZXJ2aWNlKSB7XG5cbiAgICAgICAgdmFyIHJlZiA9IGNoYW5uZWxzU2VydmljZS5nZXRDaGFubmVsc0Zyb20oJHN0YXRlUGFyYW1zLmJ1aWxkaW5nSWQpO1xuXG4gICAgICAgICRpb25pY0xvYWRpbmcuc2hvdygpO1xuICAgICAgICByZWYub24oXCJ2YWx1ZVwiLCBmdW5jdGlvbiAoc25hcHNob3QpIHtcbiAgICAgICAgICAgIHZhciB2YWwgPSBzbmFwc2hvdC52YWwoKTtcblxuICAgICAgICAgICAgaWYgKHZhbCkge1xuICAgICAgICAgICAgICAgICRzY29wZS5jaGFubmVscyA9IHZhbC5jaGFubmVscztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAkaW9uaWNMb2FkaW5nLmhpZGUoKTtcblxuICAgICAgICB9LCBmdW5jdGlvbiAoZXJyb3JPYmplY3QpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiZXJyb3IgcmVhZGluZzogXCIgKyBlcnJvck9iamVjdC5jb2RlKTtcbiAgICAgICAgICAgIHZhciBhbGVydFBvcHVwID0gJGlvbmljUG9wdXAuYWxlcnQoe1xuICAgICAgICAgICAgICAgIHRpdGxlOiAnT3BzIScsXG4gICAgICAgICAgICAgICAgdGVtcGxhdGU6ICdTb3JyeSEgQW4gZXJyb3Igb2N1cnJlZC4nXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICRpb25pY0xvYWRpbmcuaGlkZSgpO1xuICAgICAgICB9KTtcblxuICAgIH1cbn0pKCk7IiwiKGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBhbmd1bGFyLm1vZHVsZShcImFwcC5idWlsZGluZ3NcIilcblxuICAgICAgICAuY29udHJvbGxlcihcImJ1aWxkaW5nc0NvbnRyb2xsZXJcIiwgYnVpbGRpbmdzQ29udHJvbGxlcik7XG5cblxuICAgIGZ1bmN0aW9uIGJ1aWxkaW5nc0NvbnRyb2xsZXIoJHNjb3BlLCAkaW9uaWNMb2FkaW5nLCBidWlsZGluZ3NTZXJ2aWNlLCBnbG9iYWxzU2VydmljZSkge1xuICAgICAgICB2YXIgcmVmID0gYnVpbGRpbmdzU2VydmljZS5nZXRCdWlsZGluZ3MoKTtcblx0XHRcblx0XHQkc2NvcGUuc2VsZWN0ZWRLZXkgPSBnbG9iYWxzU2VydmljZS5idWlsZGluZyA/IGdsb2JhbHNTZXJ2aWNlLmJ1aWxkaW5nLmtleSA6IG51bGw7XG5cdFx0XG5cdFx0JHNjb3BlLnNlbGVjdCA9IGZ1bmN0aW9uKGtleSwgYnVpbGRpbmcpIHtcblx0XHRcdCRzY29wZS5zZWxlY3RlZEtleSA9IGJ1aWxkaW5nLmtleSA9IGtleTtcblx0XHRcdGdsb2JhbHNTZXJ2aWNlLmJ1aWxkaW5nID0gYnVpbGRpbmc7XG5cdFx0XHQkc2NvcGUuJGVtaXQoXCJidWlsZGluZy1zZWxlY3RlZFwiLCBidWlsZGluZyk7XG5cdFx0fTtcdFx0XG5cbiAgICAgICAgJGlvbmljTG9hZGluZy5zaG93KCk7XG4gICAgICAgIHJlZi5vbihcInZhbHVlXCIsIGZ1bmN0aW9uIChzbmFwc2hvdCkge1xuICAgICAgICAgICAgJHNjb3BlLmJ1aWxkaW5ncyA9IHNuYXBzaG90LnZhbCgpO1xuICAgICAgICAgICAgJGlvbmljTG9hZGluZy5oaWRlKCk7XG4gICAgICAgIH0sIGZ1bmN0aW9uIChlcnJvck9iamVjdCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJlcnJvciByZWFkaW5nOiBcIiArIGVycm9yT2JqZWN0LmNvZGUpO1xuICAgICAgICAgICAgdmFyIGFsZXJ0UG9wdXAgPSAkaW9uaWNQb3B1cC5hbGVydCh7XG4gICAgICAgICAgICAgICAgdGl0bGU6ICdPcHMhJyxcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZTogJ1NvcnJ5ISBBbiBlcnJvciBvY3VycmVkJ1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAkaW9uaWNMb2FkaW5nLmhpZGUoKTtcbiAgICAgICAgfSk7XG4gICAgfVxufSkoKTsiLCIoZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGFuZ3VsYXJcbiAgICAgICAgLm1vZHVsZSgnYXBwLmJ1aWxkaW5ncycpXG4gICAgICAgIC5zZXJ2aWNlKCdidWlsZGluZ3NTZXJ2aWNlJywgYnVpbGRpbmdzU2VydmljZSk7XG5cbiAgICBmdW5jdGlvbiBidWlsZGluZ3NTZXJ2aWNlKGZpcmViYXNlU2VydmljZSwgJHJvb3RTY29wZSkge1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBnZXRCdWlsZGluZ3M6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmlyZWJhc2UuZGF0YWJhc2UoKS5yZWYoJ2J1aWxkaW5ncycpXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59KSgpO1xuIiwiKGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBhbmd1bGFyXG4gICAgICAgIC5tb2R1bGUoJ2FwcC5jaGFubmVscycpXG4gICAgICAgIC5zZXJ2aWNlKCdjaGFubmVsc1NlcnZpY2UnLCBjaGFubmVsc1NlcnZpY2UpO1xuXG4gICAgZnVuY3Rpb24gY2hhbm5lbHNTZXJ2aWNlKCRyb290U2NvcGUpIHtcblx0XHR2YXIgc2VydmljZSA9IHt9O1xuXHRcdFxuXHRcdHNlcnZpY2UuY2hhbm5lbHMgPSB7XG5cdFx0XHRcImxhbmRsb3JkXCI6IFwiVGFsayB0byBsYW5kbG9yZFwiLFxuXHRcdFx0XCJnZW5lcmFsXCI6IFwiR2VuZXJhbFwiLFxuXHRcdFx0XCJwYXJraW5nXCI6IFwiUGFya2luZyBHYXJhZ2VcIixcblx0XHRcdFwiZ2FyZGVuXCI6IFwiR2FyZGVuXCIsXG5cdFx0XHRcImxvc3Rmb3VuZFwiOiBcIkxvc3QgJiBGb3VuZFwiLFxuXHRcdFx0XCJtYWludGVuYW5jZVwiOiBcIlJlcXVlc3QgTWFpbnRlbmFuY2VcIlxuXHRcdH07XG5cdFx0XG5cdFx0JHJvb3RTY29wZS4kb24oXCJidWlsZGluZy1zZWxlY3RlZFwiLCBmdW5jdGlvbihidWlsZGluZykge1xuXHRcdFx0Ly9jb3VudCBob3cgbWFueSBuZXcgbWVzc2FnZXMgZWFjaCBjaGFubmVsIGhhc1xuXHRcdH0pO1xuXHRcdFxuXHRcdHNlcnZpY2UuZ2V0Q2hhbm5lbHNGcm9tID0gZnVuY3Rpb24gKGJ1aWxkaW5nKSB7XG5cdFx0XHRyZXR1cm4gZmlyZWJhc2UuZGF0YWJhc2UoKS5yZWYoJ2J1aWxkaW5ncy8nICsgYnVpbGRpbmcgKyBcIi9jaGFubmVsc1wiKTtcblx0XHR9O1xuXG4gICAgICAgIHJldHVybiBzZXJ2aWNlO1xuICAgIH1cbn0pKCk7XG5cbiIsIihmdW5jdGlvbigpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBhbmd1bGFyXG4gICAgICAgIC5tb2R1bGUoJ2FwcC5kaXJlY3RtZXNzYWdlcycpXG4gICAgICAgIC5jb250cm9sbGVyKCdkaXJlY3RNZXNzYWdlc0NvbnRyb2xsZXInLCBbXG4gICAgICAgICAgICAnJHNjb3BlJyxcblx0XHRcdCckc3RhdGUnLFxuICAgICAgICAgICAgJyRpb25pY0xvYWRpbmcnLFxuICAgICAgICAgICAgJ2RpcmVjdE1lc3NhZ2VzU2VydmljZScsXG4gICAgICAgICAgICAnZ2xvYmFsc1NlcnZpY2UnLFxuICAgICAgICAgICAgZGlyZWN0TWVzc2FnZXNDb250cm9sbGVyXG4gICAgICAgIF0pO1xuXG4gICAgZnVuY3Rpb24gZGlyZWN0TWVzc2FnZXNDb250cm9sbGVyKCRzY29wZSwgJHN0YXRlLCAkaW9uaWNMb2FkaW5nLCBjb250YWN0c1NlcnZpY2UsIGdsb2JhbHNTZXJ2aWNlKSB7XG5cdFx0aWYgKCFnbG9iYWxzU2VydmljZS51c2VyKSB7XG5cdFx0XHQkc3RhdGUuZ28oJ2xvZ2luJyk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuICAgICAgICBcblx0XHR2YXIgdXNlciA9IGdsb2JhbHNTZXJ2aWNlLnVzZXI7XG5cdFx0Y29uc29sZS5sb2codXNlci51aWQpO1xuXG4gICAgICAgICRpb25pY0xvYWRpbmcuc2hvdygpO1xuXG4gICAgICAgIHZhciByZWYgPSBjb250YWN0c1NlcnZpY2UuZ2V0VXNlckNvbnRhY3RzKHVzZXIudWlkKTtcbiAgICAgICAgcmVmLm9uKFwidmFsdWVcIiwgZnVuY3Rpb24oc25hcHNob3QpIHtcblx0XHRcdCRzY29wZS5jb250YWN0cyA9IHNuYXBzaG90LnZhbCgpO1xuICAgICAgICAgICAgJGlvbmljTG9hZGluZy5oaWRlKCk7XG5cdFx0XHRcblx0XHRcdGNvbnNvbGUubG9nKCRzY29wZS5jb250YWN0cyk7XG4gICAgICAgIH0sIGZ1bmN0aW9uKGVycm9yT2JqZWN0KSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcImVycm9yIHJlYWRpbmc6IFwiICsgZXJyb3JPYmplY3QuY29kZSk7XG4gICAgICAgICAgICAkaW9uaWNMb2FkaW5nLmhpZGUoKTtcbiAgICAgICAgICAgIHZhciBhbGVydFBvcHVwID0gJGlvbmljUG9wdXAuYWxlcnQoe1xuICAgICAgICAgICAgICAgIHRpdGxlOiAnT3BzIScsXG4gICAgICAgICAgICAgICAgdGVtcGxhdGU6ICdTb3JyeSEgQW4gZXJyb3Igb2N1cnJlZC4nXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgXG4gICAgfVxufSkoKTsiLCIoZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGFuZ3VsYXJcbiAgICAgICAgLm1vZHVsZSgnYXBwLmRpcmVjdG1lc3NhZ2VzJylcbiAgICAgICAgLnNlcnZpY2UoJ2RpcmVjdE1lc3NhZ2VzU2VydmljZScsIGRpcmVjdE1lc3NhZ2VzU2VydmljZSk7XG5cbiAgICBmdW5jdGlvbiBkaXJlY3RNZXNzYWdlc1NlcnZpY2UoZmlyZWJhc2VTZXJ2aWNlKSB7XG4gICAgICAgIHZhciBzZXJ2aWNlID0ge307XG5cbiAgICAgICAgc2VydmljZS5nZXRVc2VyQ29udGFjdHMgPSBmdW5jdGlvbiAodXNlcikge1xuICAgICAgICAgICAgcmV0dXJuIGZpcmViYXNlU2VydmljZS5mYi5kYXRhYmFzZSgpLnJlZigndXNlcnMvJyArIHVzZXIgKyAnL2NvbnRhY3RzJyk7XG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIHNlcnZpY2U7XG4gICAgfVxufSkoKTtcbiIsIihmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgYW5ndWxhclxuICAgICAgICAubW9kdWxlKCdhcHAuZmlyZWJhc2UnKVxuICAgICAgICAuc2VydmljZSgnZmlyZWJhc2VTZXJ2aWNlJywgZmlyZWJhc2VTZXJ2aWNlKTtcblxuXG4gICAgZnVuY3Rpb24gZmlyZWJhc2VTZXJ2aWNlKCkge1xuICAgICAgICB2YXIgY29uZmlnID0ge1xuICAgICAgICAgICAgYXBpS2V5OiBcIkFJemFTeUI1cTgxQUdHb3g0aTgtUUwyS090bkREZmkwNWlyZ2NIRVwiLFxuICAgICAgICAgICAgYXV0aERvbWFpbjogXCJzb2NpYWxzdHJhdGFpZGVhdGVhbS5maXJlYmFzZWFwcC5jb21cIixcbiAgICAgICAgICAgIGRhdGFiYXNlVVJMOiBcImh0dHBzOi8vc29jaWFsc3RyYXRhaWRlYXRlYW0uZmlyZWJhc2Vpby5jb21cIixcbiAgICAgICAgICAgIHN0b3JhZ2VCdWNrZXQ6IFwiXCIsXG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5mYiA9IGZpcmViYXNlLmluaXRpYWxpemVBcHAoY29uZmlnKTtcbiAgICB9XG59KSgpO1xuIiwiKGZ1bmN0aW9uKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGFuZ3VsYXJcbiAgICAgICAgLm1vZHVsZSgnYXBwLm1lc3NhZ2VzJylcbiAgICAgICAgLmNvbnRyb2xsZXIoJ21lc3NhZ2VzQ29udHJvbGxlcicsIFtcbiAgICAgICAgICAgICckc2NvcGUnLFxuICAgICAgICAgICAgJyRzdGF0ZScsXG4gICAgICAgICAgICAnJHN0YXRlUGFyYW1zJyxcbiAgICAgICAgICAgICckaW9uaWNTY3JvbGxEZWxlZ2F0ZScsXG4gICAgICAgICAgICAnY2hhbm5lbHNTZXJ2aWNlJyxcbiAgICAgICAgICAgICdnbG9iYWxzU2VydmljZScsXG4gICAgICAgICAgICBNZXNzYWdlc0NvbnRyb2xsZXJcbiAgICAgICAgXSk7XG5cbiAgICBmdW5jdGlvbiBNZXNzYWdlc0NvbnRyb2xsZXIoJHNjb3BlLCAkc3RhdGUsICRzdGF0ZVBhcmFtcywgJGlvbmljU2Nyb2xsRGVsZWdhdGUsIGNoYW5uZWxzU2VydmljZSwgZ2xvYmFsc1NlcnZpY2UpIHtcbiAgICAgICAgLy9hdmFpbGFibGUgc2VydmljZXNcbiAgICAgICAgdGhpcy4kc2NvcGUgPSAkc2NvcGU7XG4gICAgICAgIHRoaXMuJHN0YXRlID0gJHN0YXRlO1xuICAgICAgICB0aGlzLiRzdGF0ZVBhcmFtcyA9ICRzdGF0ZVBhcmFtcztcbiAgICAgICAgdGhpcy4kaW9uaWNTY3JvbGxEZWxlZ2F0ZSA9ICRpb25pY1Njcm9sbERlbGVnYXRlO1xuICAgICAgICB0aGlzLmNoYW5uZWxzU2VydmljZSA9IGNoYW5uZWxzU2VydmljZTtcblx0XHR0aGlzLmdsb2JhbHNTZXJ2aWNlID0gZ2xvYmFsc1NlcnZpY2U7XG5cblx0XHRpZiAoIXRoaXMudmFsaWRhdGUoKSlcblx0XHRcdHJldHVybiBmYWxzZTtcbiAgICAgICAgXG4gICAgICAgIC8vY3VzdG9tIHByb3BlcnRpZXNcbiAgICAgICAgdGhpcy5idWlsZGluZ0tleSA9IGdsb2JhbHNTZXJ2aWNlLmJ1aWxkaW5nLmtleTtcbiAgICAgICAgdGhpcy5jaGFubmVsS2V5ID0gdGhpcy4kc3RhdGVQYXJhbXMuY2hhbm5lbElkO1xuICAgICAgICB0aGlzLm1lc3NhZ2VzUmVmID0gZmlyZWJhc2UuZGF0YWJhc2UoKS5yZWYoWydidWlsZGluZ3MnLCB0aGlzLmJ1aWxkaW5nS2V5LCAnbWVzc2FnZXMnXS5qb2luKCcvJykpO1xuXHRcdHRoaXMubWVzc2FnZXNSZWYub24oJ2NoaWxkX2FkZGVkJywgZnVuY3Rpb24ocykge1xuXHRcdFx0Y29uc29sZS5sb2cocy52YWwoKSk7XG5cdFx0fSk7XG5cdFx0XG4gICAgICAgICRzY29wZS51c2VyID0ge1xuICAgICAgICAgICAgX2lkOiBcIjUzNGI4ZmIyYWE1ZTdhZmMxYjIzZTY5Y1wiLCAvLyRzY29wZS51c2VyLnVpZCxcbiAgICAgICAgICAgIHBpYzogJ2h0dHA6Ly9pb25pY2ZyYW1ld29yay5jb20vaW1nL2RvY3MvbWNmbHkuanBnJyxcbiAgICAgICAgICAgIHVzZXJuYW1lOiBnbG9iYWxzU2VydmljZS51c2VyLmRpc3BsYXlOYW1lID8gZ2xvYmFsc1NlcnZpY2UudXNlci5kaXNwbGF5TmFtZSA6ICdBbm9ueW1vdXMnXG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLnRvVXNlcjtcblxuICAgICAgICAvL1VJIGVsZW1lbnRzXG4gICAgICAgIHRoaXMudmlld1Njcm9sbCA9ICRpb25pY1Njcm9sbERlbGVnYXRlLiRnZXRCeUhhbmRsZSgndXNlck1lc3NhZ2VTY3JvbGwnKTtcblxuICAgICAgICAvL2V2ZW50c1xuICAgICAgICAkc2NvcGUuJG9uKFwiY2hhdC1yZWNlaXZlLW1lc3NhZ2VcIiwgdGhpcy5vblJlY2VpdmVNZXNzYWdlKTtcblxuICAgICAgICB0aGlzLmluaXQoKTtcbiAgICB9XG5cdFxuXHRNZXNzYWdlc0NvbnRyb2xsZXIucHJvdG90eXBlLnZhbGlkYXRlID0gZnVuY3Rpb24oKSB7XG5cdFx0aWYgKCF0aGlzLmdsb2JhbHNTZXJ2aWNlLnVzZXIpIHtcbiAgICAgICAgICAgIHRoaXMuJHN0YXRlLmdvKCdsb2dpbicpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cdFx0XG5cdFx0aWYgKCF0aGlzLmdsb2JhbHNTZXJ2aWNlLmJ1aWxkaW5nKSB7XG4gICAgICAgICAgICB0aGlzLiRzdGF0ZS5nbygnYXBwLmJ1aWxkaW5ncycpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cdFx0XG5cdFx0cmV0dXJuIHRydWU7XG5cdH07XG5cbiAgICAvL0NoZWNrIGlmIGlzIGEgQ29tbW9uIFJvb20gb3IgRGlyZWN0IE1lc3NhZ2VcbiAgICBNZXNzYWdlc0NvbnRyb2xsZXIucHJvdG90eXBlLmluaXQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXHRcdFxuICAgICAgICB2YXIgY2hhbm5lbFBhdGggPSBbJ2J1aWxkaW5ncycsIHRoaXMuYnVpbGRpbmdLZXksICdjaGFubmVscycsIHRoaXMuJHN0YXRlUGFyYW1zLmNoYW5uZWxJZF0uam9pbignLycpO1xuICAgICAgICBjb25zb2xlLmxvZyhjaGFubmVsUGF0aCk7XG5cbiAgICAgICAgdmFyIGNoYW5uZWxSZWYgPSBmaXJlYmFzZS5kYXRhYmFzZSgpLnJlZihjaGFubmVsUGF0aCk7XG4gICAgICAgIGNoYW5uZWxSZWYub24oJ3ZhbHVlJywgZnVuY3Rpb24oc25hcHNob3QpIHtcbiAgICAgICAgICAgIHNlbGYuY2hhbm5lbCA9IHNuYXBzaG90LnZhbCgpO1xuXG4gICAgICAgICAgICBpZiAoc2VsZi5jaGFubmVsLnR5cGUgPT0gXCJkaXJlY3RcIikgeyAvL2RpcmVjdCBtZXNzYWdlXG4gICAgICAgICAgICAgICAgc2VsZi5zZXRDb250YWN0KHNlbGYuY2hhbm5lbC51c2VyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgeyAvL0NvbW1vbiByb29tXG4gICAgICAgICAgICAgICAgc2VsZi5nZXRMYXN0TWVzc2FnZXMoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIE1lc3NhZ2VzQ29udHJvbGxlci5wcm90b3R5cGUuc2V0Q29udGFjdCA9IGZ1bmN0aW9uKHVpZCkge1xuXHRcdHZhciBzZWxmID0gdGhpcztcblx0XHRcbiAgICAgICAgdmFyIGNvbnRhY3RQYXRoID0gWyd1c2VycycsIHVpZF0uam9pbignLycpO1xuICAgICAgICBjb25zb2xlLmxvZyhjb250YWN0UGF0aCk7XG5cbiAgICAgICAgZmlyZWJhc2UuZGF0YWJhc2UoKS5yZWYoY29udGFjdFBhdGgpLm9uKCd2YWx1ZScsIGZ1bmN0aW9uKHNuYXBzaG90KSB7XG4gICAgICAgICAgICB2YXIgY29udGFjdCA9IHNuYXBzaG90LnZhbCgpO1xuICAgICAgICAgICAgc2VsZi4kc2NvcGUudG9Vc2VyID0ge1xuICAgICAgICAgICAgICAgIF9pZDogXCI1MzRiOGU1YWFhNWU3YWZjMWIyM2U2OWJcIiwgLy91c2VyLnVpZCxcbiAgICAgICAgICAgICAgICBwaWM6ICdodHRwOi8vaW9uaWNmcmFtZXdvcmsuY29tL2ltZy9kb2NzL21jZmx5LmpwZycsXG4gICAgICAgICAgICAgICAgdXNlcm5hbWU6IGNvbnRhY3QgJiYgY29udGFjdC5kaXNwbGF5TmFtZSA/IGNvbnRhY3QuZGlzcGxheU5hbWUgOiAnQW5vbnltb3VzJ1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgc2VsZi5nZXRMYXN0TWVzc2FnZXMoKTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIE1lc3NhZ2VzQ29udHJvbGxlci5wcm90b3R5cGUuZ2V0TGFzdE1lc3NhZ2VzID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIFxuICAgICAgICAvL3ByZXNlbnQgbGFzdCAzMCBtZXNzYWdlc1xuICAgICAgICB0aGlzLiRzY29wZS5tZXNzYWdlcyA9IFt7XG4gICAgICAgICAgICBcIl9pZFwiOiBcIjUzNWQ2MjVmODk4ZGY0ZTgwZTJhMTI1ZVwiLFxuICAgICAgICAgICAgXCJ0ZXh0XCI6IFwiSW9uaWMgaGFzIGNoYW5nZWQgdGhlIGdhbWUgZm9yIGh5YnJpZCBhcHAgZGV2ZWxvcG1lbnQuXCIsXG4gICAgICAgICAgICBcInVzZXJJZFwiOiBcIjUzNGI4ZmIyYWE1ZTdhZmMxYjIzZTY5Y1wiLFxuICAgICAgICAgICAgXCJkYXRlXCI6IFwiMjAxNC0wNC0yN1QyMDowMjozOS4wODJaXCIsXG4gICAgICAgICAgICBcInJlYWRcIjogdHJ1ZSxcbiAgICAgICAgICAgIFwicmVhZERhdGVcIjogXCIyMDE0LTEyLTAxVDA2OjI3OjM3Ljk0NFpcIlxuICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgXCJfaWRcIjogXCI1MzVmMTNmZmVlM2IyYTY4MTEyYjlmYzBcIixcbiAgICAgICAgICAgICAgICBcInRleHRcIjogXCJJIGxpa2UgSW9uaWMgYmV0dGVyIHRoYW4gaWNlIGNyZWFtIVwiLFxuICAgICAgICAgICAgICAgIFwidXNlcklkXCI6IFwiNTM0YjhlNWFhYTVlN2FmYzFiMjNlNjliXCIsXG4gICAgICAgICAgICAgICAgXCJkYXRlXCI6IFwiMjAxNC0wNC0yOVQwMjo1Mjo0Ny43MDZaXCIsXG4gICAgICAgICAgICAgICAgXCJyZWFkXCI6IHRydWUsXG4gICAgICAgICAgICAgICAgXCJyZWFkRGF0ZVwiOiBcIjIwMTQtMTItMDFUMDY6Mjc6MzcuOTQ0WlwiXG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgXCJfaWRcIjogXCI1NDZhNTg0M2ZkNGM1ZDU4MWVmYTI2M2FcIixcbiAgICAgICAgICAgICAgICBcInRleHRcIjogXCJMb3JlbSBpcHN1bSBkb2xvciBzaXQgYW1ldCwgY29uc2VjdGV0dXIgYWRpcGlzY2luZyBlbGl0LCBzZWQgZG8gZWl1c21vZCB0ZW1wb3IgaW5jaWRpZHVudCB1dCBsYWJvcmUgZXQgZG9sb3JlIG1hZ25hIGFsaXF1YS4gVXQgZW5pbSBhZCBtaW5pbSB2ZW5pYW0sIHF1aXMgbm9zdHJ1ZCBleGVyY2l0YXRpb24gdWxsYW1jbyBsYWJvcmlzIG5pc2kgdXQgYWxpcXVpcCBleCBlYSBjb21tb2RvIGNvbnNlcXVhdC4gRHVpcyBhdXRlIGlydXJlIGRvbG9yIGluIHJlcHJlaGVuZGVyaXQgaW4gdm9sdXB0YXRlIHZlbGl0IGVzc2UgY2lsbHVtIGRvbG9yZSBldSBmdWdpYXQgbnVsbGEgcGFyaWF0dXIuIEV4Y2VwdGV1ciBzaW50IG9jY2FlY2F0IGN1cGlkYXRhdCBub24gcHJvaWRlbnQsIHN1bnQgaW4gY3VscGEgcXVpIG9mZmljaWEgZGVzZXJ1bnQgbW9sbGl0IGFuaW0gaWQgZXN0IGxhYm9ydW0uXCIsXG4gICAgICAgICAgICAgICAgXCJ1c2VySWRcIjogXCI1MzRiOGZiMmFhNWU3YWZjMWIyM2U2OWNcIixcbiAgICAgICAgICAgICAgICBcImRhdGVcIjogXCIyMDE0LTExLTE3VDIwOjE5OjE1LjI4OVpcIixcbiAgICAgICAgICAgICAgICBcInJlYWRcIjogdHJ1ZSxcbiAgICAgICAgICAgICAgICBcInJlYWREYXRlXCI6IFwiMjAxNC0xMi0wMVQwNjoyNzozOC4zMjhaXCJcbiAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICBcIl9pZFwiOiBcIjU0NzY0Mzk5YWI0M2QxZDQxMTNhYmZkMVwiLFxuICAgICAgICAgICAgICAgIFwidGV4dFwiOiBcIkFtIEkgZHJlYW1pbmc/XCIsXG4gICAgICAgICAgICAgICAgXCJ1c2VySWRcIjogXCI1MzRiOGU1YWFhNWU3YWZjMWIyM2U2OWJcIixcbiAgICAgICAgICAgICAgICBcImRhdGVcIjogXCIyMDE0LTExLTI2VDIxOjE4OjE3LjU5MVpcIixcbiAgICAgICAgICAgICAgICBcInJlYWRcIjogdHJ1ZSxcbiAgICAgICAgICAgICAgICBcInJlYWREYXRlXCI6IFwiMjAxNC0xMi0wMVQwNjoyNzozOC4zMzdaXCJcbiAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICBcIl9pZFwiOiBcIjU0NzY0M2FlYWI0M2QxZDQxMTNhYmZkMlwiLFxuICAgICAgICAgICAgICAgIFwidGV4dFwiOiBcIklzIHRoaXMgbWFnaWM/XCIsXG4gICAgICAgICAgICAgICAgXCJ1c2VySWRcIjogXCI1MzRiOGZiMmFhNWU3YWZjMWIyM2U2OWNcIixcbiAgICAgICAgICAgICAgICBcImRhdGVcIjogXCIyMDE0LTExLTI2VDIxOjE4OjM4LjU0OVpcIixcbiAgICAgICAgICAgICAgICBcInJlYWRcIjogdHJ1ZSxcbiAgICAgICAgICAgICAgICBcInJlYWREYXRlXCI6IFwiMjAxNC0xMi0wMVQwNjoyNzozOC4zMzhaXCJcbiAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICBcIl9pZFwiOiBcIjU0NzgxNWRiYWI0M2QxZDQxMTNhYmZlZlwiLFxuICAgICAgICAgICAgICAgIFwidGV4dFwiOiBcIkdlZSB3aXosIHRoaXMgaXMgc29tZXRoaW5nIHNwZWNpYWwuXCIsXG4gICAgICAgICAgICAgICAgXCJ1c2VySWRcIjogXCI1MzRiOGU1YWFhNWU3YWZjMWIyM2U2OWJcIixcbiAgICAgICAgICAgICAgICBcImRhdGVcIjogXCIyMDE0LTExLTI4VDA2OjI3OjQwLjAwMVpcIixcbiAgICAgICAgICAgICAgICBcInJlYWRcIjogdHJ1ZSxcbiAgICAgICAgICAgICAgICBcInJlYWREYXRlXCI6IFwiMjAxNC0xMi0wMVQwNjoyNzozOC4zMzhaXCJcbiAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICBcIl9pZFwiOiBcIjU0NzgxYzY5YWI0M2QxZDQxMTNhYmZmMFwiLFxuICAgICAgICAgICAgICAgIFwidGV4dFwiOiBcIkkgdGhpbmsgSSBsaWtlIElvbmljIG1vcmUgdGhhbiBJIGxpa2UgaWNlIGNyZWFtIVwiLFxuICAgICAgICAgICAgICAgIFwidXNlcklkXCI6IFwiNTM0YjhmYjJhYTVlN2FmYzFiMjNlNjljXCIsXG4gICAgICAgICAgICAgICAgXCJkYXRlXCI6IFwiMjAxNC0xMS0yOFQwNjo1NTozNy4zNTBaXCIsXG4gICAgICAgICAgICAgICAgXCJyZWFkXCI6IHRydWUsXG4gICAgICAgICAgICAgICAgXCJyZWFkRGF0ZVwiOiBcIjIwMTQtMTItMDFUMDY6Mjc6MzguMzM4WlwiXG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgXCJfaWRcIjogXCI1NDc4MWNhNGFiNDNkMWQ0MTEzYWJmZjFcIixcbiAgICAgICAgICAgICAgICBcInRleHRcIjogXCJZZWEsIGl0J3MgcHJldHR5IHN3ZWV0XCIsXG4gICAgICAgICAgICAgICAgXCJ1c2VySWRcIjogXCI1MzRiOGU1YWFhNWU3YWZjMWIyM2U2OWJcIixcbiAgICAgICAgICAgICAgICBcImRhdGVcIjogXCIyMDE0LTExLTI4VDA2OjU2OjM2LjQ3MlpcIixcbiAgICAgICAgICAgICAgICBcInJlYWRcIjogdHJ1ZSxcbiAgICAgICAgICAgICAgICBcInJlYWREYXRlXCI6IFwiMjAxNC0xMi0wMVQwNjoyNzozOC4zMzhaXCJcbiAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICBcIl9pZFwiOiBcIjU0NzhkZjg2YWI0M2QxZDQxMTNhYmZmNFwiLFxuICAgICAgICAgICAgICAgIFwidGV4dFwiOiBcIldvdywgdGhpcyBpcyByZWFsbHkgc29tZXRoaW5nIGh1aD9cIixcbiAgICAgICAgICAgICAgICBcInVzZXJJZFwiOiBcIjUzNGI4ZmIyYWE1ZTdhZmMxYjIzZTY5Y1wiLFxuICAgICAgICAgICAgICAgIFwiZGF0ZVwiOiBcIjIwMTQtMTEtMjhUMjA6NDg6MDYuNTcyWlwiLFxuICAgICAgICAgICAgICAgIFwicmVhZFwiOiB0cnVlLFxuICAgICAgICAgICAgICAgIFwicmVhZERhdGVcIjogXCIyMDE0LTEyLTAxVDA2OjI3OjM4LjMzOVpcIlxuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgIFwiX2lkXCI6IFwiNTQ3ODFjYTRhYjQzZDFkNDExM2FiZmYxXCIsXG4gICAgICAgICAgICAgICAgXCJ0ZXh0XCI6IFwiQ3JlYXRlIGFtYXppbmcgYXBwcyAtIGlvbmljZnJhbWV3b3JrLmNvbVwiLFxuICAgICAgICAgICAgICAgIFwidXNlcklkXCI6IFwiNTM0YjhlNWFhYTVlN2FmYzFiMjNlNjliXCIsXG4gICAgICAgICAgICAgICAgXCJkYXRlXCI6IFwiMjAxNC0xMS0yOVQwNjo1NjozNi40NzJaXCIsXG4gICAgICAgICAgICAgICAgXCJyZWFkXCI6IHRydWUsXG4gICAgICAgICAgICAgICAgXCJyZWFkRGF0ZVwiOiBcIjIwMTQtMTItMDFUMDY6Mjc6MzguMzM4WlwiXG4gICAgICAgICAgICB9XTtcbiAgICB9O1xuXG4gICAgTWVzc2FnZXNDb250cm9sbGVyLnByb3RvdHlwZS5vblJlY2VpdmVNZXNzYWdlID0gZnVuY3Rpb24oKSB7XG5cbiAgICB9O1xuXG4gICAgTWVzc2FnZXNDb250cm9sbGVyLnByb3RvdHlwZS5zZW5kTWVzc2FnZSA9IGZ1bmN0aW9uKHNlbmRNZXNzYWdlRm9ybSkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgdmFyIG1lc3NhZ2UgPSB7XG4gICAgICAgICAgICB0b0lkOiAkc2NvcGUudG9Vc2VyLl9pZCxcbiAgICAgICAgICAgIHRleHQ6ICRzY29wZS5pbnB1dC5tZXNzYWdlXG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gaWYgeW91IGRvIGEgd2ViIHNlcnZpY2UgY2FsbCB0aGlzIHdpbGwgYmUgbmVlZGVkIGFzIHdlbGwgYXMgYmVmb3JlIHRoZSB2aWV3U2Nyb2xsIGNhbGxzXG4gICAgICAgIC8vIHlvdSBjYW4ndCBzZWUgdGhlIGVmZmVjdCBvZiB0aGlzIGluIHRoZSBicm93c2VyIGl0IG5lZWRzIHRvIGJlIHVzZWQgb24gYSByZWFsIGRldmljZVxuICAgICAgICAvLyBmb3Igc29tZSByZWFzb24gdGhlIG9uZSB0aW1lIGJsdXIgZXZlbnQgaXMgbm90IGZpcmluZyBpbiB0aGUgYnJvd3NlciBidXQgZG9lcyBvbiBkZXZpY2VzXG4gICAgICAgIC8vIGtlZXBLZXlib2FyZE9wZW4oKTtcblxuICAgICAgICAvL01vY2tTZXJ2aWNlLnNlbmRNZXNzYWdlKG1lc3NhZ2UpLnRoZW4oZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAkc2NvcGUuaW5wdXQubWVzc2FnZSA9ICcnO1xuXG4gICAgICAgIG1lc3NhZ2UuX2lkID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7IC8vIDp+KVxuICAgICAgICBtZXNzYWdlLmRhdGUgPSBuZXcgRGF0ZSgpO1xuICAgICAgICBtZXNzYWdlLnVzZXJuYW1lID0gJHNjb3BlLnVzZXIudXNlcm5hbWU7XG4gICAgICAgIG1lc3NhZ2UudXNlcklkID0gJHNjb3BlLnVzZXIuX2lkO1xuICAgICAgICBtZXNzYWdlLnBpYyA9ICRzY29wZS51c2VyLnBpY3R1cmU7XG5cbiAgICAgICAgJHNjb3BlLm1lc3NhZ2VzLnB1c2gobWVzc2FnZSk7XG5cbiAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBrZWVwS2V5Ym9hcmRPcGVuKCk7XG4gICAgICAgICAgICBzZWxmLnZpZXdTY3JvbGwuc2Nyb2xsQm90dG9tKHRydWUpO1xuICAgICAgICB9LCAwKTtcblxuICAgICAgICAvLyAkdGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gICAgICRzY29wZS5tZXNzYWdlcy5wdXNoKE1vY2tTZXJ2aWNlLmdldE1vY2tNZXNzYWdlKCkpO1xuICAgICAgICAvLyAgICAga2VlcEtleWJvYXJkT3BlbigpO1xuICAgICAgICAvLyAgICAgc2VsZi52aWV3U2Nyb2xsLnNjcm9sbEJvdHRvbSh0cnVlKTtcbiAgICAgICAgLy8gfSwgMjAwMCk7XG5cbiAgICB9O1xuXG5cblxuXG5cblxuXG5cblxuXG4gICAgLypcbiAgICBhbmd1bGFyXG4gICAgICAgICAgICAubW9kdWxlKCdhcHAubWVzc2FnZXMnKVxuICAgIFxuICAgICAgICAgICAgLmNvbnRyb2xsZXIoJ21lc3NhZ2VzQ29udHJvbGxlcicsIFsnJHNjb3BlJywgJyRyb290U2NvcGUnLCAnJHN0YXRlJyxcbiAgICAgICAgICAgICAgICAnJHN0YXRlUGFyYW1zJywgJyRpb25pY0FjdGlvblNoZWV0JyxcbiAgICAgICAgICAgICAgICAnJGlvbmljUG9wdXAnLCAnJGlvbmljU2Nyb2xsRGVsZWdhdGUnLCAnJHRpbWVvdXQnLCAnJGludGVydmFsJyxcbiAgICAgICAgICAgICAgICAnY2hhbm5lbHNTZXJ2aWNlJywgJ2F1dGhTZXJ2aWNlJyxcbiAgICAgICAgICAgICAgICBtZXNzYWdlc0NvbnRyb2xsZXJcbiAgICAgICAgICAgIF0pO1xuICAgICAgICBcdFxuICAgICAgICBmdW5jdGlvbiBtZXNzYWdlc0NvbnRyb2xsZXIoJHNjb3BlLCAkcm9vdFNjb3BlLCAkc3RhdGUsICRzdGF0ZVBhcmFtcywgJGlvbmljQWN0aW9uU2hlZXQsXG4gICAgICAgICAgICAkaW9uaWNQb3B1cCwgJGlvbmljU2Nyb2xsRGVsZWdhdGUsICR0aW1lb3V0LCAkaW50ZXJ2YWwsIGNoYW5uZWxzU2VydmljZSwgYXV0aFNlcnZpY2UpIHtcbiAgICBcbiAgICAgICAgICAgICRzY29wZS5jaGFubmVsSWQgPSAkc3RhdGUucGFyYW1zLmNoYW5uZWxJZDtcbiAgICAgICAgICAgICRzY29wZS5jaGFubmVsTmFtZSA9IGNoYW5uZWxzU2VydmljZS5jaGFubmVsc1skc2NvcGUuY2hhbm5lbElkXTtcbiAgICAgICAgICAgICRzY29wZS51c2VyID0gYXV0aFNlcnZpY2UudXNlcigpO1xuICAgIFxuICAgICAgICAgICAgaWYgKCEkc2NvcGUudXNlcikge1xuICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnbG9naW4nKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAkc2NvcGUudXNlciA9IHtcbiAgICAgICAgICAgICAgICBfaWQ6ICRzY29wZS51c2VyLnVpZCxcbiAgICAgICAgICAgICAgICBwaWM6ICdodHRwOi8vaW9uaWNmcmFtZXdvcmsuY29tL2ltZy9kb2NzL21jZmx5LmpwZycsXG4gICAgICAgICAgICAgICAgdXNlcm5hbWU6ICRzY29wZS51c2VyICYmICRzY29wZS51c2VyLmRpc3BsYXlOYW1lID8gJHNjb3BlLnVzZXIuZGlzcGxheU5hbWUgPyAnQW5vbnltb3VzJztcbiAgICAgICAgICAgIH07XG4gICAgXG4gICAgICAgICAgICAvLyBtb2NrIGFjcXVpcmluZyBkYXRhIHZpYSAkc3RhdGVQYXJhbXNcbiAgICAgICAgICAgICRzY29wZS50b1VzZXIgPSBudWxsO1xuICAgICAgICAgICAgaWYgKCRzY29wZS5jaGFubmVsSWQgPT0gXCJsYW5kbG9yZFwiKSB7XG4gICAgICAgICAgICAgICAgJFxuICAgICAgICAgICAgICAgICRzY29wZS50b1VzZXIgPSB7XG4gICAgICAgICAgICAgICAgICAgIF9pZDogJzUzNGI4ZTVhYWE1ZTdhZmMxYjIzZTY5YicsXG4gICAgICAgICAgICAgICAgICAgIHBpYzogJ2h0dHA6Ly9pb25pY2ZyYW1ld29yay5jb20vaW1nL2RvY3MvdmVua21hbi5qcGcnLFxuICAgICAgICAgICAgICAgICAgICBjaGFubmVsOiAkc2NvcGUuY2hhbm5lbElkXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgJHNjb3BlLmlucHV0ID0ge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGxvY2FsU3RvcmFnZVsndXNlck1lc3NhZ2UtJyArICRzY29wZS50b1VzZXIuX2lkXSB8fCAnJ1xuICAgICAgICAgICAgfTtcbiAgICBcbiAgICAgICAgICAgIHZhciBtZXNzYWdlQ2hlY2tUaW1lcjtcbiAgICBcbiAgICAgICAgICAgIHZhciB2aWV3U2Nyb2xsID0gJGlvbmljU2Nyb2xsRGVsZWdhdGUuJGdldEJ5SGFuZGxlKCd1c2VyTWVzc2FnZVNjcm9sbCcpO1xuICAgICAgICAgICAgdmFyIGZvb3RlckJhcjsgLy8gZ2V0cyBzZXQgaW4gJGlvbmljVmlldy5lbnRlclxuICAgICAgICAgICAgdmFyIHNjcm9sbGVyO1xuICAgICAgICAgICAgdmFyIHR4dElucHV0OyAvLyBeXl5cbiAgICBcbiAgICAgICAgICAgICRzY29wZS4kb24oJyRpb25pY1ZpZXcuZW50ZXInLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnVXNlck1lc3NhZ2VzICRpb25pY1ZpZXcuZW50ZXInKTtcbiAgICBcbiAgICAgICAgICAgICAgICBnZXRNZXNzYWdlcygpO1xuICAgIFxuICAgICAgICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBmb290ZXJCYXIgPSBkb2N1bWVudC5ib2R5LnF1ZXJ5U2VsZWN0b3IoJyN1c2VyTWVzc2FnZXNWaWV3IC5iYXItZm9vdGVyJyk7XG4gICAgICAgICAgICAgICAgICAgIHNjcm9sbGVyID0gZG9jdW1lbnQuYm9keS5xdWVyeVNlbGVjdG9yKCcjdXNlck1lc3NhZ2VzVmlldyAuc2Nyb2xsLWNvbnRlbnQnKTtcbiAgICAgICAgICAgICAgICAgICAgdHh0SW5wdXQgPSBhbmd1bGFyLmVsZW1lbnQoZm9vdGVyQmFyLnF1ZXJ5U2VsZWN0b3IoJ3RleHRhcmVhJykpO1xuICAgICAgICAgICAgICAgIH0sIDApO1xuICAgIFxuICAgICAgICAgICAgICAgIG1lc3NhZ2VDaGVja1RpbWVyID0gJGludGVydmFsKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBoZXJlIHlvdSBjb3VsZCBjaGVjayBmb3IgbmV3IG1lc3NhZ2VzIGlmIHlvdXIgYXBwIGRvZXNuJ3QgdXNlIHB1c2ggbm90aWZpY2F0aW9ucyBvciB1c2VyIGRpc2FibGVkIHRoZW1cbiAgICAgICAgICAgICAgICB9LCAyMDAwMCk7XG4gICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgICAgICRzY29wZS4kb24oJyRpb25pY1ZpZXcubGVhdmUnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnbGVhdmluZyBVc2VyTWVzc2FnZXMgdmlldywgZGVzdHJveWluZyBpbnRlcnZhbCcpO1xuICAgICAgICAgICAgICAgIC8vIE1ha2Ugc3VyZSB0aGF0IHRoZSBpbnRlcnZhbCBpcyBkZXN0cm95ZWRcbiAgICAgICAgICAgICAgICBpZiAoYW5ndWxhci5pc0RlZmluZWQobWVzc2FnZUNoZWNrVGltZXIpKSB7XG4gICAgICAgICAgICAgICAgICAgICRpbnRlcnZhbC5jYW5jZWwobWVzc2FnZUNoZWNrVGltZXIpO1xuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlQ2hlY2tUaW1lciA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgICAgICRzY29wZS4kb24oJyRpb25pY1ZpZXcuYmVmb3JlTGVhdmUnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBpZiAoISRzY29wZS5pbnB1dC5tZXNzYWdlIHx8ICRzY29wZS5pbnB1dC5tZXNzYWdlID09PSAnJykge1xuICAgICAgICAgICAgICAgICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgndXNlck1lc3NhZ2UtJyArICRzY29wZS50b1VzZXIuX2lkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgICAgIGZ1bmN0aW9uIGdldE1lc3NhZ2VzKCkge1xuICAgICAgICAgICAgICAgICRzY29wZS5tZXNzYWdlcyA9IFt7XG4gICAgICAgICAgICAgICAgICAgIFwiX2lkXCI6IFwiNTM1ZDYyNWY4OThkZjRlODBlMmExMjVlXCIsXG4gICAgICAgICAgICAgICAgICAgIFwidGV4dFwiOiBcIklvbmljIGhhcyBjaGFuZ2VkIHRoZSBnYW1lIGZvciBoeWJyaWQgYXBwIGRldmVsb3BtZW50LlwiLFxuICAgICAgICAgICAgICAgICAgICBcInVzZXJJZFwiOiBcIjUzNGI4ZmIyYWE1ZTdhZmMxYjIzZTY5Y1wiLFxuICAgICAgICAgICAgICAgICAgICBcImRhdGVcIjogXCIyMDE0LTA0LTI3VDIwOjAyOjM5LjA4MlpcIixcbiAgICAgICAgICAgICAgICAgICAgXCJyZWFkXCI6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIFwicmVhZERhdGVcIjogXCIyMDE0LTEyLTAxVDA2OjI3OjM3Ljk0NFpcIlxuICAgICAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiX2lkXCI6IFwiNTM1ZjEzZmZlZTNiMmE2ODExMmI5ZmMwXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcInRleHRcIjogXCJJIGxpa2UgSW9uaWMgYmV0dGVyIHRoYW4gaWNlIGNyZWFtIVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJ1c2VySWRcIjogXCI1MzRiOGU1YWFhNWU3YWZjMWIyM2U2OWJcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiZGF0ZVwiOiBcIjIwMTQtMDQtMjlUMDI6NTI6NDcuNzA2WlwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJyZWFkXCI6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBcInJlYWREYXRlXCI6IFwiMjAxNC0xMi0wMVQwNjoyNzozNy45NDRaXCJcbiAgICAgICAgICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJfaWRcIjogXCI1NDZhNTg0M2ZkNGM1ZDU4MWVmYTI2M2FcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwidGV4dFwiOiBcIkxvcmVtIGlwc3VtIGRvbG9yIHNpdCBhbWV0LCBjb25zZWN0ZXR1ciBhZGlwaXNjaW5nIGVsaXQsIHNlZCBkbyBlaXVzbW9kIHRlbXBvciBpbmNpZGlkdW50IHV0IGxhYm9yZSBldCBkb2xvcmUgbWFnbmEgYWxpcXVhLiBVdCBlbmltIGFkIG1pbmltIHZlbmlhbSwgcXVpcyBub3N0cnVkIGV4ZXJjaXRhdGlvbiB1bGxhbWNvIGxhYm9yaXMgbmlzaSB1dCBhbGlxdWlwIGV4IGVhIGNvbW1vZG8gY29uc2VxdWF0LiBEdWlzIGF1dGUgaXJ1cmUgZG9sb3IgaW4gcmVwcmVoZW5kZXJpdCBpbiB2b2x1cHRhdGUgdmVsaXQgZXNzZSBjaWxsdW0gZG9sb3JlIGV1IGZ1Z2lhdCBudWxsYSBwYXJpYXR1ci4gRXhjZXB0ZXVyIHNpbnQgb2NjYWVjYXQgY3VwaWRhdGF0IG5vbiBwcm9pZGVudCwgc3VudCBpbiBjdWxwYSBxdWkgb2ZmaWNpYSBkZXNlcnVudCBtb2xsaXQgYW5pbSBpZCBlc3QgbGFib3J1bS5cIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwidXNlcklkXCI6IFwiNTM0YjhmYjJhYTVlN2FmYzFiMjNlNjljXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcImRhdGVcIjogXCIyMDE0LTExLTE3VDIwOjE5OjE1LjI4OVpcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwicmVhZFwiOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJyZWFkRGF0ZVwiOiBcIjIwMTQtMTItMDFUMDY6Mjc6MzguMzI4WlwiXG4gICAgICAgICAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiX2lkXCI6IFwiNTQ3NjQzOTlhYjQzZDFkNDExM2FiZmQxXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcInRleHRcIjogXCJBbSBJIGRyZWFtaW5nP1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJ1c2VySWRcIjogXCI1MzRiOGU1YWFhNWU3YWZjMWIyM2U2OWJcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiZGF0ZVwiOiBcIjIwMTQtMTEtMjZUMjE6MTg6MTcuNTkxWlwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJyZWFkXCI6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBcInJlYWREYXRlXCI6IFwiMjAxNC0xMi0wMVQwNjoyNzozOC4zMzdaXCJcbiAgICAgICAgICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJfaWRcIjogXCI1NDc2NDNhZWFiNDNkMWQ0MTEzYWJmZDJcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwidGV4dFwiOiBcIklzIHRoaXMgbWFnaWM/XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcInVzZXJJZFwiOiBcIjUzNGI4ZmIyYWE1ZTdhZmMxYjIzZTY5Y1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJkYXRlXCI6IFwiMjAxNC0xMS0yNlQyMToxODozOC41NDlaXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcInJlYWRcIjogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIFwicmVhZERhdGVcIjogXCIyMDE0LTEyLTAxVDA2OjI3OjM4LjMzOFpcIlxuICAgICAgICAgICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBcIl9pZFwiOiBcIjU0NzgxNWRiYWI0M2QxZDQxMTNhYmZlZlwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJ0ZXh0XCI6IFwiR2VlIHdpeiwgdGhpcyBpcyBzb21ldGhpbmcgc3BlY2lhbC5cIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwidXNlcklkXCI6IFwiNTM0YjhlNWFhYTVlN2FmYzFiMjNlNjliXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcImRhdGVcIjogXCIyMDE0LTExLTI4VDA2OjI3OjQwLjAwMVpcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwicmVhZFwiOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJyZWFkRGF0ZVwiOiBcIjIwMTQtMTItMDFUMDY6Mjc6MzguMzM4WlwiXG4gICAgICAgICAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiX2lkXCI6IFwiNTQ3ODFjNjlhYjQzZDFkNDExM2FiZmYwXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcInRleHRcIjogXCJJIHRoaW5rIEkgbGlrZSBJb25pYyBtb3JlIHRoYW4gSSBsaWtlIGljZSBjcmVhbSFcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwidXNlcklkXCI6IFwiNTM0YjhmYjJhYTVlN2FmYzFiMjNlNjljXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcImRhdGVcIjogXCIyMDE0LTExLTI4VDA2OjU1OjM3LjM1MFpcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwicmVhZFwiOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJyZWFkRGF0ZVwiOiBcIjIwMTQtMTItMDFUMDY6Mjc6MzguMzM4WlwiXG4gICAgICAgICAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiX2lkXCI6IFwiNTQ3ODFjYTRhYjQzZDFkNDExM2FiZmYxXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcInRleHRcIjogXCJZZWEsIGl0J3MgcHJldHR5IHN3ZWV0XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcInVzZXJJZFwiOiBcIjUzNGI4ZTVhYWE1ZTdhZmMxYjIzZTY5YlwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJkYXRlXCI6IFwiMjAxNC0xMS0yOFQwNjo1NjozNi40NzJaXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcInJlYWRcIjogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIFwicmVhZERhdGVcIjogXCIyMDE0LTEyLTAxVDA2OjI3OjM4LjMzOFpcIlxuICAgICAgICAgICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBcIl9pZFwiOiBcIjU0NzhkZjg2YWI0M2QxZDQxMTNhYmZmNFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJ0ZXh0XCI6IFwiV293LCB0aGlzIGlzIHJlYWxseSBzb21ldGhpbmcgaHVoP1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJ1c2VySWRcIjogXCI1MzRiOGZiMmFhNWU3YWZjMWIyM2U2OWNcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiZGF0ZVwiOiBcIjIwMTQtMTEtMjhUMjA6NDg6MDYuNTcyWlwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJyZWFkXCI6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBcInJlYWREYXRlXCI6IFwiMjAxNC0xMi0wMVQwNjoyNzozOC4zMzlaXCJcbiAgICAgICAgICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJfaWRcIjogXCI1NDc4MWNhNGFiNDNkMWQ0MTEzYWJmZjFcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwidGV4dFwiOiBcIkNyZWF0ZSBhbWF6aW5nIGFwcHMgLSBpb25pY2ZyYW1ld29yay5jb21cIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwidXNlcklkXCI6IFwiNTM0YjhlNWFhYTVlN2FmYzFiMjNlNjliXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcImRhdGVcIjogXCIyMDE0LTExLTI5VDA2OjU2OjM2LjQ3MlpcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwicmVhZFwiOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJyZWFkRGF0ZVwiOiBcIjIwMTQtMTItMDFUMDY6Mjc6MzguMzM4WlwiXG4gICAgICAgICAgICAgICAgICAgIH1dO1xuICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgJHNjb3BlLiR3YXRjaCgnaW5wdXQubWVzc2FnZScsIGZ1bmN0aW9uKG5ld1ZhbHVlLCBvbGRWYWx1ZSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdpbnB1dC5tZXNzYWdlICR3YXRjaCwgbmV3VmFsdWUgJyArIG5ld1ZhbHVlKTtcbiAgICAgICAgICAgICAgICBpZiAoIW5ld1ZhbHVlKSBuZXdWYWx1ZSA9ICcnO1xuICAgICAgICAgICAgICAgIGxvY2FsU3RvcmFnZVsndXNlck1lc3NhZ2UtJyArICRzY29wZS50b1VzZXIuX2lkXSA9IG5ld1ZhbHVlO1xuICAgICAgICAgICAgfSk7XG4gICAgXG4gICAgICAgICAgICAkc2NvcGUuc2VuZE1lc3NhZ2UgPSBmdW5jdGlvbihzZW5kTWVzc2FnZUZvcm0pIHtcbiAgICAgICAgICAgICAgICB2YXIgbWVzc2FnZSA9IHtcbiAgICAgICAgICAgICAgICAgICAgdG9JZDogJHNjb3BlLnRvVXNlci5faWQsXG4gICAgICAgICAgICAgICAgICAgIHRleHQ6ICRzY29wZS5pbnB1dC5tZXNzYWdlXG4gICAgICAgICAgICAgICAgfTtcbiAgICBcbiAgICAgICAgICAgICAgICAvLyBpZiB5b3UgZG8gYSB3ZWIgc2VydmljZSBjYWxsIHRoaXMgd2lsbCBiZSBuZWVkZWQgYXMgd2VsbCBhcyBiZWZvcmUgdGhlIHZpZXdTY3JvbGwgY2FsbHNcbiAgICAgICAgICAgICAgICAvLyB5b3UgY2FuJ3Qgc2VlIHRoZSBlZmZlY3Qgb2YgdGhpcyBpbiB0aGUgYnJvd3NlciBpdCBuZWVkcyB0byBiZSB1c2VkIG9uIGEgcmVhbCBkZXZpY2VcbiAgICAgICAgICAgICAgICAvLyBmb3Igc29tZSByZWFzb24gdGhlIG9uZSB0aW1lIGJsdXIgZXZlbnQgaXMgbm90IGZpcmluZyBpbiB0aGUgYnJvd3NlciBidXQgZG9lcyBvbiBkZXZpY2VzXG4gICAgICAgICAgICAgICAga2VlcEtleWJvYXJkT3BlbigpO1xuICAgIFxuICAgICAgICAgICAgICAgIC8vTW9ja1NlcnZpY2Uuc2VuZE1lc3NhZ2UobWVzc2FnZSkudGhlbihmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLmlucHV0Lm1lc3NhZ2UgPSAnJztcbiAgICBcbiAgICAgICAgICAgICAgICBtZXNzYWdlLl9pZCA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpOyAvLyA6filcbiAgICAgICAgICAgICAgICBtZXNzYWdlLmRhdGUgPSBuZXcgRGF0ZSgpO1xuICAgICAgICAgICAgICAgIG1lc3NhZ2UudXNlcm5hbWUgPSAkc2NvcGUudXNlci51c2VybmFtZTtcbiAgICAgICAgICAgICAgICBtZXNzYWdlLnVzZXJJZCA9ICRzY29wZS51c2VyLl9pZDtcbiAgICAgICAgICAgICAgICBtZXNzYWdlLnBpYyA9ICRzY29wZS51c2VyLnBpY3R1cmU7XG4gICAgXG4gICAgICAgICAgICAgICAgJHNjb3BlLm1lc3NhZ2VzLnB1c2gobWVzc2FnZSk7XG4gICAgXG4gICAgICAgICAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIGtlZXBLZXlib2FyZE9wZW4oKTtcbiAgICAgICAgICAgICAgICAgICAgdmlld1Njcm9sbC5zY3JvbGxCb3R0b20odHJ1ZSk7XG4gICAgICAgICAgICAgICAgfSwgMCk7XG4gICAgXG4gICAgICAgICAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5tZXNzYWdlcy5wdXNoKE1vY2tTZXJ2aWNlLmdldE1vY2tNZXNzYWdlKCkpO1xuICAgICAgICAgICAgICAgICAgICBrZWVwS2V5Ym9hcmRPcGVuKCk7XG4gICAgICAgICAgICAgICAgICAgIHZpZXdTY3JvbGwuc2Nyb2xsQm90dG9tKHRydWUpO1xuICAgICAgICAgICAgICAgIH0sIDIwMDApO1xuICAgIFxuICAgICAgICAgICAgICAgIC8vfSk7XG4gICAgICAgICAgICB9O1xuICAgIFxuICAgICAgICAgICAgLy8gdGhpcyBrZWVwcyB0aGUga2V5Ym9hcmQgb3BlbiBvbiBhIGRldmljZSBvbmx5IGFmdGVyIHNlbmRpbmcgYSBtZXNzYWdlLCBpdCBpcyBub24gb2J0cnVzaXZlXG4gICAgICAgICAgICBmdW5jdGlvbiBrZWVwS2V5Ym9hcmRPcGVuKCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdrZWVwS2V5Ym9hcmRPcGVuJyk7XG4gICAgICAgICAgICAgICAgdHh0SW5wdXQub25lKCdibHVyJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCd0ZXh0YXJlYSBibHVyLCBmb2N1cyBiYWNrIG9uIGl0Jyk7XG4gICAgICAgICAgICAgICAgICAgIHR4dElucHV0WzBdLmZvY3VzKCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICBmdW5jdGlvbiBvblByb2ZpbGVQaWNFcnJvcihlbGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmVsZS5zcmMgPSAnJzsgLy8gc2V0IGEgZmFsbGJhY2tcbiAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICRzY29wZS5vbk1lc3NhZ2VIb2xkID0gZnVuY3Rpb24oZSwgaXRlbUluZGV4LCBtZXNzYWdlKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ29uTWVzc2FnZUhvbGQnKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnbWVzc2FnZTogJyArIEpTT04uc3RyaW5naWZ5KG1lc3NhZ2UsIG51bGwsIDIpKTtcbiAgICAgICAgICAgICAgICAkaW9uaWNBY3Rpb25TaGVldC5zaG93KHtcbiAgICAgICAgICAgICAgICAgICAgYnV0dG9uczogW3tcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6ICdDb3B5IFRleHQnXG4gICAgICAgICAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiAnRGVsZXRlIE1lc3NhZ2UnXG4gICAgICAgICAgICAgICAgICAgICAgICB9XSxcbiAgICAgICAgICAgICAgICAgICAgYnV0dG9uQ2xpY2tlZDogZnVuY3Rpb24oaW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN3aXRjaCAoaW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIDA6IC8vIENvcHkgVGV4dFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL2NvcmRvdmEucGx1Z2lucy5jbGlwYm9hcmQuY29weShtZXNzYWdlLnRleHQpO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIDE6IC8vIERlbGV0ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBubyBzZXJ2ZXIgc2lkZSBzZWNyZXRzIGhlcmUgOn4pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5tZXNzYWdlcy5zcGxpY2UoaXRlbUluZGV4LCAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2aWV3U2Nyb2xsLnJlc2l6ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCAwKTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfTtcbiAgICBcbiAgICAgICAgICAgIC8vIHRoaXMgcHJvYiBzZWVtcyB3ZWlyZCBoZXJlIGJ1dCBJIGhhdmUgcmVhc29ucyBmb3IgdGhpcyBpbiBteSBhcHAsIHNlY3JldCFcbiAgICAgICAgICAgICRzY29wZS52aWV3UHJvZmlsZSA9IGZ1bmN0aW9uKG1zZykge1xuICAgICAgICAgICAgICAgIGlmIChtc2cudXNlcklkID09PSAkc2NvcGUudXNlci5faWQpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gZ28gdG8geW91ciBwcm9maWxlXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gZ28gdG8gb3RoZXIgdXNlcnMgcHJvZmlsZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgXG4gICAgICAgICAgICAvLyBJIGVtaXQgdGhpcyBldmVudCBmcm9tIHRoZSBtb25vc3BhY2VkLmVsYXN0aWMgZGlyZWN0aXZlLCByZWFkIGxpbmUgNDgwXG4gICAgICAgICAgICAkc2NvcGUuJG9uKCd0YVJlc2l6ZScsIGZ1bmN0aW9uKGUsIHRhKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ3RhUmVzaXplJyk7XG4gICAgICAgICAgICAgICAgaWYgKCF0YSkgcmV0dXJuO1xuICAgIFxuICAgICAgICAgICAgICAgIHZhciB0YUhlaWdodCA9IHRhWzBdLm9mZnNldEhlaWdodDtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygndGFIZWlnaHQ6ICcgKyB0YUhlaWdodCk7XG4gICAgXG4gICAgICAgICAgICAgICAgaWYgKCFmb290ZXJCYXIpIHJldHVybjtcbiAgICBcbiAgICAgICAgICAgICAgICB2YXIgbmV3Rm9vdGVySGVpZ2h0ID0gdGFIZWlnaHQgKyAxMDtcbiAgICAgICAgICAgICAgICBuZXdGb290ZXJIZWlnaHQgPSAobmV3Rm9vdGVySGVpZ2h0ID4gNDQpID8gbmV3Rm9vdGVySGVpZ2h0IDogNDQ7XG4gICAgXG4gICAgICAgICAgICAgICAgZm9vdGVyQmFyLnN0eWxlLmhlaWdodCA9IG5ld0Zvb3RlckhlaWdodCArICdweCc7XG4gICAgICAgICAgICAgICAgc2Nyb2xsZXIuc3R5bGUuYm90dG9tID0gbmV3Rm9vdGVySGVpZ2h0ICsgJ3B4JztcbiAgICAgICAgICAgIH0pO1xuICAgIFxuICAgICAgICB9XG4gICAgICAgICovXG59KSgpO1xuXG5cblxuXG4iLCIoZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGFuZ3VsYXJcbiAgICAgICAgLm1vZHVsZSgnYXBwLm1lc3NhZ2VzJylcblxuICAgICAgICAuZmlsdGVyKCdubDJicicsIFsnJGZpbHRlcicsIG5sMmJyXSlcblxuICAgIGZ1bmN0aW9uIG5sMmJyKCRmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICAgICBpZiAoIWRhdGEpIHJldHVybiBkYXRhO1xuICAgICAgICAgICAgcmV0dXJuIGRhdGEucmVwbGFjZSgvXFxuXFxyPy9nLCAnPGJyIC8+Jyk7XG4gICAgICAgIH07XG4gICAgfVxufSkoKTsiLCIoZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGFuZ3VsYXJcbiAgICAgICAgLm1vZHVsZSgnYXBwLm1lc3NhZ2VzJylcbiAgICAgICAgLnNlcnZpY2UoJ21lc3NhZ2VzU2VydmljZScsIG1lc3NhZ2VzU2VydmljZSk7XG5cbiAgICBmdW5jdGlvbiBtZXNzYWdlc1NlcnZpY2UoZmlyZWJhc2VTZXJ2aWNlKSB7XG4gICAgICAgIHZhciBzZXJ2aWNlID0ge307XG5cdFx0XG4gICAgICAgIHNlcnZpY2UuZ2V0TWVzc2FnZXNSZWYgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gZmlyZWJhc2VTZXJ2aWNlLmZiLmRhdGFiYXNlKCkucmVmKCdtZXNzYWdlcycpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHNlcnZpY2UuYWRkTWVzc2FnZSA9IGZ1bmN0aW9uIChtZXNzYWdlKSB7XG4gICAgICAgICAgICByZXR1cm4gZmlyZWJhc2VTZXJ2aWNlLmZiLmRhdGFiYXNlKCkucHVzaChtZXNzYWdlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBzZXJ2aWNlO1xuICAgIH1cbn0pKCk7XG4iLCIoZnVuY3Rpb24oKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgYW5ndWxhci5tb2R1bGUoXCJhcHAucHJvZmlsZXNcIilcblxuICAgICAgICAuY29udHJvbGxlcihcInByb2ZpbGVDb250cm9sbGVyXCIsIHByb2ZpbGVDb250cm9sbGVyKTtcblxuXG4gICAgZnVuY3Rpb24gcHJvZmlsZUNvbnRyb2xsZXIoJHNjb3BlLCAkaW9uaWNMb2FkaW5nLCAkaW9uaWNQb3B1cCwgYXV0aFNlcnZpY2UsIHByb2ZpbGVzU2VydmljZSkge1xuXG5cdFx0dmFyIHVzZXIgPSBhdXRoU2VydmljZS51c2VyKCk7XG5cdFx0XG5cdFx0JHNjb3BlLmRhdGEgPSB7XG5cdFx0XHRkaXNwbGF5TmFtZSA6IHVzZXIgPyB1c2VyLmRpc3BsYXlOYW1lIDogXCJcIixcblx0XHRcdGVtYWlsIDogdXNlciA/IHVzZXIuZW1haWwgOiBcIlwiXG5cdFx0fTtcblxuICAgICAgICAkc2NvcGUudXBkYXRlID0gZnVuY3Rpb24oKSB7XG5cdFx0XHQkaW9uaWNMb2FkaW5nLnNob3coKTtcblxuICAgICAgICAgICAgcHJvZmlsZXNTZXJ2aWNlLnVwZGF0ZVByb2ZpbGUoJHNjb3BlLmRhdGEpLnRoZW4oZnVuY3Rpb24gc3VjY2Vzcyhtc2cpIHtcblx0XHRcdFx0JGlvbmljTG9hZGluZy5oaWRlKCk7XG5cblx0XHRcdFx0JGlvbmljUG9wdXAuYWxlcnQoe1xuICAgICAgICAgICAgICAgICAgICB0aXRsZTogJ1Byb2ZpbGVVcGRhdGUhJyxcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGU6IG1zZ1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICB9LCBmdW5jdGlvbiBlcnJvcihlcnJvcikge1xuXHRcdFx0XHQkaW9uaWNMb2FkaW5nLmhpZGUoKTtcblxuXHRcdFx0XHQkaW9uaWNQb3B1cC5hbGVydCh7XG4gICAgICAgICAgICAgICAgICAgIHRpdGxlOiAnVXBkYXRlIGZhaWxlZCEnLFxuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZTogZXJyb3IubWVzc2FnZVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG59KSgpOyIsIihmdW5jdGlvbigpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBhbmd1bGFyLm1vZHVsZShcImFwcC5wcm9maWxlc1wiKVxuXG4gICAgICAgIC5zZXJ2aWNlKFwicHJvZmlsZXNTZXJ2aWNlXCIsIHByb2ZpbGVzU2VydmljZSk7XG5cblxuICAgIGZ1bmN0aW9uIHByb2ZpbGVzU2VydmljZSgkcSwgJHJvb3RTY29wZSwgYXV0aFNlcnZpY2UpIHtcblx0XHRcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHVwZGF0ZVByb2ZpbGU6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuXG4gICAgICAgICAgICAgICAgYXV0aFNlcnZpY2UudXNlcigpLnVwZGF0ZVByb2ZpbGUoZGF0YSlcbiAgICAgICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gc3VjY2VzcygpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUoXCJQcm9maWxlIHVwZGF0ZWQhXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KCd1c2VyLWNoYW5nZWQnKTtcbiAgICAgICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gZXJyb3IoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlamVjdChlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9XG4gICAgfVxufSkoKTsiLCIoZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGFuZ3VsYXIubW9kdWxlKFwiYXBwLnNpZGVtZW51XCIpXG5cbiAgICAgICAgLmNvbnRyb2xsZXIoXCJzaWRlbWVudUNvbnRyb2xsZXJcIiwgc2lkZW1lbnVDb250cm9sbGVyKTtcblxuXG4gICAgZnVuY3Rpb24gc2lkZW1lbnVDb250cm9sbGVyKCRzY29wZSwgJHN0YXRlLCBjaGFubmVsc1NlcnZpY2UsIGF1dGhTZXJ2aWNlKSB7XG4gICAgICAgICRzY29wZS51c2VyID0gYXV0aFNlcnZpY2UudXNlcigpO1xuICAgICAgICAkc2NvcGUuY2hhbm5lbHMgPSBjaGFubmVsc1NlcnZpY2UuY2hhbm5lbHM7XG4gICAgICAgICRzY29wZS5idWlsZGluZyA9IHtcbiAgICAgICAgICAgIG5hbWU6IFwiU2VsZWN0IGEgYnVpbGRpbmdcIixcbiAgICAgICAgICAgIGFkZHJlc3M6IFwiXCIsXG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLiRvbignYnVpbGRpbmctc2VsZWN0ZWQnLCBmdW5jdGlvbiAoZXZlbnQsIGRhdGEpIHtcbiAgICAgICAgICAgICRzY29wZS5idWlsZGluZy5uYW1lID0gZGF0YS5uYW1lO1xuICAgICAgICAgICAgJHNjb3BlLmJ1aWxkaW5nLmFkZHJlc3MgPSBkYXRhLmFkZHJlc3M7XG5cbiAgICAgICAgfSk7XG5cbiAgICAgICAgJHNjb3BlLm9wZW5DaGFubmVsID0gZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgJHN0YXRlLmdvKCdhcHAuY2hhbm5lbCcsIHtjaGFubmVsSWQ6IGtleX0pO1xuICAgICAgICB9O1xuICAgIH1cbn0pKCk7XG4iLCIoZnVuY3Rpb24oKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgYW5ndWxhci5tb2R1bGUoXCJhcHAudXNlcnNcIilcblxuICAgICAgICAuc2VydmljZShcInVzZXJzU2VydmljZVwiLCB1c2Vyc1NlcnZpY2UpO1xuXG5cbiAgICBmdW5jdGlvbiB1c2Vyc1NlcnZpY2UoJHEsIGF1dGhTZXJ2aWNlKSB7XG5cdCAgICByZXR1cm4ge1xuICAgICAgICAgICAgdXBkYXRlUHJvZmlsZTogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG5cbiAgICAgICAgICAgICAgICBhdXRoU2VydmljZS51c2VyKCkudXBkYXRlUHJvZmlsZShkYXRhKVxuICAgICAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbiBzdWNjZXNzKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShcIlByb2ZpbGUgdXBkYXRlZCFcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICB1c2VyID0gZmlyZWJhc2UuYXV0aCgpLmN1cnJlbnRVc2VyO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KCd1c2VyLWNoYW5nZWQnKTtcbiAgICAgICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gZXJyb3IoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlamVjdChlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9XG4gICAgfVxufSkoKTsiLCIoZnVuY3Rpb24oKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgYW5ndWxhclxuXG4gICAgICAgIC5tb2R1bGUoJ2FwcCcsIFtcbiAgICAgICAgICAgICdpb25pYycsXG4gICAgICAgICAgICAnbW9ub3NwYWNlZC5lbGFzdGljJyxcblxuICAgICAgICAgICAgJ2FwcC5maXJlYmFzZScsXG4gICAgICAgICAgICAnYXBwLmZpcmViYXNlJyxcbiAgICAgICAgICAgICdhcHAuYXV0aCcsXG4gICAgICAgICAgICAnYXBwLmNoYW5uZWxzJyxcbiAgICAgICAgICAgICdhcHAuc2lkZW1lbnUnLFxuICAgICAgICAgICAgJ2FwcC5idWlsZGluZ3MnLFxuICAgICAgICAgICAgJ2FwcC5wcm9maWxlcycsXG4gICAgICAgICAgICAnYXBwLm1lc3NhZ2VzJyxcbiAgICAgICAgICAgICdhcHAuZGlyZWN0bWVzc2FnZXMnXG4gICAgICAgIF0pXG5cbiAgICAgICAgLnJ1bihmdW5jdGlvbigkaW9uaWNQbGF0Zm9ybSwgJHRpbWVvdXQsICRyb290U2NvcGUpIHtcbiAgICAgICAgICAgICRpb25pY1BsYXRmb3JtLnJlYWR5KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGlmICh3aW5kb3cuY29yZG92YSAmJiB3aW5kb3cuY29yZG92YS5wbHVnaW5zLktleWJvYXJkKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvcmRvdmEucGx1Z2lucy5LZXlib2FyZC5oaWRlS2V5Ym9hcmRBY2Nlc3NvcnlCYXIodHJ1ZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgY29yZG92YS5wbHVnaW5zLktleWJvYXJkLmRpc2FibGVTY3JvbGwodHJ1ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh3aW5kb3cuU3RhdHVzQmFyKSB7XG4gICAgICAgICAgICAgICAgICAgIFN0YXR1c0Jhci5zdHlsZURlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICB9XG5cdFx0XHRcdC8vdG8gZ2V0IHVzZXIgaW5mb1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGVtaXQoJ3VzZXItY2hhbmdlZCcpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xufSkoKTtcblxuXG4iLCIoZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGFuZ3VsYXJcbiAgICAgICAgLm1vZHVsZSgnYXBwJylcbiAgICAgICAgLnNlcnZpY2UoJ2dsb2JhbHNTZXJ2aWNlJywgZ2xvYmFsc1NlcnZpY2UpO1xuXG4gICAgZnVuY3Rpb24gZ2xvYmFsc1NlcnZpY2UoKSB7XG4gICAgICAgIHZhciBzZXJ2aWNlID0ge1xuXHRcdFx0dXNlciA6IG51bGwsIC8vbG9nZ2VkIHVzZXJcblx0XHRcdGJ1aWxkaW5nIDogbnVsbCAvL3NlbGVjdGVkIGJ1aWxkaW5nXG5cdFx0fTtcblxuICAgICAgICByZXR1cm4gc2VydmljZTtcbiAgICB9XG59KSgpO1xuIiwiKGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBhbmd1bGFyXG5cbiAgICAgICAgLm1vZHVsZSgnYXBwJylcblxuICAgICAgICAucnVuKFsnJHJvb3RTY29wZScsICckbG9jYXRpb24nLCAnYXV0aFNlcnZpY2UnLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgJHN0YXRlLCBhdXRoU2VydmljZSkge1xuICAgICAgICAgICAgJHJvb3RTY29wZS4kb24oJyRyb3V0ZUNoYW5nZVN0YXJ0JywgZnVuY3Rpb24gKGV2ZW50KSB7XG5cbiAgICAgICAgICAgICAgICBpZiAoYXV0aFNlcnZpY2UudXNlcigpID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdsb2dpbicpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XSlcbn0pKCk7XG4iLCIoZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGFuZ3VsYXJcblxuICAgICAgICAubW9kdWxlKCdhcHAnKVxuXG4gICAgICAgIC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyLCAkdXJsUm91dGVyUHJvdmlkZXIpIHtcbiAgICAgICAgICAgICRzdGF0ZVByb3ZpZGVyXG5cbiAgICAgICAgICAgICAgICAuc3RhdGUoJ2FwcCcsIHtcbiAgICAgICAgICAgICAgICAgICAgdXJsOiAnL2FwcCcsXG4gICAgICAgICAgICAgICAgICAgIGNhY2hlOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgYWJzdHJhY3Q6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAndmlld3Mvc2lkZW1lbnUuaHRtbCcsXG4gICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgICAgIC5zdGF0ZSgnYXBwLmJ1aWxkaW5ncycsIHtcbiAgICAgICAgICAgICAgICAgICAgdXJsOiAnL2J1aWxkaW5ncycsXG4gICAgICAgICAgICAgICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAnbWVudUNvbnRlbnQnOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICd2aWV3cy9idWlsZGluZ3MuaHRtbCdcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgICAgICAuc3RhdGUoJ2FwcC5idWlsZGluZycsIHtcbiAgICAgICAgICAgICAgICAgICAgdXJsOiAnL2J1aWxkaW5ncy86YnVpbGRpbmdJZCcsXG4gICAgICAgICAgICAgICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAnbWVudUNvbnRlbnQnOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICd2aWV3cy9idWlsZGluZy5odG1sJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgICAgIC5zdGF0ZSgnYXBwLmNoYW5uZWwnLCB7XG4gICAgICAgICAgICAgICAgICAgIHVybDogJy9jaGFubmVsLzpjaGFubmVsSWQnLFxuICAgICAgICAgICAgICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgICAgICAgICAgICAgJ21lbnVDb250ZW50Jzoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAndmlld3MvbWVzc2FnZXMvY2hhdC5odG1sJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgICAgIC5zdGF0ZSgnYXBwLnByb2ZpbGUnLCB7XG4gICAgICAgICAgICAgICAgICAgIHVybDogJy9wcm9maWxlJyxcbiAgICAgICAgICAgICAgICAgICAgY2FjaGU6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgICAgICAgICAgICAgJ21lbnVDb250ZW50Jzoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAndmlld3MvcHJvZmlsZS9wcm9maWxlLmh0bWwnXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICAgICAgLnN0YXRlKCdhcHAubWVzc2FnZXMnLCB7XG4gICAgICAgICAgICAgICAgICAgIHVybDogJy9tZXNzYWdlcycsXG4gICAgICAgICAgICAgICAgICAgIGNhY2hlOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICdtZW51Q29udGVudCc6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3ZpZXdzL21lc3NhZ2VzL21lc3NhZ2VzLmh0bWwnXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KVxuXG5cbiAgICAgICAgICAgICAgICAuc3RhdGUoJ2FwcC5sb2dvdXQnLCB7XG4gICAgICAgICAgICAgICAgICAgIHVybDogXCIvbG9naW5cIixcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVQcm92aWRlcjogZnVuY3Rpb24gKGF1dGhTZXJ2aWNlLCAkc3RhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGF1dGhTZXJ2aWNlLmxvZ291dCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdsb2dpbicpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuc3RhdGUoJ2xvZ2luJywge1xuICAgICAgICAgICAgICAgICAgICB1cmw6IFwiL2xvZ2luXCIsXG4gICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBcInZpZXdzL2F1dGgvbG9naW4uaHRtbFwiXG4gICAgICAgICAgICAgICAgfSk7XG5cblxuICAgICAgICAgICAgLy9mYWxsYmFja1xuICAgICAgICAgICAgJHVybFJvdXRlclByb3ZpZGVyLm90aGVyd2lzZSgnL2xvZ2luJyk7XG5cbiAgICAgICAgfSk7XG59KSgpO1xuXG5cblxuXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
