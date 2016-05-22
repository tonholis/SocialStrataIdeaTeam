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

    angular.module("app.sidemenu", []);
})();
(function () {
    'use strict';

    angular.module("app.users", ['app.auth']);
})();
(function () {
    'use strict';

    angular.module("app.profiles", ['app.auth']);
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





//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImF1dGgvYXV0aC5tb2R1bGUuanMiLCJidWlsZGluZ3MvYnVpbGRpbmdzLm1vZHVsZS5qcyIsImNoYW5uZWxzL2NoYW5uZWxzLm1vZHVsZS5qcyIsImRpcmVjdG1lc3NhZ2VzL2RpcmVjdG1lc3NhZ2VzLm1vZHVsZS5qcyIsImZpcmViYXNlL2ZpcmViYXNlLm1vZHVsZS5qcyIsIm1lc3NhZ2VzL21lc3NhZ2VzLm1vZHVsZS5qcyIsInNpZGVtZW51L3NpZGVtZW51Lm1vZHVsZS5qcyIsInVzZXJzL3VzZXJzLm1vZHVsZS5qcyIsInByb2ZpbGUvcHJvZmlsZXMubW9kdWxlLmpzIiwiYXV0aC9hdXRoQ29udHJvbGxlci5qcyIsImF1dGgvYXV0aFNlcnZpY2UuanMiLCJidWlsZGluZ3MvYnVpbGRpbmdDb250cm9sbGVyLmpzIiwiYnVpbGRpbmdzL2J1aWxkaW5nc0NvbnRyb2xsZXIuanMiLCJidWlsZGluZ3MvYnVpbGRpbmdzU2VydmljZS5qcyIsImNoYW5uZWxzL2NoYW5uZWxzU2VydmljZS5qcyIsImRpcmVjdG1lc3NhZ2VzL2RpcmVjdE1lc3NhZ2VzQ29udHJvbGxlci5qcyIsImRpcmVjdG1lc3NhZ2VzL2RpcmVjdE1lc3NhZ2VzU2VydmljZS5qcyIsImZpcmViYXNlL2ZpcmViYXNlU2VydmljZS5qcyIsIm1lc3NhZ2VzL21lc3NhZ2VzQ29udHJvbGxlci5qcyIsIm1lc3NhZ2VzL21lc3NhZ2VzRmlsdGVycy5qcyIsIm1lc3NhZ2VzL21lc3NhZ2VzU2VydmljZS5qcyIsInNpZGVtZW51L3NpZGVtZW51Q29udHJvbGxlci5qcyIsInVzZXJzL3VzZXJzU2VydmljZS5qcyIsInByb2ZpbGUvcHJvZmlsZUNvbnRyb2xsZXIuanMiLCJwcm9maWxlL3Byb2ZpbGVzU2VydmljZS5qcyIsImFwcC5tb2R1bGUuanMiLCJhcHAuZ2xvYmFscy5qcyIsImFwcC5yb3V0ZXIuZmlsdGVyLmpzIiwiYXBwLnJvdXRlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxD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QTtZQUNBO1lBQ0E7WUFDQTtZQUNBO1lBQ0E7WUFDQTtZQUNBOzs7SUFHQSxTQUFBLG1CQUFBLFFBQUEsUUFBQSxjQUFBLHNCQUFBLGlCQUFBLGdCQUFBOztRQUVBLEtBQUEsU0FBQTtRQUNBLEtBQUEsU0FBQTtRQUNBLEtBQUEsZUFBQTtRQUNBLEtBQUEsdUJBQUE7UUFDQSxLQUFBLGtCQUFBO0VBQ0EsS0FBQSxpQkFBQTs7RUFFQSxJQUFBLENBQUEsS0FBQTtHQUNBLE9BQUE7OztRQUdBLEtBQUEsY0FBQSxlQUFBLFNBQUE7UUFDQSxLQUFBLGFBQUEsS0FBQSxhQUFBO1FBQ0EsS0FBQSxjQUFBLFNBQUEsV0FBQSxJQUFBLENBQUEsYUFBQSxLQUFBLGFBQUEsWUFBQSxLQUFBO0VBQ0EsS0FBQSxZQUFBLEdBQUEsZUFBQSxTQUFBLEdBQUE7R0FDQSxRQUFBLElBQUEsRUFBQTs7O1FBR0EsT0FBQSxPQUFBO1lBQ0EsS0FBQTtZQUNBLEtBQUE7WUFDQSxVQUFBLGVBQUEsS0FBQSxjQUFBLGVBQUEsS0FBQSxjQUFBOzs7UUFHQSxPQUFBOzs7UUFHQSxLQUFBLGFBQUEscUJBQUEsYUFBQTs7O1FBR0EsT0FBQSxJQUFBLHdCQUFBLEtBQUE7O1FBRUEsS0FBQTs7O0NBR0EsbUJBQUEsVUFBQSxXQUFBLFdBQUE7RUFDQSxJQUFBLENBQUEsS0FBQSxlQUFBLE1BQUE7WUFDQSxLQUFBLE9BQUEsR0FBQTtZQUNBLE9BQUE7OztFQUdBLElBQUEsQ0FBQSxLQUFBLGVBQUEsVUFBQTtZQUNBLEtBQUEsT0FBQSxHQUFBO1lBQ0EsT0FBQTs7O0VBR0EsT0FBQTs7OztJQUlBLG1CQUFBLFVBQUEsT0FBQSxXQUFBO1FBQ0EsSUFBQSxPQUFBOztRQUVBLElBQUEsY0FBQSxDQUFBLGFBQUEsS0FBQSxhQUFBLFlBQUEsS0FBQSxhQUFBLFdBQUEsS0FBQTtRQUNBLFFBQUEsSUFBQTs7UUFFQSxJQUFBLGFBQUEsU0FBQSxXQUFBLElBQUE7UUFDQSxXQUFBLEdBQUEsU0FBQSxTQUFBLFVBQUE7WUFDQSxLQUFBLFVBQUEsU0FBQTs7WUFFQSxJQUFBLEtBQUEsUUFBQSxRQUFBLFVBQUE7Z0JBQ0EsS0FBQSxXQUFBLEtBQUEsUUFBQTs7aUJBRUE7Z0JBQ0EsS0FBQTs7Ozs7SUFLQSxtQkFBQSxVQUFBLGFBQUEsU0FBQSxLQUFBO0VBQ0EsSUFBQSxPQUFBOztRQUVBLElBQUEsY0FBQSxDQUFBLFNBQUEsS0FBQSxLQUFBO1FBQ0EsUUFBQSxJQUFBOztRQUVBLFNBQUEsV0FBQSxJQUFBLGFBQUEsR0FBQSxTQUFBLFNBQUEsVUFBQTtZQUNBLElBQUEsVUFBQSxTQUFBO1lBQ0EsS0FBQSxPQUFBLFNBQUE7Z0JBQ0EsS0FBQTtnQkFDQSxLQUFBO2dCQUNBLFVBQUEsV0FBQSxRQUFBLGNBQUEsUUFBQSxjQUFBOzs7WUFHQSxLQUFBOzs7O0lBSUEsbUJBQUEsVUFBQSxrQkFBQSxXQUFBOzs7UUFHQSxLQUFBLE9BQUEsV0FBQSxDQUFBO1lBQ0EsT0FBQTtZQUNBLFFBQUE7WUFDQSxVQUFBO1lBQ0EsUUFBQTtZQUNBLFFBQUE7WUFDQSxZQUFBO1dBQ0E7Z0JBQ0EsT0FBQTtnQkFDQSxRQUFBO2dCQUNBLFVBQUE7Z0JBQ0EsUUFBQTtnQkFDQSxRQUFBO2dCQUNBLFlBQUE7ZUFDQTtnQkFDQSxPQUFBO2dCQUNBLFFBQUE7Z0JBQ0EsVUFBQTtnQkFDQSxRQUFBO2dCQUNBLFFBQUE7Z0JBQ0EsWUFBQTtlQUNBO2dCQUNBLE9BQUE7Z0JBQ0EsUUFBQTtnQkFDQSxVQUFBO2dCQUNBLFFBQUE7Z0JBQ0EsUUFBQTtnQkFDQSxZQUFBO2VBQ0E7Z0JBQ0EsT0FBQTtnQkFDQSxRQUFBO2dCQUNBLFVBQUE7Z0JBQ0EsUUFBQTtnQkFDQSxRQUFBO2dCQUNBLFlBQUE7ZUFDQTtnQkFDQSxPQUFBO2dCQUNBLFFBQUE7Z0JBQ0EsVUFBQTtnQkFDQSxRQUFBO2dCQUNBLFFBQUE7Z0JBQ0EsWUFBQTtlQUNBO2dCQUNBLE9BQUE7Z0JBQ0EsUUFBQTtnQkFDQSxVQUFBO2dCQUNBLFFBQUE7Z0JBQ0EsUUFBQTtnQkFDQSxZQUFBO2VBQ0E7Z0JBQ0EsT0FBQTtnQkFDQSxRQUFBO2dCQUNBLFVBQUE7Z0JBQ0EsUUFBQTtnQkFDQSxRQUFBO2dCQUNBLFlBQUE7ZUFDQTtnQkFDQSxPQUFBO2dCQUNBLFFBQUE7Z0JBQ0EsVUFBQTtnQkFDQSxRQUFBO2dCQUNBLFFBQUE7Z0JBQ0EsWUFBQTtlQUNBO2dCQUNBLE9BQUE7Z0JBQ0EsUUFBQTtnQkFDQSxVQUFBO2dCQUNBLFFBQUE7Z0JBQ0EsUUFBQTtnQkFDQSxZQUFBOzs7O0lBSUEsbUJBQUEsVUFBQSxtQkFBQSxXQUFBOzs7O0lBSUEsbUJBQUEsVUFBQSxjQUFBLFNBQUEsaUJBQUE7UUFDQSxJQUFBLE9BQUE7O1FBRUEsSUFBQSxVQUFBO1lBQ0EsTUFBQSxPQUFBLE9BQUE7WUFDQSxNQUFBLE9BQUEsTUFBQTs7Ozs7Ozs7O1FBU0EsT0FBQSxNQUFBLFVBQUE7O1FBRUEsUUFBQSxNQUFBLElBQUEsT0FBQTtRQUNBLFFBQUEsT0FBQSxJQUFBO1FBQ0EsUUFBQSxXQUFBLE9BQUEsS0FBQTtRQUNBLFFBQUEsU0FBQSxPQUFBLEtBQUE7UUFDQSxRQUFBLE1BQUEsT0FBQSxLQUFBOztRQUVBLE9BQUEsU0FBQSxLQUFBOztRQUVBLFNBQUEsV0FBQTtZQUNBO1lBQ0EsS0FBQSxXQUFBLGFBQUE7V0FDQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDbk5BLENBQUEsWUFBQTtJQUNBOztJQUVBO1NBQ0EsT0FBQTs7U0FFQSxPQUFBLFNBQUEsQ0FBQSxXQUFBOztJQUVB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QUEsVUFBQSxhQUFBLFFBQUE7d0JBQ0EsWUFBQTt3QkFDQSxPQUFBLEdBQUE7OztpQkFHQSxNQUFBLFNBQUE7b0JBQ0EsS0FBQTtvQkFDQSxhQUFBOzs7OztZQUtBLG1CQUFBLFVBQUE7Ozs7Ozs7O0FBUUEiLCJmaWxlIjoiYXBwLmJ1bmRsZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgYW5ndWxhci5tb2R1bGUoXCJhcHAuYXV0aFwiLCBbXSk7XG59KSgpOyIsIihmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgYW5ndWxhci5tb2R1bGUoXCJhcHAuYnVpbGRpbmdzXCIsIFsnYXBwLmZpcmViYXNlJ10pO1xufSkoKTsiLCIoZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGFuZ3VsYXIubW9kdWxlKFwiYXBwLmNoYW5uZWxzXCIsIFtdKTtcbn0pKCk7IiwiKGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBhbmd1bGFyXG4gICAgICAgIC5tb2R1bGUoJ2FwcC5kaXJlY3RtZXNzYWdlcycsIFtdKTtcbn0pKCk7XG5cblxuXG5cbiIsIihmdW5jdGlvbigpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBhbmd1bGFyXG4gICAgICAgIC5tb2R1bGUoJ2FwcC5maXJlYmFzZScsIFtdKTtcbn0pKCk7XG5cblxuXG5cbiIsIihmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgYW5ndWxhclxuICAgICAgICAubW9kdWxlKCdtb25vc3BhY2VkLmVsYXN0aWMnLCBbXSlcbiAgICAgICAgLmNvbnN0YW50KCdtc2RFbGFzdGljQ29uZmlnJywge1xuICAgICAgICAgICAgYXBwZW5kOiAnJ1xuICAgICAgICB9KVxuICAgICAgICAuZGlyZWN0aXZlKCdtc2RFbGFzdGljJywgW1xuICAgICAgICAgICAgJyR0aW1lb3V0JywgJyR3aW5kb3cnLCAnbXNkRWxhc3RpY0NvbmZpZycsXG4gICAgICAgICAgICBmdW5jdGlvbiAoJHRpbWVvdXQsICR3aW5kb3csIGNvbmZpZykge1xuICAgICAgICAgICAgICAgICd1c2Ugc3RyaWN0JztcblxuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmU6ICduZ01vZGVsJyxcbiAgICAgICAgICAgICAgICAgICAgcmVzdHJpY3Q6ICdBLCBDJyxcbiAgICAgICAgICAgICAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50LCBhdHRycywgbmdNb2RlbCkge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBjYWNoZSBhIHJlZmVyZW5jZSB0byB0aGUgRE9NIGVsZW1lbnRcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0YSA9IGVsZW1lbnRbMF0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHRhID0gZWxlbWVudDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZW5zdXJlIHRoZSBlbGVtZW50IGlzIGEgdGV4dGFyZWEsIGFuZCBicm93c2VyIGlzIGNhcGFibGVcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0YS5ub2RlTmFtZSAhPT0gJ1RFWFRBUkVBJyB8fCAhJHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBzZXQgdGhlc2UgcHJvcGVydGllcyBiZWZvcmUgbWVhc3VyaW5nIGRpbWVuc2lvbnNcbiAgICAgICAgICAgICAgICAgICAgICAgICR0YS5jc3Moe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdvdmVyZmxvdyc6ICdoaWRkZW4nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdvdmVyZmxvdy15JzogJ2hpZGRlbicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ3dvcmQtd3JhcCc6ICdicmVhay13b3JkJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGZvcmNlIHRleHQgcmVmbG93XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdGV4dCA9IHRhLnZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGEudmFsdWUgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhLnZhbHVlID0gdGV4dDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGFwcGVuZCA9IGF0dHJzLm1zZEVsYXN0aWMgPyBhdHRycy5tc2RFbGFzdGljLnJlcGxhY2UoL1xcXFxuL2csICdcXG4nKSA6IGNvbmZpZy5hcHBlbmQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHdpbiA9IGFuZ3VsYXIuZWxlbWVudCgkd2luZG93KSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaXJyb3JJbml0U3R5bGUgPSAncG9zaXRpb246IGFic29sdXRlOyB0b3A6IC05OTlweDsgcmlnaHQ6IGF1dG87IGJvdHRvbTogYXV0bzsnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2xlZnQ6IDA7IG92ZXJmbG93OiBoaWRkZW47IC13ZWJraXQtYm94LXNpemluZzogY29udGVudC1ib3g7JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICctbW96LWJveC1zaXppbmc6IGNvbnRlbnQtYm94OyBib3gtc2l6aW5nOiBjb250ZW50LWJveDsnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ21pbi1oZWlnaHQ6IDAgIWltcG9ydGFudDsgaGVpZ2h0OiAwICFpbXBvcnRhbnQ7IHBhZGRpbmc6IDA7JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICd3b3JkLXdyYXA6IGJyZWFrLXdvcmQ7IGJvcmRlcjogMDsnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRtaXJyb3IgPSBhbmd1bGFyLmVsZW1lbnQoJzx0ZXh0YXJlYSBhcmlhLWhpZGRlbj1cInRydWVcIiB0YWJpbmRleD1cIi0xXCIgJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdzdHlsZT1cIicgKyBtaXJyb3JJbml0U3R5bGUgKyAnXCIvPicpLmRhdGEoJ2VsYXN0aWMnLCB0cnVlKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaXJyb3IgPSAkbWlycm9yWzBdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhU3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlKHRhKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNpemUgPSB0YVN0eWxlLmdldFByb3BlcnR5VmFsdWUoJ3Jlc2l6ZScpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJvcmRlckJveCA9IHRhU3R5bGUuZ2V0UHJvcGVydHlWYWx1ZSgnYm94LXNpemluZycpID09PSAnYm9yZGVyLWJveCcgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFTdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKCctbW96LWJveC1zaXppbmcnKSA9PT0gJ2JvcmRlci1ib3gnIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhU3R5bGUuZ2V0UHJvcGVydHlWYWx1ZSgnLXdlYmtpdC1ib3gtc2l6aW5nJykgPT09ICdib3JkZXItYm94JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBib3hPdXRlciA9ICFib3JkZXJCb3ggPyB7d2lkdGg6IDAsIGhlaWdodDogMH0gOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiBwYXJzZUludCh0YVN0eWxlLmdldFByb3BlcnR5VmFsdWUoJ2JvcmRlci1yaWdodC13aWR0aCcpLCAxMCkgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJzZUludCh0YVN0eWxlLmdldFByb3BlcnR5VmFsdWUoJ3BhZGRpbmctcmlnaHQnKSwgMTApICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyc2VJbnQodGFTdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKCdwYWRkaW5nLWxlZnQnKSwgMTApICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyc2VJbnQodGFTdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKCdib3JkZXItbGVmdC13aWR0aCcpLCAxMCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodDogcGFyc2VJbnQodGFTdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKCdib3JkZXItdG9wLXdpZHRoJyksIDEwKSArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcnNlSW50KHRhU3R5bGUuZ2V0UHJvcGVydHlWYWx1ZSgncGFkZGluZy10b3AnKSwgMTApICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyc2VJbnQodGFTdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKCdwYWRkaW5nLWJvdHRvbScpLCAxMCkgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJzZUludCh0YVN0eWxlLmdldFByb3BlcnR5VmFsdWUoJ2JvcmRlci1ib3R0b20td2lkdGgnKSwgMTApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaW5IZWlnaHRWYWx1ZSA9IHBhcnNlSW50KHRhU3R5bGUuZ2V0UHJvcGVydHlWYWx1ZSgnbWluLWhlaWdodCcpLCAxMCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0VmFsdWUgPSBwYXJzZUludCh0YVN0eWxlLmdldFByb3BlcnR5VmFsdWUoJ2hlaWdodCcpLCAxMCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWluSGVpZ2h0ID0gTWF0aC5tYXgobWluSGVpZ2h0VmFsdWUsIGhlaWdodFZhbHVlKSAtIGJveE91dGVyLmhlaWdodCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXhIZWlnaHQgPSBwYXJzZUludCh0YVN0eWxlLmdldFByb3BlcnR5VmFsdWUoJ21heC1oZWlnaHQnKSwgMTApLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1pcnJvcmVkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGl2ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb3B5U3R5bGUgPSBbJ2ZvbnQtZmFtaWx5JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2ZvbnQtc2l6ZScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdmb250LXdlaWdodCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdmb250LXN0eWxlJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2xldHRlci1zcGFjaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2xpbmUtaGVpZ2h0JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ3RleHQtdHJhbnNmb3JtJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ3dvcmQtc3BhY2luZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICd0ZXh0LWluZGVudCddO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBleGl0IGlmIGVsYXN0aWMgYWxyZWFkeSBhcHBsaWVkIChvciBpcyB0aGUgbWlycm9yIGVsZW1lbnQpXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoJHRhLmRhdGEoJ2VsYXN0aWMnKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gT3BlcmEgcmV0dXJucyBtYXgtaGVpZ2h0IG9mIC0xIGlmIG5vdCBzZXRcbiAgICAgICAgICAgICAgICAgICAgICAgIG1heEhlaWdodCA9IG1heEhlaWdodCAmJiBtYXhIZWlnaHQgPiAwID8gbWF4SGVpZ2h0IDogOWU0O1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBhcHBlbmQgbWlycm9yIHRvIHRoZSBET01cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtaXJyb3IucGFyZW50Tm9kZSAhPT0gZG9jdW1lbnQuYm9keSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFuZ3VsYXIuZWxlbWVudChkb2N1bWVudC5ib2R5KS5hcHBlbmQobWlycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gc2V0IHJlc2l6ZSBhbmQgYXBwbHkgZWxhc3RpY1xuICAgICAgICAgICAgICAgICAgICAgICAgJHRhLmNzcyh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ3Jlc2l6ZSc6IChyZXNpemUgPT09ICdub25lJyB8fCByZXNpemUgPT09ICd2ZXJ0aWNhbCcpID8gJ25vbmUnIDogJ2hvcml6b250YWwnXG4gICAgICAgICAgICAgICAgICAgICAgICB9KS5kYXRhKCdlbGFzdGljJywgdHJ1ZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8qXG4gICAgICAgICAgICAgICAgICAgICAgICAgKiBtZXRob2RzXG4gICAgICAgICAgICAgICAgICAgICAgICAgKi9cblxuICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gaW5pdE1pcnJvcigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbWlycm9yU3R5bGUgPSBtaXJyb3JJbml0U3R5bGU7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaXJyb3JlZCA9IHRhO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNvcHkgdGhlIGVzc2VudGlhbCBzdHlsZXMgZnJvbSB0aGUgdGV4dGFyZWEgdG8gdGhlIG1pcnJvclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhU3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlKHRhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbmd1bGFyLmZvckVhY2goY29weVN0eWxlLCBmdW5jdGlvbiAodmFsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1pcnJvclN0eWxlICs9IHZhbCArICc6JyArIHRhU3R5bGUuZ2V0UHJvcGVydHlWYWx1ZSh2YWwpICsgJzsnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1pcnJvci5zZXRBdHRyaWJ1dGUoJ3N0eWxlJywgbWlycm9yU3R5bGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiBhZGp1c3QoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRhSGVpZ2h0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YUNvbXB1dGVkU3R5bGVXaWR0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWlycm9ySGVpZ2h0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3ZlcmZsb3c7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobWlycm9yZWQgIT09IHRhKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluaXRNaXJyb3IoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBhY3RpdmUgZmxhZyBwcmV2ZW50cyBhY3Rpb25zIGluIGZ1bmN0aW9uIGZyb20gY2FsbGluZyBhZGp1c3QgYWdhaW5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWFjdGl2ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3RpdmUgPSB0cnVlO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1pcnJvci52YWx1ZSA9IHRhLnZhbHVlICsgYXBwZW5kOyAvLyBvcHRpb25hbCB3aGl0ZXNwYWNlIHRvIGltcHJvdmUgYW5pbWF0aW9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1pcnJvci5zdHlsZS5vdmVyZmxvd1kgPSB0YS5zdHlsZS5vdmVyZmxvd1k7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFIZWlnaHQgPSB0YS5zdHlsZS5oZWlnaHQgPT09ICcnID8gJ2F1dG8nIDogcGFyc2VJbnQodGEuc3R5bGUuaGVpZ2h0LCAxMCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFDb21wdXRlZFN0eWxlV2lkdGggPSBnZXRDb21wdXRlZFN0eWxlKHRhKS5nZXRQcm9wZXJ0eVZhbHVlKCd3aWR0aCcpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGVuc3VyZSBnZXRDb21wdXRlZFN0eWxlIGhhcyByZXR1cm5lZCBhIHJlYWRhYmxlICd1c2VkIHZhbHVlJyBwaXhlbCB3aWR0aFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGFDb21wdXRlZFN0eWxlV2lkdGguc3Vic3RyKHRhQ29tcHV0ZWRTdHlsZVdpZHRoLmxlbmd0aCAtIDIsIDIpID09PSAncHgnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB1cGRhdGUgbWlycm9yIHdpZHRoIGluIGNhc2UgdGhlIHRleHRhcmVhIHdpZHRoIGhhcyBjaGFuZ2VkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aCA9IHBhcnNlSW50KHRhQ29tcHV0ZWRTdHlsZVdpZHRoLCAxMCkgLSBib3hPdXRlci53aWR0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1pcnJvci5zdHlsZS53aWR0aCA9IHdpZHRoICsgJ3B4JztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1pcnJvckhlaWdodCA9IG1pcnJvci5zY3JvbGxIZWlnaHQ7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1pcnJvckhlaWdodCA+IG1heEhlaWdodCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWlycm9ySGVpZ2h0ID0gbWF4SGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3ZlcmZsb3cgPSAnc2Nyb2xsJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChtaXJyb3JIZWlnaHQgPCBtaW5IZWlnaHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1pcnJvckhlaWdodCA9IG1pbkhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaXJyb3JIZWlnaHQgKz0gYm94T3V0ZXIuaGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YS5zdHlsZS5vdmVyZmxvd1kgPSBvdmVyZmxvdyB8fCAnaGlkZGVuJztcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGFIZWlnaHQgIT09IG1pcnJvckhlaWdodCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NvcGUuJGVtaXQoJ2VsYXN0aWM6cmVzaXplJywgJHRhLCB0YUhlaWdodCwgbWlycm9ySGVpZ2h0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhLnN0eWxlLmhlaWdodCA9IG1pcnJvckhlaWdodCArICdweCc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBzbWFsbCBkZWxheSB0byBwcmV2ZW50IGFuIGluZmluaXRlIGxvb3BcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0aXZlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIDEsIGZhbHNlKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gZm9yY2VBZGp1c3QoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0aXZlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWRqdXN0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8qXG4gICAgICAgICAgICAgICAgICAgICAgICAgKiBpbml0aWFsaXNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgKi9cblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gbGlzdGVuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoJ29ucHJvcGVydHljaGFuZ2UnIGluIHRhICYmICdvbmlucHV0JyBpbiB0YSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIElFOVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhWydvbmlucHV0J10gPSB0YS5vbmtleXVwID0gYWRqdXN0O1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YVsnb25pbnB1dCddID0gYWRqdXN0O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAkd2luLmJpbmQoJ3Jlc2l6ZScsIGZvcmNlQWRqdXN0KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgc2NvcGUuJHdhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmdNb2RlbC4kbW9kZWxWYWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChuZXdWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvcmNlQWRqdXN0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgc2NvcGUuJG9uKCdlbGFzdGljOmFkanVzdCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbml0TWlycm9yKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yY2VBZGp1c3QoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAkdGltZW91dChhZGp1c3QsIDAsIGZhbHNlKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLypcbiAgICAgICAgICAgICAgICAgICAgICAgICAqIGRlc3Ryb3lcbiAgICAgICAgICAgICAgICAgICAgICAgICAqL1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBzY29wZS4kb24oJyRkZXN0cm95JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRtaXJyb3IucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHdpbi51bmJpbmQoJ3Jlc2l6ZScsIGZvcmNlQWRqdXN0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgXSk7XG5cbiAgICBhbmd1bGFyXG4gICAgICAgIC5tb2R1bGUoJ2FwcC5tZXNzYWdlcycsIFsnbW9ub3NwYWNlZC5lbGFzdGljJ10pO1xufSkoKTtcblxuXG5cblxuIiwiKGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBhbmd1bGFyLm1vZHVsZShcImFwcC5zaWRlbWVudVwiLCBbXSk7XG59KSgpOyIsIihmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgYW5ndWxhci5tb2R1bGUoXCJhcHAudXNlcnNcIiwgWydhcHAuYXV0aCddKTtcbn0pKCk7IiwiKGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBhbmd1bGFyLm1vZHVsZShcImFwcC5wcm9maWxlc1wiLCBbJ2FwcC5hdXRoJ10pO1xufSkoKTsiLCIoZnVuY3Rpb24oKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgYW5ndWxhci5tb2R1bGUoXCJhcHAuYXV0aFwiKVxuXG4gICAgICAgIC5jb250cm9sbGVyKFwiYXV0aENvbnRyb2xsZXJcIiwgYXV0aENvbnRyb2xsZXIpO1xuXG5cbiAgICBmdW5jdGlvbiBhdXRoQ29udHJvbGxlcigkc2NvcGUsIGF1dGhTZXJ2aWNlLCAkaW9uaWNQb3B1cCwgJGlvbmljTG9hZGluZywgJHN0YXRlLCAkdGltZW91dCkge1xuXG4gICAgICAgICRzY29wZS5kYXRhID0ge307XG5cbiAgICAgICAgJHNjb3BlLmxvZ2luID0gZnVuY3Rpb24oKSB7XG5cdFx0XHQkaW9uaWNMb2FkaW5nLnNob3coKTtcblxuXHRcdFx0YXV0aFNlcnZpY2UubG9naW4oJHNjb3BlLmRhdGEudXNlcm5hbWUsICRzY29wZS5kYXRhLnBhc3N3b3JkKS5zdWNjZXNzKGZ1bmN0aW9uKHVzZXIpIHtcblx0XHRcdFx0JGlvbmljTG9hZGluZy5oaWRlKCk7XG5cdFx0XHRcdCRzdGF0ZS5nbygnYXBwLmJ1aWxkaW5ncycpO1xuXG4gICAgICAgICAgICB9KS5lcnJvcihmdW5jdGlvbihlcnJvcikge1xuXHRcdFx0XHQkdGltZW91dChmdW5jdGlvbigpIHtcblx0XHRcdFx0XHQkaW9uaWNMb2FkaW5nLmhpZGUoKTtcblx0XHRcdFx0fSwgMTAwKTtcblxuICAgICAgICAgICAgICAgIHZhciBhbGVydFBvcHVwID0gJGlvbmljUG9wdXAuYWxlcnQoe1xuICAgICAgICAgICAgICAgICAgICB0aXRsZTogJ0xvZ2luIGZhaWxlZCEnLFxuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZTogZXJyb3IubWVzc2FnZSAvLydQbGVhc2UgY2hlY2sgeW91ciBjcmVkZW50aWFscyEnXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG5cdFx0JHNjb3BlLmZhY2Vib29rTG9naW4gPSBmdW5jdGlvbigpIHtcblx0XHRcdHZhciBhbGVydFBvcHVwID0gJGlvbmljUG9wdXAuYWxlcnQoe1xuXHRcdFx0XHR0aXRsZTogJ0ZhY2Vib29rIGxvZ2luJyxcblx0XHRcdFx0dGVtcGxhdGU6ICdQbGFubmVkISdcblx0XHRcdH0pO1xuICAgICAgICB9XG4gICAgfVxufSkoKTsiLCIoZnVuY3Rpb24oKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgYW5ndWxhci5tb2R1bGUoXCJhcHAuYXV0aFwiKVxuXG4gICAgICAgIC5zZXJ2aWNlKFwiYXV0aFNlcnZpY2VcIiwgYXV0aFNlcnZpY2UpO1xuXG5cdGZ1bmN0aW9uIGNyZWF0ZVVzZXIodXNlcm5hbWUsIHBhc3N3b3JkKSB7XG5cdFx0dmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcblx0XHR2YXIgYXV0aCA9IGZpcmViYXNlU2VydmljZS5mYi5hdXRoKCk7XG5cblx0XHRyZXR1cm4gYXV0aC5jcmVhdGVVc2VyV2l0aEVtYWlsQW5kUGFzc3dvcmQoZW1haWwsIHBhc3N3b3JkKTtcblx0fVxuXHRcbiAgICBmdW5jdGlvbiBhdXRoU2VydmljZSgkcSwgJHJvb3RTY29wZSwgYnVpbGRpbmdzU2VydmljZSwgZ2xvYmFsc1NlcnZpY2UpIHtcblx0XHR2YXIgYXV0aCA9IGZpcmViYXNlLmF1dGgoKTtcblx0XHRcblx0XHQkcm9vdFNjb3BlLiRvbigndXNlci1jaGFuZ2VkJywgZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgdXNyID0gZmlyZWJhc2UuYXV0aCgpLmN1cnJlbnRVc2VyO1xuXHRcdFx0aWYgKHVzciA9PSBudWxsKSB7XG5cdFx0XHRcdGdsb2JhbHNTZXJ2aWNlLnVzZXIgPSBudWxsO1xuXHRcdFx0XHRyZXR1cm5cblx0XHRcdH07XG5cdFx0XHRcblx0XHRcdGdsb2JhbHNTZXJ2aWNlLnVzZXIgPSB1c3I7XG5cdFx0XHRcblx0XHRcdGZpcmViYXNlLmRhdGFiYXNlKCkucmVmKCd1c2Vycy8nICsgdXNyLnVpZCkuc2V0KHtcblx0XHRcdFx0bmFtZTogdXNyLmRpc3BsYXlOYW1lLFxuXHRcdFx0XHRlbWFpbDogdXNyLmVtYWlsLFxuXHRcdFx0XHRsYXN0QWN0aXZpdHk6IG5ldyBEYXRlKCkuZ2V0VGltZSgpXG5cdFx0XHR9KTtcblx0XHR9KTtcblxuXHRcdHJldHVybiB7XG4gICAgICAgICAgICBsb2dpbjogZnVuY3Rpb24odXNlcm5hbWUsIHBhc3N3b3JkKSB7XG4gICAgICAgICAgICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICAgICAgICB2YXIgcHJvbWlzZSA9IGRlZmVycmVkLnByb21pc2U7XG5cblx0XHRcdFx0dmFyIHN1Y2Nlc3NIYW5kbGVyID0gZnVuY3Rpb24oaW5mbykge1xuXHRcdFx0XHRcdGluZm8uaXNOZXcgPSBpbmZvLmRpc3BsYXlOYW1lID09IG51bGw7XG5cdFx0XHRcdFx0ZGVmZXJyZWQucmVzb2x2ZShpbmZvKTtcblx0XHRcdFx0XHRcdFx0XHRcdFxuXHRcdFx0XHRcdCRyb290U2NvcGUuJGVtaXQoJ3VzZXItY2hhbmdlZCcpO1xuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdHZhciBlcnJvckhhbmRsZXIgPSBmdW5jdGlvbihlcnJvcikge1xuXHRcdFx0XHRcdGRlZmVycmVkLnJlamVjdChlcnJvcik7XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0YXV0aC5zaWduSW5XaXRoRW1haWxBbmRQYXNzd29yZCh1c2VybmFtZSwgcGFzc3dvcmQpXG5cdFx0XHRcdFx0LnRoZW4oc3VjY2Vzc0hhbmRsZXIsIGZ1bmN0aW9uIGVycm9yKGVycm9yKSB7XG5cdFx0XHRcdFx0XHRpZiAoZXJyb3IuY29kZSA9PSBcImF1dGgvdXNlci1ub3QtZm91bmRcIikge1xuXHRcdFx0XHRcdFx0XHRhdXRoLmNyZWF0ZVVzZXJXaXRoRW1haWxBbmRQYXNzd29yZCh1c2VybmFtZSwgcGFzc3dvcmQpXG5cdFx0XHRcdFx0XHRcdFx0LnRoZW4oc3VjY2Vzc0hhbmRsZXIsIGVycm9ySGFuZGxlcik7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRcdFx0ZXJyb3JIYW5kbGVyKGVycm9yKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9KTtcblxuICAgICAgICAgICAgICAgIHByb21pc2Uuc3VjY2VzcyA9IGZ1bmN0aW9uKGZuKSB7XG4gICAgICAgICAgICAgICAgICAgIHByb21pc2UudGhlbihmbik7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBwcm9taXNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBwcm9taXNlLmVycm9yID0gZnVuY3Rpb24oZm4pIHtcbiAgICAgICAgICAgICAgICAgICAgcHJvbWlzZS50aGVuKG51bGwsIGZuKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBwcm9taXNlO1xuICAgICAgICAgICAgfSxcblxuXHRcdFx0bG9nb3V0OiBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdGF1dGguc2lnbk91dCgpO1xuXHRcdFx0XHRnbG9iYWxzU2VydmljZS51c2VyID0gbnVsbDtcblx0XHRcdH0sXG5cbiAgICAgICAgICAgIHVzZXI6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRyZXR1cm4gZmlyZWJhc2UuYXV0aCgpLmN1cnJlbnRVc2VyO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufSkoKTtcbiIsIihmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgYW5ndWxhci5tb2R1bGUoXCJhcHAuYnVpbGRpbmdzXCIpXG5cbiAgICAgICAgLmNvbnRyb2xsZXIoXCJidWlsZGluZ0NvbnRyb2xsZXJcIiwgYnVpbGRpbmdDb250cm9sbGVyKTtcblxuXG4gICAgZnVuY3Rpb24gYnVpbGRpbmdDb250cm9sbGVyKCRzY29wZSwgJGlvbmljTG9hZGluZywgJHN0YXRlUGFyYW1zLCBjaGFubmVsc1NlcnZpY2UpIHtcblxuICAgICAgICB2YXIgcmVmID0gY2hhbm5lbHNTZXJ2aWNlLmdldENoYW5uZWxzRnJvbSgkc3RhdGVQYXJhbXMuYnVpbGRpbmdJZCk7XG5cbiAgICAgICAgJGlvbmljTG9hZGluZy5zaG93KCk7XG4gICAgICAgIHJlZi5vbihcInZhbHVlXCIsIGZ1bmN0aW9uIChzbmFwc2hvdCkge1xuICAgICAgICAgICAgdmFyIHZhbCA9IHNuYXBzaG90LnZhbCgpO1xuXG4gICAgICAgICAgICBpZiAodmFsKSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLmNoYW5uZWxzID0gdmFsLmNoYW5uZWxzO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG5cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgICRpb25pY0xvYWRpbmcuaGlkZSgpO1xuXG4gICAgICAgIH0sIGZ1bmN0aW9uIChlcnJvck9iamVjdCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJlcnJvciByZWFkaW5nOiBcIiArIGVycm9yT2JqZWN0LmNvZGUpO1xuICAgICAgICAgICAgdmFyIGFsZXJ0UG9wdXAgPSAkaW9uaWNQb3B1cC5hbGVydCh7XG4gICAgICAgICAgICAgICAgdGl0bGU6ICdPcHMhJyxcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZTogJ1NvcnJ5ISBBbiBlcnJvciBvY3VycmVkLidcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgJGlvbmljTG9hZGluZy5oaWRlKCk7XG4gICAgICAgIH0pO1xuXG4gICAgfVxufSkoKTsiLCIoZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGFuZ3VsYXIubW9kdWxlKFwiYXBwLmJ1aWxkaW5nc1wiKVxuXG4gICAgICAgIC5jb250cm9sbGVyKFwiYnVpbGRpbmdzQ29udHJvbGxlclwiLCBidWlsZGluZ3NDb250cm9sbGVyKTtcblxuXG4gICAgZnVuY3Rpb24gYnVpbGRpbmdzQ29udHJvbGxlcigkc2NvcGUsICRpb25pY0xvYWRpbmcsIGJ1aWxkaW5nc1NlcnZpY2UsIGdsb2JhbHNTZXJ2aWNlKSB7XG4gICAgICAgIHZhciByZWYgPSBidWlsZGluZ3NTZXJ2aWNlLmdldEJ1aWxkaW5ncygpO1xuXHRcdFxuXHRcdCRzY29wZS5zZWxlY3RlZEtleSA9IGdsb2JhbHNTZXJ2aWNlLmJ1aWxkaW5nID8gZ2xvYmFsc1NlcnZpY2UuYnVpbGRpbmcua2V5IDogbnVsbDtcblx0XHRcblx0XHQkc2NvcGUuc2VsZWN0ID0gZnVuY3Rpb24oa2V5LCBidWlsZGluZykge1xuXHRcdFx0JHNjb3BlLnNlbGVjdGVkS2V5ID0gYnVpbGRpbmcua2V5ID0ga2V5O1xuXHRcdFx0Z2xvYmFsc1NlcnZpY2UuYnVpbGRpbmcgPSBidWlsZGluZztcblx0XHRcdCRzY29wZS4kZW1pdChcImJ1aWxkaW5nLXNlbGVjdGVkXCIsIGJ1aWxkaW5nKTtcblx0XHR9O1x0XHRcblxuICAgICAgICAkaW9uaWNMb2FkaW5nLnNob3coKTtcbiAgICAgICAgcmVmLm9uKFwidmFsdWVcIiwgZnVuY3Rpb24gKHNuYXBzaG90KSB7XG4gICAgICAgICAgICAkc2NvcGUuYnVpbGRpbmdzID0gc25hcHNob3QudmFsKCk7XG4gICAgICAgICAgICAkaW9uaWNMb2FkaW5nLmhpZGUoKTtcbiAgICAgICAgfSwgZnVuY3Rpb24gKGVycm9yT2JqZWN0KSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcImVycm9yIHJlYWRpbmc6IFwiICsgZXJyb3JPYmplY3QuY29kZSk7XG4gICAgICAgICAgICB2YXIgYWxlcnRQb3B1cCA9ICRpb25pY1BvcHVwLmFsZXJ0KHtcbiAgICAgICAgICAgICAgICB0aXRsZTogJ09wcyEnLFxuICAgICAgICAgICAgICAgIHRlbXBsYXRlOiAnU29ycnkhIEFuIGVycm9yIG9jdXJyZWQnXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICRpb25pY0xvYWRpbmcuaGlkZSgpO1xuICAgICAgICB9KTtcbiAgICB9XG59KSgpOyIsIihmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgYW5ndWxhclxuICAgICAgICAubW9kdWxlKCdhcHAuYnVpbGRpbmdzJylcbiAgICAgICAgLnNlcnZpY2UoJ2J1aWxkaW5nc1NlcnZpY2UnLCBidWlsZGluZ3NTZXJ2aWNlKTtcblxuICAgIGZ1bmN0aW9uIGJ1aWxkaW5nc1NlcnZpY2UoZmlyZWJhc2VTZXJ2aWNlLCAkcm9vdFNjb3BlKSB7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGdldEJ1aWxkaW5nczogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmaXJlYmFzZS5kYXRhYmFzZSgpLnJlZignYnVpbGRpbmdzJylcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn0pKCk7XG4iLCIoZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGFuZ3VsYXJcbiAgICAgICAgLm1vZHVsZSgnYXBwLmNoYW5uZWxzJylcbiAgICAgICAgLnNlcnZpY2UoJ2NoYW5uZWxzU2VydmljZScsIGNoYW5uZWxzU2VydmljZSk7XG5cbiAgICBmdW5jdGlvbiBjaGFubmVsc1NlcnZpY2UoJHJvb3RTY29wZSkge1xuXHRcdHZhciBzZXJ2aWNlID0ge307XG5cdFx0XG5cdFx0c2VydmljZS5jaGFubmVscyA9IHtcblx0XHRcdFwibGFuZGxvcmRcIjogXCJUYWxrIHRvIGxhbmRsb3JkXCIsXG5cdFx0XHRcImdlbmVyYWxcIjogXCJHZW5lcmFsXCIsXG5cdFx0XHRcInBhcmtpbmdcIjogXCJQYXJraW5nIEdhcmFnZVwiLFxuXHRcdFx0XCJnYXJkZW5cIjogXCJHYXJkZW5cIixcblx0XHRcdFwibG9zdGZvdW5kXCI6IFwiTG9zdCAmIEZvdW5kXCIsXG5cdFx0XHRcIm1haW50ZW5hbmNlXCI6IFwiUmVxdWVzdCBNYWludGVuYW5jZVwiXG5cdFx0fTtcblx0XHRcblx0XHQkcm9vdFNjb3BlLiRvbihcImJ1aWxkaW5nLXNlbGVjdGVkXCIsIGZ1bmN0aW9uKGJ1aWxkaW5nKSB7XG5cdFx0XHQvL2NvdW50IGhvdyBtYW55IG5ldyBtZXNzYWdlcyBlYWNoIGNoYW5uZWwgaGFzXG5cdFx0fSk7XG5cdFx0XG5cdFx0c2VydmljZS5nZXRDaGFubmVsc0Zyb20gPSBmdW5jdGlvbiAoYnVpbGRpbmcpIHtcblx0XHRcdHJldHVybiBmaXJlYmFzZS5kYXRhYmFzZSgpLnJlZignYnVpbGRpbmdzLycgKyBidWlsZGluZyArIFwiL2NoYW5uZWxzXCIpO1xuXHRcdH07XG5cbiAgICAgICAgcmV0dXJuIHNlcnZpY2U7XG4gICAgfVxufSkoKTtcblxuIiwiKGZ1bmN0aW9uKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGFuZ3VsYXJcbiAgICAgICAgLm1vZHVsZSgnYXBwLmRpcmVjdG1lc3NhZ2VzJylcbiAgICAgICAgLmNvbnRyb2xsZXIoJ2RpcmVjdE1lc3NhZ2VzQ29udHJvbGxlcicsIFtcbiAgICAgICAgICAgICckc2NvcGUnLFxuXHRcdFx0JyRzdGF0ZScsXG4gICAgICAgICAgICAnJGlvbmljTG9hZGluZycsXG4gICAgICAgICAgICAnZGlyZWN0TWVzc2FnZXNTZXJ2aWNlJyxcbiAgICAgICAgICAgICdnbG9iYWxzU2VydmljZScsXG4gICAgICAgICAgICBkaXJlY3RNZXNzYWdlc0NvbnRyb2xsZXJcbiAgICAgICAgXSk7XG5cbiAgICBmdW5jdGlvbiBkaXJlY3RNZXNzYWdlc0NvbnRyb2xsZXIoJHNjb3BlLCAkc3RhdGUsICRpb25pY0xvYWRpbmcsIGNvbnRhY3RzU2VydmljZSwgZ2xvYmFsc1NlcnZpY2UpIHtcblx0XHRpZiAoIWdsb2JhbHNTZXJ2aWNlLnVzZXIpIHtcblx0XHRcdCRzdGF0ZS5nbygnbG9naW4nKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG4gICAgICAgIFxuXHRcdHZhciB1c2VyID0gZ2xvYmFsc1NlcnZpY2UudXNlcjtcblx0XHRjb25zb2xlLmxvZyh1c2VyLnVpZCk7XG5cbiAgICAgICAgJGlvbmljTG9hZGluZy5zaG93KCk7XG5cbiAgICAgICAgdmFyIHJlZiA9IGNvbnRhY3RzU2VydmljZS5nZXRVc2VyQ29udGFjdHModXNlci51aWQpO1xuICAgICAgICByZWYub24oXCJ2YWx1ZVwiLCBmdW5jdGlvbihzbmFwc2hvdCkge1xuXHRcdFx0JHNjb3BlLmNvbnRhY3RzID0gc25hcHNob3QudmFsKCk7XG4gICAgICAgICAgICAkaW9uaWNMb2FkaW5nLmhpZGUoKTtcblx0XHRcdFxuXHRcdFx0Y29uc29sZS5sb2coJHNjb3BlLmNvbnRhY3RzKTtcbiAgICAgICAgfSwgZnVuY3Rpb24oZXJyb3JPYmplY3QpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiZXJyb3IgcmVhZGluZzogXCIgKyBlcnJvck9iamVjdC5jb2RlKTtcbiAgICAgICAgICAgICRpb25pY0xvYWRpbmcuaGlkZSgpO1xuICAgICAgICAgICAgdmFyIGFsZXJ0UG9wdXAgPSAkaW9uaWNQb3B1cC5hbGVydCh7XG4gICAgICAgICAgICAgICAgdGl0bGU6ICdPcHMhJyxcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZTogJ1NvcnJ5ISBBbiBlcnJvciBvY3VycmVkLidcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgICBcbiAgICB9XG59KSgpOyIsIihmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgYW5ndWxhclxuICAgICAgICAubW9kdWxlKCdhcHAuZGlyZWN0bWVzc2FnZXMnKVxuICAgICAgICAuc2VydmljZSgnZGlyZWN0TWVzc2FnZXNTZXJ2aWNlJywgZGlyZWN0TWVzc2FnZXNTZXJ2aWNlKTtcblxuICAgIGZ1bmN0aW9uIGRpcmVjdE1lc3NhZ2VzU2VydmljZShmaXJlYmFzZVNlcnZpY2UpIHtcbiAgICAgICAgdmFyIHNlcnZpY2UgPSB7fTtcblxuICAgICAgICBzZXJ2aWNlLmdldFVzZXJDb250YWN0cyA9IGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICAgICAgICByZXR1cm4gZmlyZWJhc2VTZXJ2aWNlLmZiLmRhdGFiYXNlKCkucmVmKCd1c2Vycy8nICsgdXNlciArICcvY29udGFjdHMnKTtcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gc2VydmljZTtcbiAgICB9XG59KSgpO1xuIiwiKGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBhbmd1bGFyXG4gICAgICAgIC5tb2R1bGUoJ2FwcC5maXJlYmFzZScpXG4gICAgICAgIC5zZXJ2aWNlKCdmaXJlYmFzZVNlcnZpY2UnLCBmaXJlYmFzZVNlcnZpY2UpO1xuXG5cbiAgICBmdW5jdGlvbiBmaXJlYmFzZVNlcnZpY2UoKSB7XG4gICAgICAgIHZhciBjb25maWcgPSB7XG4gICAgICAgICAgICBhcGlLZXk6IFwiQUl6YVN5QjVxODFBR0dveDRpOC1RTDJLT3RuRERmaTA1aXJnY0hFXCIsXG4gICAgICAgICAgICBhdXRoRG9tYWluOiBcInNvY2lhbHN0cmF0YWlkZWF0ZWFtLmZpcmViYXNlYXBwLmNvbVwiLFxuICAgICAgICAgICAgZGF0YWJhc2VVUkw6IFwiaHR0cHM6Ly9zb2NpYWxzdHJhdGFpZGVhdGVhbS5maXJlYmFzZWlvLmNvbVwiLFxuICAgICAgICAgICAgc3RvcmFnZUJ1Y2tldDogXCJcIixcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmZiID0gZmlyZWJhc2UuaW5pdGlhbGl6ZUFwcChjb25maWcpO1xuICAgIH1cbn0pKCk7XG4iLCIoZnVuY3Rpb24oKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgYW5ndWxhclxuICAgICAgICAubW9kdWxlKCdhcHAubWVzc2FnZXMnKVxuICAgICAgICAuY29udHJvbGxlcignbWVzc2FnZXNDb250cm9sbGVyJywgW1xuICAgICAgICAgICAgJyRzY29wZScsXG4gICAgICAgICAgICAnJHN0YXRlJyxcbiAgICAgICAgICAgICckc3RhdGVQYXJhbXMnLFxuICAgICAgICAgICAgJyRpb25pY1Njcm9sbERlbGVnYXRlJyxcbiAgICAgICAgICAgICdjaGFubmVsc1NlcnZpY2UnLFxuICAgICAgICAgICAgJ2dsb2JhbHNTZXJ2aWNlJyxcbiAgICAgICAgICAgIE1lc3NhZ2VzQ29udHJvbGxlclxuICAgICAgICBdKTtcblxuICAgIGZ1bmN0aW9uIE1lc3NhZ2VzQ29udHJvbGxlcigkc2NvcGUsICRzdGF0ZSwgJHN0YXRlUGFyYW1zLCAkaW9uaWNTY3JvbGxEZWxlZ2F0ZSwgY2hhbm5lbHNTZXJ2aWNlLCBnbG9iYWxzU2VydmljZSkge1xuICAgICAgICAvL2F2YWlsYWJsZSBzZXJ2aWNlc1xuICAgICAgICB0aGlzLiRzY29wZSA9ICRzY29wZTtcbiAgICAgICAgdGhpcy4kc3RhdGUgPSAkc3RhdGU7XG4gICAgICAgIHRoaXMuJHN0YXRlUGFyYW1zID0gJHN0YXRlUGFyYW1zO1xuICAgICAgICB0aGlzLiRpb25pY1Njcm9sbERlbGVnYXRlID0gJGlvbmljU2Nyb2xsRGVsZWdhdGU7XG4gICAgICAgIHRoaXMuY2hhbm5lbHNTZXJ2aWNlID0gY2hhbm5lbHNTZXJ2aWNlO1xuXHRcdHRoaXMuZ2xvYmFsc1NlcnZpY2UgPSBnbG9iYWxzU2VydmljZTtcblxuXHRcdGlmICghdGhpcy52YWxpZGF0ZSgpKVxuXHRcdFx0cmV0dXJuIGZhbHNlO1xuICAgICAgICBcbiAgICAgICAgLy9jdXN0b20gcHJvcGVydGllc1xuICAgICAgICB0aGlzLmJ1aWxkaW5nS2V5ID0gZ2xvYmFsc1NlcnZpY2UuYnVpbGRpbmcua2V5O1xuICAgICAgICB0aGlzLmNoYW5uZWxLZXkgPSB0aGlzLiRzdGF0ZVBhcmFtcy5jaGFubmVsSWQ7XG4gICAgICAgIHRoaXMubWVzc2FnZXNSZWYgPSBmaXJlYmFzZS5kYXRhYmFzZSgpLnJlZihbJ2J1aWxkaW5ncycsIHRoaXMuYnVpbGRpbmdLZXksICdtZXNzYWdlcyddLmpvaW4oJy8nKSk7XG5cdFx0dGhpcy5tZXNzYWdlc1JlZi5vbignY2hpbGRfYWRkZWQnLCBmdW5jdGlvbihzKSB7XG5cdFx0XHRjb25zb2xlLmxvZyhzLnZhbCgpKTtcblx0XHR9KTtcblx0XHRcbiAgICAgICAgJHNjb3BlLnVzZXIgPSB7XG4gICAgICAgICAgICBfaWQ6IFwiNTM0YjhmYjJhYTVlN2FmYzFiMjNlNjljXCIsIC8vJHNjb3BlLnVzZXIudWlkLFxuICAgICAgICAgICAgcGljOiAnaHR0cDovL2lvbmljZnJhbWV3b3JrLmNvbS9pbWcvZG9jcy9tY2ZseS5qcGcnLFxuICAgICAgICAgICAgdXNlcm5hbWU6IGdsb2JhbHNTZXJ2aWNlLnVzZXIuZGlzcGxheU5hbWUgPyBnbG9iYWxzU2VydmljZS51c2VyLmRpc3BsYXlOYW1lIDogJ0Fub255bW91cydcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUudG9Vc2VyO1xuXG4gICAgICAgIC8vVUkgZWxlbWVudHNcbiAgICAgICAgdGhpcy52aWV3U2Nyb2xsID0gJGlvbmljU2Nyb2xsRGVsZWdhdGUuJGdldEJ5SGFuZGxlKCd1c2VyTWVzc2FnZVNjcm9sbCcpO1xuXG4gICAgICAgIC8vZXZlbnRzXG4gICAgICAgICRzY29wZS4kb24oXCJjaGF0LXJlY2VpdmUtbWVzc2FnZVwiLCB0aGlzLm9uUmVjZWl2ZU1lc3NhZ2UpO1xuXG4gICAgICAgIHRoaXMuaW5pdCgpO1xuICAgIH1cblx0XG5cdE1lc3NhZ2VzQ29udHJvbGxlci5wcm90b3R5cGUudmFsaWRhdGUgPSBmdW5jdGlvbigpIHtcblx0XHRpZiAoIXRoaXMuZ2xvYmFsc1NlcnZpY2UudXNlcikge1xuICAgICAgICAgICAgdGhpcy4kc3RhdGUuZ28oJ2xvZ2luJyk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblx0XHRcblx0XHRpZiAoIXRoaXMuZ2xvYmFsc1NlcnZpY2UuYnVpbGRpbmcpIHtcbiAgICAgICAgICAgIHRoaXMuJHN0YXRlLmdvKCdhcHAuYnVpbGRpbmdzJyk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblx0XHRcblx0XHRyZXR1cm4gdHJ1ZTtcblx0fTtcblxuICAgIC8vQ2hlY2sgaWYgaXMgYSBDb21tb24gUm9vbSBvciBEaXJlY3QgTWVzc2FnZVxuICAgIE1lc3NhZ2VzQ29udHJvbGxlci5wcm90b3R5cGUuaW5pdCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cdFx0XG4gICAgICAgIHZhciBjaGFubmVsUGF0aCA9IFsnYnVpbGRpbmdzJywgdGhpcy5idWlsZGluZ0tleSwgJ2NoYW5uZWxzJywgdGhpcy4kc3RhdGVQYXJhbXMuY2hhbm5lbElkXS5qb2luKCcvJyk7XG4gICAgICAgIGNvbnNvbGUubG9nKGNoYW5uZWxQYXRoKTtcblxuICAgICAgICB2YXIgY2hhbm5lbFJlZiA9IGZpcmViYXNlLmRhdGFiYXNlKCkucmVmKGNoYW5uZWxQYXRoKTtcbiAgICAgICAgY2hhbm5lbFJlZi5vbigndmFsdWUnLCBmdW5jdGlvbihzbmFwc2hvdCkge1xuICAgICAgICAgICAgc2VsZi5jaGFubmVsID0gc25hcHNob3QudmFsKCk7XG5cbiAgICAgICAgICAgIGlmIChzZWxmLmNoYW5uZWwudHlwZSA9PSBcImRpcmVjdFwiKSB7IC8vZGlyZWN0IG1lc3NhZ2VcbiAgICAgICAgICAgICAgICBzZWxmLnNldENvbnRhY3Qoc2VsZi5jaGFubmVsLnVzZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7IC8vQ29tbW9uIHJvb21cbiAgICAgICAgICAgICAgICBzZWxmLmdldExhc3RNZXNzYWdlcygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgTWVzc2FnZXNDb250cm9sbGVyLnByb3RvdHlwZS5zZXRDb250YWN0ID0gZnVuY3Rpb24odWlkKSB7XG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xuXHRcdFxuICAgICAgICB2YXIgY29udGFjdFBhdGggPSBbJ3VzZXJzJywgdWlkXS5qb2luKCcvJyk7XG4gICAgICAgIGNvbnNvbGUubG9nKGNvbnRhY3RQYXRoKTtcblxuICAgICAgICBmaXJlYmFzZS5kYXRhYmFzZSgpLnJlZihjb250YWN0UGF0aCkub24oJ3ZhbHVlJywgZnVuY3Rpb24oc25hcHNob3QpIHtcbiAgICAgICAgICAgIHZhciBjb250YWN0ID0gc25hcHNob3QudmFsKCk7XG4gICAgICAgICAgICBzZWxmLiRzY29wZS50b1VzZXIgPSB7XG4gICAgICAgICAgICAgICAgX2lkOiBcIjUzNGI4ZTVhYWE1ZTdhZmMxYjIzZTY5YlwiLCAvL3VzZXIudWlkLFxuICAgICAgICAgICAgICAgIHBpYzogJ2h0dHA6Ly9pb25pY2ZyYW1ld29yay5jb20vaW1nL2RvY3MvbWNmbHkuanBnJyxcbiAgICAgICAgICAgICAgICB1c2VybmFtZTogY29udGFjdCAmJiBjb250YWN0LmRpc3BsYXlOYW1lID8gY29udGFjdC5kaXNwbGF5TmFtZSA6ICdBbm9ueW1vdXMnXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBzZWxmLmdldExhc3RNZXNzYWdlcygpO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgTWVzc2FnZXNDb250cm9sbGVyLnByb3RvdHlwZS5nZXRMYXN0TWVzc2FnZXMgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgXG4gICAgICAgIC8vcHJlc2VudCBsYXN0IDMwIG1lc3NhZ2VzXG4gICAgICAgIHRoaXMuJHNjb3BlLm1lc3NhZ2VzID0gW3tcbiAgICAgICAgICAgIFwiX2lkXCI6IFwiNTM1ZDYyNWY4OThkZjRlODBlMmExMjVlXCIsXG4gICAgICAgICAgICBcInRleHRcIjogXCJJb25pYyBoYXMgY2hhbmdlZCB0aGUgZ2FtZSBmb3IgaHlicmlkIGFwcCBkZXZlbG9wbWVudC5cIixcbiAgICAgICAgICAgIFwidXNlcklkXCI6IFwiNTM0YjhmYjJhYTVlN2FmYzFiMjNlNjljXCIsXG4gICAgICAgICAgICBcImRhdGVcIjogXCIyMDE0LTA0LTI3VDIwOjAyOjM5LjA4MlpcIixcbiAgICAgICAgICAgIFwicmVhZFwiOiB0cnVlLFxuICAgICAgICAgICAgXCJyZWFkRGF0ZVwiOiBcIjIwMTQtMTItMDFUMDY6Mjc6MzcuOTQ0WlwiXG4gICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICBcIl9pZFwiOiBcIjUzNWYxM2ZmZWUzYjJhNjgxMTJiOWZjMFwiLFxuICAgICAgICAgICAgICAgIFwidGV4dFwiOiBcIkkgbGlrZSBJb25pYyBiZXR0ZXIgdGhhbiBpY2UgY3JlYW0hXCIsXG4gICAgICAgICAgICAgICAgXCJ1c2VySWRcIjogXCI1MzRiOGU1YWFhNWU3YWZjMWIyM2U2OWJcIixcbiAgICAgICAgICAgICAgICBcImRhdGVcIjogXCIyMDE0LTA0LTI5VDAyOjUyOjQ3LjcwNlpcIixcbiAgICAgICAgICAgICAgICBcInJlYWRcIjogdHJ1ZSxcbiAgICAgICAgICAgICAgICBcInJlYWREYXRlXCI6IFwiMjAxNC0xMi0wMVQwNjoyNzozNy45NDRaXCJcbiAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICBcIl9pZFwiOiBcIjU0NmE1ODQzZmQ0YzVkNTgxZWZhMjYzYVwiLFxuICAgICAgICAgICAgICAgIFwidGV4dFwiOiBcIkxvcmVtIGlwc3VtIGRvbG9yIHNpdCBhbWV0LCBjb25zZWN0ZXR1ciBhZGlwaXNjaW5nIGVsaXQsIHNlZCBkbyBlaXVzbW9kIHRlbXBvciBpbmNpZGlkdW50IHV0IGxhYm9yZSBldCBkb2xvcmUgbWFnbmEgYWxpcXVhLiBVdCBlbmltIGFkIG1pbmltIHZlbmlhbSwgcXVpcyBub3N0cnVkIGV4ZXJjaXRhdGlvbiB1bGxhbWNvIGxhYm9yaXMgbmlzaSB1dCBhbGlxdWlwIGV4IGVhIGNvbW1vZG8gY29uc2VxdWF0LiBEdWlzIGF1dGUgaXJ1cmUgZG9sb3IgaW4gcmVwcmVoZW5kZXJpdCBpbiB2b2x1cHRhdGUgdmVsaXQgZXNzZSBjaWxsdW0gZG9sb3JlIGV1IGZ1Z2lhdCBudWxsYSBwYXJpYXR1ci4gRXhjZXB0ZXVyIHNpbnQgb2NjYWVjYXQgY3VwaWRhdGF0IG5vbiBwcm9pZGVudCwgc3VudCBpbiBjdWxwYSBxdWkgb2ZmaWNpYSBkZXNlcnVudCBtb2xsaXQgYW5pbSBpZCBlc3QgbGFib3J1bS5cIixcbiAgICAgICAgICAgICAgICBcInVzZXJJZFwiOiBcIjUzNGI4ZmIyYWE1ZTdhZmMxYjIzZTY5Y1wiLFxuICAgICAgICAgICAgICAgIFwiZGF0ZVwiOiBcIjIwMTQtMTEtMTdUMjA6MTk6MTUuMjg5WlwiLFxuICAgICAgICAgICAgICAgIFwicmVhZFwiOiB0cnVlLFxuICAgICAgICAgICAgICAgIFwicmVhZERhdGVcIjogXCIyMDE0LTEyLTAxVDA2OjI3OjM4LjMyOFpcIlxuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgIFwiX2lkXCI6IFwiNTQ3NjQzOTlhYjQzZDFkNDExM2FiZmQxXCIsXG4gICAgICAgICAgICAgICAgXCJ0ZXh0XCI6IFwiQW0gSSBkcmVhbWluZz9cIixcbiAgICAgICAgICAgICAgICBcInVzZXJJZFwiOiBcIjUzNGI4ZTVhYWE1ZTdhZmMxYjIzZTY5YlwiLFxuICAgICAgICAgICAgICAgIFwiZGF0ZVwiOiBcIjIwMTQtMTEtMjZUMjE6MTg6MTcuNTkxWlwiLFxuICAgICAgICAgICAgICAgIFwicmVhZFwiOiB0cnVlLFxuICAgICAgICAgICAgICAgIFwicmVhZERhdGVcIjogXCIyMDE0LTEyLTAxVDA2OjI3OjM4LjMzN1pcIlxuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgIFwiX2lkXCI6IFwiNTQ3NjQzYWVhYjQzZDFkNDExM2FiZmQyXCIsXG4gICAgICAgICAgICAgICAgXCJ0ZXh0XCI6IFwiSXMgdGhpcyBtYWdpYz9cIixcbiAgICAgICAgICAgICAgICBcInVzZXJJZFwiOiBcIjUzNGI4ZmIyYWE1ZTdhZmMxYjIzZTY5Y1wiLFxuICAgICAgICAgICAgICAgIFwiZGF0ZVwiOiBcIjIwMTQtMTEtMjZUMjE6MTg6MzguNTQ5WlwiLFxuICAgICAgICAgICAgICAgIFwicmVhZFwiOiB0cnVlLFxuICAgICAgICAgICAgICAgIFwicmVhZERhdGVcIjogXCIyMDE0LTEyLTAxVDA2OjI3OjM4LjMzOFpcIlxuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgIFwiX2lkXCI6IFwiNTQ3ODE1ZGJhYjQzZDFkNDExM2FiZmVmXCIsXG4gICAgICAgICAgICAgICAgXCJ0ZXh0XCI6IFwiR2VlIHdpeiwgdGhpcyBpcyBzb21ldGhpbmcgc3BlY2lhbC5cIixcbiAgICAgICAgICAgICAgICBcInVzZXJJZFwiOiBcIjUzNGI4ZTVhYWE1ZTdhZmMxYjIzZTY5YlwiLFxuICAgICAgICAgICAgICAgIFwiZGF0ZVwiOiBcIjIwMTQtMTEtMjhUMDY6Mjc6NDAuMDAxWlwiLFxuICAgICAgICAgICAgICAgIFwicmVhZFwiOiB0cnVlLFxuICAgICAgICAgICAgICAgIFwicmVhZERhdGVcIjogXCIyMDE0LTEyLTAxVDA2OjI3OjM4LjMzOFpcIlxuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgIFwiX2lkXCI6IFwiNTQ3ODFjNjlhYjQzZDFkNDExM2FiZmYwXCIsXG4gICAgICAgICAgICAgICAgXCJ0ZXh0XCI6IFwiSSB0aGluayBJIGxpa2UgSW9uaWMgbW9yZSB0aGFuIEkgbGlrZSBpY2UgY3JlYW0hXCIsXG4gICAgICAgICAgICAgICAgXCJ1c2VySWRcIjogXCI1MzRiOGZiMmFhNWU3YWZjMWIyM2U2OWNcIixcbiAgICAgICAgICAgICAgICBcImRhdGVcIjogXCIyMDE0LTExLTI4VDA2OjU1OjM3LjM1MFpcIixcbiAgICAgICAgICAgICAgICBcInJlYWRcIjogdHJ1ZSxcbiAgICAgICAgICAgICAgICBcInJlYWREYXRlXCI6IFwiMjAxNC0xMi0wMVQwNjoyNzozOC4zMzhaXCJcbiAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICBcIl9pZFwiOiBcIjU0NzgxY2E0YWI0M2QxZDQxMTNhYmZmMVwiLFxuICAgICAgICAgICAgICAgIFwidGV4dFwiOiBcIlllYSwgaXQncyBwcmV0dHkgc3dlZXRcIixcbiAgICAgICAgICAgICAgICBcInVzZXJJZFwiOiBcIjUzNGI4ZTVhYWE1ZTdhZmMxYjIzZTY5YlwiLFxuICAgICAgICAgICAgICAgIFwiZGF0ZVwiOiBcIjIwMTQtMTEtMjhUMDY6NTY6MzYuNDcyWlwiLFxuICAgICAgICAgICAgICAgIFwicmVhZFwiOiB0cnVlLFxuICAgICAgICAgICAgICAgIFwicmVhZERhdGVcIjogXCIyMDE0LTEyLTAxVDA2OjI3OjM4LjMzOFpcIlxuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgIFwiX2lkXCI6IFwiNTQ3OGRmODZhYjQzZDFkNDExM2FiZmY0XCIsXG4gICAgICAgICAgICAgICAgXCJ0ZXh0XCI6IFwiV293LCB0aGlzIGlzIHJlYWxseSBzb21ldGhpbmcgaHVoP1wiLFxuICAgICAgICAgICAgICAgIFwidXNlcklkXCI6IFwiNTM0YjhmYjJhYTVlN2FmYzFiMjNlNjljXCIsXG4gICAgICAgICAgICAgICAgXCJkYXRlXCI6IFwiMjAxNC0xMS0yOFQyMDo0ODowNi41NzJaXCIsXG4gICAgICAgICAgICAgICAgXCJyZWFkXCI6IHRydWUsXG4gICAgICAgICAgICAgICAgXCJyZWFkRGF0ZVwiOiBcIjIwMTQtMTItMDFUMDY6Mjc6MzguMzM5WlwiXG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgXCJfaWRcIjogXCI1NDc4MWNhNGFiNDNkMWQ0MTEzYWJmZjFcIixcbiAgICAgICAgICAgICAgICBcInRleHRcIjogXCJDcmVhdGUgYW1hemluZyBhcHBzIC0gaW9uaWNmcmFtZXdvcmsuY29tXCIsXG4gICAgICAgICAgICAgICAgXCJ1c2VySWRcIjogXCI1MzRiOGU1YWFhNWU3YWZjMWIyM2U2OWJcIixcbiAgICAgICAgICAgICAgICBcImRhdGVcIjogXCIyMDE0LTExLTI5VDA2OjU2OjM2LjQ3MlpcIixcbiAgICAgICAgICAgICAgICBcInJlYWRcIjogdHJ1ZSxcbiAgICAgICAgICAgICAgICBcInJlYWREYXRlXCI6IFwiMjAxNC0xMi0wMVQwNjoyNzozOC4zMzhaXCJcbiAgICAgICAgICAgIH1dO1xuICAgIH07XG5cbiAgICBNZXNzYWdlc0NvbnRyb2xsZXIucHJvdG90eXBlLm9uUmVjZWl2ZU1lc3NhZ2UgPSBmdW5jdGlvbigpIHtcblxuICAgIH07XG5cbiAgICBNZXNzYWdlc0NvbnRyb2xsZXIucHJvdG90eXBlLnNlbmRNZXNzYWdlID0gZnVuY3Rpb24oc2VuZE1lc3NhZ2VGb3JtKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgICB2YXIgbWVzc2FnZSA9IHtcbiAgICAgICAgICAgIHRvSWQ6ICRzY29wZS50b1VzZXIuX2lkLFxuICAgICAgICAgICAgdGV4dDogJHNjb3BlLmlucHV0Lm1lc3NhZ2VcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBpZiB5b3UgZG8gYSB3ZWIgc2VydmljZSBjYWxsIHRoaXMgd2lsbCBiZSBuZWVkZWQgYXMgd2VsbCBhcyBiZWZvcmUgdGhlIHZpZXdTY3JvbGwgY2FsbHNcbiAgICAgICAgLy8geW91IGNhbid0IHNlZSB0aGUgZWZmZWN0IG9mIHRoaXMgaW4gdGhlIGJyb3dzZXIgaXQgbmVlZHMgdG8gYmUgdXNlZCBvbiBhIHJlYWwgZGV2aWNlXG4gICAgICAgIC8vIGZvciBzb21lIHJlYXNvbiB0aGUgb25lIHRpbWUgYmx1ciBldmVudCBpcyBub3QgZmlyaW5nIGluIHRoZSBicm93c2VyIGJ1dCBkb2VzIG9uIGRldmljZXNcbiAgICAgICAgLy8ga2VlcEtleWJvYXJkT3BlbigpO1xuXG4gICAgICAgIC8vTW9ja1NlcnZpY2Uuc2VuZE1lc3NhZ2UobWVzc2FnZSkudGhlbihmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICRzY29wZS5pbnB1dC5tZXNzYWdlID0gJyc7XG5cbiAgICAgICAgbWVzc2FnZS5faWQgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTsgLy8gOn4pXG4gICAgICAgIG1lc3NhZ2UuZGF0ZSA9IG5ldyBEYXRlKCk7XG4gICAgICAgIG1lc3NhZ2UudXNlcm5hbWUgPSAkc2NvcGUudXNlci51c2VybmFtZTtcbiAgICAgICAgbWVzc2FnZS51c2VySWQgPSAkc2NvcGUudXNlci5faWQ7XG4gICAgICAgIG1lc3NhZ2UucGljID0gJHNjb3BlLnVzZXIucGljdHVyZTtcblxuICAgICAgICAkc2NvcGUubWVzc2FnZXMucHVzaChtZXNzYWdlKTtcblxuICAgICAgICAkdGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGtlZXBLZXlib2FyZE9wZW4oKTtcbiAgICAgICAgICAgIHNlbGYudmlld1Njcm9sbC5zY3JvbGxCb3R0b20odHJ1ZSk7XG4gICAgICAgIH0sIDApO1xuXG4gICAgICAgIC8vICR0aW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyAgICAgJHNjb3BlLm1lc3NhZ2VzLnB1c2goTW9ja1NlcnZpY2UuZ2V0TW9ja01lc3NhZ2UoKSk7XG4gICAgICAgIC8vICAgICBrZWVwS2V5Ym9hcmRPcGVuKCk7XG4gICAgICAgIC8vICAgICBzZWxmLnZpZXdTY3JvbGwuc2Nyb2xsQm90dG9tKHRydWUpO1xuICAgICAgICAvLyB9LCAyMDAwKTtcblxuICAgIH07XG5cblxuXG5cblxuXG5cblxuXG5cbiAgICAvKlxuICAgIGFuZ3VsYXJcbiAgICAgICAgICAgIC5tb2R1bGUoJ2FwcC5tZXNzYWdlcycpXG4gICAgXG4gICAgICAgICAgICAuY29udHJvbGxlcignbWVzc2FnZXNDb250cm9sbGVyJywgWyckc2NvcGUnLCAnJHJvb3RTY29wZScsICckc3RhdGUnLFxuICAgICAgICAgICAgICAgICckc3RhdGVQYXJhbXMnLCAnJGlvbmljQWN0aW9uU2hlZXQnLFxuICAgICAgICAgICAgICAgICckaW9uaWNQb3B1cCcsICckaW9uaWNTY3JvbGxEZWxlZ2F0ZScsICckdGltZW91dCcsICckaW50ZXJ2YWwnLFxuICAgICAgICAgICAgICAgICdjaGFubmVsc1NlcnZpY2UnLCAnYXV0aFNlcnZpY2UnLFxuICAgICAgICAgICAgICAgIG1lc3NhZ2VzQ29udHJvbGxlclxuICAgICAgICAgICAgXSk7XG4gICAgICAgIFx0XG4gICAgICAgIGZ1bmN0aW9uIG1lc3NhZ2VzQ29udHJvbGxlcigkc2NvcGUsICRyb290U2NvcGUsICRzdGF0ZSwgJHN0YXRlUGFyYW1zLCAkaW9uaWNBY3Rpb25TaGVldCxcbiAgICAgICAgICAgICRpb25pY1BvcHVwLCAkaW9uaWNTY3JvbGxEZWxlZ2F0ZSwgJHRpbWVvdXQsICRpbnRlcnZhbCwgY2hhbm5lbHNTZXJ2aWNlLCBhdXRoU2VydmljZSkge1xuICAgIFxuICAgICAgICAgICAgJHNjb3BlLmNoYW5uZWxJZCA9ICRzdGF0ZS5wYXJhbXMuY2hhbm5lbElkO1xuICAgICAgICAgICAgJHNjb3BlLmNoYW5uZWxOYW1lID0gY2hhbm5lbHNTZXJ2aWNlLmNoYW5uZWxzWyRzY29wZS5jaGFubmVsSWRdO1xuICAgICAgICAgICAgJHNjb3BlLnVzZXIgPSBhdXRoU2VydmljZS51c2VyKCk7XG4gICAgXG4gICAgICAgICAgICBpZiAoISRzY29wZS51c2VyKSB7XG4gICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdsb2dpbicpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICRzY29wZS51c2VyID0ge1xuICAgICAgICAgICAgICAgIF9pZDogJHNjb3BlLnVzZXIudWlkLFxuICAgICAgICAgICAgICAgIHBpYzogJ2h0dHA6Ly9pb25pY2ZyYW1ld29yay5jb20vaW1nL2RvY3MvbWNmbHkuanBnJyxcbiAgICAgICAgICAgICAgICB1c2VybmFtZTogJHNjb3BlLnVzZXIgJiYgJHNjb3BlLnVzZXIuZGlzcGxheU5hbWUgPyAkc2NvcGUudXNlci5kaXNwbGF5TmFtZSA/ICdBbm9ueW1vdXMnO1xuICAgICAgICAgICAgfTtcbiAgICBcbiAgICAgICAgICAgIC8vIG1vY2sgYWNxdWlyaW5nIGRhdGEgdmlhICRzdGF0ZVBhcmFtc1xuICAgICAgICAgICAgJHNjb3BlLnRvVXNlciA9IG51bGw7XG4gICAgICAgICAgICBpZiAoJHNjb3BlLmNoYW5uZWxJZCA9PSBcImxhbmRsb3JkXCIpIHtcbiAgICAgICAgICAgICAgICAkXG4gICAgICAgICAgICAgICAgJHNjb3BlLnRvVXNlciA9IHtcbiAgICAgICAgICAgICAgICAgICAgX2lkOiAnNTM0YjhlNWFhYTVlN2FmYzFiMjNlNjliJyxcbiAgICAgICAgICAgICAgICAgICAgcGljOiAnaHR0cDovL2lvbmljZnJhbWV3b3JrLmNvbS9pbWcvZG9jcy92ZW5rbWFuLmpwZycsXG4gICAgICAgICAgICAgICAgICAgIGNoYW5uZWw6ICRzY29wZS5jaGFubmVsSWRcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAkc2NvcGUuaW5wdXQgPSB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZTogbG9jYWxTdG9yYWdlWyd1c2VyTWVzc2FnZS0nICsgJHNjb3BlLnRvVXNlci5faWRdIHx8ICcnXG4gICAgICAgICAgICB9O1xuICAgIFxuICAgICAgICAgICAgdmFyIG1lc3NhZ2VDaGVja1RpbWVyO1xuICAgIFxuICAgICAgICAgICAgdmFyIHZpZXdTY3JvbGwgPSAkaW9uaWNTY3JvbGxEZWxlZ2F0ZS4kZ2V0QnlIYW5kbGUoJ3VzZXJNZXNzYWdlU2Nyb2xsJyk7XG4gICAgICAgICAgICB2YXIgZm9vdGVyQmFyOyAvLyBnZXRzIHNldCBpbiAkaW9uaWNWaWV3LmVudGVyXG4gICAgICAgICAgICB2YXIgc2Nyb2xsZXI7XG4gICAgICAgICAgICB2YXIgdHh0SW5wdXQ7IC8vIF5eXlxuICAgIFxuICAgICAgICAgICAgJHNjb3BlLiRvbignJGlvbmljVmlldy5lbnRlcicsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdVc2VyTWVzc2FnZXMgJGlvbmljVmlldy5lbnRlcicpO1xuICAgIFxuICAgICAgICAgICAgICAgIGdldE1lc3NhZ2VzKCk7XG4gICAgXG4gICAgICAgICAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvb3RlckJhciA9IGRvY3VtZW50LmJvZHkucXVlcnlTZWxlY3RvcignI3VzZXJNZXNzYWdlc1ZpZXcgLmJhci1mb290ZXInKTtcbiAgICAgICAgICAgICAgICAgICAgc2Nyb2xsZXIgPSBkb2N1bWVudC5ib2R5LnF1ZXJ5U2VsZWN0b3IoJyN1c2VyTWVzc2FnZXNWaWV3IC5zY3JvbGwtY29udGVudCcpO1xuICAgICAgICAgICAgICAgICAgICB0eHRJbnB1dCA9IGFuZ3VsYXIuZWxlbWVudChmb290ZXJCYXIucXVlcnlTZWxlY3RvcigndGV4dGFyZWEnKSk7XG4gICAgICAgICAgICAgICAgfSwgMCk7XG4gICAgXG4gICAgICAgICAgICAgICAgbWVzc2FnZUNoZWNrVGltZXIgPSAkaW50ZXJ2YWwoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGhlcmUgeW91IGNvdWxkIGNoZWNrIGZvciBuZXcgbWVzc2FnZXMgaWYgeW91ciBhcHAgZG9lc24ndCB1c2UgcHVzaCBub3RpZmljYXRpb25zIG9yIHVzZXIgZGlzYWJsZWQgdGhlbVxuICAgICAgICAgICAgICAgIH0sIDIwMDAwKTtcbiAgICAgICAgICAgIH0pO1xuICAgIFxuICAgICAgICAgICAgJHNjb3BlLiRvbignJGlvbmljVmlldy5sZWF2ZScsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdsZWF2aW5nIFVzZXJNZXNzYWdlcyB2aWV3LCBkZXN0cm95aW5nIGludGVydmFsJyk7XG4gICAgICAgICAgICAgICAgLy8gTWFrZSBzdXJlIHRoYXQgdGhlIGludGVydmFsIGlzIGRlc3Ryb3llZFxuICAgICAgICAgICAgICAgIGlmIChhbmd1bGFyLmlzRGVmaW5lZChtZXNzYWdlQ2hlY2tUaW1lcikpIHtcbiAgICAgICAgICAgICAgICAgICAgJGludGVydmFsLmNhbmNlbChtZXNzYWdlQ2hlY2tUaW1lcik7XG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2VDaGVja1RpbWVyID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgIFxuICAgICAgICAgICAgJHNjb3BlLiRvbignJGlvbmljVmlldy5iZWZvcmVMZWF2ZScsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGlmICghJHNjb3BlLmlucHV0Lm1lc3NhZ2UgfHwgJHNjb3BlLmlucHV0Lm1lc3NhZ2UgPT09ICcnKSB7XG4gICAgICAgICAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCd1c2VyTWVzc2FnZS0nICsgJHNjb3BlLnRvVXNlci5faWQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgIFxuICAgICAgICAgICAgZnVuY3Rpb24gZ2V0TWVzc2FnZXMoKSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLm1lc3NhZ2VzID0gW3tcbiAgICAgICAgICAgICAgICAgICAgXCJfaWRcIjogXCI1MzVkNjI1Zjg5OGRmNGU4MGUyYTEyNWVcIixcbiAgICAgICAgICAgICAgICAgICAgXCJ0ZXh0XCI6IFwiSW9uaWMgaGFzIGNoYW5nZWQgdGhlIGdhbWUgZm9yIGh5YnJpZCBhcHAgZGV2ZWxvcG1lbnQuXCIsXG4gICAgICAgICAgICAgICAgICAgIFwidXNlcklkXCI6IFwiNTM0YjhmYjJhYTVlN2FmYzFiMjNlNjljXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZGF0ZVwiOiBcIjIwMTQtMDQtMjdUMjA6MDI6MzkuMDgyWlwiLFxuICAgICAgICAgICAgICAgICAgICBcInJlYWRcIjogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgXCJyZWFkRGF0ZVwiOiBcIjIwMTQtMTItMDFUMDY6Mjc6MzcuOTQ0WlwiXG4gICAgICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJfaWRcIjogXCI1MzVmMTNmZmVlM2IyYTY4MTEyYjlmYzBcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwidGV4dFwiOiBcIkkgbGlrZSBJb25pYyBiZXR0ZXIgdGhhbiBpY2UgY3JlYW0hXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcInVzZXJJZFwiOiBcIjUzNGI4ZTVhYWE1ZTdhZmMxYjIzZTY5YlwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJkYXRlXCI6IFwiMjAxNC0wNC0yOVQwMjo1Mjo0Ny43MDZaXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcInJlYWRcIjogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIFwicmVhZERhdGVcIjogXCIyMDE0LTEyLTAxVDA2OjI3OjM3Ljk0NFpcIlxuICAgICAgICAgICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBcIl9pZFwiOiBcIjU0NmE1ODQzZmQ0YzVkNTgxZWZhMjYzYVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJ0ZXh0XCI6IFwiTG9yZW0gaXBzdW0gZG9sb3Igc2l0IGFtZXQsIGNvbnNlY3RldHVyIGFkaXBpc2NpbmcgZWxpdCwgc2VkIGRvIGVpdXNtb2QgdGVtcG9yIGluY2lkaWR1bnQgdXQgbGFib3JlIGV0IGRvbG9yZSBtYWduYSBhbGlxdWEuIFV0IGVuaW0gYWQgbWluaW0gdmVuaWFtLCBxdWlzIG5vc3RydWQgZXhlcmNpdGF0aW9uIHVsbGFtY28gbGFib3JpcyBuaXNpIHV0IGFsaXF1aXAgZXggZWEgY29tbW9kbyBjb25zZXF1YXQuIER1aXMgYXV0ZSBpcnVyZSBkb2xvciBpbiByZXByZWhlbmRlcml0IGluIHZvbHVwdGF0ZSB2ZWxpdCBlc3NlIGNpbGx1bSBkb2xvcmUgZXUgZnVnaWF0IG51bGxhIHBhcmlhdHVyLiBFeGNlcHRldXIgc2ludCBvY2NhZWNhdCBjdXBpZGF0YXQgbm9uIHByb2lkZW50LCBzdW50IGluIGN1bHBhIHF1aSBvZmZpY2lhIGRlc2VydW50IG1vbGxpdCBhbmltIGlkIGVzdCBsYWJvcnVtLlwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJ1c2VySWRcIjogXCI1MzRiOGZiMmFhNWU3YWZjMWIyM2U2OWNcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiZGF0ZVwiOiBcIjIwMTQtMTEtMTdUMjA6MTk6MTUuMjg5WlwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJyZWFkXCI6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBcInJlYWREYXRlXCI6IFwiMjAxNC0xMi0wMVQwNjoyNzozOC4zMjhaXCJcbiAgICAgICAgICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJfaWRcIjogXCI1NDc2NDM5OWFiNDNkMWQ0MTEzYWJmZDFcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwidGV4dFwiOiBcIkFtIEkgZHJlYW1pbmc/XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcInVzZXJJZFwiOiBcIjUzNGI4ZTVhYWE1ZTdhZmMxYjIzZTY5YlwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJkYXRlXCI6IFwiMjAxNC0xMS0yNlQyMToxODoxNy41OTFaXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcInJlYWRcIjogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIFwicmVhZERhdGVcIjogXCIyMDE0LTEyLTAxVDA2OjI3OjM4LjMzN1pcIlxuICAgICAgICAgICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBcIl9pZFwiOiBcIjU0NzY0M2FlYWI0M2QxZDQxMTNhYmZkMlwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJ0ZXh0XCI6IFwiSXMgdGhpcyBtYWdpYz9cIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwidXNlcklkXCI6IFwiNTM0YjhmYjJhYTVlN2FmYzFiMjNlNjljXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcImRhdGVcIjogXCIyMDE0LTExLTI2VDIxOjE4OjM4LjU0OVpcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwicmVhZFwiOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJyZWFkRGF0ZVwiOiBcIjIwMTQtMTItMDFUMDY6Mjc6MzguMzM4WlwiXG4gICAgICAgICAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiX2lkXCI6IFwiNTQ3ODE1ZGJhYjQzZDFkNDExM2FiZmVmXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcInRleHRcIjogXCJHZWUgd2l6LCB0aGlzIGlzIHNvbWV0aGluZyBzcGVjaWFsLlwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJ1c2VySWRcIjogXCI1MzRiOGU1YWFhNWU3YWZjMWIyM2U2OWJcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiZGF0ZVwiOiBcIjIwMTQtMTEtMjhUMDY6Mjc6NDAuMDAxWlwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJyZWFkXCI6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBcInJlYWREYXRlXCI6IFwiMjAxNC0xMi0wMVQwNjoyNzozOC4zMzhaXCJcbiAgICAgICAgICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJfaWRcIjogXCI1NDc4MWM2OWFiNDNkMWQ0MTEzYWJmZjBcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwidGV4dFwiOiBcIkkgdGhpbmsgSSBsaWtlIElvbmljIG1vcmUgdGhhbiBJIGxpa2UgaWNlIGNyZWFtIVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJ1c2VySWRcIjogXCI1MzRiOGZiMmFhNWU3YWZjMWIyM2U2OWNcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiZGF0ZVwiOiBcIjIwMTQtMTEtMjhUMDY6NTU6MzcuMzUwWlwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJyZWFkXCI6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBcInJlYWREYXRlXCI6IFwiMjAxNC0xMi0wMVQwNjoyNzozOC4zMzhaXCJcbiAgICAgICAgICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJfaWRcIjogXCI1NDc4MWNhNGFiNDNkMWQ0MTEzYWJmZjFcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwidGV4dFwiOiBcIlllYSwgaXQncyBwcmV0dHkgc3dlZXRcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwidXNlcklkXCI6IFwiNTM0YjhlNWFhYTVlN2FmYzFiMjNlNjliXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcImRhdGVcIjogXCIyMDE0LTExLTI4VDA2OjU2OjM2LjQ3MlpcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwicmVhZFwiOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJyZWFkRGF0ZVwiOiBcIjIwMTQtMTItMDFUMDY6Mjc6MzguMzM4WlwiXG4gICAgICAgICAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiX2lkXCI6IFwiNTQ3OGRmODZhYjQzZDFkNDExM2FiZmY0XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcInRleHRcIjogXCJXb3csIHRoaXMgaXMgcmVhbGx5IHNvbWV0aGluZyBodWg/XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcInVzZXJJZFwiOiBcIjUzNGI4ZmIyYWE1ZTdhZmMxYjIzZTY5Y1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJkYXRlXCI6IFwiMjAxNC0xMS0yOFQyMDo0ODowNi41NzJaXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcInJlYWRcIjogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIFwicmVhZERhdGVcIjogXCIyMDE0LTEyLTAxVDA2OjI3OjM4LjMzOVpcIlxuICAgICAgICAgICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBcIl9pZFwiOiBcIjU0NzgxY2E0YWI0M2QxZDQxMTNhYmZmMVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJ0ZXh0XCI6IFwiQ3JlYXRlIGFtYXppbmcgYXBwcyAtIGlvbmljZnJhbWV3b3JrLmNvbVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJ1c2VySWRcIjogXCI1MzRiOGU1YWFhNWU3YWZjMWIyM2U2OWJcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiZGF0ZVwiOiBcIjIwMTQtMTEtMjlUMDY6NTY6MzYuNDcyWlwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJyZWFkXCI6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBcInJlYWREYXRlXCI6IFwiMjAxNC0xMi0wMVQwNjoyNzozOC4zMzhaXCJcbiAgICAgICAgICAgICAgICAgICAgfV07XG4gICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAkc2NvcGUuJHdhdGNoKCdpbnB1dC5tZXNzYWdlJywgZnVuY3Rpb24obmV3VmFsdWUsIG9sZFZhbHVlKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2lucHV0Lm1lc3NhZ2UgJHdhdGNoLCBuZXdWYWx1ZSAnICsgbmV3VmFsdWUpO1xuICAgICAgICAgICAgICAgIGlmICghbmV3VmFsdWUpIG5ld1ZhbHVlID0gJyc7XG4gICAgICAgICAgICAgICAgbG9jYWxTdG9yYWdlWyd1c2VyTWVzc2FnZS0nICsgJHNjb3BlLnRvVXNlci5faWRdID0gbmV3VmFsdWU7XG4gICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgICAgICRzY29wZS5zZW5kTWVzc2FnZSA9IGZ1bmN0aW9uKHNlbmRNZXNzYWdlRm9ybSkge1xuICAgICAgICAgICAgICAgIHZhciBtZXNzYWdlID0ge1xuICAgICAgICAgICAgICAgICAgICB0b0lkOiAkc2NvcGUudG9Vc2VyLl9pZCxcbiAgICAgICAgICAgICAgICAgICAgdGV4dDogJHNjb3BlLmlucHV0Lm1lc3NhZ2VcbiAgICAgICAgICAgICAgICB9O1xuICAgIFxuICAgICAgICAgICAgICAgIC8vIGlmIHlvdSBkbyBhIHdlYiBzZXJ2aWNlIGNhbGwgdGhpcyB3aWxsIGJlIG5lZWRlZCBhcyB3ZWxsIGFzIGJlZm9yZSB0aGUgdmlld1Njcm9sbCBjYWxsc1xuICAgICAgICAgICAgICAgIC8vIHlvdSBjYW4ndCBzZWUgdGhlIGVmZmVjdCBvZiB0aGlzIGluIHRoZSBicm93c2VyIGl0IG5lZWRzIHRvIGJlIHVzZWQgb24gYSByZWFsIGRldmljZVxuICAgICAgICAgICAgICAgIC8vIGZvciBzb21lIHJlYXNvbiB0aGUgb25lIHRpbWUgYmx1ciBldmVudCBpcyBub3QgZmlyaW5nIGluIHRoZSBicm93c2VyIGJ1dCBkb2VzIG9uIGRldmljZXNcbiAgICAgICAgICAgICAgICBrZWVwS2V5Ym9hcmRPcGVuKCk7XG4gICAgXG4gICAgICAgICAgICAgICAgLy9Nb2NrU2VydmljZS5zZW5kTWVzc2FnZShtZXNzYWdlKS50aGVuKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUuaW5wdXQubWVzc2FnZSA9ICcnO1xuICAgIFxuICAgICAgICAgICAgICAgIG1lc3NhZ2UuX2lkID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7IC8vIDp+KVxuICAgICAgICAgICAgICAgIG1lc3NhZ2UuZGF0ZSA9IG5ldyBEYXRlKCk7XG4gICAgICAgICAgICAgICAgbWVzc2FnZS51c2VybmFtZSA9ICRzY29wZS51c2VyLnVzZXJuYW1lO1xuICAgICAgICAgICAgICAgIG1lc3NhZ2UudXNlcklkID0gJHNjb3BlLnVzZXIuX2lkO1xuICAgICAgICAgICAgICAgIG1lc3NhZ2UucGljID0gJHNjb3BlLnVzZXIucGljdHVyZTtcbiAgICBcbiAgICAgICAgICAgICAgICAkc2NvcGUubWVzc2FnZXMucHVzaChtZXNzYWdlKTtcbiAgICBcbiAgICAgICAgICAgICAgICAkdGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAga2VlcEtleWJvYXJkT3BlbigpO1xuICAgICAgICAgICAgICAgICAgICB2aWV3U2Nyb2xsLnNjcm9sbEJvdHRvbSh0cnVlKTtcbiAgICAgICAgICAgICAgICB9LCAwKTtcbiAgICBcbiAgICAgICAgICAgICAgICAkdGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLm1lc3NhZ2VzLnB1c2goTW9ja1NlcnZpY2UuZ2V0TW9ja01lc3NhZ2UoKSk7XG4gICAgICAgICAgICAgICAgICAgIGtlZXBLZXlib2FyZE9wZW4oKTtcbiAgICAgICAgICAgICAgICAgICAgdmlld1Njcm9sbC5zY3JvbGxCb3R0b20odHJ1ZSk7XG4gICAgICAgICAgICAgICAgfSwgMjAwMCk7XG4gICAgXG4gICAgICAgICAgICAgICAgLy99KTtcbiAgICAgICAgICAgIH07XG4gICAgXG4gICAgICAgICAgICAvLyB0aGlzIGtlZXBzIHRoZSBrZXlib2FyZCBvcGVuIG9uIGEgZGV2aWNlIG9ubHkgYWZ0ZXIgc2VuZGluZyBhIG1lc3NhZ2UsIGl0IGlzIG5vbiBvYnRydXNpdmVcbiAgICAgICAgICAgIGZ1bmN0aW9uIGtlZXBLZXlib2FyZE9wZW4oKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2tlZXBLZXlib2FyZE9wZW4nKTtcbiAgICAgICAgICAgICAgICB0eHRJbnB1dC5vbmUoJ2JsdXInLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ3RleHRhcmVhIGJsdXIsIGZvY3VzIGJhY2sgb24gaXQnKTtcbiAgICAgICAgICAgICAgICAgICAgdHh0SW5wdXRbMF0uZm9jdXMoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgIGZ1bmN0aW9uIG9uUHJvZmlsZVBpY0Vycm9yKGVsZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZWxlLnNyYyA9ICcnOyAvLyBzZXQgYSBmYWxsYmFja1xuICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgJHNjb3BlLm9uTWVzc2FnZUhvbGQgPSBmdW5jdGlvbihlLCBpdGVtSW5kZXgsIG1lc3NhZ2UpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnb25NZXNzYWdlSG9sZCcpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdtZXNzYWdlOiAnICsgSlNPTi5zdHJpbmdpZnkobWVzc2FnZSwgbnVsbCwgMikpO1xuICAgICAgICAgICAgICAgICRpb25pY0FjdGlvblNoZWV0LnNob3coe1xuICAgICAgICAgICAgICAgICAgICBidXR0b25zOiBbe1xuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogJ0NvcHkgVGV4dCdcbiAgICAgICAgICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6ICdEZWxldGUgTWVzc2FnZSdcbiAgICAgICAgICAgICAgICAgICAgICAgIH1dLFxuICAgICAgICAgICAgICAgICAgICBidXR0b25DbGlja2VkOiBmdW5jdGlvbihpbmRleCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3dpdGNoIChpbmRleCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgMDogLy8gQ29weSBUZXh0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vY29yZG92YS5wbHVnaW5zLmNsaXBib2FyZC5jb3B5KG1lc3NhZ2UudGV4dCk7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgMTogLy8gRGVsZXRlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG5vIHNlcnZlciBzaWRlIHNlY3JldHMgaGVyZSA6filcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLm1lc3NhZ2VzLnNwbGljZShpdGVtSW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZpZXdTY3JvbGwucmVzaXplKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIDApO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9O1xuICAgIFxuICAgICAgICAgICAgLy8gdGhpcyBwcm9iIHNlZW1zIHdlaXJkIGhlcmUgYnV0IEkgaGF2ZSByZWFzb25zIGZvciB0aGlzIGluIG15IGFwcCwgc2VjcmV0IVxuICAgICAgICAgICAgJHNjb3BlLnZpZXdQcm9maWxlID0gZnVuY3Rpb24obXNnKSB7XG4gICAgICAgICAgICAgICAgaWYgKG1zZy51c2VySWQgPT09ICRzY29wZS51c2VyLl9pZCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBnbyB0byB5b3VyIHByb2ZpbGVcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyBnbyB0byBvdGhlciB1c2VycyBwcm9maWxlXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICBcbiAgICAgICAgICAgIC8vIEkgZW1pdCB0aGlzIGV2ZW50IGZyb20gdGhlIG1vbm9zcGFjZWQuZWxhc3RpYyBkaXJlY3RpdmUsIHJlYWQgbGluZSA0ODBcbiAgICAgICAgICAgICRzY29wZS4kb24oJ3RhUmVzaXplJywgZnVuY3Rpb24oZSwgdGEpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygndGFSZXNpemUnKTtcbiAgICAgICAgICAgICAgICBpZiAoIXRhKSByZXR1cm47XG4gICAgXG4gICAgICAgICAgICAgICAgdmFyIHRhSGVpZ2h0ID0gdGFbMF0ub2Zmc2V0SGVpZ2h0O1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCd0YUhlaWdodDogJyArIHRhSGVpZ2h0KTtcbiAgICBcbiAgICAgICAgICAgICAgICBpZiAoIWZvb3RlckJhcikgcmV0dXJuO1xuICAgIFxuICAgICAgICAgICAgICAgIHZhciBuZXdGb290ZXJIZWlnaHQgPSB0YUhlaWdodCArIDEwO1xuICAgICAgICAgICAgICAgIG5ld0Zvb3RlckhlaWdodCA9IChuZXdGb290ZXJIZWlnaHQgPiA0NCkgPyBuZXdGb290ZXJIZWlnaHQgOiA0NDtcbiAgICBcbiAgICAgICAgICAgICAgICBmb290ZXJCYXIuc3R5bGUuaGVpZ2h0ID0gbmV3Rm9vdGVySGVpZ2h0ICsgJ3B4JztcbiAgICAgICAgICAgICAgICBzY3JvbGxlci5zdHlsZS5ib3R0b20gPSBuZXdGb290ZXJIZWlnaHQgKyAncHgnO1xuICAgICAgICAgICAgfSk7XG4gICAgXG4gICAgICAgIH1cbiAgICAgICAgKi9cbn0pKCk7XG5cblxuXG5cbiIsIihmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgYW5ndWxhclxuICAgICAgICAubW9kdWxlKCdhcHAubWVzc2FnZXMnKVxuXG4gICAgICAgIC5maWx0ZXIoJ25sMmJyJywgWyckZmlsdGVyJywgbmwyYnJdKVxuXG4gICAgZnVuY3Rpb24gbmwyYnIoJGZpbHRlcikge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgICAgIGlmICghZGF0YSkgcmV0dXJuIGRhdGE7XG4gICAgICAgICAgICByZXR1cm4gZGF0YS5yZXBsYWNlKC9cXG5cXHI/L2csICc8YnIgLz4nKTtcbiAgICAgICAgfTtcbiAgICB9XG59KSgpOyIsIihmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgYW5ndWxhclxuICAgICAgICAubW9kdWxlKCdhcHAubWVzc2FnZXMnKVxuICAgICAgICAuc2VydmljZSgnbWVzc2FnZXNTZXJ2aWNlJywgbWVzc2FnZXNTZXJ2aWNlKTtcblxuICAgIGZ1bmN0aW9uIG1lc3NhZ2VzU2VydmljZShmaXJlYmFzZVNlcnZpY2UpIHtcbiAgICAgICAgdmFyIHNlcnZpY2UgPSB7fTtcblx0XHRcbiAgICAgICAgc2VydmljZS5nZXRNZXNzYWdlc1JlZiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBmaXJlYmFzZVNlcnZpY2UuZmIuZGF0YWJhc2UoKS5yZWYoJ21lc3NhZ2VzJyk7XG4gICAgICAgIH07XG5cbiAgICAgICAgc2VydmljZS5hZGRNZXNzYWdlID0gZnVuY3Rpb24gKG1lc3NhZ2UpIHtcbiAgICAgICAgICAgIHJldHVybiBmaXJlYmFzZVNlcnZpY2UuZmIuZGF0YWJhc2UoKS5wdXNoKG1lc3NhZ2UpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHNlcnZpY2U7XG4gICAgfVxufSkoKTtcbiIsIihmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgYW5ndWxhci5tb2R1bGUoXCJhcHAuc2lkZW1lbnVcIilcblxuICAgICAgICAuY29udHJvbGxlcihcInNpZGVtZW51Q29udHJvbGxlclwiLCBzaWRlbWVudUNvbnRyb2xsZXIpO1xuXG5cbiAgICBmdW5jdGlvbiBzaWRlbWVudUNvbnRyb2xsZXIoJHNjb3BlLCAkc3RhdGUsIGNoYW5uZWxzU2VydmljZSwgYXV0aFNlcnZpY2UpIHtcbiAgICAgICAgJHNjb3BlLnVzZXIgPSBhdXRoU2VydmljZS51c2VyKCk7XG4gICAgICAgICRzY29wZS5jaGFubmVscyA9IGNoYW5uZWxzU2VydmljZS5jaGFubmVscztcbiAgICAgICAgJHNjb3BlLmJ1aWxkaW5nID0ge1xuICAgICAgICAgICAgbmFtZTogXCJTZWxlY3QgYSBidWlsZGluZ1wiLFxuICAgICAgICAgICAgYWRkcmVzczogXCJcIixcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuJG9uKCdidWlsZGluZy1zZWxlY3RlZCcsIGZ1bmN0aW9uIChldmVudCwgZGF0YSkge1xuICAgICAgICAgICAgJHNjb3BlLmJ1aWxkaW5nLm5hbWUgPSBkYXRhLm5hbWU7XG4gICAgICAgICAgICAkc2NvcGUuYnVpbGRpbmcuYWRkcmVzcyA9IGRhdGEuYWRkcmVzcztcblxuICAgICAgICB9KTtcblxuICAgICAgICAkc2NvcGUub3BlbkNoYW5uZWwgPSBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICAkc3RhdGUuZ28oJ2FwcC5jaGFubmVsJywge2NoYW5uZWxJZDoga2V5fSk7XG4gICAgICAgIH07XG4gICAgfVxufSkoKTtcbiIsIihmdW5jdGlvbigpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBhbmd1bGFyLm1vZHVsZShcImFwcC51c2Vyc1wiKVxuXG4gICAgICAgIC5zZXJ2aWNlKFwidXNlcnNTZXJ2aWNlXCIsIHVzZXJzU2VydmljZSk7XG5cblxuICAgIGZ1bmN0aW9uIHVzZXJzU2VydmljZSgkcSwgYXV0aFNlcnZpY2UpIHtcblx0ICAgIHJldHVybiB7XG4gICAgICAgICAgICB1cGRhdGVQcm9maWxlOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcblxuICAgICAgICAgICAgICAgIGF1dGhTZXJ2aWNlLnVzZXIoKS51cGRhdGVQcm9maWxlKGRhdGEpXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uIHN1Y2Nlc3MoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKFwiUHJvZmlsZSB1cGRhdGVkIVwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHVzZXIgPSBmaXJlYmFzZS5hdXRoKCkuY3VycmVudFVzZXI7XG4gICAgICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ3VzZXItY2hhbmdlZCcpO1xuICAgICAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiBlcnJvcihlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVmZXJyZWQucmVqZWN0KGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH1cbiAgICB9XG59KSgpOyIsIihmdW5jdGlvbigpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBhbmd1bGFyLm1vZHVsZShcImFwcC5wcm9maWxlc1wiKVxuXG4gICAgICAgIC5jb250cm9sbGVyKFwicHJvZmlsZUNvbnRyb2xsZXJcIiwgcHJvZmlsZUNvbnRyb2xsZXIpO1xuXG5cbiAgICBmdW5jdGlvbiBwcm9maWxlQ29udHJvbGxlcigkc2NvcGUsICRpb25pY0xvYWRpbmcsICRpb25pY1BvcHVwLCBhdXRoU2VydmljZSwgcHJvZmlsZXNTZXJ2aWNlKSB7XG5cblx0XHR2YXIgdXNlciA9IGF1dGhTZXJ2aWNlLnVzZXIoKTtcblx0XHRcblx0XHQkc2NvcGUuZGF0YSA9IHtcblx0XHRcdGRpc3BsYXlOYW1lIDogdXNlciA/IHVzZXIuZGlzcGxheU5hbWUgOiBcIlwiLFxuXHRcdFx0ZW1haWwgOiB1c2VyID8gdXNlci5lbWFpbCA6IFwiXCJcblx0XHR9O1xuXG4gICAgICAgICRzY29wZS51cGRhdGUgPSBmdW5jdGlvbigpIHtcblx0XHRcdCRpb25pY0xvYWRpbmcuc2hvdygpO1xuXG4gICAgICAgICAgICBwcm9maWxlc1NlcnZpY2UudXBkYXRlUHJvZmlsZSgkc2NvcGUuZGF0YSkudGhlbihmdW5jdGlvbiBzdWNjZXNzKG1zZykge1xuXHRcdFx0XHQkaW9uaWNMb2FkaW5nLmhpZGUoKTtcblxuXHRcdFx0XHQkaW9uaWNQb3B1cC5hbGVydCh7XG4gICAgICAgICAgICAgICAgICAgIHRpdGxlOiAnUHJvZmlsZVVwZGF0ZSEnLFxuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZTogbXNnXG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uIGVycm9yKGVycm9yKSB7XG5cdFx0XHRcdCRpb25pY0xvYWRpbmcuaGlkZSgpO1xuXG5cdFx0XHRcdCRpb25pY1BvcHVwLmFsZXJ0KHtcbiAgICAgICAgICAgICAgICAgICAgdGl0bGU6ICdVcGRhdGUgZmFpbGVkIScsXG4gICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlOiBlcnJvci5tZXNzYWdlXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbn0pKCk7IiwiKGZ1bmN0aW9uKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGFuZ3VsYXIubW9kdWxlKFwiYXBwLnByb2ZpbGVzXCIpXG5cbiAgICAgICAgLnNlcnZpY2UoXCJwcm9maWxlc1NlcnZpY2VcIiwgcHJvZmlsZXNTZXJ2aWNlKTtcblxuXG4gICAgZnVuY3Rpb24gcHJvZmlsZXNTZXJ2aWNlKCRxLCAkcm9vdFNjb3BlLCBhdXRoU2VydmljZSkge1xuXHRcdFxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdXBkYXRlUHJvZmlsZTogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG5cbiAgICAgICAgICAgICAgICBhdXRoU2VydmljZS51c2VyKCkudXBkYXRlUHJvZmlsZShkYXRhKVxuICAgICAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbiBzdWNjZXNzKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShcIlByb2ZpbGUgdXBkYXRlZCFcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ3VzZXItY2hhbmdlZCcpO1xuICAgICAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiBlcnJvcihlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVmZXJyZWQucmVqZWN0KGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH1cbiAgICB9XG59KSgpOyIsIihmdW5jdGlvbigpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBhbmd1bGFyXG5cbiAgICAgICAgLm1vZHVsZSgnYXBwJywgW1xuICAgICAgICAgICAgJ2lvbmljJyxcbiAgICAgICAgICAgICdtb25vc3BhY2VkLmVsYXN0aWMnLFxuXG4gICAgICAgICAgICAnYXBwLmZpcmViYXNlJyxcbiAgICAgICAgICAgICdhcHAuZmlyZWJhc2UnLFxuICAgICAgICAgICAgJ2FwcC5hdXRoJyxcbiAgICAgICAgICAgICdhcHAuY2hhbm5lbHMnLFxuICAgICAgICAgICAgJ2FwcC5zaWRlbWVudScsXG4gICAgICAgICAgICAnYXBwLmJ1aWxkaW5ncycsXG4gICAgICAgICAgICAnYXBwLnByb2ZpbGVzJyxcbiAgICAgICAgICAgICdhcHAubWVzc2FnZXMnLFxuICAgICAgICAgICAgJ2FwcC5kaXJlY3RtZXNzYWdlcydcbiAgICAgICAgXSlcblxuICAgICAgICAucnVuKGZ1bmN0aW9uKCRpb25pY1BsYXRmb3JtLCAkdGltZW91dCwgJHJvb3RTY29wZSkge1xuICAgICAgICAgICAgJGlvbmljUGxhdGZvcm0ucmVhZHkoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgaWYgKHdpbmRvdy5jb3Jkb3ZhICYmIHdpbmRvdy5jb3Jkb3ZhLnBsdWdpbnMuS2V5Ym9hcmQpIHtcbiAgICAgICAgICAgICAgICAgICAgY29yZG92YS5wbHVnaW5zLktleWJvYXJkLmhpZGVLZXlib2FyZEFjY2Vzc29yeUJhcih0cnVlKTtcblxuICAgICAgICAgICAgICAgICAgICBjb3Jkb3ZhLnBsdWdpbnMuS2V5Ym9hcmQuZGlzYWJsZVNjcm9sbCh0cnVlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHdpbmRvdy5TdGF0dXNCYXIpIHtcbiAgICAgICAgICAgICAgICAgICAgU3RhdHVzQmFyLnN0eWxlRGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgIH1cblx0XHRcdFx0Ly90byBnZXQgdXNlciBpbmZvXG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kZW1pdCgndXNlci1jaGFuZ2VkJyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG59KSgpO1xuXG5cbiIsIihmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgYW5ndWxhclxuICAgICAgICAubW9kdWxlKCdhcHAnKVxuICAgICAgICAuc2VydmljZSgnZ2xvYmFsc1NlcnZpY2UnLCBnbG9iYWxzU2VydmljZSk7XG5cbiAgICBmdW5jdGlvbiBnbG9iYWxzU2VydmljZSgpIHtcbiAgICAgICAgdmFyIHNlcnZpY2UgPSB7XG5cdFx0XHR1c2VyIDogbnVsbCwgLy9sb2dnZWQgdXNlclxuXHRcdFx0YnVpbGRpbmcgOiBudWxsIC8vc2VsZWN0ZWQgYnVpbGRpbmdcblx0XHR9O1xuXG4gICAgICAgIHJldHVybiBzZXJ2aWNlO1xuICAgIH1cbn0pKCk7XG4iLCIoZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGFuZ3VsYXJcblxuICAgICAgICAubW9kdWxlKCdhcHAnKVxuXG4gICAgICAgIC5ydW4oWyckcm9vdFNjb3BlJywgJyRsb2NhdGlvbicsICdhdXRoU2VydmljZScsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCAkc3RhdGUsIGF1dGhTZXJ2aWNlKSB7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRvbignJHJvdXRlQ2hhbmdlU3RhcnQnLCBmdW5jdGlvbiAoZXZlbnQpIHtcblxuICAgICAgICAgICAgICAgIGlmIChhdXRoU2VydmljZS51c2VyKCkgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2xvZ2luJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1dKVxufSkoKTtcbiIsIihmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgYW5ndWxhclxuXG4gICAgICAgIC5tb2R1bGUoJ2FwcCcpXG5cbiAgICAgICAgLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIsICR1cmxSb3V0ZXJQcm92aWRlcikge1xuICAgICAgICAgICAgJHN0YXRlUHJvdmlkZXJcblxuICAgICAgICAgICAgICAgIC5zdGF0ZSgnYXBwJywge1xuICAgICAgICAgICAgICAgICAgICB1cmw6ICcvYXBwJyxcbiAgICAgICAgICAgICAgICAgICAgY2FjaGU6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBhYnN0cmFjdDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICd2aWV3cy9zaWRlbWVudS5odG1sJyxcbiAgICAgICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICAgICAgLnN0YXRlKCdhcHAuYnVpbGRpbmdzJywge1xuICAgICAgICAgICAgICAgICAgICB1cmw6ICcvYnVpbGRpbmdzJyxcbiAgICAgICAgICAgICAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICdtZW51Q29udGVudCc6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3ZpZXdzL2J1aWxkaW5ncy5odG1sJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgICAgIC5zdGF0ZSgnYXBwLmJ1aWxkaW5nJywge1xuICAgICAgICAgICAgICAgICAgICB1cmw6ICcvYnVpbGRpbmdzLzpidWlsZGluZ0lkJyxcbiAgICAgICAgICAgICAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICdtZW51Q29udGVudCc6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3ZpZXdzL2J1aWxkaW5nLmh0bWwnXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICAgICAgLnN0YXRlKCdhcHAuY2hhbm5lbCcsIHtcbiAgICAgICAgICAgICAgICAgICAgdXJsOiAnL2NoYW5uZWwvOmNoYW5uZWxJZCcsXG4gICAgICAgICAgICAgICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAnbWVudUNvbnRlbnQnOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICd2aWV3cy9tZXNzYWdlcy9jaGF0Lmh0bWwnXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICAgICAgLnN0YXRlKCdhcHAucHJvZmlsZScsIHtcbiAgICAgICAgICAgICAgICAgICAgdXJsOiAnL3Byb2ZpbGUnLFxuICAgICAgICAgICAgICAgICAgICBjYWNoZTogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAnbWVudUNvbnRlbnQnOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICd2aWV3cy9wcm9maWxlL3Byb2ZpbGUuaHRtbCdcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgICAgICAuc3RhdGUoJ2FwcC5tZXNzYWdlcycsIHtcbiAgICAgICAgICAgICAgICAgICAgdXJsOiAnL21lc3NhZ2VzJyxcbiAgICAgICAgICAgICAgICAgICAgY2FjaGU6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgICAgICAgICAgICAgJ21lbnVDb250ZW50Jzoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAndmlld3MvbWVzc2FnZXMvbWVzc2FnZXMuaHRtbCdcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pXG5cblxuICAgICAgICAgICAgICAgIC5zdGF0ZSgnYXBwLmxvZ291dCcsIHtcbiAgICAgICAgICAgICAgICAgICAgdXJsOiBcIi9sb2dpblwiLFxuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVByb3ZpZGVyOiBmdW5jdGlvbiAoYXV0aFNlcnZpY2UsICRzdGF0ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXV0aFNlcnZpY2UubG9nb3V0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2xvZ2luJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5zdGF0ZSgnbG9naW4nLCB7XG4gICAgICAgICAgICAgICAgICAgIHVybDogXCIvbG9naW5cIixcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFwidmlld3MvYXV0aC9sb2dpbi5odG1sXCJcbiAgICAgICAgICAgICAgICB9KTtcblxuXG4gICAgICAgICAgICAvL2ZhbGxiYWNrXG4gICAgICAgICAgICAkdXJsUm91dGVyUHJvdmlkZXIub3RoZXJ3aXNlKCcvbG9naW4nKTtcblxuICAgICAgICB9KTtcbn0pKCk7XG5cblxuXG5cbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
