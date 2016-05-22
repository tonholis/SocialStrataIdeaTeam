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
			if (usr == null) return;
			
			globalsService.user = usr;
			
			firebase.database().ref('users/' + usr.uid).set({
				name: usr.displayName,
				email: usr.email,
				lastActivity: new Date().getTime()
			});
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
            return firebase.database().ref('messages');
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

    sidemenuController.$inject = ["$scope", "$state", "channelsService"];
    angular.module("app.sidemenu")

        .controller("sidemenuController", sidemenuController);


    function sidemenuController($scope, $state, channelsService) {
		$scope.channels = channelsService.channels;
		
		$scope.building = {
			name: "Select a building",
			address: "",
		};
		
		$scope.$on('building-selected', function(event, data) {
			$scope.building.name = data.name;
			$scope.building.address = data.address;
		});
		
		$scope.openChannel = function(key) {
			$state.go('app.channel', { channelId: key });
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
            'app.messages'
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





//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImF1dGgvYXV0aC5tb2R1bGUuanMiLCJidWlsZGluZ3MvYnVpbGRpbmdzLm1vZHVsZS5qcyIsImNoYW5uZWxzL2NoYW5uZWxzLm1vZHVsZS5qcyIsImZpcmViYXNlL2ZpcmViYXNlLm1vZHVsZS5qcyIsIm1lc3NhZ2VzL21lc3NhZ2VzLm1vZHVsZS5qcyIsInByb2ZpbGUvcHJvZmlsZXMubW9kdWxlLmpzIiwic2lkZW1lbnUvc2lkZW1lbnUubW9kdWxlLmpzIiwidXNlcnMvdXNlcnMubW9kdWxlLmpzIiwiYXV0aC9hdXRoQ29udHJvbGxlci5qcyIsImF1dGgvYXV0aFNlcnZpY2UuanMiLCJidWlsZGluZ3MvYnVpbGRpbmdDb250cm9sbGVyLmpzIiwiYnVpbGRpbmdzL2J1aWxkaW5nc0NvbnRyb2xsZXIuanMiLCJidWlsZGluZ3MvYnVpbGRpbmdzU2VydmljZS5qcyIsImNoYW5uZWxzL2NoYW5uZWxzU2VydmljZS5qcyIsImZpcmViYXNlL2ZpcmViYXNlU2VydmljZS5qcyIsIm1lc3NhZ2VzL21lc3NhZ2VzQ29udHJvbGxlci5qcyIsIm1lc3NhZ2VzL21lc3NhZ2VzRmlsdGVycy5qcyIsIm1lc3NhZ2VzL21lc3NhZ2VzU2VydmljZS5qcyIsInByb2ZpbGUvcHJvZmlsZUNvbnRyb2xsZXIuanMiLCJwcm9maWxlL3Byb2ZpbGVzU2VydmljZS5qcyIsInNpZGVtZW51L3NpZGVtZW51Q29udHJvbGxlci5qcyIsInVzZXJzL3VzZXJzU2VydmljZS5qcyIsImFwcC5tb2R1bGUuanMiLCJhcHAuZ2xvYmFscy5qcyIsImFwcC5yb3V0ZXIuZmlsdGVyLmpzIiwiYXBwLnJvdXRlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxDQUFBLFlBQUE7SUFDQTs7SUFFQSxRQUFBLE9BQUEsWUFBQTs7QUNIQSxDQUFBLFlBQUE7SUFDQTs7SUFFQSxRQUFBLE9BQUEsaUJBQUEsQ0FBQTs7QUNIQSxDQUFBLFlBQUE7SUFDQTs7SUFFQSxRQUFBLE9BQUEsZ0JBQUE7O0FDSEEsQ0FBQSxXQUFBO0lBQ0E7O0lBRUE7U0FDQSxPQUFBLGdCQUFBOzs7Ozs7O0FDSkEsQ0FBQSxZQUFBO0lBQ0E7O0lBRUE7U0FDQSxPQUFBLHNCQUFBO1NBQ0EsU0FBQSxvQkFBQTtZQUNBLFFBQUE7O1NBRUEsVUFBQSxjQUFBO1lBQ0EsWUFBQSxXQUFBO1lBQ0EsVUFBQSxVQUFBLFNBQUEsUUFBQTtnQkFDQTs7Z0JBRUEsT0FBQTtvQkFDQSxTQUFBO29CQUNBLFVBQUE7b0JBQ0EsTUFBQSxVQUFBLE9BQUEsU0FBQSxPQUFBLFNBQUE7Ozt3QkFHQSxJQUFBLEtBQUEsUUFBQTs0QkFDQSxNQUFBOzs7d0JBR0EsSUFBQSxHQUFBLGFBQUEsY0FBQSxDQUFBLFFBQUEsa0JBQUE7NEJBQ0E7Ozs7d0JBSUEsSUFBQSxJQUFBOzRCQUNBLFlBQUE7NEJBQ0EsY0FBQTs0QkFDQSxhQUFBOzs7O3dCQUlBLElBQUEsT0FBQSxHQUFBO3dCQUNBLEdBQUEsUUFBQTt3QkFDQSxHQUFBLFFBQUE7O3dCQUVBLElBQUEsU0FBQSxNQUFBLGFBQUEsTUFBQSxXQUFBLFFBQUEsUUFBQSxRQUFBLE9BQUE7NEJBQ0EsT0FBQSxRQUFBLFFBQUE7NEJBQ0Esa0JBQUE7Z0NBQ0E7Z0NBQ0E7Z0NBQ0E7Z0NBQ0E7NEJBQ0EsVUFBQSxRQUFBLFFBQUE7Z0NBQ0EsWUFBQSxrQkFBQSxPQUFBLEtBQUEsV0FBQTs0QkFDQSxTQUFBLFFBQUE7NEJBQ0EsVUFBQSxpQkFBQTs0QkFDQSxTQUFBLFFBQUEsaUJBQUE7NEJBQ0EsWUFBQSxRQUFBLGlCQUFBLGtCQUFBO2dDQUNBLFFBQUEsaUJBQUEsdUJBQUE7Z0NBQ0EsUUFBQSxpQkFBQSwwQkFBQTs0QkFDQSxXQUFBLENBQUEsWUFBQSxDQUFBLE9BQUEsR0FBQSxRQUFBLEtBQUE7Z0NBQ0EsT0FBQSxTQUFBLFFBQUEsaUJBQUEsdUJBQUE7Z0NBQ0EsU0FBQSxRQUFBLGlCQUFBLGtCQUFBO2dDQUNBLFNBQUEsUUFBQSxpQkFBQSxpQkFBQTtnQ0FDQSxTQUFBLFFBQUEsaUJBQUEsc0JBQUE7Z0NBQ0EsUUFBQSxTQUFBLFFBQUEsaUJBQUEscUJBQUE7Z0NBQ0EsU0FBQSxRQUFBLGlCQUFBLGdCQUFBO2dDQUNBLFNBQUEsUUFBQSxpQkFBQSxtQkFBQTtnQ0FDQSxTQUFBLFFBQUEsaUJBQUEsd0JBQUE7OzRCQUVBLGlCQUFBLFNBQUEsUUFBQSxpQkFBQSxlQUFBOzRCQUNBLGNBQUEsU0FBQSxRQUFBLGlCQUFBLFdBQUE7NEJBQ0EsWUFBQSxLQUFBLElBQUEsZ0JBQUEsZUFBQSxTQUFBOzRCQUNBLFlBQUEsU0FBQSxRQUFBLGlCQUFBLGVBQUE7NEJBQ0E7NEJBQ0E7NEJBQ0EsWUFBQSxDQUFBO2dDQUNBO2dDQUNBO2dDQUNBO2dDQUNBO2dDQUNBO2dDQUNBO2dDQUNBO2dDQUNBOzs7d0JBR0EsSUFBQSxJQUFBLEtBQUEsWUFBQTs0QkFDQTs7Ozt3QkFJQSxZQUFBLGFBQUEsWUFBQSxJQUFBLFlBQUE7Ozt3QkFHQSxJQUFBLE9BQUEsZUFBQSxTQUFBLE1BQUE7NEJBQ0EsUUFBQSxRQUFBLFNBQUEsTUFBQSxPQUFBOzs7O3dCQUlBLElBQUEsSUFBQTs0QkFDQSxVQUFBLENBQUEsV0FBQSxVQUFBLFdBQUEsY0FBQSxTQUFBOzJCQUNBLEtBQUEsV0FBQTs7Ozs7O3dCQU1BLFNBQUEsYUFBQTs0QkFDQSxJQUFBLGNBQUE7OzRCQUVBLFdBQUE7OzRCQUVBLFVBQUEsaUJBQUE7NEJBQ0EsUUFBQSxRQUFBLFdBQUEsVUFBQSxLQUFBO2dDQUNBLGVBQUEsTUFBQSxNQUFBLFFBQUEsaUJBQUEsT0FBQTs7NEJBRUEsT0FBQSxhQUFBLFNBQUE7Ozt3QkFHQSxTQUFBLFNBQUE7NEJBQ0EsSUFBQTtnQ0FDQTtnQ0FDQTtnQ0FDQTtnQ0FDQTs7NEJBRUEsSUFBQSxhQUFBLElBQUE7Z0NBQ0E7Ozs7NEJBSUEsSUFBQSxDQUFBLFFBQUE7Z0NBQ0EsU0FBQTs7Z0NBRUEsT0FBQSxRQUFBLEdBQUEsUUFBQTtnQ0FDQSxPQUFBLE1BQUEsWUFBQSxHQUFBLE1BQUE7O2dDQUVBLFdBQUEsR0FBQSxNQUFBLFdBQUEsS0FBQSxTQUFBLFNBQUEsR0FBQSxNQUFBLFFBQUE7O2dDQUVBLHVCQUFBLGlCQUFBLElBQUEsaUJBQUE7OztnQ0FHQSxJQUFBLHFCQUFBLE9BQUEscUJBQUEsU0FBQSxHQUFBLE9BQUEsTUFBQTs7b0NBRUEsUUFBQSxTQUFBLHNCQUFBLE1BQUEsU0FBQTtvQ0FDQSxPQUFBLE1BQUEsUUFBQSxRQUFBOzs7Z0NBR0EsZUFBQSxPQUFBOztnQ0FFQSxJQUFBLGVBQUEsV0FBQTtvQ0FDQSxlQUFBO29DQUNBLFdBQUE7dUNBQ0EsSUFBQSxlQUFBLFdBQUE7b0NBQ0EsZUFBQTs7Z0NBRUEsZ0JBQUEsU0FBQTtnQ0FDQSxHQUFBLE1BQUEsWUFBQSxZQUFBOztnQ0FFQSxJQUFBLGFBQUEsY0FBQTtvQ0FDQSxNQUFBLE1BQUEsa0JBQUEsS0FBQSxVQUFBO29DQUNBLEdBQUEsTUFBQSxTQUFBLGVBQUE7Ozs7Z0NBSUEsU0FBQSxZQUFBO29DQUNBLFNBQUE7bUNBQ0EsR0FBQTs7Ozs7d0JBS0EsU0FBQSxjQUFBOzRCQUNBLFNBQUE7NEJBQ0E7Ozs7Ozs7O3dCQVFBLElBQUEsc0JBQUEsTUFBQSxhQUFBLElBQUE7OzRCQUVBLEdBQUEsYUFBQSxHQUFBLFVBQUE7K0JBQ0E7NEJBQ0EsR0FBQSxhQUFBOzs7d0JBR0EsS0FBQSxLQUFBLFVBQUE7O3dCQUVBLE1BQUEsT0FBQSxZQUFBOzRCQUNBLE9BQUEsUUFBQTsyQkFDQSxVQUFBLFVBQUE7NEJBQ0E7Ozt3QkFHQSxNQUFBLElBQUEsa0JBQUEsWUFBQTs0QkFDQTs0QkFDQTs7O3dCQUdBLFNBQUEsUUFBQSxHQUFBOzs7Ozs7d0JBTUEsTUFBQSxJQUFBLFlBQUEsWUFBQTs0QkFDQSxRQUFBOzRCQUNBLEtBQUEsT0FBQSxVQUFBOzs7Ozs7O0lBT0E7U0FDQSxPQUFBLGdCQUFBLENBQUE7Ozs7Ozs7QUNyTkEsQ0FBQSxZQUFBO0lBQ0E7O0lBRUEsUUFBQSxPQUFBLGdCQUFBLENBQUE7O0FDSEEsQ0FBQSxZQUFBO0lBQ0E7O0lBRUEsUUFBQSxPQUFBLGdCQUFBOztBQ0hBLENBQUEsWUFBQTtJQUNBOztJQUVBLFFBQUEsT0FBQSxhQUFBLENBQUE7O0FDSEEsQ0FBQSxXQUFBO0lBQ0E7OztJQUVBLFFBQUEsT0FBQTs7U0FFQSxXQUFBLGtCQUFBOzs7SUFHQSxTQUFBLGVBQUEsUUFBQSxhQUFBLGFBQUEsZUFBQSxRQUFBLFVBQUE7O1FBRUEsT0FBQSxPQUFBOztRQUVBLE9BQUEsUUFBQSxXQUFBO0dBQ0EsY0FBQTs7R0FFQSxZQUFBLE1BQUEsT0FBQSxLQUFBLFVBQUEsT0FBQSxLQUFBLFVBQUEsUUFBQSxTQUFBLE1BQUE7SUFDQSxjQUFBO0lBQ0EsT0FBQSxHQUFBOztlQUVBLE1BQUEsU0FBQSxPQUFBO0lBQ0EsU0FBQSxXQUFBO0tBQ0EsY0FBQTtPQUNBOztnQkFFQSxJQUFBLGFBQUEsWUFBQSxNQUFBO29CQUNBLE9BQUE7b0JBQ0EsVUFBQSxNQUFBOzs7OztFQUtBLE9BQUEsZ0JBQUEsV0FBQTtHQUNBLElBQUEsYUFBQSxZQUFBLE1BQUE7SUFDQSxPQUFBO0lBQ0EsVUFBQTs7Ozs7QUNsQ0EsQ0FBQSxXQUFBO0lBQ0E7OztJQUVBLFFBQUEsT0FBQTs7U0FFQSxRQUFBLGVBQUE7O0NBRUEsU0FBQSxXQUFBLFVBQUEsVUFBQTtFQUNBLElBQUEsV0FBQSxHQUFBO0VBQ0EsSUFBQSxPQUFBLGdCQUFBLEdBQUE7O0VBRUEsT0FBQSxLQUFBLCtCQUFBLE9BQUE7OztJQUdBLFNBQUEsWUFBQSxJQUFBLFlBQUEsa0JBQUEsZ0JBQUE7RUFDQSxJQUFBLE9BQUEsU0FBQTs7RUFFQSxXQUFBLElBQUEsZ0JBQUEsV0FBQTtHQUNBLElBQUEsTUFBQSxTQUFBLE9BQUE7R0FDQSxJQUFBLE9BQUEsTUFBQTs7R0FFQSxlQUFBLE9BQUE7O0dBRUEsU0FBQSxXQUFBLElBQUEsV0FBQSxJQUFBLEtBQUEsSUFBQTtJQUNBLE1BQUEsSUFBQTtJQUNBLE9BQUEsSUFBQTtJQUNBLGNBQUEsSUFBQSxPQUFBOzs7O0VBSUEsT0FBQTtZQUNBLE9BQUEsU0FBQSxVQUFBLFVBQUE7Z0JBQ0EsSUFBQSxXQUFBLEdBQUE7Z0JBQ0EsSUFBQSxVQUFBLFNBQUE7O0lBRUEsSUFBQSxpQkFBQSxTQUFBLE1BQUE7S0FDQSxLQUFBLFFBQUEsS0FBQSxlQUFBO0tBQ0EsU0FBQSxRQUFBOztLQUVBLFdBQUEsTUFBQTs7O0lBR0EsSUFBQSxlQUFBLFNBQUEsT0FBQTtLQUNBLFNBQUEsT0FBQTs7O0lBR0EsS0FBQSwyQkFBQSxVQUFBO01BQ0EsS0FBQSxnQkFBQSxTQUFBLE1BQUEsT0FBQTtNQUNBLElBQUEsTUFBQSxRQUFBLHVCQUFBO09BQ0EsS0FBQSwrQkFBQSxVQUFBO1NBQ0EsS0FBQSxnQkFBQTs7V0FFQTtPQUNBLGFBQUE7Ozs7Z0JBSUEsUUFBQSxVQUFBLFNBQUEsSUFBQTtvQkFDQSxRQUFBLEtBQUE7b0JBQ0EsT0FBQTs7Z0JBRUEsUUFBQSxRQUFBLFNBQUEsSUFBQTtvQkFDQSxRQUFBLEtBQUEsTUFBQTtvQkFDQSxPQUFBOztnQkFFQSxPQUFBOzs7R0FHQSxRQUFBLFlBQUE7SUFDQSxLQUFBO0lBQ0EsZUFBQSxPQUFBOzs7WUFHQSxNQUFBLFdBQUE7SUFDQSxPQUFBLFNBQUEsT0FBQTs7Ozs7O0FDMUVBLENBQUEsWUFBQTtJQUNBOzs7SUFFQSxRQUFBLE9BQUE7O1NBRUEsV0FBQSxzQkFBQTs7O0lBR0EsU0FBQSxtQkFBQSxRQUFBLGVBQUEsY0FBQSxpQkFBQTs7UUFFQSxJQUFBLE1BQUEsZ0JBQUEsZ0JBQUEsYUFBQTs7UUFFQSxjQUFBO1FBQ0EsSUFBQSxHQUFBLFNBQUEsVUFBQSxVQUFBO1lBQ0EsSUFBQSxNQUFBLFNBQUE7O1lBRUEsSUFBQSxLQUFBO2dCQUNBLE9BQUEsV0FBQSxJQUFBOztpQkFFQTs7O1lBR0EsY0FBQTs7V0FFQSxVQUFBLGFBQUE7WUFDQSxRQUFBLElBQUEsb0JBQUEsWUFBQTtZQUNBLElBQUEsYUFBQSxZQUFBLE1BQUE7Z0JBQ0EsT0FBQTtnQkFDQSxVQUFBOztZQUVBLGNBQUE7Ozs7O0FDOUJBLENBQUEsWUFBQTtJQUNBOzs7SUFFQSxRQUFBLE9BQUE7O1NBRUEsV0FBQSx1QkFBQTs7O0lBR0EsU0FBQSxvQkFBQSxRQUFBLGVBQUEsa0JBQUEsZ0JBQUE7UUFDQSxJQUFBLE1BQUEsaUJBQUE7O0VBRUEsT0FBQSxjQUFBLGVBQUEsV0FBQSxlQUFBLFNBQUEsTUFBQTs7RUFFQSxPQUFBLFNBQUEsU0FBQSxLQUFBLFVBQUE7R0FDQSxPQUFBLGNBQUEsU0FBQSxNQUFBO0dBQ0EsZUFBQSxXQUFBO0dBQ0EsT0FBQSxNQUFBLHFCQUFBOzs7UUFHQSxjQUFBO1FBQ0EsSUFBQSxHQUFBLFNBQUEsVUFBQSxVQUFBO1lBQ0EsT0FBQSxZQUFBLFNBQUE7WUFDQSxjQUFBO1dBQ0EsVUFBQSxhQUFBO1lBQ0EsUUFBQSxJQUFBLG9CQUFBLFlBQUE7WUFDQSxJQUFBLGFBQUEsWUFBQSxNQUFBO2dCQUNBLE9BQUE7Z0JBQ0EsVUFBQTs7WUFFQSxjQUFBOzs7O0FDN0JBLENBQUEsWUFBQTtJQUNBOzs7SUFFQTtTQUNBLE9BQUE7U0FDQSxRQUFBLG9CQUFBOztJQUVBLFNBQUEsaUJBQUEsaUJBQUEsWUFBQTs7UUFFQSxPQUFBO1lBQ0EsY0FBQSxZQUFBO2dCQUNBLE9BQUEsU0FBQSxXQUFBLElBQUE7Ozs7OztBQ1hBLENBQUEsWUFBQTtJQUNBOzs7SUFFQTtTQUNBLE9BQUE7U0FDQSxRQUFBLG1CQUFBOztJQUVBLFNBQUEsZ0JBQUEsWUFBQTtFQUNBLElBQUEsVUFBQTs7RUFFQSxRQUFBLFdBQUE7R0FDQSxZQUFBO0dBQ0EsV0FBQTtHQUNBLFdBQUE7R0FDQSxVQUFBO0dBQ0EsYUFBQTtHQUNBLGVBQUE7OztFQUdBLFdBQUEsSUFBQSxxQkFBQSxTQUFBLFVBQUE7Ozs7RUFJQSxRQUFBLGtCQUFBLFVBQUEsVUFBQTtHQUNBLE9BQUEsU0FBQSxXQUFBLElBQUEsZUFBQSxXQUFBOzs7UUFHQSxPQUFBOzs7OztBQzNCQSxDQUFBLFlBQUE7SUFDQTs7SUFFQTtTQUNBLE9BQUE7U0FDQSxRQUFBLG1CQUFBOzs7SUFHQSxTQUFBLGtCQUFBO1FBQ0EsSUFBQSxTQUFBO1lBQ0EsUUFBQTtZQUNBLFlBQUE7WUFDQSxhQUFBO1lBQ0EsZUFBQTs7O1FBR0EsS0FBQSxLQUFBLFNBQUEsY0FBQTs7OztBQ2hCQSxDQUFBLFdBQUE7SUFDQTs7SUFFQTtTQUNBLE9BQUE7U0FDQSxXQUFBLHNCQUFBO1lBQ0E7WUFDQTtZQUNBO1lBQ0E7WUFDQTtZQUNBO1lBQ0E7OztJQUdBLFNBQUEsbUJBQUEsUUFBQSxRQUFBLGNBQUEsc0JBQUEsaUJBQUEsZ0JBQUE7O1FBRUEsS0FBQSxTQUFBO1FBQ0EsS0FBQSxTQUFBO1FBQ0EsS0FBQSxlQUFBO1FBQ0EsS0FBQSx1QkFBQTtRQUNBLEtBQUEsa0JBQUE7RUFDQSxLQUFBLGlCQUFBOztFQUVBLElBQUEsQ0FBQSxLQUFBO0dBQ0EsT0FBQTs7O1FBR0EsS0FBQSxjQUFBLGVBQUEsU0FBQTtRQUNBLEtBQUEsYUFBQSxLQUFBLGFBQUE7UUFDQSxLQUFBLGNBQUEsU0FBQSxXQUFBLElBQUEsQ0FBQSxhQUFBLEtBQUEsYUFBQSxZQUFBLEtBQUE7RUFDQSxLQUFBLFlBQUEsR0FBQSxlQUFBLFNBQUEsR0FBQTtHQUNBLFFBQUEsSUFBQSxFQUFBOzs7UUFHQSxPQUFBLE9BQUE7WUFDQSxLQUFBO1lBQ0EsS0FBQTtZQUNBLFVBQUEsZUFBQSxLQUFBLGNBQUEsZUFBQSxLQUFBLGNBQUE7OztRQUdBLE9BQUE7OztRQUdBLEtBQUEsYUFBQSxxQkFBQSxhQUFBOzs7UUFHQSxPQUFBLElBQUEsd0JBQUEsS0FBQTs7UUFFQSxLQUFBOzs7Q0FHQSxtQkFBQSxVQUFBLFdBQUEsV0FBQTtFQUNBLElBQUEsQ0FBQSxLQUFBLGVBQUEsTUFBQTtZQUNBLEtBQUEsT0FBQSxHQUFBO1lBQ0EsT0FBQTs7O0VBR0EsSUFBQSxDQUFBLEtBQUEsZUFBQSxVQUFBO1lBQ0EsS0FBQSxPQUFBLEdBQUE7WUFDQSxPQUFBOzs7RUFHQSxPQUFBOzs7O0lBSUEsbUJBQUEsVUFBQSxPQUFBLFdBQUE7UUFDQSxJQUFBLE9BQUE7O1FBRUEsSUFBQSxjQUFBLENBQUEsYUFBQSxLQUFBLGFBQUEsWUFBQSxLQUFBLGFBQUEsV0FBQSxLQUFBO1FBQ0EsUUFBQSxJQUFBOztRQUVBLElBQUEsYUFBQSxTQUFBLFdBQUEsSUFBQTtRQUNBLFdBQUEsR0FBQSxTQUFBLFNBQUEsVUFBQTtZQUNBLEtBQUEsVUFBQSxTQUFBOztZQUVBLElBQUEsS0FBQSxRQUFBLFFBQUEsVUFBQTtnQkFDQSxLQUFBLFdBQUEsS0FBQSxRQUFBOztpQkFFQTtnQkFDQSxLQUFBOzs7OztJQUtBLG1CQUFBLFVBQUEsYUFBQSxTQUFBLEtBQUE7RUFDQSxJQUFBLE9BQUE7O1FBRUEsSUFBQSxjQUFBLENBQUEsU0FBQSxLQUFBLEtBQUE7UUFDQSxRQUFBLElBQUE7O1FBRUEsU0FBQSxXQUFBLElBQUEsYUFBQSxHQUFBLFNBQUEsU0FBQSxVQUFBO1lBQ0EsSUFBQSxVQUFBLFNBQUE7WUFDQSxLQUFBLE9BQUEsU0FBQTtnQkFDQSxLQUFBO2dCQUNBLEtBQUE7Z0JBQ0EsVUFBQSxXQUFBLFFBQUEsY0FBQSxRQUFBLGNBQUE7OztZQUdBLEtBQUE7Ozs7SUFJQSxtQkFBQSxVQUFBLGtCQUFBLFdBQUE7OztRQUdBLEtBQUEsT0FBQSxXQUFBLENBQUE7WUFDQSxPQUFBO1lBQ0EsUUFBQTtZQUNBLFVBQUE7WUFDQSxRQUFBO1lBQ0EsUUFBQTtZQUNBLFlBQUE7V0FDQTtnQkFDQSxPQUFBO2dCQUNBLFFBQUE7Z0JBQ0EsVUFBQTtnQkFDQSxRQUFBO2dCQUNBLFFBQUE7Z0JBQ0EsWUFBQTtlQUNBO2dCQUNBLE9BQUE7Z0JBQ0EsUUFBQTtnQkFDQSxVQUFBO2dCQUNBLFFBQUE7Z0JBQ0EsUUFBQTtnQkFDQSxZQUFBO2VBQ0E7Z0JBQ0EsT0FBQTtnQkFDQSxRQUFBO2dCQUNBLFVBQUE7Z0JBQ0EsUUFBQTtnQkFDQSxRQUFBO2dCQUNBLFlBQUE7ZUFDQTtnQkFDQSxPQUFBO2dCQUNBLFFBQUE7Z0JBQ0EsVUFBQTtnQkFDQSxRQUFBO2dCQUNBLFFBQUE7Z0JBQ0EsWUFBQTtlQUNBO2dCQUNBLE9BQUE7Z0JBQ0EsUUFBQTtnQkFDQSxVQUFBO2dCQUNBLFFBQUE7Z0JBQ0EsUUFBQTtnQkFDQSxZQUFBO2VBQ0E7Z0JBQ0EsT0FBQTtnQkFDQSxRQUFBO2dCQUNBLFVBQUE7Z0JBQ0EsUUFBQTtnQkFDQSxRQUFBO2dCQUNBLFlBQUE7ZUFDQTtnQkFDQSxPQUFBO2dCQUNBLFFBQUE7Z0JBQ0EsVUFBQTtnQkFDQSxRQUFBO2dCQUNBLFFBQUE7Z0JBQ0EsWUFBQTtlQUNBO2dCQUNBLE9BQUE7Z0JBQ0EsUUFBQTtnQkFDQSxVQUFBO2dCQUNBLFFBQUE7Z0JBQ0EsUUFBQTtnQkFDQSxZQUFBO2VBQ0E7Z0JBQ0EsT0FBQTtnQkFDQSxRQUFBO2dCQUNBLFVBQUE7Z0JBQ0EsUUFBQTtnQkFDQSxRQUFBO2dCQUNBLFlBQUE7Ozs7SUFJQSxtQkFBQSxVQUFBLG1CQUFBLFdBQUE7Ozs7SUFJQSxtQkFBQSxVQUFBLGNBQUEsU0FBQSxpQkFBQTtRQUNBLElBQUEsT0FBQTs7UUFFQSxJQUFBLFVBQUE7WUFDQSxNQUFBLE9BQUEsT0FBQTtZQUNBLE1BQUEsT0FBQSxNQUFBOzs7Ozs7Ozs7UUFTQSxPQUFBLE1BQUEsVUFBQTs7UUFFQSxRQUFBLE1BQUEsSUFBQSxPQUFBO1FBQ0EsUUFBQSxPQUFBLElBQUE7UUFDQSxRQUFBLFdBQUEsT0FBQSxLQUFBO1FBQ0EsUUFBQSxTQUFBLE9BQUEsS0FBQTtRQUNBLFFBQUEsTUFBQSxPQUFBLEtBQUE7O1FBRUEsT0FBQSxTQUFBLEtBQUE7O1FBRUEsU0FBQSxXQUFBO1lBQ0E7WUFDQSxLQUFBLFdBQUEsYUFBQTtXQUNBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNuTkEsQ0FBQSxZQUFBO0lBQ0E7O0lBRUE7U0FDQSxPQUFBOztTQUVBLE9BQUEsU0FBQSxDQUFBLFdBQUE7O0lBRUEsU0FBQSxNQUFBLFNBQUE7UUFDQSxPQUFBLFVBQUEsTUFBQTtZQUNBLElBQUEsQ0FBQSxNQUFBLE9BQUE7WUFDQSxPQUFBLEtBQUEsUUFBQSxVQUFBOzs7O0FDWEEsQ0FBQSxZQUFBO0lBQ0E7OztJQUVBO1NBQ0EsT0FBQTtTQUNBLFFBQUEsbUJBQUE7O0lBRUEsU0FBQSxnQkFBQSxpQkFBQTtRQUNBLElBQUEsVUFBQTs7UUFFQSxRQUFBLGlCQUFBLFlBQUE7WUFDQSxPQUFBLFNBQUEsV0FBQSxJQUFBOzs7UUFHQSxRQUFBLGFBQUEsVUFBQSxTQUFBO1lBQ0EsT0FBQSxnQkFBQSxHQUFBLFdBQUEsS0FBQTs7O1FBR0EsT0FBQTs7OztBQ2xCQSxDQUFBLFdBQUE7SUFDQTs7O0lBRUEsUUFBQSxPQUFBOztTQUVBLFdBQUEscUJBQUE7OztJQUdBLFNBQUEsa0JBQUEsUUFBQSxlQUFBLGFBQUEsYUFBQSxpQkFBQTs7RUFFQSxJQUFBLE9BQUEsWUFBQTs7RUFFQSxPQUFBLE9BQUE7R0FDQSxjQUFBLE9BQUEsS0FBQSxjQUFBO0dBQ0EsUUFBQSxPQUFBLEtBQUEsUUFBQTs7O1FBR0EsT0FBQSxTQUFBLFdBQUE7R0FDQSxjQUFBOztZQUVBLGdCQUFBLGNBQUEsT0FBQSxNQUFBLEtBQUEsU0FBQSxRQUFBLEtBQUE7SUFDQSxjQUFBOztJQUVBLFlBQUEsTUFBQTtvQkFDQSxPQUFBO29CQUNBLFVBQUE7OztlQUdBLFNBQUEsTUFBQSxPQUFBO0lBQ0EsY0FBQTs7SUFFQSxZQUFBLE1BQUE7b0JBQ0EsT0FBQTtvQkFDQSxVQUFBLE1BQUE7Ozs7OztBQ2pDQSxDQUFBLFdBQUE7SUFDQTs7O0lBRUEsUUFBQSxPQUFBOztTQUVBLFFBQUEsbUJBQUE7OztJQUdBLFNBQUEsZ0JBQUEsSUFBQSxZQUFBLGFBQUE7O1FBRUEsT0FBQTtZQUNBLGVBQUEsU0FBQSxNQUFBO2dCQUNBLElBQUEsV0FBQSxHQUFBOztnQkFFQSxZQUFBLE9BQUEsY0FBQTtxQkFDQSxLQUFBLFNBQUEsVUFBQTt3QkFDQSxTQUFBLFFBQUE7d0JBQ0EsV0FBQSxXQUFBO3VCQUNBLFNBQUEsTUFBQSxPQUFBO3dCQUNBLFNBQUEsT0FBQTs7O2dCQUdBLE9BQUEsU0FBQTs7Ozs7QUN0QkEsQ0FBQSxXQUFBO0lBQ0E7OztJQUVBLFFBQUEsT0FBQTs7U0FFQSxXQUFBLHNCQUFBOzs7SUFHQSxTQUFBLG1CQUFBLFFBQUEsUUFBQSxpQkFBQTtFQUNBLE9BQUEsV0FBQSxnQkFBQTs7RUFFQSxPQUFBLFdBQUE7R0FDQSxNQUFBO0dBQ0EsU0FBQTs7O0VBR0EsT0FBQSxJQUFBLHFCQUFBLFNBQUEsT0FBQSxNQUFBO0dBQ0EsT0FBQSxTQUFBLE9BQUEsS0FBQTtHQUNBLE9BQUEsU0FBQSxVQUFBLEtBQUE7OztFQUdBLE9BQUEsY0FBQSxTQUFBLEtBQUE7R0FDQSxPQUFBLEdBQUEsZUFBQSxFQUFBLFdBQUE7Ozs7O0FDdEJBLENBQUEsV0FBQTtJQUNBOzs7SUFFQSxRQUFBLE9BQUE7O1NBRUEsUUFBQSxnQkFBQTs7O0lBR0EsU0FBQSxhQUFBLElBQUEsYUFBQTtLQUNBLE9BQUE7WUFDQSxlQUFBLFNBQUEsTUFBQTtnQkFDQSxJQUFBLFdBQUEsR0FBQTs7Z0JBRUEsWUFBQSxPQUFBLGNBQUE7cUJBQ0EsS0FBQSxTQUFBLFVBQUE7d0JBQ0EsU0FBQSxRQUFBO3dCQUNBLE9BQUEsU0FBQSxPQUFBO3dCQUNBLFdBQUEsV0FBQTt1QkFDQSxTQUFBLE1BQUEsT0FBQTt3QkFDQSxTQUFBLE9BQUE7OztnQkFHQSxPQUFBLFNBQUE7Ozs7O0FDdEJBLENBQUEsV0FBQTtJQUNBOztJQUVBOztTQUVBLE9BQUEsT0FBQTtZQUNBO1lBQ0E7O1lBRUE7WUFDQTtZQUNBO1lBQ0E7WUFDQTtZQUNBO1lBQ0E7WUFDQTs7O1NBR0EsaURBQUEsU0FBQSxnQkFBQSxVQUFBLFlBQUE7WUFDQSxlQUFBLE1BQUEsV0FBQTtnQkFDQSxJQUFBLE9BQUEsV0FBQSxPQUFBLFFBQUEsUUFBQSxVQUFBO29CQUNBLFFBQUEsUUFBQSxTQUFBLHlCQUFBOztvQkFFQSxRQUFBLFFBQUEsU0FBQSxjQUFBOztnQkFFQSxJQUFBLE9BQUEsV0FBQTtvQkFDQSxVQUFBOzs7Z0JBR0EsV0FBQSxNQUFBOzs7Ozs7O0FDOUJBLENBQUEsWUFBQTtJQUNBOztJQUVBO1NBQ0EsT0FBQTtTQUNBLFFBQUEsa0JBQUE7O0lBRUEsU0FBQSxpQkFBQTtRQUNBLElBQUEsVUFBQTtHQUNBLE9BQUE7R0FDQSxXQUFBOzs7UUFHQSxPQUFBOzs7O0FDYkEsQ0FBQSxZQUFBO0lBQ0E7O0lBRUE7O1NBRUEsT0FBQTs7U0FFQSxJQUFBLENBQUEsY0FBQSxhQUFBLGVBQUEsVUFBQSxZQUFBLFFBQUEsYUFBQTtZQUNBLFdBQUEsSUFBQSxxQkFBQSxVQUFBLE9BQUE7O2dCQUVBLElBQUEsWUFBQSxVQUFBLE1BQUE7b0JBQ0EsTUFBQTtvQkFDQSxPQUFBLEdBQUE7Ozs7OztBQ1pBLENBQUEsWUFBQTtJQUNBOztJQUVBOztTQUVBLE9BQUE7O1NBRUEsZ0RBQUEsVUFBQSxnQkFBQSxvQkFBQTtZQUNBOztpQkFFQSxNQUFBLE9BQUE7b0JBQ0EsS0FBQTtvQkFDQSxPQUFBO29CQUNBLFVBQUE7b0JBQ0EsYUFBQTs7O2lCQUdBLE1BQUEsaUJBQUE7b0JBQ0EsS0FBQTtvQkFDQSxPQUFBO3dCQUNBLGVBQUE7NEJBQ0EsYUFBQTs7Ozs7aUJBS0EsTUFBQSxnQkFBQTtvQkFDQSxLQUFBO29CQUNBLE9BQUE7d0JBQ0EsZUFBQTs0QkFDQSxhQUFBOzs7OztpQkFLQSxNQUFBLGVBQUE7b0JBQ0EsS0FBQTtvQkFDQSxPQUFBO3dCQUNBLGVBQUE7NEJBQ0EsYUFBQTs7Ozs7aUJBS0EsTUFBQSxlQUFBO29CQUNBLEtBQUE7b0JBQ0EsT0FBQTtvQkFDQSxPQUFBO3dCQUNBLGVBQUE7NEJBQ0EsYUFBQTs7Ozs7aUJBS0EsTUFBQSxjQUFBO29CQUNBLEtBQUE7b0JBQ0EsNENBQUEsVUFBQSxhQUFBLFFBQUE7d0JBQ0EsWUFBQTt3QkFDQSxPQUFBLEdBQUE7OztpQkFHQSxNQUFBLFNBQUE7b0JBQ0EsS0FBQTtvQkFDQSxhQUFBOzs7OztZQUtBLG1CQUFBLFVBQUE7Ozs7Ozs7O0FBUUEiLCJmaWxlIjoiYXBwLmJ1bmRsZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgYW5ndWxhci5tb2R1bGUoXCJhcHAuYXV0aFwiLCBbXSk7XG59KSgpOyIsIihmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgYW5ndWxhci5tb2R1bGUoXCJhcHAuYnVpbGRpbmdzXCIsIFsnYXBwLmZpcmViYXNlJ10pO1xufSkoKTsiLCIoZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGFuZ3VsYXIubW9kdWxlKFwiYXBwLmNoYW5uZWxzXCIsIFtdKTtcbn0pKCk7IiwiKGZ1bmN0aW9uKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGFuZ3VsYXJcbiAgICAgICAgLm1vZHVsZSgnYXBwLmZpcmViYXNlJywgW10pO1xufSkoKTtcblxuXG5cblxuIiwiKGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBhbmd1bGFyXG4gICAgICAgIC5tb2R1bGUoJ21vbm9zcGFjZWQuZWxhc3RpYycsIFtdKVxuICAgICAgICAuY29uc3RhbnQoJ21zZEVsYXN0aWNDb25maWcnLCB7XG4gICAgICAgICAgICBhcHBlbmQ6ICcnXG4gICAgICAgIH0pXG4gICAgICAgIC5kaXJlY3RpdmUoJ21zZEVsYXN0aWMnLCBbXG4gICAgICAgICAgICAnJHRpbWVvdXQnLCAnJHdpbmRvdycsICdtc2RFbGFzdGljQ29uZmlnJyxcbiAgICAgICAgICAgIGZ1bmN0aW9uICgkdGltZW91dCwgJHdpbmRvdywgY29uZmlnKSB7XG4gICAgICAgICAgICAgICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZTogJ25nTW9kZWwnLFxuICAgICAgICAgICAgICAgICAgICByZXN0cmljdDogJ0EsIEMnLFxuICAgICAgICAgICAgICAgICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBuZ01vZGVsKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNhY2hlIGEgcmVmZXJlbmNlIHRvIHRoZSBET00gZWxlbWVudFxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRhID0gZWxlbWVudFswXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdGEgPSBlbGVtZW50O1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBlbnN1cmUgdGhlIGVsZW1lbnQgaXMgYSB0ZXh0YXJlYSwgYW5kIGJyb3dzZXIgaXMgY2FwYWJsZVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRhLm5vZGVOYW1lICE9PSAnVEVYVEFSRUEnIHx8ICEkd2luZG93LmdldENvbXB1dGVkU3R5bGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHNldCB0aGVzZSBwcm9wZXJ0aWVzIGJlZm9yZSBtZWFzdXJpbmcgZGltZW5zaW9uc1xuICAgICAgICAgICAgICAgICAgICAgICAgJHRhLmNzcyh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ292ZXJmbG93JzogJ2hpZGRlbicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ292ZXJmbG93LXknOiAnaGlkZGVuJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnd29yZC13cmFwJzogJ2JyZWFrLXdvcmQnXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZm9yY2UgdGV4dCByZWZsb3dcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0ZXh0ID0gdGEudmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB0YS52YWx1ZSA9ICcnO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGEudmFsdWUgPSB0ZXh0O1xuXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgYXBwZW5kID0gYXR0cnMubXNkRWxhc3RpYyA/IGF0dHJzLm1zZEVsYXN0aWMucmVwbGFjZSgvXFxcXG4vZywgJ1xcbicpIDogY29uZmlnLmFwcGVuZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkd2luID0gYW5ndWxhci5lbGVtZW50KCR3aW5kb3cpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1pcnJvckluaXRTdHlsZSA9ICdwb3NpdGlvbjogYWJzb2x1dGU7IHRvcDogLTk5OXB4OyByaWdodDogYXV0bzsgYm90dG9tOiBhdXRvOycgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnbGVmdDogMDsgb3ZlcmZsb3c6IGhpZGRlbjsgLXdlYmtpdC1ib3gtc2l6aW5nOiBjb250ZW50LWJveDsnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJy1tb3otYm94LXNpemluZzogY29udGVudC1ib3g7IGJveC1zaXppbmc6IGNvbnRlbnQtYm94OycgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnbWluLWhlaWdodDogMCAhaW1wb3J0YW50OyBoZWlnaHQ6IDAgIWltcG9ydGFudDsgcGFkZGluZzogMDsnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ3dvcmQtd3JhcDogYnJlYWstd29yZDsgYm9yZGVyOiAwOycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJG1pcnJvciA9IGFuZ3VsYXIuZWxlbWVudCgnPHRleHRhcmVhIGFyaWEtaGlkZGVuPVwidHJ1ZVwiIHRhYmluZGV4PVwiLTFcIiAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ3N0eWxlPVwiJyArIG1pcnJvckluaXRTdHlsZSArICdcIi8+JykuZGF0YSgnZWxhc3RpYycsIHRydWUpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1pcnJvciA9ICRtaXJyb3JbMF0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFTdHlsZSA9IGdldENvbXB1dGVkU3R5bGUodGEpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc2l6ZSA9IHRhU3R5bGUuZ2V0UHJvcGVydHlWYWx1ZSgncmVzaXplJyksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYm9yZGVyQm94ID0gdGFTdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKCdib3gtc2l6aW5nJykgPT09ICdib3JkZXItYm94JyB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YVN0eWxlLmdldFByb3BlcnR5VmFsdWUoJy1tb3otYm94LXNpemluZycpID09PSAnYm9yZGVyLWJveCcgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFTdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKCctd2Via2l0LWJveC1zaXppbmcnKSA9PT0gJ2JvcmRlci1ib3gnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJveE91dGVyID0gIWJvcmRlckJveCA/IHt3aWR0aDogMCwgaGVpZ2h0OiAwfSA6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6IHBhcnNlSW50KHRhU3R5bGUuZ2V0UHJvcGVydHlWYWx1ZSgnYm9yZGVyLXJpZ2h0LXdpZHRoJyksIDEwKSArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcnNlSW50KHRhU3R5bGUuZ2V0UHJvcGVydHlWYWx1ZSgncGFkZGluZy1yaWdodCcpLCAxMCkgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJzZUludCh0YVN0eWxlLmdldFByb3BlcnR5VmFsdWUoJ3BhZGRpbmctbGVmdCcpLCAxMCkgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJzZUludCh0YVN0eWxlLmdldFByb3BlcnR5VmFsdWUoJ2JvcmRlci1sZWZ0LXdpZHRoJyksIDEwKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBwYXJzZUludCh0YVN0eWxlLmdldFByb3BlcnR5VmFsdWUoJ2JvcmRlci10b3Atd2lkdGgnKSwgMTApICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyc2VJbnQodGFTdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKCdwYWRkaW5nLXRvcCcpLCAxMCkgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJzZUludCh0YVN0eWxlLmdldFByb3BlcnR5VmFsdWUoJ3BhZGRpbmctYm90dG9tJyksIDEwKSArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcnNlSW50KHRhU3R5bGUuZ2V0UHJvcGVydHlWYWx1ZSgnYm9yZGVyLWJvdHRvbS13aWR0aCcpLCAxMClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1pbkhlaWdodFZhbHVlID0gcGFyc2VJbnQodGFTdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKCdtaW4taGVpZ2h0JyksIDEwKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHRWYWx1ZSA9IHBhcnNlSW50KHRhU3R5bGUuZ2V0UHJvcGVydHlWYWx1ZSgnaGVpZ2h0JyksIDEwKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaW5IZWlnaHQgPSBNYXRoLm1heChtaW5IZWlnaHRWYWx1ZSwgaGVpZ2h0VmFsdWUpIC0gYm94T3V0ZXIuaGVpZ2h0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1heEhlaWdodCA9IHBhcnNlSW50KHRhU3R5bGUuZ2V0UHJvcGVydHlWYWx1ZSgnbWF4LWhlaWdodCcpLCAxMCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWlycm9yZWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0aXZlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvcHlTdHlsZSA9IFsnZm9udC1mYW1pbHknLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnZm9udC1zaXplJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2ZvbnQtd2VpZ2h0JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2ZvbnQtc3R5bGUnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnbGV0dGVyLXNwYWNpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnbGluZS1oZWlnaHQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAndGV4dC10cmFuc2Zvcm0nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnd29yZC1zcGFjaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ3RleHQtaW5kZW50J107XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGV4aXQgaWYgZWxhc3RpYyBhbHJlYWR5IGFwcGxpZWQgKG9yIGlzIHRoZSBtaXJyb3IgZWxlbWVudClcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgkdGEuZGF0YSgnZWxhc3RpYycpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBPcGVyYSByZXR1cm5zIG1heC1oZWlnaHQgb2YgLTEgaWYgbm90IHNldFxuICAgICAgICAgICAgICAgICAgICAgICAgbWF4SGVpZ2h0ID0gbWF4SGVpZ2h0ICYmIG1heEhlaWdodCA+IDAgPyBtYXhIZWlnaHQgOiA5ZTQ7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGFwcGVuZCBtaXJyb3IgdG8gdGhlIERPTVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1pcnJvci5wYXJlbnROb2RlICE9PSBkb2N1bWVudC5ib2R5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYW5ndWxhci5lbGVtZW50KGRvY3VtZW50LmJvZHkpLmFwcGVuZChtaXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBzZXQgcmVzaXplIGFuZCBhcHBseSBlbGFzdGljXG4gICAgICAgICAgICAgICAgICAgICAgICAkdGEuY3NzKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAncmVzaXplJzogKHJlc2l6ZSA9PT0gJ25vbmUnIHx8IHJlc2l6ZSA9PT0gJ3ZlcnRpY2FsJykgPyAnbm9uZScgOiAnaG9yaXpvbnRhbCdcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pLmRhdGEoJ2VsYXN0aWMnLCB0cnVlKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLypcbiAgICAgICAgICAgICAgICAgICAgICAgICAqIG1ldGhvZHNcbiAgICAgICAgICAgICAgICAgICAgICAgICAqL1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiBpbml0TWlycm9yKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBtaXJyb3JTdHlsZSA9IG1pcnJvckluaXRTdHlsZTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1pcnJvcmVkID0gdGE7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gY29weSB0aGUgZXNzZW50aWFsIHN0eWxlcyBmcm9tIHRoZSB0ZXh0YXJlYSB0byB0aGUgbWlycm9yXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFTdHlsZSA9IGdldENvbXB1dGVkU3R5bGUodGEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFuZ3VsYXIuZm9yRWFjaChjb3B5U3R5bGUsIGZ1bmN0aW9uICh2YWwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWlycm9yU3R5bGUgKz0gdmFsICsgJzonICsgdGFTdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKHZhbCkgKyAnOyc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWlycm9yLnNldEF0dHJpYnV0ZSgnc3R5bGUnLCBtaXJyb3JTdHlsZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGFkanVzdCgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgdGFIZWlnaHQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhQ29tcHV0ZWRTdHlsZVdpZHRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaXJyb3JIZWlnaHQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvdmVyZmxvdztcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtaXJyb3JlZCAhPT0gdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5pdE1pcnJvcigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGFjdGl2ZSBmbGFnIHByZXZlbnRzIGFjdGlvbnMgaW4gZnVuY3Rpb24gZnJvbSBjYWxsaW5nIGFkanVzdCBhZ2FpblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghYWN0aXZlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGl2ZSA9IHRydWU7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWlycm9yLnZhbHVlID0gdGEudmFsdWUgKyBhcHBlbmQ7IC8vIG9wdGlvbmFsIHdoaXRlc3BhY2UgdG8gaW1wcm92ZSBhbmltYXRpb25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWlycm9yLnN0eWxlLm92ZXJmbG93WSA9IHRhLnN0eWxlLm92ZXJmbG93WTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YUhlaWdodCA9IHRhLnN0eWxlLmhlaWdodCA9PT0gJycgPyAnYXV0bycgOiBwYXJzZUludCh0YS5zdHlsZS5oZWlnaHQsIDEwKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YUNvbXB1dGVkU3R5bGVXaWR0aCA9IGdldENvbXB1dGVkU3R5bGUodGEpLmdldFByb3BlcnR5VmFsdWUoJ3dpZHRoJyk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gZW5zdXJlIGdldENvbXB1dGVkU3R5bGUgaGFzIHJldHVybmVkIGEgcmVhZGFibGUgJ3VzZWQgdmFsdWUnIHBpeGVsIHdpZHRoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0YUNvbXB1dGVkU3R5bGVXaWR0aC5zdWJzdHIodGFDb21wdXRlZFN0eWxlV2lkdGgubGVuZ3RoIC0gMiwgMikgPT09ICdweCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHVwZGF0ZSBtaXJyb3Igd2lkdGggaW4gY2FzZSB0aGUgdGV4dGFyZWEgd2lkdGggaGFzIGNoYW5nZWRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoID0gcGFyc2VJbnQodGFDb21wdXRlZFN0eWxlV2lkdGgsIDEwKSAtIGJveE91dGVyLndpZHRoO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWlycm9yLnN0eWxlLndpZHRoID0gd2lkdGggKyAncHgnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWlycm9ySGVpZ2h0ID0gbWlycm9yLnNjcm9sbEhlaWdodDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobWlycm9ySGVpZ2h0ID4gbWF4SGVpZ2h0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaXJyb3JIZWlnaHQgPSBtYXhIZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvdmVyZmxvdyA9ICdzY3JvbGwnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKG1pcnJvckhlaWdodCA8IG1pbkhlaWdodCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWlycm9ySGVpZ2h0ID0gbWluSGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1pcnJvckhlaWdodCArPSBib3hPdXRlci5oZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhLnN0eWxlLm92ZXJmbG93WSA9IG92ZXJmbG93IHx8ICdoaWRkZW4nO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0YUhlaWdodCAhPT0gbWlycm9ySGVpZ2h0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY29wZS4kZW1pdCgnZWxhc3RpYzpyZXNpemUnLCAkdGEsIHRhSGVpZ2h0LCBtaXJyb3JIZWlnaHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGEuc3R5bGUuaGVpZ2h0ID0gbWlycm9ySGVpZ2h0ICsgJ3B4JztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHNtYWxsIGRlbGF5IHRvIHByZXZlbnQgYW4gaW5maW5pdGUgbG9vcFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgMSwgZmFsc2UpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiBmb3JjZUFkanVzdCgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZGp1c3QoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgLypcbiAgICAgICAgICAgICAgICAgICAgICAgICAqIGluaXRpYWxpc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAqL1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBsaXN0ZW5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgnb25wcm9wZXJ0eWNoYW5nZScgaW4gdGEgJiYgJ29uaW5wdXQnIGluIHRhKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSUU5XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFbJ29uaW5wdXQnXSA9IHRhLm9ua2V5dXAgPSBhZGp1c3Q7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhWydvbmlucHV0J10gPSBhZGp1c3Q7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICR3aW4uYmluZCgncmVzaXplJywgZm9yY2VBZGp1c3QpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBzY29wZS4kd2F0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZ01vZGVsLiRtb2RlbFZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKG5ld1ZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yY2VBZGp1c3QoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBzY29wZS4kb24oJ2VsYXN0aWM6YWRqdXN0JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluaXRNaXJyb3IoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3JjZUFkanVzdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICR0aW1lb3V0KGFkanVzdCwgMCwgZmFsc2UpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvKlxuICAgICAgICAgICAgICAgICAgICAgICAgICogZGVzdHJveVxuICAgICAgICAgICAgICAgICAgICAgICAgICovXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHNjb3BlLiRvbignJGRlc3Ryb3knLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJG1pcnJvci5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkd2luLnVuYmluZCgncmVzaXplJywgZm9yY2VBZGp1c3QpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICBdKTtcblxuICAgIGFuZ3VsYXJcbiAgICAgICAgLm1vZHVsZSgnYXBwLm1lc3NhZ2VzJywgWydtb25vc3BhY2VkLmVsYXN0aWMnXSk7XG59KSgpO1xuXG5cblxuXG4iLCIoZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGFuZ3VsYXIubW9kdWxlKFwiYXBwLnByb2ZpbGVzXCIsIFsnYXBwLmF1dGgnXSk7XG59KSgpOyIsIihmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgYW5ndWxhci5tb2R1bGUoXCJhcHAuc2lkZW1lbnVcIiwgW10pO1xufSkoKTsiLCIoZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGFuZ3VsYXIubW9kdWxlKFwiYXBwLnVzZXJzXCIsIFsnYXBwLmF1dGgnXSk7XG59KSgpOyIsIihmdW5jdGlvbigpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBhbmd1bGFyLm1vZHVsZShcImFwcC5hdXRoXCIpXG5cbiAgICAgICAgLmNvbnRyb2xsZXIoXCJhdXRoQ29udHJvbGxlclwiLCBhdXRoQ29udHJvbGxlcik7XG5cblxuICAgIGZ1bmN0aW9uIGF1dGhDb250cm9sbGVyKCRzY29wZSwgYXV0aFNlcnZpY2UsICRpb25pY1BvcHVwLCAkaW9uaWNMb2FkaW5nLCAkc3RhdGUsICR0aW1lb3V0KSB7XG5cbiAgICAgICAgJHNjb3BlLmRhdGEgPSB7fTtcblxuICAgICAgICAkc2NvcGUubG9naW4gPSBmdW5jdGlvbigpIHtcblx0XHRcdCRpb25pY0xvYWRpbmcuc2hvdygpO1xuXG5cdFx0XHRhdXRoU2VydmljZS5sb2dpbigkc2NvcGUuZGF0YS51c2VybmFtZSwgJHNjb3BlLmRhdGEucGFzc3dvcmQpLnN1Y2Nlc3MoZnVuY3Rpb24odXNlcikge1xuXHRcdFx0XHQkaW9uaWNMb2FkaW5nLmhpZGUoKTtcblx0XHRcdFx0JHN0YXRlLmdvKCdhcHAuYnVpbGRpbmdzJyk7XG5cbiAgICAgICAgICAgIH0pLmVycm9yKGZ1bmN0aW9uKGVycm9yKSB7XG5cdFx0XHRcdCR0aW1lb3V0KGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdCRpb25pY0xvYWRpbmcuaGlkZSgpO1xuXHRcdFx0XHR9LCAxMDApO1xuXG4gICAgICAgICAgICAgICAgdmFyIGFsZXJ0UG9wdXAgPSAkaW9uaWNQb3B1cC5hbGVydCh7XG4gICAgICAgICAgICAgICAgICAgIHRpdGxlOiAnTG9naW4gZmFpbGVkIScsXG4gICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlOiBlcnJvci5tZXNzYWdlIC8vJ1BsZWFzZSBjaGVjayB5b3VyIGNyZWRlbnRpYWxzISdcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cblx0XHQkc2NvcGUuZmFjZWJvb2tMb2dpbiA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIGFsZXJ0UG9wdXAgPSAkaW9uaWNQb3B1cC5hbGVydCh7XG5cdFx0XHRcdHRpdGxlOiAnRmFjZWJvb2sgbG9naW4nLFxuXHRcdFx0XHR0ZW1wbGF0ZTogJ1BsYW5uZWQhJ1xuXHRcdFx0fSk7XG4gICAgICAgIH1cbiAgICB9XG59KSgpOyIsIihmdW5jdGlvbigpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBhbmd1bGFyLm1vZHVsZShcImFwcC5hdXRoXCIpXG5cbiAgICAgICAgLnNlcnZpY2UoXCJhdXRoU2VydmljZVwiLCBhdXRoU2VydmljZSk7XG5cblx0ZnVuY3Rpb24gY3JlYXRlVXNlcih1c2VybmFtZSwgcGFzc3dvcmQpIHtcblx0XHR2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuXHRcdHZhciBhdXRoID0gZmlyZWJhc2VTZXJ2aWNlLmZiLmF1dGgoKTtcblxuXHRcdHJldHVybiBhdXRoLmNyZWF0ZVVzZXJXaXRoRW1haWxBbmRQYXNzd29yZChlbWFpbCwgcGFzc3dvcmQpO1xuXHR9XG5cdFxuICAgIGZ1bmN0aW9uIGF1dGhTZXJ2aWNlKCRxLCAkcm9vdFNjb3BlLCBidWlsZGluZ3NTZXJ2aWNlLCBnbG9iYWxzU2VydmljZSkge1xuXHRcdHZhciBhdXRoID0gZmlyZWJhc2UuYXV0aCgpO1xuXHRcdFxuXHRcdCRyb290U2NvcGUuJG9uKCd1c2VyLWNoYW5nZWQnLCBmdW5jdGlvbigpIHtcblx0XHRcdHZhciB1c3IgPSBmaXJlYmFzZS5hdXRoKCkuY3VycmVudFVzZXI7XG5cdFx0XHRpZiAodXNyID09IG51bGwpIHJldHVybjtcblx0XHRcdFxuXHRcdFx0Z2xvYmFsc1NlcnZpY2UudXNlciA9IHVzcjtcblx0XHRcdFxuXHRcdFx0ZmlyZWJhc2UuZGF0YWJhc2UoKS5yZWYoJ3VzZXJzLycgKyB1c3IudWlkKS5zZXQoe1xuXHRcdFx0XHRuYW1lOiB1c3IuZGlzcGxheU5hbWUsXG5cdFx0XHRcdGVtYWlsOiB1c3IuZW1haWwsXG5cdFx0XHRcdGxhc3RBY3Rpdml0eTogbmV3IERhdGUoKS5nZXRUaW1lKClcblx0XHRcdH0pO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIHtcbiAgICAgICAgICAgIGxvZ2luOiBmdW5jdGlvbih1c2VybmFtZSwgcGFzc3dvcmQpIHtcbiAgICAgICAgICAgICAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuICAgICAgICAgICAgICAgIHZhciBwcm9taXNlID0gZGVmZXJyZWQucHJvbWlzZTtcblxuXHRcdFx0XHR2YXIgc3VjY2Vzc0hhbmRsZXIgPSBmdW5jdGlvbihpbmZvKSB7XG5cdFx0XHRcdFx0aW5mby5pc05ldyA9IGluZm8uZGlzcGxheU5hbWUgPT0gbnVsbDtcblx0XHRcdFx0XHRkZWZlcnJlZC5yZXNvbHZlKGluZm8pO1xuXHRcdFx0XHRcdFx0XHRcdFx0XG5cdFx0XHRcdFx0JHJvb3RTY29wZS4kZW1pdCgndXNlci1jaGFuZ2VkJyk7XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0dmFyIGVycm9ySGFuZGxlciA9IGZ1bmN0aW9uKGVycm9yKSB7XG5cdFx0XHRcdFx0ZGVmZXJyZWQucmVqZWN0KGVycm9yKTtcblx0XHRcdFx0fTtcblxuXHRcdFx0XHRhdXRoLnNpZ25JbldpdGhFbWFpbEFuZFBhc3N3b3JkKHVzZXJuYW1lLCBwYXNzd29yZClcblx0XHRcdFx0XHQudGhlbihzdWNjZXNzSGFuZGxlciwgZnVuY3Rpb24gZXJyb3IoZXJyb3IpIHtcblx0XHRcdFx0XHRcdGlmIChlcnJvci5jb2RlID09IFwiYXV0aC91c2VyLW5vdC1mb3VuZFwiKSB7XG5cdFx0XHRcdFx0XHRcdGF1dGguY3JlYXRlVXNlcldpdGhFbWFpbEFuZFBhc3N3b3JkKHVzZXJuYW1lLCBwYXNzd29yZClcblx0XHRcdFx0XHRcdFx0XHQudGhlbihzdWNjZXNzSGFuZGxlciwgZXJyb3JIYW5kbGVyKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRlcnJvckhhbmRsZXIoZXJyb3IpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0pO1xuXG4gICAgICAgICAgICAgICAgcHJvbWlzZS5zdWNjZXNzID0gZnVuY3Rpb24oZm4pIHtcbiAgICAgICAgICAgICAgICAgICAgcHJvbWlzZS50aGVuKGZuKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHByb21pc2UuZXJyb3IgPSBmdW5jdGlvbihmbikge1xuICAgICAgICAgICAgICAgICAgICBwcm9taXNlLnRoZW4obnVsbCwgZm4pO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgICAgICAgICB9LFxuXG5cdFx0XHRsb2dvdXQ6IGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0YXV0aC5zaWduT3V0KCk7XG5cdFx0XHRcdGdsb2JhbHNTZXJ2aWNlLnVzZXIgPSBudWxsO1xuXHRcdFx0fSxcblxuICAgICAgICAgICAgdXNlcjogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHJldHVybiBmaXJlYmFzZS5hdXRoKCkuY3VycmVudFVzZXI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59KSgpO1xuIiwiKGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBhbmd1bGFyLm1vZHVsZShcImFwcC5idWlsZGluZ3NcIilcblxuICAgICAgICAuY29udHJvbGxlcihcImJ1aWxkaW5nQ29udHJvbGxlclwiLCBidWlsZGluZ0NvbnRyb2xsZXIpO1xuXG5cbiAgICBmdW5jdGlvbiBidWlsZGluZ0NvbnRyb2xsZXIoJHNjb3BlLCAkaW9uaWNMb2FkaW5nLCAkc3RhdGVQYXJhbXMsIGNoYW5uZWxzU2VydmljZSkge1xuXG4gICAgICAgIHZhciByZWYgPSBjaGFubmVsc1NlcnZpY2UuZ2V0Q2hhbm5lbHNGcm9tKCRzdGF0ZVBhcmFtcy5idWlsZGluZ0lkKTtcblxuICAgICAgICAkaW9uaWNMb2FkaW5nLnNob3coKTtcbiAgICAgICAgcmVmLm9uKFwidmFsdWVcIiwgZnVuY3Rpb24gKHNuYXBzaG90KSB7XG4gICAgICAgICAgICB2YXIgdmFsID0gc25hcHNob3QudmFsKCk7XG5cbiAgICAgICAgICAgIGlmICh2YWwpIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUuY2hhbm5lbHMgPSB2YWwuY2hhbm5lbHM7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcblxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgJGlvbmljTG9hZGluZy5oaWRlKCk7XG5cbiAgICAgICAgfSwgZnVuY3Rpb24gKGVycm9yT2JqZWN0KSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcImVycm9yIHJlYWRpbmc6IFwiICsgZXJyb3JPYmplY3QuY29kZSk7XG4gICAgICAgICAgICB2YXIgYWxlcnRQb3B1cCA9ICRpb25pY1BvcHVwLmFsZXJ0KHtcbiAgICAgICAgICAgICAgICB0aXRsZTogJ09wcyEnLFxuICAgICAgICAgICAgICAgIHRlbXBsYXRlOiAnU29ycnkhIEFuIGVycm9yIG9jdXJyZWQuJ1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAkaW9uaWNMb2FkaW5nLmhpZGUoKTtcbiAgICAgICAgfSk7XG5cbiAgICB9XG59KSgpOyIsIihmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgYW5ndWxhci5tb2R1bGUoXCJhcHAuYnVpbGRpbmdzXCIpXG5cbiAgICAgICAgLmNvbnRyb2xsZXIoXCJidWlsZGluZ3NDb250cm9sbGVyXCIsIGJ1aWxkaW5nc0NvbnRyb2xsZXIpO1xuXG5cbiAgICBmdW5jdGlvbiBidWlsZGluZ3NDb250cm9sbGVyKCRzY29wZSwgJGlvbmljTG9hZGluZywgYnVpbGRpbmdzU2VydmljZSwgZ2xvYmFsc1NlcnZpY2UpIHtcbiAgICAgICAgdmFyIHJlZiA9IGJ1aWxkaW5nc1NlcnZpY2UuZ2V0QnVpbGRpbmdzKCk7XG5cdFx0XG5cdFx0JHNjb3BlLnNlbGVjdGVkS2V5ID0gZ2xvYmFsc1NlcnZpY2UuYnVpbGRpbmcgPyBnbG9iYWxzU2VydmljZS5idWlsZGluZy5rZXkgOiBudWxsO1xuXHRcdFxuXHRcdCRzY29wZS5zZWxlY3QgPSBmdW5jdGlvbihrZXksIGJ1aWxkaW5nKSB7XG5cdFx0XHQkc2NvcGUuc2VsZWN0ZWRLZXkgPSBidWlsZGluZy5rZXkgPSBrZXk7XG5cdFx0XHRnbG9iYWxzU2VydmljZS5idWlsZGluZyA9IGJ1aWxkaW5nO1xuXHRcdFx0JHNjb3BlLiRlbWl0KFwiYnVpbGRpbmctc2VsZWN0ZWRcIiwgYnVpbGRpbmcpO1xuXHRcdH07XHRcdFxuXG4gICAgICAgICRpb25pY0xvYWRpbmcuc2hvdygpO1xuICAgICAgICByZWYub24oXCJ2YWx1ZVwiLCBmdW5jdGlvbiAoc25hcHNob3QpIHtcbiAgICAgICAgICAgICRzY29wZS5idWlsZGluZ3MgPSBzbmFwc2hvdC52YWwoKTtcbiAgICAgICAgICAgICRpb25pY0xvYWRpbmcuaGlkZSgpO1xuICAgICAgICB9LCBmdW5jdGlvbiAoZXJyb3JPYmplY3QpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiZXJyb3IgcmVhZGluZzogXCIgKyBlcnJvck9iamVjdC5jb2RlKTtcbiAgICAgICAgICAgIHZhciBhbGVydFBvcHVwID0gJGlvbmljUG9wdXAuYWxlcnQoe1xuICAgICAgICAgICAgICAgIHRpdGxlOiAnT3BzIScsXG4gICAgICAgICAgICAgICAgdGVtcGxhdGU6ICdTb3JyeSEgQW4gZXJyb3Igb2N1cnJlZCdcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgJGlvbmljTG9hZGluZy5oaWRlKCk7XG4gICAgICAgIH0pO1xuICAgIH1cbn0pKCk7IiwiKGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBhbmd1bGFyXG4gICAgICAgIC5tb2R1bGUoJ2FwcC5idWlsZGluZ3MnKVxuICAgICAgICAuc2VydmljZSgnYnVpbGRpbmdzU2VydmljZScsIGJ1aWxkaW5nc1NlcnZpY2UpO1xuXG4gICAgZnVuY3Rpb24gYnVpbGRpbmdzU2VydmljZShmaXJlYmFzZVNlcnZpY2UsICRyb290U2NvcGUpIHtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZ2V0QnVpbGRpbmdzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZpcmViYXNlLmRhdGFiYXNlKCkucmVmKCdidWlsZGluZ3MnKVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufSkoKTtcbiIsIihmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgYW5ndWxhclxuICAgICAgICAubW9kdWxlKCdhcHAuY2hhbm5lbHMnKVxuICAgICAgICAuc2VydmljZSgnY2hhbm5lbHNTZXJ2aWNlJywgY2hhbm5lbHNTZXJ2aWNlKTtcblxuICAgIGZ1bmN0aW9uIGNoYW5uZWxzU2VydmljZSgkcm9vdFNjb3BlKSB7XG5cdFx0dmFyIHNlcnZpY2UgPSB7fTtcblx0XHRcblx0XHRzZXJ2aWNlLmNoYW5uZWxzID0ge1xuXHRcdFx0XCJsYW5kbG9yZFwiOiBcIlRhbGsgdG8gbGFuZGxvcmRcIixcblx0XHRcdFwiZ2VuZXJhbFwiOiBcIkdlbmVyYWxcIixcblx0XHRcdFwicGFya2luZ1wiOiBcIlBhcmtpbmcgR2FyYWdlXCIsXG5cdFx0XHRcImdhcmRlblwiOiBcIkdhcmRlblwiLFxuXHRcdFx0XCJsb3N0Zm91bmRcIjogXCJMb3N0ICYgRm91bmRcIixcblx0XHRcdFwibWFpbnRlbmFuY2VcIjogXCJSZXF1ZXN0IE1haW50ZW5hbmNlXCJcblx0XHR9O1xuXHRcdFxuXHRcdCRyb290U2NvcGUuJG9uKFwiYnVpbGRpbmctc2VsZWN0ZWRcIiwgZnVuY3Rpb24oYnVpbGRpbmcpIHtcblx0XHRcdC8vY291bnQgaG93IG1hbnkgbmV3IG1lc3NhZ2VzIGVhY2ggY2hhbm5lbCBoYXNcblx0XHR9KTtcblx0XHRcblx0XHRzZXJ2aWNlLmdldENoYW5uZWxzRnJvbSA9IGZ1bmN0aW9uIChidWlsZGluZykge1xuXHRcdFx0cmV0dXJuIGZpcmViYXNlLmRhdGFiYXNlKCkucmVmKCdidWlsZGluZ3MvJyArIGJ1aWxkaW5nICsgXCIvY2hhbm5lbHNcIik7XG5cdFx0fTtcblxuICAgICAgICByZXR1cm4gc2VydmljZTtcbiAgICB9XG59KSgpO1xuXG4iLCIoZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGFuZ3VsYXJcbiAgICAgICAgLm1vZHVsZSgnYXBwLmZpcmViYXNlJylcbiAgICAgICAgLnNlcnZpY2UoJ2ZpcmViYXNlU2VydmljZScsIGZpcmViYXNlU2VydmljZSk7XG5cblxuICAgIGZ1bmN0aW9uIGZpcmViYXNlU2VydmljZSgpIHtcbiAgICAgICAgdmFyIGNvbmZpZyA9IHtcbiAgICAgICAgICAgIGFwaUtleTogXCJBSXphU3lCNXE4MUFHR294NGk4LVFMMktPdG5ERGZpMDVpcmdjSEVcIixcbiAgICAgICAgICAgIGF1dGhEb21haW46IFwic29jaWFsc3RyYXRhaWRlYXRlYW0uZmlyZWJhc2VhcHAuY29tXCIsXG4gICAgICAgICAgICBkYXRhYmFzZVVSTDogXCJodHRwczovL3NvY2lhbHN0cmF0YWlkZWF0ZWFtLmZpcmViYXNlaW8uY29tXCIsXG4gICAgICAgICAgICBzdG9yYWdlQnVja2V0OiBcIlwiLFxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZmIgPSBmaXJlYmFzZS5pbml0aWFsaXplQXBwKGNvbmZpZyk7XG4gICAgfVxufSkoKTtcbiIsIihmdW5jdGlvbigpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBhbmd1bGFyXG4gICAgICAgIC5tb2R1bGUoJ2FwcC5tZXNzYWdlcycpXG4gICAgICAgIC5jb250cm9sbGVyKCdtZXNzYWdlc0NvbnRyb2xsZXInLCBbXG4gICAgICAgICAgICAnJHNjb3BlJyxcbiAgICAgICAgICAgICckc3RhdGUnLFxuICAgICAgICAgICAgJyRzdGF0ZVBhcmFtcycsXG4gICAgICAgICAgICAnJGlvbmljU2Nyb2xsRGVsZWdhdGUnLFxuICAgICAgICAgICAgJ2NoYW5uZWxzU2VydmljZScsXG4gICAgICAgICAgICAnZ2xvYmFsc1NlcnZpY2UnLFxuICAgICAgICAgICAgTWVzc2FnZXNDb250cm9sbGVyXG4gICAgICAgIF0pO1xuXG4gICAgZnVuY3Rpb24gTWVzc2FnZXNDb250cm9sbGVyKCRzY29wZSwgJHN0YXRlLCAkc3RhdGVQYXJhbXMsICRpb25pY1Njcm9sbERlbGVnYXRlLCBjaGFubmVsc1NlcnZpY2UsIGdsb2JhbHNTZXJ2aWNlKSB7XG4gICAgICAgIC8vYXZhaWxhYmxlIHNlcnZpY2VzXG4gICAgICAgIHRoaXMuJHNjb3BlID0gJHNjb3BlO1xuICAgICAgICB0aGlzLiRzdGF0ZSA9ICRzdGF0ZTtcbiAgICAgICAgdGhpcy4kc3RhdGVQYXJhbXMgPSAkc3RhdGVQYXJhbXM7XG4gICAgICAgIHRoaXMuJGlvbmljU2Nyb2xsRGVsZWdhdGUgPSAkaW9uaWNTY3JvbGxEZWxlZ2F0ZTtcbiAgICAgICAgdGhpcy5jaGFubmVsc1NlcnZpY2UgPSBjaGFubmVsc1NlcnZpY2U7XG5cdFx0dGhpcy5nbG9iYWxzU2VydmljZSA9IGdsb2JhbHNTZXJ2aWNlO1xuXG5cdFx0aWYgKCF0aGlzLnZhbGlkYXRlKCkpXG5cdFx0XHRyZXR1cm4gZmFsc2U7XG4gICAgICAgIFxuICAgICAgICAvL2N1c3RvbSBwcm9wZXJ0aWVzXG4gICAgICAgIHRoaXMuYnVpbGRpbmdLZXkgPSBnbG9iYWxzU2VydmljZS5idWlsZGluZy5rZXk7XG4gICAgICAgIHRoaXMuY2hhbm5lbEtleSA9IHRoaXMuJHN0YXRlUGFyYW1zLmNoYW5uZWxJZDtcbiAgICAgICAgdGhpcy5tZXNzYWdlc1JlZiA9IGZpcmViYXNlLmRhdGFiYXNlKCkucmVmKFsnYnVpbGRpbmdzJywgdGhpcy5idWlsZGluZ0tleSwgJ21lc3NhZ2VzJ10uam9pbignLycpKTtcblx0XHR0aGlzLm1lc3NhZ2VzUmVmLm9uKCdjaGlsZF9hZGRlZCcsIGZ1bmN0aW9uKHMpIHtcblx0XHRcdGNvbnNvbGUubG9nKHMudmFsKCkpO1xuXHRcdH0pO1xuXHRcdFxuICAgICAgICAkc2NvcGUudXNlciA9IHtcbiAgICAgICAgICAgIF9pZDogXCI1MzRiOGZiMmFhNWU3YWZjMWIyM2U2OWNcIiwgLy8kc2NvcGUudXNlci51aWQsXG4gICAgICAgICAgICBwaWM6ICdodHRwOi8vaW9uaWNmcmFtZXdvcmsuY29tL2ltZy9kb2NzL21jZmx5LmpwZycsXG4gICAgICAgICAgICB1c2VybmFtZTogZ2xvYmFsc1NlcnZpY2UudXNlci5kaXNwbGF5TmFtZSA/IGdsb2JhbHNTZXJ2aWNlLnVzZXIuZGlzcGxheU5hbWUgOiAnQW5vbnltb3VzJ1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS50b1VzZXI7XG5cbiAgICAgICAgLy9VSSBlbGVtZW50c1xuICAgICAgICB0aGlzLnZpZXdTY3JvbGwgPSAkaW9uaWNTY3JvbGxEZWxlZ2F0ZS4kZ2V0QnlIYW5kbGUoJ3VzZXJNZXNzYWdlU2Nyb2xsJyk7XG5cbiAgICAgICAgLy9ldmVudHNcbiAgICAgICAgJHNjb3BlLiRvbihcImNoYXQtcmVjZWl2ZS1tZXNzYWdlXCIsIHRoaXMub25SZWNlaXZlTWVzc2FnZSk7XG5cbiAgICAgICAgdGhpcy5pbml0KCk7XG4gICAgfVxuXHRcblx0TWVzc2FnZXNDb250cm9sbGVyLnByb3RvdHlwZS52YWxpZGF0ZSA9IGZ1bmN0aW9uKCkge1xuXHRcdGlmICghdGhpcy5nbG9iYWxzU2VydmljZS51c2VyKSB7XG4gICAgICAgICAgICB0aGlzLiRzdGF0ZS5nbygnbG9naW4nKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXHRcdFxuXHRcdGlmICghdGhpcy5nbG9iYWxzU2VydmljZS5idWlsZGluZykge1xuICAgICAgICAgICAgdGhpcy4kc3RhdGUuZ28oJ2FwcC5idWlsZGluZ3MnKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXHRcdFxuXHRcdHJldHVybiB0cnVlO1xuXHR9O1xuXG4gICAgLy9DaGVjayBpZiBpcyBhIENvbW1vbiBSb29tIG9yIERpcmVjdCBNZXNzYWdlXG4gICAgTWVzc2FnZXNDb250cm9sbGVyLnByb3RvdHlwZS5pbml0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcblx0XHRcbiAgICAgICAgdmFyIGNoYW5uZWxQYXRoID0gWydidWlsZGluZ3MnLCB0aGlzLmJ1aWxkaW5nS2V5LCAnY2hhbm5lbHMnLCB0aGlzLiRzdGF0ZVBhcmFtcy5jaGFubmVsSWRdLmpvaW4oJy8nKTtcbiAgICAgICAgY29uc29sZS5sb2coY2hhbm5lbFBhdGgpO1xuXG4gICAgICAgIHZhciBjaGFubmVsUmVmID0gZmlyZWJhc2UuZGF0YWJhc2UoKS5yZWYoY2hhbm5lbFBhdGgpO1xuICAgICAgICBjaGFubmVsUmVmLm9uKCd2YWx1ZScsIGZ1bmN0aW9uKHNuYXBzaG90KSB7XG4gICAgICAgICAgICBzZWxmLmNoYW5uZWwgPSBzbmFwc2hvdC52YWwoKTtcblxuICAgICAgICAgICAgaWYgKHNlbGYuY2hhbm5lbC50eXBlID09IFwiZGlyZWN0XCIpIHsgLy9kaXJlY3QgbWVzc2FnZVxuICAgICAgICAgICAgICAgIHNlbGYuc2V0Q29udGFjdChzZWxmLmNoYW5uZWwudXNlcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHsgLy9Db21tb24gcm9vbVxuICAgICAgICAgICAgICAgIHNlbGYuZ2V0TGFzdE1lc3NhZ2VzKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBNZXNzYWdlc0NvbnRyb2xsZXIucHJvdG90eXBlLnNldENvbnRhY3QgPSBmdW5jdGlvbih1aWQpIHtcblx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cdFx0XG4gICAgICAgIHZhciBjb250YWN0UGF0aCA9IFsndXNlcnMnLCB1aWRdLmpvaW4oJy8nKTtcbiAgICAgICAgY29uc29sZS5sb2coY29udGFjdFBhdGgpO1xuXG4gICAgICAgIGZpcmViYXNlLmRhdGFiYXNlKCkucmVmKGNvbnRhY3RQYXRoKS5vbigndmFsdWUnLCBmdW5jdGlvbihzbmFwc2hvdCkge1xuICAgICAgICAgICAgdmFyIGNvbnRhY3QgPSBzbmFwc2hvdC52YWwoKTtcbiAgICAgICAgICAgIHNlbGYuJHNjb3BlLnRvVXNlciA9IHtcbiAgICAgICAgICAgICAgICBfaWQ6IFwiNTM0YjhlNWFhYTVlN2FmYzFiMjNlNjliXCIsIC8vdXNlci51aWQsXG4gICAgICAgICAgICAgICAgcGljOiAnaHR0cDovL2lvbmljZnJhbWV3b3JrLmNvbS9pbWcvZG9jcy9tY2ZseS5qcGcnLFxuICAgICAgICAgICAgICAgIHVzZXJuYW1lOiBjb250YWN0ICYmIGNvbnRhY3QuZGlzcGxheU5hbWUgPyBjb250YWN0LmRpc3BsYXlOYW1lIDogJ0Fub255bW91cydcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHNlbGYuZ2V0TGFzdE1lc3NhZ2VzKCk7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBNZXNzYWdlc0NvbnRyb2xsZXIucHJvdG90eXBlLmdldExhc3RNZXNzYWdlcyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBcbiAgICAgICAgLy9wcmVzZW50IGxhc3QgMzAgbWVzc2FnZXNcbiAgICAgICAgdGhpcy4kc2NvcGUubWVzc2FnZXMgPSBbe1xuICAgICAgICAgICAgXCJfaWRcIjogXCI1MzVkNjI1Zjg5OGRmNGU4MGUyYTEyNWVcIixcbiAgICAgICAgICAgIFwidGV4dFwiOiBcIklvbmljIGhhcyBjaGFuZ2VkIHRoZSBnYW1lIGZvciBoeWJyaWQgYXBwIGRldmVsb3BtZW50LlwiLFxuICAgICAgICAgICAgXCJ1c2VySWRcIjogXCI1MzRiOGZiMmFhNWU3YWZjMWIyM2U2OWNcIixcbiAgICAgICAgICAgIFwiZGF0ZVwiOiBcIjIwMTQtMDQtMjdUMjA6MDI6MzkuMDgyWlwiLFxuICAgICAgICAgICAgXCJyZWFkXCI6IHRydWUsXG4gICAgICAgICAgICBcInJlYWREYXRlXCI6IFwiMjAxNC0xMi0wMVQwNjoyNzozNy45NDRaXCJcbiAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgIFwiX2lkXCI6IFwiNTM1ZjEzZmZlZTNiMmE2ODExMmI5ZmMwXCIsXG4gICAgICAgICAgICAgICAgXCJ0ZXh0XCI6IFwiSSBsaWtlIElvbmljIGJldHRlciB0aGFuIGljZSBjcmVhbSFcIixcbiAgICAgICAgICAgICAgICBcInVzZXJJZFwiOiBcIjUzNGI4ZTVhYWE1ZTdhZmMxYjIzZTY5YlwiLFxuICAgICAgICAgICAgICAgIFwiZGF0ZVwiOiBcIjIwMTQtMDQtMjlUMDI6NTI6NDcuNzA2WlwiLFxuICAgICAgICAgICAgICAgIFwicmVhZFwiOiB0cnVlLFxuICAgICAgICAgICAgICAgIFwicmVhZERhdGVcIjogXCIyMDE0LTEyLTAxVDA2OjI3OjM3Ljk0NFpcIlxuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgIFwiX2lkXCI6IFwiNTQ2YTU4NDNmZDRjNWQ1ODFlZmEyNjNhXCIsXG4gICAgICAgICAgICAgICAgXCJ0ZXh0XCI6IFwiTG9yZW0gaXBzdW0gZG9sb3Igc2l0IGFtZXQsIGNvbnNlY3RldHVyIGFkaXBpc2NpbmcgZWxpdCwgc2VkIGRvIGVpdXNtb2QgdGVtcG9yIGluY2lkaWR1bnQgdXQgbGFib3JlIGV0IGRvbG9yZSBtYWduYSBhbGlxdWEuIFV0IGVuaW0gYWQgbWluaW0gdmVuaWFtLCBxdWlzIG5vc3RydWQgZXhlcmNpdGF0aW9uIHVsbGFtY28gbGFib3JpcyBuaXNpIHV0IGFsaXF1aXAgZXggZWEgY29tbW9kbyBjb25zZXF1YXQuIER1aXMgYXV0ZSBpcnVyZSBkb2xvciBpbiByZXByZWhlbmRlcml0IGluIHZvbHVwdGF0ZSB2ZWxpdCBlc3NlIGNpbGx1bSBkb2xvcmUgZXUgZnVnaWF0IG51bGxhIHBhcmlhdHVyLiBFeGNlcHRldXIgc2ludCBvY2NhZWNhdCBjdXBpZGF0YXQgbm9uIHByb2lkZW50LCBzdW50IGluIGN1bHBhIHF1aSBvZmZpY2lhIGRlc2VydW50IG1vbGxpdCBhbmltIGlkIGVzdCBsYWJvcnVtLlwiLFxuICAgICAgICAgICAgICAgIFwidXNlcklkXCI6IFwiNTM0YjhmYjJhYTVlN2FmYzFiMjNlNjljXCIsXG4gICAgICAgICAgICAgICAgXCJkYXRlXCI6IFwiMjAxNC0xMS0xN1QyMDoxOToxNS4yODlaXCIsXG4gICAgICAgICAgICAgICAgXCJyZWFkXCI6IHRydWUsXG4gICAgICAgICAgICAgICAgXCJyZWFkRGF0ZVwiOiBcIjIwMTQtMTItMDFUMDY6Mjc6MzguMzI4WlwiXG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgXCJfaWRcIjogXCI1NDc2NDM5OWFiNDNkMWQ0MTEzYWJmZDFcIixcbiAgICAgICAgICAgICAgICBcInRleHRcIjogXCJBbSBJIGRyZWFtaW5nP1wiLFxuICAgICAgICAgICAgICAgIFwidXNlcklkXCI6IFwiNTM0YjhlNWFhYTVlN2FmYzFiMjNlNjliXCIsXG4gICAgICAgICAgICAgICAgXCJkYXRlXCI6IFwiMjAxNC0xMS0yNlQyMToxODoxNy41OTFaXCIsXG4gICAgICAgICAgICAgICAgXCJyZWFkXCI6IHRydWUsXG4gICAgICAgICAgICAgICAgXCJyZWFkRGF0ZVwiOiBcIjIwMTQtMTItMDFUMDY6Mjc6MzguMzM3WlwiXG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgXCJfaWRcIjogXCI1NDc2NDNhZWFiNDNkMWQ0MTEzYWJmZDJcIixcbiAgICAgICAgICAgICAgICBcInRleHRcIjogXCJJcyB0aGlzIG1hZ2ljP1wiLFxuICAgICAgICAgICAgICAgIFwidXNlcklkXCI6IFwiNTM0YjhmYjJhYTVlN2FmYzFiMjNlNjljXCIsXG4gICAgICAgICAgICAgICAgXCJkYXRlXCI6IFwiMjAxNC0xMS0yNlQyMToxODozOC41NDlaXCIsXG4gICAgICAgICAgICAgICAgXCJyZWFkXCI6IHRydWUsXG4gICAgICAgICAgICAgICAgXCJyZWFkRGF0ZVwiOiBcIjIwMTQtMTItMDFUMDY6Mjc6MzguMzM4WlwiXG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgXCJfaWRcIjogXCI1NDc4MTVkYmFiNDNkMWQ0MTEzYWJmZWZcIixcbiAgICAgICAgICAgICAgICBcInRleHRcIjogXCJHZWUgd2l6LCB0aGlzIGlzIHNvbWV0aGluZyBzcGVjaWFsLlwiLFxuICAgICAgICAgICAgICAgIFwidXNlcklkXCI6IFwiNTM0YjhlNWFhYTVlN2FmYzFiMjNlNjliXCIsXG4gICAgICAgICAgICAgICAgXCJkYXRlXCI6IFwiMjAxNC0xMS0yOFQwNjoyNzo0MC4wMDFaXCIsXG4gICAgICAgICAgICAgICAgXCJyZWFkXCI6IHRydWUsXG4gICAgICAgICAgICAgICAgXCJyZWFkRGF0ZVwiOiBcIjIwMTQtMTItMDFUMDY6Mjc6MzguMzM4WlwiXG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgXCJfaWRcIjogXCI1NDc4MWM2OWFiNDNkMWQ0MTEzYWJmZjBcIixcbiAgICAgICAgICAgICAgICBcInRleHRcIjogXCJJIHRoaW5rIEkgbGlrZSBJb25pYyBtb3JlIHRoYW4gSSBsaWtlIGljZSBjcmVhbSFcIixcbiAgICAgICAgICAgICAgICBcInVzZXJJZFwiOiBcIjUzNGI4ZmIyYWE1ZTdhZmMxYjIzZTY5Y1wiLFxuICAgICAgICAgICAgICAgIFwiZGF0ZVwiOiBcIjIwMTQtMTEtMjhUMDY6NTU6MzcuMzUwWlwiLFxuICAgICAgICAgICAgICAgIFwicmVhZFwiOiB0cnVlLFxuICAgICAgICAgICAgICAgIFwicmVhZERhdGVcIjogXCIyMDE0LTEyLTAxVDA2OjI3OjM4LjMzOFpcIlxuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgIFwiX2lkXCI6IFwiNTQ3ODFjYTRhYjQzZDFkNDExM2FiZmYxXCIsXG4gICAgICAgICAgICAgICAgXCJ0ZXh0XCI6IFwiWWVhLCBpdCdzIHByZXR0eSBzd2VldFwiLFxuICAgICAgICAgICAgICAgIFwidXNlcklkXCI6IFwiNTM0YjhlNWFhYTVlN2FmYzFiMjNlNjliXCIsXG4gICAgICAgICAgICAgICAgXCJkYXRlXCI6IFwiMjAxNC0xMS0yOFQwNjo1NjozNi40NzJaXCIsXG4gICAgICAgICAgICAgICAgXCJyZWFkXCI6IHRydWUsXG4gICAgICAgICAgICAgICAgXCJyZWFkRGF0ZVwiOiBcIjIwMTQtMTItMDFUMDY6Mjc6MzguMzM4WlwiXG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgXCJfaWRcIjogXCI1NDc4ZGY4NmFiNDNkMWQ0MTEzYWJmZjRcIixcbiAgICAgICAgICAgICAgICBcInRleHRcIjogXCJXb3csIHRoaXMgaXMgcmVhbGx5IHNvbWV0aGluZyBodWg/XCIsXG4gICAgICAgICAgICAgICAgXCJ1c2VySWRcIjogXCI1MzRiOGZiMmFhNWU3YWZjMWIyM2U2OWNcIixcbiAgICAgICAgICAgICAgICBcImRhdGVcIjogXCIyMDE0LTExLTI4VDIwOjQ4OjA2LjU3MlpcIixcbiAgICAgICAgICAgICAgICBcInJlYWRcIjogdHJ1ZSxcbiAgICAgICAgICAgICAgICBcInJlYWREYXRlXCI6IFwiMjAxNC0xMi0wMVQwNjoyNzozOC4zMzlaXCJcbiAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICBcIl9pZFwiOiBcIjU0NzgxY2E0YWI0M2QxZDQxMTNhYmZmMVwiLFxuICAgICAgICAgICAgICAgIFwidGV4dFwiOiBcIkNyZWF0ZSBhbWF6aW5nIGFwcHMgLSBpb25pY2ZyYW1ld29yay5jb21cIixcbiAgICAgICAgICAgICAgICBcInVzZXJJZFwiOiBcIjUzNGI4ZTVhYWE1ZTdhZmMxYjIzZTY5YlwiLFxuICAgICAgICAgICAgICAgIFwiZGF0ZVwiOiBcIjIwMTQtMTEtMjlUMDY6NTY6MzYuNDcyWlwiLFxuICAgICAgICAgICAgICAgIFwicmVhZFwiOiB0cnVlLFxuICAgICAgICAgICAgICAgIFwicmVhZERhdGVcIjogXCIyMDE0LTEyLTAxVDA2OjI3OjM4LjMzOFpcIlxuICAgICAgICAgICAgfV07XG4gICAgfTtcblxuICAgIE1lc3NhZ2VzQ29udHJvbGxlci5wcm90b3R5cGUub25SZWNlaXZlTWVzc2FnZSA9IGZ1bmN0aW9uKCkge1xuXG4gICAgfTtcblxuICAgIE1lc3NhZ2VzQ29udHJvbGxlci5wcm90b3R5cGUuc2VuZE1lc3NhZ2UgPSBmdW5jdGlvbihzZW5kTWVzc2FnZUZvcm0pIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIHZhciBtZXNzYWdlID0ge1xuICAgICAgICAgICAgdG9JZDogJHNjb3BlLnRvVXNlci5faWQsXG4gICAgICAgICAgICB0ZXh0OiAkc2NvcGUuaW5wdXQubWVzc2FnZVxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIGlmIHlvdSBkbyBhIHdlYiBzZXJ2aWNlIGNhbGwgdGhpcyB3aWxsIGJlIG5lZWRlZCBhcyB3ZWxsIGFzIGJlZm9yZSB0aGUgdmlld1Njcm9sbCBjYWxsc1xuICAgICAgICAvLyB5b3UgY2FuJ3Qgc2VlIHRoZSBlZmZlY3Qgb2YgdGhpcyBpbiB0aGUgYnJvd3NlciBpdCBuZWVkcyB0byBiZSB1c2VkIG9uIGEgcmVhbCBkZXZpY2VcbiAgICAgICAgLy8gZm9yIHNvbWUgcmVhc29uIHRoZSBvbmUgdGltZSBibHVyIGV2ZW50IGlzIG5vdCBmaXJpbmcgaW4gdGhlIGJyb3dzZXIgYnV0IGRvZXMgb24gZGV2aWNlc1xuICAgICAgICAvLyBrZWVwS2V5Ym9hcmRPcGVuKCk7XG5cbiAgICAgICAgLy9Nb2NrU2VydmljZS5zZW5kTWVzc2FnZShtZXNzYWdlKS50aGVuKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgJHNjb3BlLmlucHV0Lm1lc3NhZ2UgPSAnJztcblxuICAgICAgICBtZXNzYWdlLl9pZCA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpOyAvLyA6filcbiAgICAgICAgbWVzc2FnZS5kYXRlID0gbmV3IERhdGUoKTtcbiAgICAgICAgbWVzc2FnZS51c2VybmFtZSA9ICRzY29wZS51c2VyLnVzZXJuYW1lO1xuICAgICAgICBtZXNzYWdlLnVzZXJJZCA9ICRzY29wZS51c2VyLl9pZDtcbiAgICAgICAgbWVzc2FnZS5waWMgPSAkc2NvcGUudXNlci5waWN0dXJlO1xuXG4gICAgICAgICRzY29wZS5tZXNzYWdlcy5wdXNoKG1lc3NhZ2UpO1xuXG4gICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAga2VlcEtleWJvYXJkT3BlbigpO1xuICAgICAgICAgICAgc2VsZi52aWV3U2Nyb2xsLnNjcm9sbEJvdHRvbSh0cnVlKTtcbiAgICAgICAgfSwgMCk7XG5cbiAgICAgICAgLy8gJHRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vICAgICAkc2NvcGUubWVzc2FnZXMucHVzaChNb2NrU2VydmljZS5nZXRNb2NrTWVzc2FnZSgpKTtcbiAgICAgICAgLy8gICAgIGtlZXBLZXlib2FyZE9wZW4oKTtcbiAgICAgICAgLy8gICAgIHNlbGYudmlld1Njcm9sbC5zY3JvbGxCb3R0b20odHJ1ZSk7XG4gICAgICAgIC8vIH0sIDIwMDApO1xuXG4gICAgfTtcblxuXG5cblxuXG5cblxuXG5cblxuICAgIC8qXG4gICAgYW5ndWxhclxuICAgICAgICAgICAgLm1vZHVsZSgnYXBwLm1lc3NhZ2VzJylcbiAgICBcbiAgICAgICAgICAgIC5jb250cm9sbGVyKCdtZXNzYWdlc0NvbnRyb2xsZXInLCBbJyRzY29wZScsICckcm9vdFNjb3BlJywgJyRzdGF0ZScsXG4gICAgICAgICAgICAgICAgJyRzdGF0ZVBhcmFtcycsICckaW9uaWNBY3Rpb25TaGVldCcsXG4gICAgICAgICAgICAgICAgJyRpb25pY1BvcHVwJywgJyRpb25pY1Njcm9sbERlbGVnYXRlJywgJyR0aW1lb3V0JywgJyRpbnRlcnZhbCcsXG4gICAgICAgICAgICAgICAgJ2NoYW5uZWxzU2VydmljZScsICdhdXRoU2VydmljZScsXG4gICAgICAgICAgICAgICAgbWVzc2FnZXNDb250cm9sbGVyXG4gICAgICAgICAgICBdKTtcbiAgICAgICAgXHRcbiAgICAgICAgZnVuY3Rpb24gbWVzc2FnZXNDb250cm9sbGVyKCRzY29wZSwgJHJvb3RTY29wZSwgJHN0YXRlLCAkc3RhdGVQYXJhbXMsICRpb25pY0FjdGlvblNoZWV0LFxuICAgICAgICAgICAgJGlvbmljUG9wdXAsICRpb25pY1Njcm9sbERlbGVnYXRlLCAkdGltZW91dCwgJGludGVydmFsLCBjaGFubmVsc1NlcnZpY2UsIGF1dGhTZXJ2aWNlKSB7XG4gICAgXG4gICAgICAgICAgICAkc2NvcGUuY2hhbm5lbElkID0gJHN0YXRlLnBhcmFtcy5jaGFubmVsSWQ7XG4gICAgICAgICAgICAkc2NvcGUuY2hhbm5lbE5hbWUgPSBjaGFubmVsc1NlcnZpY2UuY2hhbm5lbHNbJHNjb3BlLmNoYW5uZWxJZF07XG4gICAgICAgICAgICAkc2NvcGUudXNlciA9IGF1dGhTZXJ2aWNlLnVzZXIoKTtcbiAgICBcbiAgICAgICAgICAgIGlmICghJHNjb3BlLnVzZXIpIHtcbiAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2xvZ2luJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgJHNjb3BlLnVzZXIgPSB7XG4gICAgICAgICAgICAgICAgX2lkOiAkc2NvcGUudXNlci51aWQsXG4gICAgICAgICAgICAgICAgcGljOiAnaHR0cDovL2lvbmljZnJhbWV3b3JrLmNvbS9pbWcvZG9jcy9tY2ZseS5qcGcnLFxuICAgICAgICAgICAgICAgIHVzZXJuYW1lOiAkc2NvcGUudXNlciAmJiAkc2NvcGUudXNlci5kaXNwbGF5TmFtZSA/ICRzY29wZS51c2VyLmRpc3BsYXlOYW1lID8gJ0Fub255bW91cyc7XG4gICAgICAgICAgICB9O1xuICAgIFxuICAgICAgICAgICAgLy8gbW9jayBhY3F1aXJpbmcgZGF0YSB2aWEgJHN0YXRlUGFyYW1zXG4gICAgICAgICAgICAkc2NvcGUudG9Vc2VyID0gbnVsbDtcbiAgICAgICAgICAgIGlmICgkc2NvcGUuY2hhbm5lbElkID09IFwibGFuZGxvcmRcIikge1xuICAgICAgICAgICAgICAgICRcbiAgICAgICAgICAgICAgICAkc2NvcGUudG9Vc2VyID0ge1xuICAgICAgICAgICAgICAgICAgICBfaWQ6ICc1MzRiOGU1YWFhNWU3YWZjMWIyM2U2OWInLFxuICAgICAgICAgICAgICAgICAgICBwaWM6ICdodHRwOi8vaW9uaWNmcmFtZXdvcmsuY29tL2ltZy9kb2NzL3ZlbmttYW4uanBnJyxcbiAgICAgICAgICAgICAgICAgICAgY2hhbm5lbDogJHNjb3BlLmNoYW5uZWxJZFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICRzY29wZS5pbnB1dCA9IHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiBsb2NhbFN0b3JhZ2VbJ3VzZXJNZXNzYWdlLScgKyAkc2NvcGUudG9Vc2VyLl9pZF0gfHwgJydcbiAgICAgICAgICAgIH07XG4gICAgXG4gICAgICAgICAgICB2YXIgbWVzc2FnZUNoZWNrVGltZXI7XG4gICAgXG4gICAgICAgICAgICB2YXIgdmlld1Njcm9sbCA9ICRpb25pY1Njcm9sbERlbGVnYXRlLiRnZXRCeUhhbmRsZSgndXNlck1lc3NhZ2VTY3JvbGwnKTtcbiAgICAgICAgICAgIHZhciBmb290ZXJCYXI7IC8vIGdldHMgc2V0IGluICRpb25pY1ZpZXcuZW50ZXJcbiAgICAgICAgICAgIHZhciBzY3JvbGxlcjtcbiAgICAgICAgICAgIHZhciB0eHRJbnB1dDsgLy8gXl5eXG4gICAgXG4gICAgICAgICAgICAkc2NvcGUuJG9uKCckaW9uaWNWaWV3LmVudGVyJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1VzZXJNZXNzYWdlcyAkaW9uaWNWaWV3LmVudGVyJyk7XG4gICAgXG4gICAgICAgICAgICAgICAgZ2V0TWVzc2FnZXMoKTtcbiAgICBcbiAgICAgICAgICAgICAgICAkdGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9vdGVyQmFyID0gZG9jdW1lbnQuYm9keS5xdWVyeVNlbGVjdG9yKCcjdXNlck1lc3NhZ2VzVmlldyAuYmFyLWZvb3RlcicpO1xuICAgICAgICAgICAgICAgICAgICBzY3JvbGxlciA9IGRvY3VtZW50LmJvZHkucXVlcnlTZWxlY3RvcignI3VzZXJNZXNzYWdlc1ZpZXcgLnNjcm9sbC1jb250ZW50Jyk7XG4gICAgICAgICAgICAgICAgICAgIHR4dElucHV0ID0gYW5ndWxhci5lbGVtZW50KGZvb3RlckJhci5xdWVyeVNlbGVjdG9yKCd0ZXh0YXJlYScpKTtcbiAgICAgICAgICAgICAgICB9LCAwKTtcbiAgICBcbiAgICAgICAgICAgICAgICBtZXNzYWdlQ2hlY2tUaW1lciA9ICRpbnRlcnZhbChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gaGVyZSB5b3UgY291bGQgY2hlY2sgZm9yIG5ldyBtZXNzYWdlcyBpZiB5b3VyIGFwcCBkb2Vzbid0IHVzZSBwdXNoIG5vdGlmaWNhdGlvbnMgb3IgdXNlciBkaXNhYmxlZCB0aGVtXG4gICAgICAgICAgICAgICAgfSwgMjAwMDApO1xuICAgICAgICAgICAgfSk7XG4gICAgXG4gICAgICAgICAgICAkc2NvcGUuJG9uKCckaW9uaWNWaWV3LmxlYXZlJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2xlYXZpbmcgVXNlck1lc3NhZ2VzIHZpZXcsIGRlc3Ryb3lpbmcgaW50ZXJ2YWwnKTtcbiAgICAgICAgICAgICAgICAvLyBNYWtlIHN1cmUgdGhhdCB0aGUgaW50ZXJ2YWwgaXMgZGVzdHJveWVkXG4gICAgICAgICAgICAgICAgaWYgKGFuZ3VsYXIuaXNEZWZpbmVkKG1lc3NhZ2VDaGVja1RpbWVyKSkge1xuICAgICAgICAgICAgICAgICAgICAkaW50ZXJ2YWwuY2FuY2VsKG1lc3NhZ2VDaGVja1RpbWVyKTtcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZUNoZWNrVGltZXIgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgXG4gICAgICAgICAgICAkc2NvcGUuJG9uKCckaW9uaWNWaWV3LmJlZm9yZUxlYXZlJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgaWYgKCEkc2NvcGUuaW5wdXQubWVzc2FnZSB8fCAkc2NvcGUuaW5wdXQubWVzc2FnZSA9PT0gJycpIHtcbiAgICAgICAgICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ3VzZXJNZXNzYWdlLScgKyAkc2NvcGUudG9Vc2VyLl9pZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgXG4gICAgICAgICAgICBmdW5jdGlvbiBnZXRNZXNzYWdlcygpIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUubWVzc2FnZXMgPSBbe1xuICAgICAgICAgICAgICAgICAgICBcIl9pZFwiOiBcIjUzNWQ2MjVmODk4ZGY0ZTgwZTJhMTI1ZVwiLFxuICAgICAgICAgICAgICAgICAgICBcInRleHRcIjogXCJJb25pYyBoYXMgY2hhbmdlZCB0aGUgZ2FtZSBmb3IgaHlicmlkIGFwcCBkZXZlbG9wbWVudC5cIixcbiAgICAgICAgICAgICAgICAgICAgXCJ1c2VySWRcIjogXCI1MzRiOGZiMmFhNWU3YWZjMWIyM2U2OWNcIixcbiAgICAgICAgICAgICAgICAgICAgXCJkYXRlXCI6IFwiMjAxNC0wNC0yN1QyMDowMjozOS4wODJaXCIsXG4gICAgICAgICAgICAgICAgICAgIFwicmVhZFwiOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBcInJlYWREYXRlXCI6IFwiMjAxNC0xMi0wMVQwNjoyNzozNy45NDRaXCJcbiAgICAgICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBcIl9pZFwiOiBcIjUzNWYxM2ZmZWUzYjJhNjgxMTJiOWZjMFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJ0ZXh0XCI6IFwiSSBsaWtlIElvbmljIGJldHRlciB0aGFuIGljZSBjcmVhbSFcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwidXNlcklkXCI6IFwiNTM0YjhlNWFhYTVlN2FmYzFiMjNlNjliXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcImRhdGVcIjogXCIyMDE0LTA0LTI5VDAyOjUyOjQ3LjcwNlpcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwicmVhZFwiOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJyZWFkRGF0ZVwiOiBcIjIwMTQtMTItMDFUMDY6Mjc6MzcuOTQ0WlwiXG4gICAgICAgICAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiX2lkXCI6IFwiNTQ2YTU4NDNmZDRjNWQ1ODFlZmEyNjNhXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcInRleHRcIjogXCJMb3JlbSBpcHN1bSBkb2xvciBzaXQgYW1ldCwgY29uc2VjdGV0dXIgYWRpcGlzY2luZyBlbGl0LCBzZWQgZG8gZWl1c21vZCB0ZW1wb3IgaW5jaWRpZHVudCB1dCBsYWJvcmUgZXQgZG9sb3JlIG1hZ25hIGFsaXF1YS4gVXQgZW5pbSBhZCBtaW5pbSB2ZW5pYW0sIHF1aXMgbm9zdHJ1ZCBleGVyY2l0YXRpb24gdWxsYW1jbyBsYWJvcmlzIG5pc2kgdXQgYWxpcXVpcCBleCBlYSBjb21tb2RvIGNvbnNlcXVhdC4gRHVpcyBhdXRlIGlydXJlIGRvbG9yIGluIHJlcHJlaGVuZGVyaXQgaW4gdm9sdXB0YXRlIHZlbGl0IGVzc2UgY2lsbHVtIGRvbG9yZSBldSBmdWdpYXQgbnVsbGEgcGFyaWF0dXIuIEV4Y2VwdGV1ciBzaW50IG9jY2FlY2F0IGN1cGlkYXRhdCBub24gcHJvaWRlbnQsIHN1bnQgaW4gY3VscGEgcXVpIG9mZmljaWEgZGVzZXJ1bnQgbW9sbGl0IGFuaW0gaWQgZXN0IGxhYm9ydW0uXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcInVzZXJJZFwiOiBcIjUzNGI4ZmIyYWE1ZTdhZmMxYjIzZTY5Y1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJkYXRlXCI6IFwiMjAxNC0xMS0xN1QyMDoxOToxNS4yODlaXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcInJlYWRcIjogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIFwicmVhZERhdGVcIjogXCIyMDE0LTEyLTAxVDA2OjI3OjM4LjMyOFpcIlxuICAgICAgICAgICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBcIl9pZFwiOiBcIjU0NzY0Mzk5YWI0M2QxZDQxMTNhYmZkMVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJ0ZXh0XCI6IFwiQW0gSSBkcmVhbWluZz9cIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwidXNlcklkXCI6IFwiNTM0YjhlNWFhYTVlN2FmYzFiMjNlNjliXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcImRhdGVcIjogXCIyMDE0LTExLTI2VDIxOjE4OjE3LjU5MVpcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwicmVhZFwiOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJyZWFkRGF0ZVwiOiBcIjIwMTQtMTItMDFUMDY6Mjc6MzguMzM3WlwiXG4gICAgICAgICAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiX2lkXCI6IFwiNTQ3NjQzYWVhYjQzZDFkNDExM2FiZmQyXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcInRleHRcIjogXCJJcyB0aGlzIG1hZ2ljP1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJ1c2VySWRcIjogXCI1MzRiOGZiMmFhNWU3YWZjMWIyM2U2OWNcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiZGF0ZVwiOiBcIjIwMTQtMTEtMjZUMjE6MTg6MzguNTQ5WlwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJyZWFkXCI6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBcInJlYWREYXRlXCI6IFwiMjAxNC0xMi0wMVQwNjoyNzozOC4zMzhaXCJcbiAgICAgICAgICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJfaWRcIjogXCI1NDc4MTVkYmFiNDNkMWQ0MTEzYWJmZWZcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwidGV4dFwiOiBcIkdlZSB3aXosIHRoaXMgaXMgc29tZXRoaW5nIHNwZWNpYWwuXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcInVzZXJJZFwiOiBcIjUzNGI4ZTVhYWE1ZTdhZmMxYjIzZTY5YlwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJkYXRlXCI6IFwiMjAxNC0xMS0yOFQwNjoyNzo0MC4wMDFaXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcInJlYWRcIjogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIFwicmVhZERhdGVcIjogXCIyMDE0LTEyLTAxVDA2OjI3OjM4LjMzOFpcIlxuICAgICAgICAgICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBcIl9pZFwiOiBcIjU0NzgxYzY5YWI0M2QxZDQxMTNhYmZmMFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJ0ZXh0XCI6IFwiSSB0aGluayBJIGxpa2UgSW9uaWMgbW9yZSB0aGFuIEkgbGlrZSBpY2UgY3JlYW0hXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcInVzZXJJZFwiOiBcIjUzNGI4ZmIyYWE1ZTdhZmMxYjIzZTY5Y1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJkYXRlXCI6IFwiMjAxNC0xMS0yOFQwNjo1NTozNy4zNTBaXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcInJlYWRcIjogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIFwicmVhZERhdGVcIjogXCIyMDE0LTEyLTAxVDA2OjI3OjM4LjMzOFpcIlxuICAgICAgICAgICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBcIl9pZFwiOiBcIjU0NzgxY2E0YWI0M2QxZDQxMTNhYmZmMVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJ0ZXh0XCI6IFwiWWVhLCBpdCdzIHByZXR0eSBzd2VldFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJ1c2VySWRcIjogXCI1MzRiOGU1YWFhNWU3YWZjMWIyM2U2OWJcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiZGF0ZVwiOiBcIjIwMTQtMTEtMjhUMDY6NTY6MzYuNDcyWlwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJyZWFkXCI6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBcInJlYWREYXRlXCI6IFwiMjAxNC0xMi0wMVQwNjoyNzozOC4zMzhaXCJcbiAgICAgICAgICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJfaWRcIjogXCI1NDc4ZGY4NmFiNDNkMWQ0MTEzYWJmZjRcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwidGV4dFwiOiBcIldvdywgdGhpcyBpcyByZWFsbHkgc29tZXRoaW5nIGh1aD9cIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwidXNlcklkXCI6IFwiNTM0YjhmYjJhYTVlN2FmYzFiMjNlNjljXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcImRhdGVcIjogXCIyMDE0LTExLTI4VDIwOjQ4OjA2LjU3MlpcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwicmVhZFwiOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJyZWFkRGF0ZVwiOiBcIjIwMTQtMTItMDFUMDY6Mjc6MzguMzM5WlwiXG4gICAgICAgICAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiX2lkXCI6IFwiNTQ3ODFjYTRhYjQzZDFkNDExM2FiZmYxXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcInRleHRcIjogXCJDcmVhdGUgYW1hemluZyBhcHBzIC0gaW9uaWNmcmFtZXdvcmsuY29tXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcInVzZXJJZFwiOiBcIjUzNGI4ZTVhYWE1ZTdhZmMxYjIzZTY5YlwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJkYXRlXCI6IFwiMjAxNC0xMS0yOVQwNjo1NjozNi40NzJaXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcInJlYWRcIjogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIFwicmVhZERhdGVcIjogXCIyMDE0LTEyLTAxVDA2OjI3OjM4LjMzOFpcIlxuICAgICAgICAgICAgICAgICAgICB9XTtcbiAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICRzY29wZS4kd2F0Y2goJ2lucHV0Lm1lc3NhZ2UnLCBmdW5jdGlvbihuZXdWYWx1ZSwgb2xkVmFsdWUpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnaW5wdXQubWVzc2FnZSAkd2F0Y2gsIG5ld1ZhbHVlICcgKyBuZXdWYWx1ZSk7XG4gICAgICAgICAgICAgICAgaWYgKCFuZXdWYWx1ZSkgbmV3VmFsdWUgPSAnJztcbiAgICAgICAgICAgICAgICBsb2NhbFN0b3JhZ2VbJ3VzZXJNZXNzYWdlLScgKyAkc2NvcGUudG9Vc2VyLl9pZF0gPSBuZXdWYWx1ZTtcbiAgICAgICAgICAgIH0pO1xuICAgIFxuICAgICAgICAgICAgJHNjb3BlLnNlbmRNZXNzYWdlID0gZnVuY3Rpb24oc2VuZE1lc3NhZ2VGb3JtKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1lc3NhZ2UgPSB7XG4gICAgICAgICAgICAgICAgICAgIHRvSWQ6ICRzY29wZS50b1VzZXIuX2lkLFxuICAgICAgICAgICAgICAgICAgICB0ZXh0OiAkc2NvcGUuaW5wdXQubWVzc2FnZVxuICAgICAgICAgICAgICAgIH07XG4gICAgXG4gICAgICAgICAgICAgICAgLy8gaWYgeW91IGRvIGEgd2ViIHNlcnZpY2UgY2FsbCB0aGlzIHdpbGwgYmUgbmVlZGVkIGFzIHdlbGwgYXMgYmVmb3JlIHRoZSB2aWV3U2Nyb2xsIGNhbGxzXG4gICAgICAgICAgICAgICAgLy8geW91IGNhbid0IHNlZSB0aGUgZWZmZWN0IG9mIHRoaXMgaW4gdGhlIGJyb3dzZXIgaXQgbmVlZHMgdG8gYmUgdXNlZCBvbiBhIHJlYWwgZGV2aWNlXG4gICAgICAgICAgICAgICAgLy8gZm9yIHNvbWUgcmVhc29uIHRoZSBvbmUgdGltZSBibHVyIGV2ZW50IGlzIG5vdCBmaXJpbmcgaW4gdGhlIGJyb3dzZXIgYnV0IGRvZXMgb24gZGV2aWNlc1xuICAgICAgICAgICAgICAgIGtlZXBLZXlib2FyZE9wZW4oKTtcbiAgICBcbiAgICAgICAgICAgICAgICAvL01vY2tTZXJ2aWNlLnNlbmRNZXNzYWdlKG1lc3NhZ2UpLnRoZW4oZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgICRzY29wZS5pbnB1dC5tZXNzYWdlID0gJyc7XG4gICAgXG4gICAgICAgICAgICAgICAgbWVzc2FnZS5faWQgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTsgLy8gOn4pXG4gICAgICAgICAgICAgICAgbWVzc2FnZS5kYXRlID0gbmV3IERhdGUoKTtcbiAgICAgICAgICAgICAgICBtZXNzYWdlLnVzZXJuYW1lID0gJHNjb3BlLnVzZXIudXNlcm5hbWU7XG4gICAgICAgICAgICAgICAgbWVzc2FnZS51c2VySWQgPSAkc2NvcGUudXNlci5faWQ7XG4gICAgICAgICAgICAgICAgbWVzc2FnZS5waWMgPSAkc2NvcGUudXNlci5waWN0dXJlO1xuICAgIFxuICAgICAgICAgICAgICAgICRzY29wZS5tZXNzYWdlcy5wdXNoKG1lc3NhZ2UpO1xuICAgIFxuICAgICAgICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBrZWVwS2V5Ym9hcmRPcGVuKCk7XG4gICAgICAgICAgICAgICAgICAgIHZpZXdTY3JvbGwuc2Nyb2xsQm90dG9tKHRydWUpO1xuICAgICAgICAgICAgICAgIH0sIDApO1xuICAgIFxuICAgICAgICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUubWVzc2FnZXMucHVzaChNb2NrU2VydmljZS5nZXRNb2NrTWVzc2FnZSgpKTtcbiAgICAgICAgICAgICAgICAgICAga2VlcEtleWJvYXJkT3BlbigpO1xuICAgICAgICAgICAgICAgICAgICB2aWV3U2Nyb2xsLnNjcm9sbEJvdHRvbSh0cnVlKTtcbiAgICAgICAgICAgICAgICB9LCAyMDAwKTtcbiAgICBcbiAgICAgICAgICAgICAgICAvL30pO1xuICAgICAgICAgICAgfTtcbiAgICBcbiAgICAgICAgICAgIC8vIHRoaXMga2VlcHMgdGhlIGtleWJvYXJkIG9wZW4gb24gYSBkZXZpY2Ugb25seSBhZnRlciBzZW5kaW5nIGEgbWVzc2FnZSwgaXQgaXMgbm9uIG9idHJ1c2l2ZVxuICAgICAgICAgICAgZnVuY3Rpb24ga2VlcEtleWJvYXJkT3BlbigpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygna2VlcEtleWJvYXJkT3BlbicpO1xuICAgICAgICAgICAgICAgIHR4dElucHV0Lm9uZSgnYmx1cicsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygndGV4dGFyZWEgYmx1ciwgZm9jdXMgYmFjayBvbiBpdCcpO1xuICAgICAgICAgICAgICAgICAgICB0eHRJbnB1dFswXS5mb2N1cygpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgZnVuY3Rpb24gb25Qcm9maWxlUGljRXJyb3IoZWxlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5lbGUuc3JjID0gJyc7IC8vIHNldCBhIGZhbGxiYWNrXG4gICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAkc2NvcGUub25NZXNzYWdlSG9sZCA9IGZ1bmN0aW9uKGUsIGl0ZW1JbmRleCwgbWVzc2FnZSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdvbk1lc3NhZ2VIb2xkJyk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ21lc3NhZ2U6ICcgKyBKU09OLnN0cmluZ2lmeShtZXNzYWdlLCBudWxsLCAyKSk7XG4gICAgICAgICAgICAgICAgJGlvbmljQWN0aW9uU2hlZXQuc2hvdyh7XG4gICAgICAgICAgICAgICAgICAgIGJ1dHRvbnM6IFt7XG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiAnQ29weSBUZXh0J1xuICAgICAgICAgICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogJ0RlbGV0ZSBNZXNzYWdlJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfV0sXG4gICAgICAgICAgICAgICAgICAgIGJ1dHRvbkNsaWNrZWQ6IGZ1bmN0aW9uKGluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKGluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAwOiAvLyBDb3B5IFRleHRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9jb3Jkb3ZhLnBsdWdpbnMuY2xpcGJvYXJkLmNvcHkobWVzc2FnZS50ZXh0KTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAxOiAvLyBEZWxldGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gbm8gc2VydmVyIHNpZGUgc2VjcmV0cyBoZXJlIDp+KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUubWVzc2FnZXMuc3BsaWNlKGl0ZW1JbmRleCwgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmlld1Njcm9sbC5yZXNpemUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgMCk7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH07XG4gICAgXG4gICAgICAgICAgICAvLyB0aGlzIHByb2Igc2VlbXMgd2VpcmQgaGVyZSBidXQgSSBoYXZlIHJlYXNvbnMgZm9yIHRoaXMgaW4gbXkgYXBwLCBzZWNyZXQhXG4gICAgICAgICAgICAkc2NvcGUudmlld1Byb2ZpbGUgPSBmdW5jdGlvbihtc2cpIHtcbiAgICAgICAgICAgICAgICBpZiAobXNnLnVzZXJJZCA9PT0gJHNjb3BlLnVzZXIuX2lkKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGdvIHRvIHlvdXIgcHJvZmlsZVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGdvIHRvIG90aGVyIHVzZXJzIHByb2ZpbGVcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgIFxuICAgICAgICAgICAgLy8gSSBlbWl0IHRoaXMgZXZlbnQgZnJvbSB0aGUgbW9ub3NwYWNlZC5lbGFzdGljIGRpcmVjdGl2ZSwgcmVhZCBsaW5lIDQ4MFxuICAgICAgICAgICAgJHNjb3BlLiRvbigndGFSZXNpemUnLCBmdW5jdGlvbihlLCB0YSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCd0YVJlc2l6ZScpO1xuICAgICAgICAgICAgICAgIGlmICghdGEpIHJldHVybjtcbiAgICBcbiAgICAgICAgICAgICAgICB2YXIgdGFIZWlnaHQgPSB0YVswXS5vZmZzZXRIZWlnaHQ7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ3RhSGVpZ2h0OiAnICsgdGFIZWlnaHQpO1xuICAgIFxuICAgICAgICAgICAgICAgIGlmICghZm9vdGVyQmFyKSByZXR1cm47XG4gICAgXG4gICAgICAgICAgICAgICAgdmFyIG5ld0Zvb3RlckhlaWdodCA9IHRhSGVpZ2h0ICsgMTA7XG4gICAgICAgICAgICAgICAgbmV3Rm9vdGVySGVpZ2h0ID0gKG5ld0Zvb3RlckhlaWdodCA+IDQ0KSA/IG5ld0Zvb3RlckhlaWdodCA6IDQ0O1xuICAgIFxuICAgICAgICAgICAgICAgIGZvb3RlckJhci5zdHlsZS5oZWlnaHQgPSBuZXdGb290ZXJIZWlnaHQgKyAncHgnO1xuICAgICAgICAgICAgICAgIHNjcm9sbGVyLnN0eWxlLmJvdHRvbSA9IG5ld0Zvb3RlckhlaWdodCArICdweCc7XG4gICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgfVxuICAgICAgICAqL1xufSkoKTtcblxuXG5cblxuIiwiKGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBhbmd1bGFyXG4gICAgICAgIC5tb2R1bGUoJ2FwcC5tZXNzYWdlcycpXG5cbiAgICAgICAgLmZpbHRlcignbmwyYnInLCBbJyRmaWx0ZXInLCBubDJicl0pXG5cbiAgICBmdW5jdGlvbiBubDJicigkZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICAgICAgaWYgKCFkYXRhKSByZXR1cm4gZGF0YTtcbiAgICAgICAgICAgIHJldHVybiBkYXRhLnJlcGxhY2UoL1xcblxccj8vZywgJzxiciAvPicpO1xuICAgICAgICB9O1xuICAgIH1cbn0pKCk7IiwiKGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBhbmd1bGFyXG4gICAgICAgIC5tb2R1bGUoJ2FwcC5tZXNzYWdlcycpXG4gICAgICAgIC5zZXJ2aWNlKCdtZXNzYWdlc1NlcnZpY2UnLCBtZXNzYWdlc1NlcnZpY2UpO1xuXG4gICAgZnVuY3Rpb24gbWVzc2FnZXNTZXJ2aWNlKGZpcmViYXNlU2VydmljZSkge1xuICAgICAgICB2YXIgc2VydmljZSA9IHt9O1xuXHRcdFxuICAgICAgICBzZXJ2aWNlLmdldE1lc3NhZ2VzUmVmID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGZpcmViYXNlLmRhdGFiYXNlKCkucmVmKCdtZXNzYWdlcycpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHNlcnZpY2UuYWRkTWVzc2FnZSA9IGZ1bmN0aW9uIChtZXNzYWdlKSB7XG4gICAgICAgICAgICByZXR1cm4gZmlyZWJhc2VTZXJ2aWNlLmZiLmRhdGFiYXNlKCkucHVzaChtZXNzYWdlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBzZXJ2aWNlO1xuICAgIH1cbn0pKCk7XG4iLCIoZnVuY3Rpb24oKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgYW5ndWxhci5tb2R1bGUoXCJhcHAucHJvZmlsZXNcIilcblxuICAgICAgICAuY29udHJvbGxlcihcInByb2ZpbGVDb250cm9sbGVyXCIsIHByb2ZpbGVDb250cm9sbGVyKTtcblxuXG4gICAgZnVuY3Rpb24gcHJvZmlsZUNvbnRyb2xsZXIoJHNjb3BlLCAkaW9uaWNMb2FkaW5nLCAkaW9uaWNQb3B1cCwgYXV0aFNlcnZpY2UsIHByb2ZpbGVzU2VydmljZSkge1xuXG5cdFx0dmFyIHVzZXIgPSBhdXRoU2VydmljZS51c2VyKCk7XG5cdFx0XG5cdFx0JHNjb3BlLmRhdGEgPSB7XG5cdFx0XHRkaXNwbGF5TmFtZSA6IHVzZXIgPyB1c2VyLmRpc3BsYXlOYW1lIDogXCJcIixcblx0XHRcdGVtYWlsIDogdXNlciA/IHVzZXIuZW1haWwgOiBcIlwiXG5cdFx0fTtcblxuICAgICAgICAkc2NvcGUudXBkYXRlID0gZnVuY3Rpb24oKSB7XG5cdFx0XHQkaW9uaWNMb2FkaW5nLnNob3coKTtcblxuICAgICAgICAgICAgcHJvZmlsZXNTZXJ2aWNlLnVwZGF0ZVByb2ZpbGUoJHNjb3BlLmRhdGEpLnRoZW4oZnVuY3Rpb24gc3VjY2Vzcyhtc2cpIHtcblx0XHRcdFx0JGlvbmljTG9hZGluZy5oaWRlKCk7XG5cblx0XHRcdFx0JGlvbmljUG9wdXAuYWxlcnQoe1xuICAgICAgICAgICAgICAgICAgICB0aXRsZTogJ1Byb2ZpbGVVcGRhdGUhJyxcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGU6IG1zZ1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICB9LCBmdW5jdGlvbiBlcnJvcihlcnJvcikge1xuXHRcdFx0XHQkaW9uaWNMb2FkaW5nLmhpZGUoKTtcblxuXHRcdFx0XHQkaW9uaWNQb3B1cC5hbGVydCh7XG4gICAgICAgICAgICAgICAgICAgIHRpdGxlOiAnVXBkYXRlIGZhaWxlZCEnLFxuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZTogZXJyb3IubWVzc2FnZVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG59KSgpOyIsIihmdW5jdGlvbigpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBhbmd1bGFyLm1vZHVsZShcImFwcC5wcm9maWxlc1wiKVxuXG4gICAgICAgIC5zZXJ2aWNlKFwicHJvZmlsZXNTZXJ2aWNlXCIsIHByb2ZpbGVzU2VydmljZSk7XG5cblxuICAgIGZ1bmN0aW9uIHByb2ZpbGVzU2VydmljZSgkcSwgJHJvb3RTY29wZSwgYXV0aFNlcnZpY2UpIHtcblx0XHRcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHVwZGF0ZVByb2ZpbGU6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuXG4gICAgICAgICAgICAgICAgYXV0aFNlcnZpY2UudXNlcigpLnVwZGF0ZVByb2ZpbGUoZGF0YSlcbiAgICAgICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gc3VjY2VzcygpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUoXCJQcm9maWxlIHVwZGF0ZWQhXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KCd1c2VyLWNoYW5nZWQnKTtcbiAgICAgICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gZXJyb3IoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlamVjdChlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9XG4gICAgfVxufSkoKTsiLCIoZnVuY3Rpb24oKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgYW5ndWxhci5tb2R1bGUoXCJhcHAuc2lkZW1lbnVcIilcblxuICAgICAgICAuY29udHJvbGxlcihcInNpZGVtZW51Q29udHJvbGxlclwiLCBzaWRlbWVudUNvbnRyb2xsZXIpO1xuXG5cbiAgICBmdW5jdGlvbiBzaWRlbWVudUNvbnRyb2xsZXIoJHNjb3BlLCAkc3RhdGUsIGNoYW5uZWxzU2VydmljZSkge1xuXHRcdCRzY29wZS5jaGFubmVscyA9IGNoYW5uZWxzU2VydmljZS5jaGFubmVscztcblx0XHRcblx0XHQkc2NvcGUuYnVpbGRpbmcgPSB7XG5cdFx0XHRuYW1lOiBcIlNlbGVjdCBhIGJ1aWxkaW5nXCIsXG5cdFx0XHRhZGRyZXNzOiBcIlwiLFxuXHRcdH07XG5cdFx0XG5cdFx0JHNjb3BlLiRvbignYnVpbGRpbmctc2VsZWN0ZWQnLCBmdW5jdGlvbihldmVudCwgZGF0YSkge1xuXHRcdFx0JHNjb3BlLmJ1aWxkaW5nLm5hbWUgPSBkYXRhLm5hbWU7XG5cdFx0XHQkc2NvcGUuYnVpbGRpbmcuYWRkcmVzcyA9IGRhdGEuYWRkcmVzcztcblx0XHR9KTtcblx0XHRcblx0XHQkc2NvcGUub3BlbkNoYW5uZWwgPSBmdW5jdGlvbihrZXkpIHtcblx0XHRcdCRzdGF0ZS5nbygnYXBwLmNoYW5uZWwnLCB7IGNoYW5uZWxJZDoga2V5IH0pO1xuXHRcdH07XG4gICAgfVxufSkoKTtcbiIsIihmdW5jdGlvbigpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBhbmd1bGFyLm1vZHVsZShcImFwcC51c2Vyc1wiKVxuXG4gICAgICAgIC5zZXJ2aWNlKFwidXNlcnNTZXJ2aWNlXCIsIHVzZXJzU2VydmljZSk7XG5cblxuICAgIGZ1bmN0aW9uIHVzZXJzU2VydmljZSgkcSwgYXV0aFNlcnZpY2UpIHtcblx0ICAgIHJldHVybiB7XG4gICAgICAgICAgICB1cGRhdGVQcm9maWxlOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcblxuICAgICAgICAgICAgICAgIGF1dGhTZXJ2aWNlLnVzZXIoKS51cGRhdGVQcm9maWxlKGRhdGEpXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uIHN1Y2Nlc3MoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKFwiUHJvZmlsZSB1cGRhdGVkIVwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHVzZXIgPSBmaXJlYmFzZS5hdXRoKCkuY3VycmVudFVzZXI7XG4gICAgICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ3VzZXItY2hhbmdlZCcpO1xuICAgICAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiBlcnJvcihlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVmZXJyZWQucmVqZWN0KGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH1cbiAgICB9XG59KSgpOyIsIihmdW5jdGlvbigpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBhbmd1bGFyXG5cbiAgICAgICAgLm1vZHVsZSgnYXBwJywgW1xuICAgICAgICAgICAgJ2lvbmljJyxcbiAgICAgICAgICAgICdtb25vc3BhY2VkLmVsYXN0aWMnLFxuXG4gICAgICAgICAgICAnYXBwLmZpcmViYXNlJyxcbiAgICAgICAgICAgICdhcHAuZmlyZWJhc2UnLFxuICAgICAgICAgICAgJ2FwcC5hdXRoJyxcbiAgICAgICAgICAgICdhcHAuY2hhbm5lbHMnLFxuICAgICAgICAgICAgJ2FwcC5zaWRlbWVudScsXG4gICAgICAgICAgICAnYXBwLmJ1aWxkaW5ncycsXG4gICAgICAgICAgICAnYXBwLnByb2ZpbGVzJyxcbiAgICAgICAgICAgICdhcHAubWVzc2FnZXMnXG4gICAgICAgIF0pXG5cbiAgICAgICAgLnJ1bihmdW5jdGlvbigkaW9uaWNQbGF0Zm9ybSwgJHRpbWVvdXQsICRyb290U2NvcGUpIHtcbiAgICAgICAgICAgICRpb25pY1BsYXRmb3JtLnJlYWR5KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGlmICh3aW5kb3cuY29yZG92YSAmJiB3aW5kb3cuY29yZG92YS5wbHVnaW5zLktleWJvYXJkKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvcmRvdmEucGx1Z2lucy5LZXlib2FyZC5oaWRlS2V5Ym9hcmRBY2Nlc3NvcnlCYXIodHJ1ZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgY29yZG92YS5wbHVnaW5zLktleWJvYXJkLmRpc2FibGVTY3JvbGwodHJ1ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh3aW5kb3cuU3RhdHVzQmFyKSB7XG4gICAgICAgICAgICAgICAgICAgIFN0YXR1c0Jhci5zdHlsZURlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRlbWl0KCd1c2VyLWNoYW5nZWQnKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbn0pKCk7XG5cblxuIiwiKGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBhbmd1bGFyXG4gICAgICAgIC5tb2R1bGUoJ2FwcCcpXG4gICAgICAgIC5zZXJ2aWNlKCdnbG9iYWxzU2VydmljZScsIGdsb2JhbHNTZXJ2aWNlKTtcblxuICAgIGZ1bmN0aW9uIGdsb2JhbHNTZXJ2aWNlKCkge1xuICAgICAgICB2YXIgc2VydmljZSA9IHtcblx0XHRcdHVzZXIgOiBudWxsLCAvL2xvZ2dlZCB1c2VyXG5cdFx0XHRidWlsZGluZyA6IG51bGwgLy9zZWxlY3RlZCBidWlsZGluZ1xuXHRcdH07XG5cbiAgICAgICAgcmV0dXJuIHNlcnZpY2U7XG4gICAgfVxufSkoKTtcbiIsIihmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgYW5ndWxhclxuXG4gICAgICAgIC5tb2R1bGUoJ2FwcCcpXG5cbiAgICAgICAgLnJ1bihbJyRyb290U2NvcGUnLCAnJGxvY2F0aW9uJywgJ2F1dGhTZXJ2aWNlJywgZnVuY3Rpb24gKCRyb290U2NvcGUsICRzdGF0ZSwgYXV0aFNlcnZpY2UpIHtcbiAgICAgICAgICAgICRyb290U2NvcGUuJG9uKCckcm91dGVDaGFuZ2VTdGFydCcsIGZ1bmN0aW9uIChldmVudCkge1xuXG4gICAgICAgICAgICAgICAgaWYgKGF1dGhTZXJ2aWNlLnVzZXIoKSA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnbG9naW4nKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfV0pXG59KSgpO1xuIiwiKGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBhbmd1bGFyXG5cbiAgICAgICAgLm1vZHVsZSgnYXBwJylcblxuICAgICAgICAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlciwgJHVybFJvdXRlclByb3ZpZGVyKSB7XG4gICAgICAgICAgICAkc3RhdGVQcm92aWRlclxuXG4gICAgICAgICAgICAgICAgLnN0YXRlKCdhcHAnLCB7XG4gICAgICAgICAgICAgICAgICAgIHVybDogJy9hcHAnLFxuICAgICAgICAgICAgICAgICAgICBjYWNoZTogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIGFic3RyYWN0OiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3ZpZXdzL3NpZGVtZW51Lmh0bWwnLFxuICAgICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgICAgICAuc3RhdGUoJ2FwcC5idWlsZGluZ3MnLCB7XG4gICAgICAgICAgICAgICAgICAgIHVybDogJy9idWlsZGluZ3MnLFxuICAgICAgICAgICAgICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgICAgICAgICAgICAgJ21lbnVDb250ZW50Jzoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAndmlld3MvYnVpbGRpbmdzLmh0bWwnXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICAgICAgLnN0YXRlKCdhcHAuYnVpbGRpbmcnLCB7XG4gICAgICAgICAgICAgICAgICAgIHVybDogJy9idWlsZGluZ3MvOmJ1aWxkaW5nSWQnLFxuICAgICAgICAgICAgICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgICAgICAgICAgICAgJ21lbnVDb250ZW50Jzoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAndmlld3MvYnVpbGRpbmcuaHRtbCdcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgICAgICAuc3RhdGUoJ2FwcC5jaGFubmVsJywge1xuICAgICAgICAgICAgICAgICAgICB1cmw6ICcvY2hhbm5lbC86Y2hhbm5lbElkJyxcbiAgICAgICAgICAgICAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICdtZW51Q29udGVudCc6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3ZpZXdzL21lc3NhZ2VzL2NoYXQuaHRtbCdcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgICAgICAuc3RhdGUoJ2FwcC5wcm9maWxlJywge1xuICAgICAgICAgICAgICAgICAgICB1cmw6ICcvcHJvZmlsZScsXG4gICAgICAgICAgICAgICAgICAgIGNhY2hlOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICdtZW51Q29udGVudCc6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3ZpZXdzL3Byb2ZpbGUvcHJvZmlsZS5odG1sJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgICAgIC5zdGF0ZSgnYXBwLmxvZ291dCcsIHtcbiAgICAgICAgICAgICAgICAgICAgdXJsOiBcIi9sb2dpblwiLFxuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVByb3ZpZGVyOiBmdW5jdGlvbiAoYXV0aFNlcnZpY2UsICRzdGF0ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXV0aFNlcnZpY2UubG9nb3V0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2xvZ2luJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5zdGF0ZSgnbG9naW4nLCB7XG4gICAgICAgICAgICAgICAgICAgIHVybDogXCIvbG9naW5cIixcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFwidmlld3MvYXV0aC9sb2dpbi5odG1sXCJcbiAgICAgICAgICAgICAgICB9KTtcblxuXG4gICAgICAgICAgICAvL2ZhbGxiYWNrXG4gICAgICAgICAgICAkdXJsUm91dGVyUHJvdmlkZXIub3RoZXJ3aXNlKCcvbG9naW4nKTtcblxuICAgICAgICB9KTtcbn0pKCk7XG5cblxuXG5cbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
