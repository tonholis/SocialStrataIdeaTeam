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

    angular.module("app.profiles", ['app.auth']);
})();
(function () {
    'use strict';

    angular.module("app.sidemenu", []);
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
            self.$scope.toUser = {
                userId: user.uid,
                userPic: 'http://ionicframework.com/img/docs/venkman.jpg',
                userName: contact && contact.displayName ? contact.displayName : 'Undefined'
            };

            self.getLastMessages();
        });
    };

    MessagesController.prototype.getLastMessages = function() {
        var self = this;
        var msgPath = ['buildings', self.buildingKey, 'messages'].join('/');

        self.messageRef = firebase.database()
            .ref(msgPath)
            .orderByChild('channel').equalTo(self.channelKey)
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
			message.to = self.toUser.uid; 

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





//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImF1dGgvYXV0aC5tb2R1bGUuanMiLCJidWlsZGluZ3MvYnVpbGRpbmdzLm1vZHVsZS5qcyIsImNoYW5uZWxzL2NoYW5uZWxzLm1vZHVsZS5qcyIsImRpcmVjdG1lc3NhZ2VzL2RpcmVjdG1lc3NhZ2VzLm1vZHVsZS5qcyIsImZpcmViYXNlL2ZpcmViYXNlLm1vZHVsZS5qcyIsInByb2ZpbGUvcHJvZmlsZXMubW9kdWxlLmpzIiwic2lkZW1lbnUvc2lkZW1lbnUubW9kdWxlLmpzIiwibWVzc2FnZXMvbWVzc2FnZXMubW9kdWxlLmpzIiwidXNlcnMvdXNlcnMubW9kdWxlLmpzIiwiYXV0aC9hdXRoQ29udHJvbGxlci5qcyIsImF1dGgvYXV0aFNlcnZpY2UuanMiLCJidWlsZGluZ3MvYnVpbGRpbmdDb250cm9sbGVyLmpzIiwiYnVpbGRpbmdzL2J1aWxkaW5nc0NvbnRyb2xsZXIuanMiLCJidWlsZGluZ3MvYnVpbGRpbmdzU2VydmljZS5qcyIsImNoYW5uZWxzL2NoYW5uZWxzU2VydmljZS5qcyIsImRpcmVjdG1lc3NhZ2VzL2RpcmVjdE1lc3NhZ2VzQ29udHJvbGxlci5qcyIsImRpcmVjdG1lc3NhZ2VzL2RpcmVjdE1lc3NhZ2VzU2VydmljZS5qcyIsImZpcmViYXNlL2ZpcmViYXNlU2VydmljZS5qcyIsInByb2ZpbGUvcHJvZmlsZUNvbnRyb2xsZXIuanMiLCJwcm9maWxlL3Byb2ZpbGVzU2VydmljZS5qcyIsInNpZGVtZW51L3NpZGVtZW51Q29udHJvbGxlci5qcyIsIm1lc3NhZ2VzL21lc3NhZ2VzQ29udHJvbGxlci5qcyIsIm1lc3NhZ2VzL21lc3NhZ2VzRmlsdGVycy5qcyIsIm1lc3NhZ2VzL21lc3NhZ2VzU2VydmljZS5qcyIsInVzZXJzL3VzZXJzU2VydmljZS5qcyIsImFwcC5tb2R1bGUuanMiLCJhcHAuZ2xvYmFscy5qcyIsImFwcC5yb3V0ZXIuZmlsdGVyLmpzIiwiYXBwLnJvdXRlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxD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S0FBQSxlQUFBLE1BQUE7WUFDQSxLQUFBLE9BQUEsR0FBQTtZQUNBLE9BQUE7OztRQUdBLElBQUEsQ0FBQSxLQUFBLGVBQUEsVUFBQTtZQUNBLEtBQUEsT0FBQSxHQUFBO1lBQ0EsT0FBQTs7O1FBR0EsT0FBQTs7OztJQUlBLG1CQUFBLFVBQUEsT0FBQSxXQUFBO1FBQ0EsSUFBQSxPQUFBOztRQUVBLElBQUEsY0FBQSxDQUFBLGFBQUEsS0FBQSxhQUFBLFlBQUEsS0FBQSxhQUFBLFdBQUEsS0FBQTtRQUNBLFFBQUEsSUFBQTs7UUFFQSxJQUFBLGFBQUEsU0FBQSxXQUFBLElBQUE7UUFDQSxXQUFBLEtBQUEsU0FBQSxTQUFBLFVBQUE7WUFDQSxLQUFBLFVBQUEsU0FBQTs7WUFFQSxJQUFBLEtBQUEsUUFBQSxRQUFBLFVBQUE7Z0JBQ0EsS0FBQSxXQUFBLEtBQUEsUUFBQTs7aUJBRUE7Z0JBQ0EsS0FBQTs7Ozs7SUFLQSxtQkFBQSxVQUFBLGFBQUEsU0FBQSxLQUFBO1FBQ0EsSUFBQSxPQUFBOztRQUVBLElBQUEsY0FBQSxDQUFBLFNBQUEsS0FBQSxLQUFBO1FBQ0EsUUFBQSxJQUFBOztRQUVBLFNBQUEsV0FBQSxJQUFBLGFBQUEsS0FBQSxTQUFBLFNBQUEsVUFBQTtZQUNBLElBQUEsVUFBQSxTQUFBO1lBQ0EsS0FBQSxPQUFBLFNBQUE7Z0JBQ0EsUUFBQSxLQUFBO2dCQUNBLFNBQUE7Z0JBQ0EsVUFBQSxXQUFBLFFBQUEsY0FBQSxRQUFBLGNBQUE7OztZQUdBLEtBQUE7Ozs7SUFJQSxtQkFBQSxVQUFBLGtCQUFBLFdBQUE7UUFDQSxJQUFBLE9BQUE7UUFDQSxJQUFBLFVBQUEsQ0FBQSxhQUFBLEtBQUEsYUFBQSxZQUFBLEtBQUE7O1FBRUEsS0FBQSxhQUFBLFNBQUE7YUFDQSxJQUFBO2FBQ0EsYUFBQSxXQUFBLFFBQUEsS0FBQTthQUNBLFlBQUE7YUFDQSxHQUFBLFNBQUEsU0FBQSxHQUFBO2dCQUNBLEtBQUEsT0FBQSxXQUFBLEVBQUE7O0lBRUEsS0FBQSxTQUFBLFdBQUE7S0FDQSxLQUFBLFdBQUEsYUFBQTtPQUNBOzs7O0lBSUEsbUJBQUEsVUFBQSxnQkFBQSxTQUFBLE1BQUEsS0FBQTtRQUNBLElBQUEsVUFBQTtZQUNBLE1BQUEsSUFBQSxPQUFBO1lBQ0EsU0FBQSxLQUFBO1lBQ0EsTUFBQTtZQUNBLFVBQUEsS0FBQSxPQUFBLEtBQUE7WUFDQSxRQUFBLEtBQUEsT0FBQSxLQUFBO1lBQ0EsU0FBQSxLQUFBLE9BQUEsS0FBQTs7O0VBR0EsSUFBQSxLQUFBO0dBQ0EsUUFBQSxLQUFBLEtBQUEsT0FBQTs7RUFFQSxJQUFBLFVBQUEsQ0FBQSxhQUFBLEtBQUEsYUFBQSxZQUFBLEtBQUE7UUFDQSxTQUFBLFdBQUEsSUFBQSxTQUFBLEtBQUE7O0VBRUEsS0FBQSxPQUFBLGVBQUE7O1FBRUEsS0FBQSxTQUFBLFdBQUE7WUFDQSxLQUFBO1lBQ0EsS0FBQSxXQUFBLGFBQUE7V0FDQTs7O0lBR0EsbUJBQUEsVUFBQSxtQkFBQSxXQUFBO1FBQ0EsSUFBQSxPQUFBO0VBQ0EsS0FBQSxTQUFBLElBQUEsUUFBQSxXQUFBO1lBQ0EsUUFBQSxJQUFBO1lBQ0EsS0FBQSxTQUFBLEdBQUE7Ozs7SUFJQSxtQkFBQSxVQUFBLG9CQUFBLFNBQUEsS0FBQTtRQUNBLEtBQUEsSUFBQSxNQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ3hLQSxDQUFBLFlBQUE7SUFDQTs7SUFFQTtTQUNBLE9BQUE7O1NBRUEsT0FBQSxTQUFBLENBQUEsV0FBQTs7SUFFQSxTQUFBLE1B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QkFBQSxVQUFBOzs7Ozs7OztBQVFBIiwiZmlsZSI6ImFwcC5idW5kbGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGFuZ3VsYXIubW9kdWxlKFwiYXBwLmF1dGhcIiwgW10pO1xufSkoKTsiLCIoZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGFuZ3VsYXIubW9kdWxlKFwiYXBwLmJ1aWxkaW5nc1wiLCBbJ2FwcC5maXJlYmFzZSddKTtcbn0pKCk7IiwiKGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBhbmd1bGFyLm1vZHVsZShcImFwcC5jaGFubmVsc1wiLCBbXSk7XG59KSgpOyIsIihmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgYW5ndWxhclxuICAgICAgICAubW9kdWxlKCdhcHAuZGlyZWN0bWVzc2FnZXMnLCBbXSk7XG59KSgpO1xuXG5cblxuXG4iLCIoZnVuY3Rpb24oKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgYW5ndWxhclxuICAgICAgICAubW9kdWxlKCdhcHAuZmlyZWJhc2UnLCBbXSk7XG59KSgpO1xuXG5cblxuXG4iLCIoZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGFuZ3VsYXIubW9kdWxlKFwiYXBwLnByb2ZpbGVzXCIsIFsnYXBwLmF1dGgnXSk7XG59KSgpOyIsIihmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgYW5ndWxhci5tb2R1bGUoXCJhcHAuc2lkZW1lbnVcIiwgW10pO1xufSkoKTsiLCIoZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGFuZ3VsYXJcbiAgICAgICAgLm1vZHVsZSgnbW9ub3NwYWNlZC5lbGFzdGljJywgW10pXG4gICAgICAgIC5jb25zdGFudCgnbXNkRWxhc3RpY0NvbmZpZycsIHtcbiAgICAgICAgICAgIGFwcGVuZDogJydcbiAgICAgICAgfSlcbiAgICAgICAgLmRpcmVjdGl2ZSgnbXNkRWxhc3RpYycsIFtcbiAgICAgICAgICAgICckdGltZW91dCcsICckd2luZG93JywgJ21zZEVsYXN0aWNDb25maWcnLFxuICAgICAgICAgICAgZnVuY3Rpb24gKCR0aW1lb3V0LCAkd2luZG93LCBjb25maWcpIHtcbiAgICAgICAgICAgICAgICAndXNlIHN0cmljdCc7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICByZXF1aXJlOiAnbmdNb2RlbCcsXG4gICAgICAgICAgICAgICAgICAgIHJlc3RyaWN0OiAnQSwgQycsXG4gICAgICAgICAgICAgICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCwgYXR0cnMsIG5nTW9kZWwpIHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gY2FjaGUgYSByZWZlcmVuY2UgdG8gdGhlIERPTSBlbGVtZW50XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdGEgPSBlbGVtZW50WzBdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR0YSA9IGVsZW1lbnQ7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGVuc3VyZSB0aGUgZWxlbWVudCBpcyBhIHRleHRhcmVhLCBhbmQgYnJvd3NlciBpcyBjYXBhYmxlXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGEubm9kZU5hbWUgIT09ICdURVhUQVJFQScgfHwgISR3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gc2V0IHRoZXNlIHByb3BlcnRpZXMgYmVmb3JlIG1lYXN1cmluZyBkaW1lbnNpb25zXG4gICAgICAgICAgICAgICAgICAgICAgICAkdGEuY3NzKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnb3ZlcmZsb3cnOiAnaGlkZGVuJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnb3ZlcmZsb3cteSc6ICdoaWRkZW4nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICd3b3JkLXdyYXAnOiAnYnJlYWstd29yZCdcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBmb3JjZSB0ZXh0IHJlZmxvd1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRleHQgPSB0YS52YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhLnZhbHVlID0gJyc7XG4gICAgICAgICAgICAgICAgICAgICAgICB0YS52YWx1ZSA9IHRleHQ7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhcHBlbmQgPSBhdHRycy5tc2RFbGFzdGljID8gYXR0cnMubXNkRWxhc3RpYy5yZXBsYWNlKC9cXFxcbi9nLCAnXFxuJykgOiBjb25maWcuYXBwZW5kLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR3aW4gPSBhbmd1bGFyLmVsZW1lbnQoJHdpbmRvdyksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWlycm9ySW5pdFN0eWxlID0gJ3Bvc2l0aW9uOiBhYnNvbHV0ZTsgdG9wOiAtOTk5cHg7IHJpZ2h0OiBhdXRvOyBib3R0b206IGF1dG87JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdsZWZ0OiAwOyBvdmVyZmxvdzogaGlkZGVuOyAtd2Via2l0LWJveC1zaXppbmc6IGNvbnRlbnQtYm94OycgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnLW1vei1ib3gtc2l6aW5nOiBjb250ZW50LWJveDsgYm94LXNpemluZzogY29udGVudC1ib3g7JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdtaW4taGVpZ2h0OiAwICFpbXBvcnRhbnQ7IGhlaWdodDogMCAhaW1wb3J0YW50OyBwYWRkaW5nOiAwOycgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnd29yZC13cmFwOiBicmVhay13b3JkOyBib3JkZXI6IDA7JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkbWlycm9yID0gYW5ndWxhci5lbGVtZW50KCc8dGV4dGFyZWEgYXJpYS1oaWRkZW49XCJ0cnVlXCIgdGFiaW5kZXg9XCItMVwiICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnc3R5bGU9XCInICsgbWlycm9ySW5pdFN0eWxlICsgJ1wiLz4nKS5kYXRhKCdlbGFzdGljJywgdHJ1ZSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWlycm9yID0gJG1pcnJvclswXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YVN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZSh0YSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzaXplID0gdGFTdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKCdyZXNpemUnKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBib3JkZXJCb3ggPSB0YVN0eWxlLmdldFByb3BlcnR5VmFsdWUoJ2JveC1zaXppbmcnKSA9PT0gJ2JvcmRlci1ib3gnIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhU3R5bGUuZ2V0UHJvcGVydHlWYWx1ZSgnLW1vei1ib3gtc2l6aW5nJykgPT09ICdib3JkZXItYm94JyB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YVN0eWxlLmdldFByb3BlcnR5VmFsdWUoJy13ZWJraXQtYm94LXNpemluZycpID09PSAnYm9yZGVyLWJveCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYm94T3V0ZXIgPSAhYm9yZGVyQm94ID8ge3dpZHRoOiAwLCBoZWlnaHQ6IDB9IDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogcGFyc2VJbnQodGFTdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKCdib3JkZXItcmlnaHQtd2lkdGgnKSwgMTApICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyc2VJbnQodGFTdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKCdwYWRkaW5nLXJpZ2h0JyksIDEwKSArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcnNlSW50KHRhU3R5bGUuZ2V0UHJvcGVydHlWYWx1ZSgncGFkZGluZy1sZWZ0JyksIDEwKSArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcnNlSW50KHRhU3R5bGUuZ2V0UHJvcGVydHlWYWx1ZSgnYm9yZGVyLWxlZnQtd2lkdGgnKSwgMTApLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IHBhcnNlSW50KHRhU3R5bGUuZ2V0UHJvcGVydHlWYWx1ZSgnYm9yZGVyLXRvcC13aWR0aCcpLCAxMCkgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJzZUludCh0YVN0eWxlLmdldFByb3BlcnR5VmFsdWUoJ3BhZGRpbmctdG9wJyksIDEwKSArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcnNlSW50KHRhU3R5bGUuZ2V0UHJvcGVydHlWYWx1ZSgncGFkZGluZy1ib3R0b20nKSwgMTApICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyc2VJbnQodGFTdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKCdib3JkZXItYm90dG9tLXdpZHRoJyksIDEwKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWluSGVpZ2h0VmFsdWUgPSBwYXJzZUludCh0YVN0eWxlLmdldFByb3BlcnR5VmFsdWUoJ21pbi1oZWlnaHQnKSwgMTApLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodFZhbHVlID0gcGFyc2VJbnQodGFTdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKCdoZWlnaHQnKSwgMTApLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1pbkhlaWdodCA9IE1hdGgubWF4KG1pbkhlaWdodFZhbHVlLCBoZWlnaHRWYWx1ZSkgLSBib3hPdXRlci5oZWlnaHQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF4SGVpZ2h0ID0gcGFyc2VJbnQodGFTdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKCdtYXgtaGVpZ2h0JyksIDEwKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaXJyb3JlZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3RpdmUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29weVN0eWxlID0gWydmb250LWZhbWlseScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdmb250LXNpemUnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnZm9udC13ZWlnaHQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnZm9udC1zdHlsZScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdsZXR0ZXItc3BhY2luZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdsaW5lLWhlaWdodCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICd0ZXh0LXRyYW5zZm9ybScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICd3b3JkLXNwYWNpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAndGV4dC1pbmRlbnQnXTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZXhpdCBpZiBlbGFzdGljIGFscmVhZHkgYXBwbGllZCAob3IgaXMgdGhlIG1pcnJvciBlbGVtZW50KVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCR0YS5kYXRhKCdlbGFzdGljJykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIE9wZXJhIHJldHVybnMgbWF4LWhlaWdodCBvZiAtMSBpZiBub3Qgc2V0XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXhIZWlnaHQgPSBtYXhIZWlnaHQgJiYgbWF4SGVpZ2h0ID4gMCA/IG1heEhlaWdodCA6IDllNDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gYXBwZW5kIG1pcnJvciB0byB0aGUgRE9NXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobWlycm9yLnBhcmVudE5vZGUgIT09IGRvY3VtZW50LmJvZHkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbmd1bGFyLmVsZW1lbnQoZG9jdW1lbnQuYm9keSkuYXBwZW5kKG1pcnJvcik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHNldCByZXNpemUgYW5kIGFwcGx5IGVsYXN0aWNcbiAgICAgICAgICAgICAgICAgICAgICAgICR0YS5jc3Moe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdyZXNpemUnOiAocmVzaXplID09PSAnbm9uZScgfHwgcmVzaXplID09PSAndmVydGljYWwnKSA/ICdub25lJyA6ICdob3Jpem9udGFsJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSkuZGF0YSgnZWxhc3RpYycsIHRydWUpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvKlxuICAgICAgICAgICAgICAgICAgICAgICAgICogbWV0aG9kc1xuICAgICAgICAgICAgICAgICAgICAgICAgICovXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGluaXRNaXJyb3IoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG1pcnJvclN0eWxlID0gbWlycm9ySW5pdFN0eWxlO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWlycm9yZWQgPSB0YTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBjb3B5IHRoZSBlc3NlbnRpYWwgc3R5bGVzIGZyb20gdGhlIHRleHRhcmVhIHRvIHRoZSBtaXJyb3JcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YVN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZSh0YSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYW5ndWxhci5mb3JFYWNoKGNvcHlTdHlsZSwgZnVuY3Rpb24gKHZhbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaXJyb3JTdHlsZSArPSB2YWwgKyAnOicgKyB0YVN0eWxlLmdldFByb3BlcnR5VmFsdWUodmFsKSArICc7JztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaXJyb3Iuc2V0QXR0cmlidXRlKCdzdHlsZScsIG1pcnJvclN0eWxlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gYWRqdXN0KCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0YUhlaWdodCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFDb21wdXRlZFN0eWxlV2lkdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1pcnJvckhlaWdodCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG92ZXJmbG93O1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1pcnJvcmVkICE9PSB0YSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbml0TWlycm9yKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gYWN0aXZlIGZsYWcgcHJldmVudHMgYWN0aW9ucyBpbiBmdW5jdGlvbiBmcm9tIGNhbGxpbmcgYWRqdXN0IGFnYWluXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFhY3RpdmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0aXZlID0gdHJ1ZTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaXJyb3IudmFsdWUgPSB0YS52YWx1ZSArIGFwcGVuZDsgLy8gb3B0aW9uYWwgd2hpdGVzcGFjZSB0byBpbXByb3ZlIGFuaW1hdGlvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaXJyb3Iuc3R5bGUub3ZlcmZsb3dZID0gdGEuc3R5bGUub3ZlcmZsb3dZO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhSGVpZ2h0ID0gdGEuc3R5bGUuaGVpZ2h0ID09PSAnJyA/ICdhdXRvJyA6IHBhcnNlSW50KHRhLnN0eWxlLmhlaWdodCwgMTApO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhQ29tcHV0ZWRTdHlsZVdpZHRoID0gZ2V0Q29tcHV0ZWRTdHlsZSh0YSkuZ2V0UHJvcGVydHlWYWx1ZSgnd2lkdGgnKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBlbnN1cmUgZ2V0Q29tcHV0ZWRTdHlsZSBoYXMgcmV0dXJuZWQgYSByZWFkYWJsZSAndXNlZCB2YWx1ZScgcGl4ZWwgd2lkdGhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRhQ29tcHV0ZWRTdHlsZVdpZHRoLnN1YnN0cih0YUNvbXB1dGVkU3R5bGVXaWR0aC5sZW5ndGggLSAyLCAyKSA9PT0gJ3B4Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gdXBkYXRlIG1pcnJvciB3aWR0aCBpbiBjYXNlIHRoZSB0ZXh0YXJlYSB3aWR0aCBoYXMgY2hhbmdlZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGggPSBwYXJzZUludCh0YUNvbXB1dGVkU3R5bGVXaWR0aCwgMTApIC0gYm94T3V0ZXIud2lkdGg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaXJyb3Iuc3R5bGUud2lkdGggPSB3aWR0aCArICdweCc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaXJyb3JIZWlnaHQgPSBtaXJyb3Iuc2Nyb2xsSGVpZ2h0O1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtaXJyb3JIZWlnaHQgPiBtYXhIZWlnaHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1pcnJvckhlaWdodCA9IG1heEhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG92ZXJmbG93ID0gJ3Njcm9sbCc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobWlycm9ySGVpZ2h0IDwgbWluSGVpZ2h0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaXJyb3JIZWlnaHQgPSBtaW5IZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWlycm9ySGVpZ2h0ICs9IGJveE91dGVyLmhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGEuc3R5bGUub3ZlcmZsb3dZID0gb3ZlcmZsb3cgfHwgJ2hpZGRlbic7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRhSGVpZ2h0ICE9PSBtaXJyb3JIZWlnaHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjb3BlLiRlbWl0KCdlbGFzdGljOnJlc2l6ZScsICR0YSwgdGFIZWlnaHQsIG1pcnJvckhlaWdodCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YS5zdHlsZS5oZWlnaHQgPSBtaXJyb3JIZWlnaHQgKyAncHgnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gc21hbGwgZGVsYXkgdG8gcHJldmVudCBhbiBpbmZpbml0ZSBsb29wXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGl2ZSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCAxLCBmYWxzZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGZvcmNlQWRqdXN0KCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGl2ZSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFkanVzdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAvKlxuICAgICAgICAgICAgICAgICAgICAgICAgICogaW5pdGlhbGlzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICovXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGxpc3RlblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCdvbnByb3BlcnR5Y2hhbmdlJyBpbiB0YSAmJiAnb25pbnB1dCcgaW4gdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJRTlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YVsnb25pbnB1dCddID0gdGEub25rZXl1cCA9IGFkanVzdDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFbJ29uaW5wdXQnXSA9IGFkanVzdDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgJHdpbi5iaW5kKCdyZXNpemUnLCBmb3JjZUFkanVzdCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHNjb3BlLiR3YXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5nTW9kZWwuJG1vZGVsVmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiAobmV3VmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3JjZUFkanVzdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHNjb3BlLiRvbignZWxhc3RpYzphZGp1c3QnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5pdE1pcnJvcigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvcmNlQWRqdXN0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgJHRpbWVvdXQoYWRqdXN0LCAwLCBmYWxzZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8qXG4gICAgICAgICAgICAgICAgICAgICAgICAgKiBkZXN0cm95XG4gICAgICAgICAgICAgICAgICAgICAgICAgKi9cblxuICAgICAgICAgICAgICAgICAgICAgICAgc2NvcGUuJG9uKCckZGVzdHJveScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkbWlycm9yLnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR3aW4udW5iaW5kKCdyZXNpemUnLCBmb3JjZUFkanVzdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIF0pO1xuXG4gICAgYW5ndWxhclxuICAgICAgICAubW9kdWxlKCdhcHAubWVzc2FnZXMnLCBbJ21vbm9zcGFjZWQuZWxhc3RpYyddKTtcbn0pKCk7XG5cblxuXG5cbiIsIihmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgYW5ndWxhci5tb2R1bGUoXCJhcHAudXNlcnNcIiwgWydhcHAuYXV0aCddKTtcbn0pKCk7IiwiKGZ1bmN0aW9uKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGFuZ3VsYXIubW9kdWxlKFwiYXBwLmF1dGhcIilcblxuICAgICAgICAuY29udHJvbGxlcihcImF1dGhDb250cm9sbGVyXCIsIGF1dGhDb250cm9sbGVyKTtcblxuXG4gICAgZnVuY3Rpb24gYXV0aENvbnRyb2xsZXIoJHNjb3BlLCBhdXRoU2VydmljZSwgJGlvbmljUG9wdXAsICRpb25pY0xvYWRpbmcsICRzdGF0ZSwgJHRpbWVvdXQpIHtcblxuICAgICAgICAkc2NvcGUuZGF0YSA9IHt9O1xuXG4gICAgICAgICRzY29wZS5sb2dpbiA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0JGlvbmljTG9hZGluZy5zaG93KCk7XG5cblx0XHRcdGF1dGhTZXJ2aWNlLmxvZ2luKCRzY29wZS5kYXRhLnVzZXJuYW1lLCAkc2NvcGUuZGF0YS5wYXNzd29yZCkuc3VjY2VzcyhmdW5jdGlvbih1c2VyKSB7XG5cdFx0XHRcdCRpb25pY0xvYWRpbmcuaGlkZSgpO1xuXHRcdFx0XHQkc3RhdGUuZ28oJ2FwcC5idWlsZGluZ3MnKTtcblxuICAgICAgICAgICAgfSkuZXJyb3IoZnVuY3Rpb24oZXJyb3IpIHtcblx0XHRcdFx0JHRpbWVvdXQoZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0JGlvbmljTG9hZGluZy5oaWRlKCk7XG5cdFx0XHRcdH0sIDEwMCk7XG5cbiAgICAgICAgICAgICAgICB2YXIgYWxlcnRQb3B1cCA9ICRpb25pY1BvcHVwLmFsZXJ0KHtcbiAgICAgICAgICAgICAgICAgICAgdGl0bGU6ICdMb2dpbiBmYWlsZWQhJyxcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGU6IGVycm9yLm1lc3NhZ2UgLy8nUGxlYXNlIGNoZWNrIHlvdXIgY3JlZGVudGlhbHMhJ1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuXHRcdCRzY29wZS5mYWNlYm9va0xvZ2luID0gZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgYWxlcnRQb3B1cCA9ICRpb25pY1BvcHVwLmFsZXJ0KHtcblx0XHRcdFx0dGl0bGU6ICdGYWNlYm9vayBsb2dpbicsXG5cdFx0XHRcdHRlbXBsYXRlOiAnUGxhbm5lZCEnXG5cdFx0XHR9KTtcbiAgICAgICAgfVxuICAgIH1cbn0pKCk7IiwiKGZ1bmN0aW9uKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGFuZ3VsYXIubW9kdWxlKFwiYXBwLmF1dGhcIilcblxuICAgICAgICAuc2VydmljZShcImF1dGhTZXJ2aWNlXCIsIGF1dGhTZXJ2aWNlKTtcblxuXHRmdW5jdGlvbiBjcmVhdGVVc2VyKHVzZXJuYW1lLCBwYXNzd29yZCkge1xuXHRcdHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG5cdFx0dmFyIGF1dGggPSBmaXJlYmFzZVNlcnZpY2UuZmIuYXV0aCgpO1xuXG5cdFx0cmV0dXJuIGF1dGguY3JlYXRlVXNlcldpdGhFbWFpbEFuZFBhc3N3b3JkKGVtYWlsLCBwYXNzd29yZCk7XG5cdH1cblx0XG4gICAgZnVuY3Rpb24gYXV0aFNlcnZpY2UoJHEsICRyb290U2NvcGUsIGJ1aWxkaW5nc1NlcnZpY2UsIGdsb2JhbHNTZXJ2aWNlKSB7XG5cdFx0dmFyIGF1dGggPSBmaXJlYmFzZS5hdXRoKCk7XG5cdFx0XG5cdFx0JHJvb3RTY29wZS4kb24oJ3VzZXItY2hhbmdlZCcsIGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIHVzciA9IGZpcmViYXNlLmF1dGgoKS5jdXJyZW50VXNlcjtcblx0XHRcdGlmICh1c3IgPT0gbnVsbCkge1xuXHRcdFx0XHRnbG9iYWxzU2VydmljZS51c2VyID0gbnVsbDtcblx0XHRcdFx0cmV0dXJuXG5cdFx0XHR9O1xuXHRcdFx0XG5cdFx0XHRnbG9iYWxzU2VydmljZS51c2VyID0gdXNyO1xuXHRcdFx0XG5cdFx0XHR2YXIgcmVmID0gZmlyZWJhc2UuZGF0YWJhc2UoKS5yZWYoJ3VzZXJzLycgKyB1c3IudWlkKTtcblx0XHRcdHJlZi5jaGlsZCgnbmFtZScpLnNldCh1c3IuZGlzcGxheU5hbWUpO1xuXHRcdFx0cmVmLmNoaWxkKCdlbWFpbCcpLnNldCh1c3IuZW1haWwpO1xuXHRcdFx0cmVmLmNoaWxkKCdsYXN0QWN0aXZpdHknKS5zZXQobmV3IERhdGUoKS5nZXRUaW1lKCkpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIHtcbiAgICAgICAgICAgIGxvZ2luOiBmdW5jdGlvbih1c2VybmFtZSwgcGFzc3dvcmQpIHtcbiAgICAgICAgICAgICAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuICAgICAgICAgICAgICAgIHZhciBwcm9taXNlID0gZGVmZXJyZWQucHJvbWlzZTtcblxuXHRcdFx0XHR2YXIgc3VjY2Vzc0hhbmRsZXIgPSBmdW5jdGlvbihpbmZvKSB7XG5cdFx0XHRcdFx0aW5mby5pc05ldyA9IGluZm8uZGlzcGxheU5hbWUgPT0gbnVsbDtcblx0XHRcdFx0XHRkZWZlcnJlZC5yZXNvbHZlKGluZm8pO1xuXHRcdFx0XHRcdFx0XHRcdFx0XG5cdFx0XHRcdFx0JHJvb3RTY29wZS4kZW1pdCgndXNlci1jaGFuZ2VkJyk7XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0dmFyIGVycm9ySGFuZGxlciA9IGZ1bmN0aW9uKGVycm9yKSB7XG5cdFx0XHRcdFx0ZGVmZXJyZWQucmVqZWN0KGVycm9yKTtcblx0XHRcdFx0fTtcblxuXHRcdFx0XHRhdXRoLnNpZ25JbldpdGhFbWFpbEFuZFBhc3N3b3JkKHVzZXJuYW1lLCBwYXNzd29yZClcblx0XHRcdFx0XHQudGhlbihzdWNjZXNzSGFuZGxlciwgZnVuY3Rpb24gZXJyb3IoZXJyb3IpIHtcblx0XHRcdFx0XHRcdGlmIChlcnJvci5jb2RlID09IFwiYXV0aC91c2VyLW5vdC1mb3VuZFwiKSB7XG5cdFx0XHRcdFx0XHRcdGF1dGguY3JlYXRlVXNlcldpdGhFbWFpbEFuZFBhc3N3b3JkKHVzZXJuYW1lLCBwYXNzd29yZClcblx0XHRcdFx0XHRcdFx0XHQudGhlbihzdWNjZXNzSGFuZGxlciwgZXJyb3JIYW5kbGVyKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRlcnJvckhhbmRsZXIoZXJyb3IpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0pO1xuXG4gICAgICAgICAgICAgICAgcHJvbWlzZS5zdWNjZXNzID0gZnVuY3Rpb24oZm4pIHtcbiAgICAgICAgICAgICAgICAgICAgcHJvbWlzZS50aGVuKGZuKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHByb21pc2UuZXJyb3IgPSBmdW5jdGlvbihmbikge1xuICAgICAgICAgICAgICAgICAgICBwcm9taXNlLnRoZW4obnVsbCwgZm4pO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgICAgICAgICB9LFxuXG5cdFx0XHRsb2dvdXQ6IGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0YXV0aC5zaWduT3V0KCk7XG5cdFx0XHRcdGdsb2JhbHNTZXJ2aWNlLnVzZXIgPSBudWxsO1xuXHRcdFx0fSxcblxuICAgICAgICAgICAgdXNlcjogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHJldHVybiBmaXJlYmFzZS5hdXRoKCkuY3VycmVudFVzZXI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59KSgpO1xuIiwiKGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBhbmd1bGFyLm1vZHVsZShcImFwcC5idWlsZGluZ3NcIilcblxuICAgICAgICAuY29udHJvbGxlcihcImJ1aWxkaW5nQ29udHJvbGxlclwiLCBidWlsZGluZ0NvbnRyb2xsZXIpO1xuXG5cbiAgICBmdW5jdGlvbiBidWlsZGluZ0NvbnRyb2xsZXIoJHNjb3BlLCAkaW9uaWNMb2FkaW5nLCAkc3RhdGVQYXJhbXMsIGNoYW5uZWxzU2VydmljZSkge1xuXG4gICAgICAgIHZhciByZWYgPSBjaGFubmVsc1NlcnZpY2UuZ2V0Q2hhbm5lbHNGcm9tKCRzdGF0ZVBhcmFtcy5idWlsZGluZ0lkKTtcblxuICAgICAgICAkaW9uaWNMb2FkaW5nLnNob3coKTtcbiAgICAgICAgcmVmLm9uKFwidmFsdWVcIiwgZnVuY3Rpb24gKHNuYXBzaG90KSB7XG4gICAgICAgICAgICB2YXIgdmFsID0gc25hcHNob3QudmFsKCk7XG5cbiAgICAgICAgICAgIGlmICh2YWwpIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUuY2hhbm5lbHMgPSB2YWwuY2hhbm5lbHM7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcblxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgJGlvbmljTG9hZGluZy5oaWRlKCk7XG5cbiAgICAgICAgfSwgZnVuY3Rpb24gKGVycm9yT2JqZWN0KSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcImVycm9yIHJlYWRpbmc6IFwiICsgZXJyb3JPYmplY3QuY29kZSk7XG4gICAgICAgICAgICB2YXIgYWxlcnRQb3B1cCA9ICRpb25pY1BvcHVwLmFsZXJ0KHtcbiAgICAgICAgICAgICAgICB0aXRsZTogJ09wcyEnLFxuICAgICAgICAgICAgICAgIHRlbXBsYXRlOiAnU29ycnkhIEFuIGVycm9yIG9jdXJyZWQuJ1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAkaW9uaWNMb2FkaW5nLmhpZGUoKTtcbiAgICAgICAgfSk7XG5cbiAgICB9XG59KSgpOyIsIihmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgYW5ndWxhci5tb2R1bGUoXCJhcHAuYnVpbGRpbmdzXCIpXG5cbiAgICAgICAgLmNvbnRyb2xsZXIoXCJidWlsZGluZ3NDb250cm9sbGVyXCIsIGJ1aWxkaW5nc0NvbnRyb2xsZXIpO1xuXG5cbiAgICBmdW5jdGlvbiBidWlsZGluZ3NDb250cm9sbGVyKCRzY29wZSwgJGlvbmljTG9hZGluZywgYnVpbGRpbmdzU2VydmljZSwgZ2xvYmFsc1NlcnZpY2UpIHtcbiAgICAgICAgdmFyIHJlZiA9IGJ1aWxkaW5nc1NlcnZpY2UuZ2V0QnVpbGRpbmdzKCk7XG5cdFx0XG5cdFx0JHNjb3BlLnNlbGVjdGVkS2V5ID0gZ2xvYmFsc1NlcnZpY2UuYnVpbGRpbmcgPyBnbG9iYWxzU2VydmljZS5idWlsZGluZy5rZXkgOiBudWxsO1xuXHRcdFxuXHRcdCRzY29wZS5zZWxlY3QgPSBmdW5jdGlvbihrZXksIGJ1aWxkaW5nKSB7XG5cdFx0XHQkc2NvcGUuc2VsZWN0ZWRLZXkgPSBidWlsZGluZy5rZXkgPSBrZXk7XG5cdFx0XHRnbG9iYWxzU2VydmljZS5idWlsZGluZyA9IGJ1aWxkaW5nO1xuXHRcdFx0JHNjb3BlLiRlbWl0KFwiYnVpbGRpbmctc2VsZWN0ZWRcIiwgYnVpbGRpbmcpO1xuXHRcdH07XHRcdFxuXG4gICAgICAgICRpb25pY0xvYWRpbmcuc2hvdygpO1xuICAgICAgICByZWYub24oXCJ2YWx1ZVwiLCBmdW5jdGlvbiAoc25hcHNob3QpIHtcbiAgICAgICAgICAgICRzY29wZS5idWlsZGluZ3MgPSBzbmFwc2hvdC52YWwoKTtcbiAgICAgICAgICAgICRpb25pY0xvYWRpbmcuaGlkZSgpO1xuICAgICAgICB9LCBmdW5jdGlvbiAoZXJyb3JPYmplY3QpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiZXJyb3IgcmVhZGluZzogXCIgKyBlcnJvck9iamVjdC5jb2RlKTtcbiAgICAgICAgICAgIHZhciBhbGVydFBvcHVwID0gJGlvbmljUG9wdXAuYWxlcnQoe1xuICAgICAgICAgICAgICAgIHRpdGxlOiAnT3BzIScsXG4gICAgICAgICAgICAgICAgdGVtcGxhdGU6ICdTb3JyeSEgQW4gZXJyb3Igb2N1cnJlZCdcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgJGlvbmljTG9hZGluZy5oaWRlKCk7XG4gICAgICAgIH0pO1xuICAgIH1cbn0pKCk7IiwiKGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBhbmd1bGFyXG4gICAgICAgIC5tb2R1bGUoJ2FwcC5idWlsZGluZ3MnKVxuICAgICAgICAuc2VydmljZSgnYnVpbGRpbmdzU2VydmljZScsIGJ1aWxkaW5nc1NlcnZpY2UpO1xuXG4gICAgZnVuY3Rpb24gYnVpbGRpbmdzU2VydmljZShmaXJlYmFzZVNlcnZpY2UsICRyb290U2NvcGUpIHtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZ2V0QnVpbGRpbmdzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZpcmViYXNlLmRhdGFiYXNlKCkucmVmKCdidWlsZGluZ3MnKVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufSkoKTtcbiIsIihmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgYW5ndWxhclxuICAgICAgICAubW9kdWxlKCdhcHAuY2hhbm5lbHMnKVxuICAgICAgICAuc2VydmljZSgnY2hhbm5lbHNTZXJ2aWNlJywgY2hhbm5lbHNTZXJ2aWNlKTtcblxuICAgIGZ1bmN0aW9uIGNoYW5uZWxzU2VydmljZSgkcm9vdFNjb3BlKSB7XG5cdFx0dmFyIHNlcnZpY2UgPSB7fTtcblx0XHRcblx0XHRzZXJ2aWNlLmNoYW5uZWxzID0ge1xuXHRcdFx0XCJsYW5kbG9yZFwiOiBcIlRhbGsgdG8gbGFuZGxvcmRcIixcblx0XHRcdFwiZ2VuZXJhbFwiOiBcIkdlbmVyYWxcIixcblx0XHRcdFwicGFya2luZ1wiOiBcIlBhcmtpbmcgR2FyYWdlXCIsXG5cdFx0XHRcImdhcmRlblwiOiBcIkdhcmRlblwiLFxuXHRcdFx0XCJsb3N0Zm91bmRcIjogXCJMb3N0ICYgRm91bmRcIixcblx0XHRcdFwibWFpbnRlbmFuY2VcIjogXCJSZXF1ZXN0IE1haW50ZW5hbmNlXCJcblx0XHR9O1xuXHRcdFxuXHRcdCRyb290U2NvcGUuJG9uKFwiYnVpbGRpbmctc2VsZWN0ZWRcIiwgZnVuY3Rpb24oYnVpbGRpbmcpIHtcblx0XHRcdC8vY291bnQgaG93IG1hbnkgbmV3IG1lc3NhZ2VzIGVhY2ggY2hhbm5lbCBoYXNcblx0XHR9KTtcblx0XHRcblx0XHRzZXJ2aWNlLmdldENoYW5uZWxzRnJvbSA9IGZ1bmN0aW9uIChidWlsZGluZykge1xuXHRcdFx0cmV0dXJuIGZpcmViYXNlLmRhdGFiYXNlKCkucmVmKCdidWlsZGluZ3MvJyArIGJ1aWxkaW5nICsgXCIvY2hhbm5lbHNcIik7XG5cdFx0fTtcblxuICAgICAgICByZXR1cm4gc2VydmljZTtcbiAgICB9XG59KSgpO1xuXG4iLCIoZnVuY3Rpb24oKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgYW5ndWxhclxuICAgICAgICAubW9kdWxlKCdhcHAuZGlyZWN0bWVzc2FnZXMnKVxuICAgICAgICAuY29udHJvbGxlcignZGlyZWN0TWVzc2FnZXNDb250cm9sbGVyJywgW1xuICAgICAgICAgICAgJyRzY29wZScsXG5cdFx0XHQnJHN0YXRlJyxcbiAgICAgICAgICAgICckaW9uaWNMb2FkaW5nJyxcbiAgICAgICAgICAgICdkaXJlY3RNZXNzYWdlc1NlcnZpY2UnLFxuICAgICAgICAgICAgJ2dsb2JhbHNTZXJ2aWNlJyxcbiAgICAgICAgICAgIGRpcmVjdE1lc3NhZ2VzQ29udHJvbGxlclxuICAgICAgICBdKTtcblxuICAgIGZ1bmN0aW9uIGRpcmVjdE1lc3NhZ2VzQ29udHJvbGxlcigkc2NvcGUsICRzdGF0ZSwgJGlvbmljTG9hZGluZywgY29udGFjdHNTZXJ2aWNlLCBnbG9iYWxzU2VydmljZSkge1xuXHRcdGlmICghZ2xvYmFsc1NlcnZpY2UudXNlcikge1xuXHRcdFx0JHN0YXRlLmdvKCdsb2dpbicpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cbiAgICAgICAgXG5cdFx0dmFyIHVzZXIgPSBnbG9iYWxzU2VydmljZS51c2VyO1xuXHRcdGNvbnNvbGUubG9nKHVzZXIudWlkKTtcblxuICAgICAgICAkaW9uaWNMb2FkaW5nLnNob3coKTtcblxuICAgICAgICB2YXIgcmVmID0gY29udGFjdHNTZXJ2aWNlLmdldFVzZXJDb250YWN0cyh1c2VyLnVpZCk7XG4gICAgICAgIHJlZi5vbihcInZhbHVlXCIsIGZ1bmN0aW9uKHNuYXBzaG90KSB7XG5cdFx0XHQkc2NvcGUuY29udGFjdHMgPSBzbmFwc2hvdC52YWwoKTtcbiAgICAgICAgICAgICRpb25pY0xvYWRpbmcuaGlkZSgpO1xuXHRcdFx0XG5cdFx0XHRjb25zb2xlLmxvZygkc2NvcGUuY29udGFjdHMpO1xuICAgICAgICB9LCBmdW5jdGlvbihlcnJvck9iamVjdCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJlcnJvciByZWFkaW5nOiBcIiArIGVycm9yT2JqZWN0LmNvZGUpO1xuICAgICAgICAgICAgJGlvbmljTG9hZGluZy5oaWRlKCk7XG4gICAgICAgICAgICB2YXIgYWxlcnRQb3B1cCA9ICRpb25pY1BvcHVwLmFsZXJ0KHtcbiAgICAgICAgICAgICAgICB0aXRsZTogJ09wcyEnLFxuICAgICAgICAgICAgICAgIHRlbXBsYXRlOiAnU29ycnkhIEFuIGVycm9yIG9jdXJyZWQuJ1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIFxuICAgIH1cbn0pKCk7IiwiKGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBhbmd1bGFyXG4gICAgICAgIC5tb2R1bGUoJ2FwcC5kaXJlY3RtZXNzYWdlcycpXG4gICAgICAgIC5zZXJ2aWNlKCdkaXJlY3RNZXNzYWdlc1NlcnZpY2UnLCBkaXJlY3RNZXNzYWdlc1NlcnZpY2UpO1xuXG4gICAgZnVuY3Rpb24gZGlyZWN0TWVzc2FnZXNTZXJ2aWNlKGZpcmViYXNlU2VydmljZSkge1xuICAgICAgICB2YXIgc2VydmljZSA9IHt9O1xuXG4gICAgICAgIHNlcnZpY2UuZ2V0VXNlckNvbnRhY3RzID0gZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBmaXJlYmFzZVNlcnZpY2UuZmIuZGF0YWJhc2UoKS5yZWYoJ3VzZXJzLycgKyB1c2VyICsgJy9jb250YWN0cycpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiBzZXJ2aWNlO1xuICAgIH1cbn0pKCk7XG4iLCIoZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGFuZ3VsYXJcbiAgICAgICAgLm1vZHVsZSgnYXBwLmZpcmViYXNlJylcbiAgICAgICAgLnNlcnZpY2UoJ2ZpcmViYXNlU2VydmljZScsIGZpcmViYXNlU2VydmljZSk7XG5cblxuICAgIGZ1bmN0aW9uIGZpcmViYXNlU2VydmljZSgpIHtcbiAgICAgICAgdmFyIGNvbmZpZyA9IHtcbiAgICAgICAgICAgIGFwaUtleTogXCJBSXphU3lCNXE4MUFHR294NGk4LVFMMktPdG5ERGZpMDVpcmdjSEVcIixcbiAgICAgICAgICAgIGF1dGhEb21haW46IFwic29jaWFsc3RyYXRhaWRlYXRlYW0uZmlyZWJhc2VhcHAuY29tXCIsXG4gICAgICAgICAgICBkYXRhYmFzZVVSTDogXCJodHRwczovL3NvY2lhbHN0cmF0YWlkZWF0ZWFtLmZpcmViYXNlaW8uY29tXCIsXG4gICAgICAgICAgICBzdG9yYWdlQnVja2V0OiBcIlwiLFxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZmIgPSBmaXJlYmFzZS5pbml0aWFsaXplQXBwKGNvbmZpZyk7XG4gICAgfVxufSkoKTtcbiIsIihmdW5jdGlvbigpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBhbmd1bGFyLm1vZHVsZShcImFwcC5wcm9maWxlc1wiKVxuXG4gICAgICAgIC5jb250cm9sbGVyKFwicHJvZmlsZUNvbnRyb2xsZXJcIiwgcHJvZmlsZUNvbnRyb2xsZXIpO1xuXG5cbiAgICBmdW5jdGlvbiBwcm9maWxlQ29udHJvbGxlcigkc2NvcGUsICRpb25pY0xvYWRpbmcsICRpb25pY1BvcHVwLCBhdXRoU2VydmljZSwgcHJvZmlsZXNTZXJ2aWNlKSB7XG5cblx0XHR2YXIgdXNlciA9IGF1dGhTZXJ2aWNlLnVzZXIoKTtcblx0XHRcblx0XHQkc2NvcGUuZGF0YSA9IHtcblx0XHRcdGRpc3BsYXlOYW1lIDogdXNlciA/IHVzZXIuZGlzcGxheU5hbWUgOiBcIlwiLFxuXHRcdFx0ZW1haWwgOiB1c2VyID8gdXNlci5lbWFpbCA6IFwiXCJcblx0XHR9O1xuXG4gICAgICAgICRzY29wZS51cGRhdGUgPSBmdW5jdGlvbigpIHtcblx0XHRcdCRpb25pY0xvYWRpbmcuc2hvdygpO1xuXG4gICAgICAgICAgICBwcm9maWxlc1NlcnZpY2UudXBkYXRlUHJvZmlsZSgkc2NvcGUuZGF0YSkudGhlbihmdW5jdGlvbiBzdWNjZXNzKG1zZykge1xuXHRcdFx0XHQkaW9uaWNMb2FkaW5nLmhpZGUoKTtcblxuXHRcdFx0XHQkaW9uaWNQb3B1cC5hbGVydCh7XG4gICAgICAgICAgICAgICAgICAgIHRpdGxlOiAnUHJvZmlsZVVwZGF0ZSEnLFxuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZTogbXNnXG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uIGVycm9yKGVycm9yKSB7XG5cdFx0XHRcdCRpb25pY0xvYWRpbmcuaGlkZSgpO1xuXG5cdFx0XHRcdCRpb25pY1BvcHVwLmFsZXJ0KHtcbiAgICAgICAgICAgICAgICAgICAgdGl0bGU6ICdVcGRhdGUgZmFpbGVkIScsXG4gICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlOiBlcnJvci5tZXNzYWdlXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbn0pKCk7IiwiKGZ1bmN0aW9uKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGFuZ3VsYXIubW9kdWxlKFwiYXBwLnByb2ZpbGVzXCIpXG5cbiAgICAgICAgLnNlcnZpY2UoXCJwcm9maWxlc1NlcnZpY2VcIiwgcHJvZmlsZXNTZXJ2aWNlKTtcblxuXG4gICAgZnVuY3Rpb24gcHJvZmlsZXNTZXJ2aWNlKCRxLCAkcm9vdFNjb3BlLCBhdXRoU2VydmljZSkge1xuXHRcdFxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdXBkYXRlUHJvZmlsZTogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG5cbiAgICAgICAgICAgICAgICBhdXRoU2VydmljZS51c2VyKCkudXBkYXRlUHJvZmlsZShkYXRhKVxuICAgICAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbiBzdWNjZXNzKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShcIlByb2ZpbGUgdXBkYXRlZCFcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ3VzZXItY2hhbmdlZCcpO1xuICAgICAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiBlcnJvcihlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVmZXJyZWQucmVqZWN0KGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH1cbiAgICB9XG59KSgpOyIsIihmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgYW5ndWxhci5tb2R1bGUoXCJhcHAuc2lkZW1lbnVcIilcblxuICAgICAgICAuY29udHJvbGxlcihcInNpZGVtZW51Q29udHJvbGxlclwiLCBzaWRlbWVudUNvbnRyb2xsZXIpO1xuXG5cbiAgICBmdW5jdGlvbiBzaWRlbWVudUNvbnRyb2xsZXIoJHNjb3BlLCAkc3RhdGUsIGNoYW5uZWxzU2VydmljZSwgYXV0aFNlcnZpY2UpIHtcbiAgICAgICAgJHNjb3BlLnVzZXIgPSBhdXRoU2VydmljZS51c2VyKCk7XG4gICAgICAgICRzY29wZS5jaGFubmVscyA9IGNoYW5uZWxzU2VydmljZS5jaGFubmVscztcbiAgICAgICAgJHNjb3BlLmJ1aWxkaW5nID0ge1xuICAgICAgICAgICAgbmFtZTogXCJTZWxlY3QgYSBidWlsZGluZ1wiLFxuICAgICAgICAgICAgYWRkcmVzczogXCJcIixcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuJG9uKCdidWlsZGluZy1zZWxlY3RlZCcsIGZ1bmN0aW9uIChldmVudCwgZGF0YSkge1xuICAgICAgICAgICAgJHNjb3BlLmJ1aWxkaW5nLm5hbWUgPSBkYXRhLm5hbWU7XG4gICAgICAgICAgICAkc2NvcGUuYnVpbGRpbmcuYWRkcmVzcyA9IGRhdGEuYWRkcmVzcztcblxuICAgICAgICB9KTtcblxuICAgICAgICAkc2NvcGUub3BlbkNoYW5uZWwgPSBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICAkc3RhdGUuZ28oJ2FwcC5jaGFubmVsJywge2NoYW5uZWxJZDoga2V5fSk7XG4gICAgICAgIH07XG4gICAgfVxufSkoKTtcbiIsIihmdW5jdGlvbigpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBhbmd1bGFyXG4gICAgICAgIC5tb2R1bGUoJ2FwcC5tZXNzYWdlcycpXG4gICAgICAgIC5jb250cm9sbGVyKCdtZXNzYWdlc0NvbnRyb2xsZXInLCBbXG4gICAgICAgICAgICAnJHNjb3BlJyxcbiAgICAgICAgICAgICckc3RhdGUnLFxuICAgICAgICAgICAgJyRzdGF0ZVBhcmFtcycsXG4gICAgICAgICAgICAnJGlvbmljU2Nyb2xsRGVsZWdhdGUnLFxuXHRcdFx0JyR0aW1lb3V0JyxcbiAgICAgICAgICAgICdjaGFubmVsc1NlcnZpY2UnLFxuICAgICAgICAgICAgJ2dsb2JhbHNTZXJ2aWNlJyxcbiAgICAgICAgICAgIE1lc3NhZ2VzQ29udHJvbGxlclxuICAgICAgICBdKTtcblxuICAgIGZ1bmN0aW9uIE1lc3NhZ2VzQ29udHJvbGxlcigkc2NvcGUsICRzdGF0ZSwgJHN0YXRlUGFyYW1zLCAkaW9uaWNTY3JvbGxEZWxlZ2F0ZSwgJHRpbWVvdXQsIGNoYW5uZWxzU2VydmljZSwgZ2xvYmFsc1NlcnZpY2UpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIC8vYXZhaWxhYmxlIHNlcnZpY2VzXG4gICAgICAgIHRoaXMuJHNjb3BlID0gJHNjb3BlO1xuICAgICAgICB0aGlzLiRzdGF0ZSA9ICRzdGF0ZTtcbiAgICAgICAgdGhpcy4kc3RhdGVQYXJhbXMgPSAkc3RhdGVQYXJhbXM7XG4gICAgICAgIHRoaXMuJGlvbmljU2Nyb2xsRGVsZWdhdGUgPSAkaW9uaWNTY3JvbGxEZWxlZ2F0ZTtcblx0XHR0aGlzLiR0aW1lb3V0ID0gJHRpbWVvdXQ7XG4gICAgICAgIHRoaXMuY2hhbm5lbHNTZXJ2aWNlID0gY2hhbm5lbHNTZXJ2aWNlO1xuICAgICAgICB0aGlzLmdsb2JhbHNTZXJ2aWNlID0gZ2xvYmFsc1NlcnZpY2U7XG5cbiAgICAgICAgaWYgKCF0aGlzLnZhbGlkYXRlKCkpXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG5cbiAgICAgICAgLy9jdXN0b20gcHJvcGVydGllc1xuICAgICAgICB0aGlzLmJ1aWxkaW5nS2V5ID0gZ2xvYmFsc1NlcnZpY2UuYnVpbGRpbmcua2V5O1xuICAgICAgICB0aGlzLmNoYW5uZWxLZXkgPSB0aGlzLiRzdGF0ZVBhcmFtcy5jaGFubmVsSWQ7XG4gICAgICAgIHRoaXMubWVzc2FnZVJlZjtcblxuICAgICAgICAkc2NvcGUudXNlciA9IHtcbiAgICAgICAgICAgIGlkOiAkc2NvcGUudXNlci51aWQsXG4gICAgICAgICAgICBwaWM6ICdodHRwOi8vaW9uaWNmcmFtZXdvcmsuY29tL2ltZy9kb2NzL21jZmx5LmpwZycsXG4gICAgICAgICAgICBuYW1lOiBnbG9iYWxzU2VydmljZS51c2VyLmRpc3BsYXlOYW1lID8gZ2xvYmFsc1NlcnZpY2UudXNlci5kaXNwbGF5TmFtZSA6ICdVbmRlZmluZWQnXG4gICAgICAgIH07XG5cblx0XHQkc2NvcGUuY2hhbm5lbEtleSA9IHRoaXMuY2hhbm5lbEtleTsgLy90byB1c2UgaW4gc2VuZE1lc3NhZ2VcbiAgICAgICAgJHNjb3BlLnRvVXNlcjtcbiAgICAgICAgJHNjb3BlLm1lc3NhZ2VzID0gW107XG5cdFx0JHNjb3BlLmlucHV0TWVzc2FnZSA9ICcnO1xuXHRcdCRzY29wZS5zZW5kTWVzc2FnZSA9IGZ1bmN0aW9uKG1zZykge1xuXHRcdFx0c2VsZi5kb1NlbmRNZXNzYWdlKHNlbGYsIG1zZyk7XG5cdFx0fTtcblxuICAgICAgICAvL1VJIGVsZW1lbnRzXG4gICAgICAgIHRoaXMudmlld1Njcm9sbCA9ICRpb25pY1Njcm9sbERlbGVnYXRlLiRnZXRCeUhhbmRsZSgndXNlck1lc3NhZ2VTY3JvbGwnKTtcbiAgICAgICAgdGhpcy5mb290ZXJCYXIgPSBkb2N1bWVudC5ib2R5LnF1ZXJ5U2VsZWN0b3IoJyN1c2VyTWVzc2FnZXNWaWV3IC5iYXItZm9vdGVyJyk7XG4gICAgICAgIHRoaXMuc2Nyb2xsZXIgPSBkb2N1bWVudC5ib2R5LnF1ZXJ5U2VsZWN0b3IoJyN1c2VyTWVzc2FnZXNWaWV3IC5zY3JvbGwtY29udGVudCcpO1xuICAgICAgICB0aGlzLnR4dElucHV0ID0gYW5ndWxhci5lbGVtZW50KHRoaXMuZm9vdGVyQmFyLnF1ZXJ5U2VsZWN0b3IoJ3RleHRhcmVhJykpO1xuXG4gICAgICAgIC8vZXZlbnRzXG4gICAgICAgICRzY29wZS4kb24oXCJjaGF0LXJlY2VpdmUtbWVzc2FnZVwiLCB0aGlzLm9uUmVjZWl2ZU1lc3NhZ2UpO1xuXG4gICAgICAgICRzY29wZS4kb24oJyRpb25pY1ZpZXcuYmVmb3JlTGVhdmUnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHNlbGYubWVzc2FnZVJlZi5vZmYoJ2NoaWxkX2FkZGVkJyk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuaW5pdCgpO1xuICAgIH1cblxuICAgIE1lc3NhZ2VzQ29udHJvbGxlci5wcm90b3R5cGUudmFsaWRhdGUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKCF0aGlzLmdsb2JhbHNTZXJ2aWNlLnVzZXIpIHtcbiAgICAgICAgICAgIHRoaXMuJHN0YXRlLmdvKCdsb2dpbicpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF0aGlzLmdsb2JhbHNTZXJ2aWNlLmJ1aWxkaW5nKSB7XG4gICAgICAgICAgICB0aGlzLiRzdGF0ZS5nbygnYXBwLmJ1aWxkaW5ncycpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfTtcblxuICAgIC8vQ2hlY2sgaWYgaXMgYSBDb21tb24gUm9vbSBvciBEaXJlY3QgTWVzc2FnZVxuICAgIE1lc3NhZ2VzQ29udHJvbGxlci5wcm90b3R5cGUuaW5pdCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgdmFyIGNoYW5uZWxQYXRoID0gWydidWlsZGluZ3MnLCB0aGlzLmJ1aWxkaW5nS2V5LCAnY2hhbm5lbHMnLCB0aGlzLiRzdGF0ZVBhcmFtcy5jaGFubmVsSWRdLmpvaW4oJy8nKTtcbiAgICAgICAgY29uc29sZS5sb2coY2hhbm5lbFBhdGgpO1xuXG4gICAgICAgIHZhciBjaGFubmVsUmVmID0gZmlyZWJhc2UuZGF0YWJhc2UoKS5yZWYoY2hhbm5lbFBhdGgpO1xuICAgICAgICBjaGFubmVsUmVmLm9uY2UoJ3ZhbHVlJywgZnVuY3Rpb24oc25hcHNob3QpIHtcbiAgICAgICAgICAgIHNlbGYuY2hhbm5lbCA9IHNuYXBzaG90LnZhbCgpO1xuXG4gICAgICAgICAgICBpZiAoc2VsZi5jaGFubmVsLnR5cGUgPT0gXCJkaXJlY3RcIikgeyAvL2RpcmVjdCBtZXNzYWdlXG4gICAgICAgICAgICAgICAgc2VsZi5zZXRDb250YWN0KHNlbGYuY2hhbm5lbC51c2VyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgeyAvL0NvbW1vbiByb29tXG4gICAgICAgICAgICAgICAgc2VsZi5nZXRMYXN0TWVzc2FnZXMoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIE1lc3NhZ2VzQ29udHJvbGxlci5wcm90b3R5cGUuc2V0Q29udGFjdCA9IGZ1bmN0aW9uKHVpZCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgdmFyIGNvbnRhY3RQYXRoID0gWyd1c2VycycsIHVpZF0uam9pbignLycpO1xuICAgICAgICBjb25zb2xlLmxvZyhjb250YWN0UGF0aCk7XG5cbiAgICAgICAgZmlyZWJhc2UuZGF0YWJhc2UoKS5yZWYoY29udGFjdFBhdGgpLm9uY2UoJ3ZhbHVlJywgZnVuY3Rpb24oc25hcHNob3QpIHtcbiAgICAgICAgICAgIHZhciBjb250YWN0ID0gc25hcHNob3QudmFsKCk7XG4gICAgICAgICAgICBzZWxmLiRzY29wZS50b1VzZXIgPSB7XG4gICAgICAgICAgICAgICAgdXNlcklkOiB1c2VyLnVpZCxcbiAgICAgICAgICAgICAgICB1c2VyUGljOiAnaHR0cDovL2lvbmljZnJhbWV3b3JrLmNvbS9pbWcvZG9jcy92ZW5rbWFuLmpwZycsXG4gICAgICAgICAgICAgICAgdXNlck5hbWU6IGNvbnRhY3QgJiYgY29udGFjdC5kaXNwbGF5TmFtZSA/IGNvbnRhY3QuZGlzcGxheU5hbWUgOiAnVW5kZWZpbmVkJ1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgc2VsZi5nZXRMYXN0TWVzc2FnZXMoKTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIE1lc3NhZ2VzQ29udHJvbGxlci5wcm90b3R5cGUuZ2V0TGFzdE1lc3NhZ2VzID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIG1zZ1BhdGggPSBbJ2J1aWxkaW5ncycsIHNlbGYuYnVpbGRpbmdLZXksICdtZXNzYWdlcyddLmpvaW4oJy8nKTtcblxuICAgICAgICBzZWxmLm1lc3NhZ2VSZWYgPSBmaXJlYmFzZS5kYXRhYmFzZSgpXG4gICAgICAgICAgICAucmVmKG1zZ1BhdGgpXG4gICAgICAgICAgICAub3JkZXJCeUNoaWxkKCdjaGFubmVsJykuZXF1YWxUbyhzZWxmLmNoYW5uZWxLZXkpXG4gICAgICAgICAgICAubGltaXRUb0xhc3QoMTAwKVxuICAgICAgICAgICAgLm9uKCd2YWx1ZScsIGZ1bmN0aW9uKHMpIHtcbiAgICAgICAgICAgICAgICBzZWxmLiRzY29wZS5tZXNzYWdlcyA9IHMudmFsKCk7XG5cdFx0XHRcdFxuXHRcdFx0XHRzZWxmLiR0aW1lb3V0KGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdHNlbGYudmlld1Njcm9sbC5zY3JvbGxCb3R0b20odHJ1ZSk7XG5cdFx0XHRcdH0sIDEwKTtcbiAgICAgICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBNZXNzYWdlc0NvbnRyb2xsZXIucHJvdG90eXBlLmRvU2VuZE1lc3NhZ2UgPSBmdW5jdGlvbihzZWxmLCBtc2cpIHtcbiAgICAgICAgdmFyIG1lc3NhZ2UgPSB7XG4gICAgICAgICAgICBkYXRlOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgICAgICBjaGFubmVsOiBzZWxmLmNoYW5uZWxLZXksXG4gICAgICAgICAgICB0ZXh0OiBtc2csXG4gICAgICAgICAgICB1c2VyTmFtZTogc2VsZi4kc2NvcGUudXNlci5uYW1lLFxuICAgICAgICAgICAgdXNlcklkOiBzZWxmLiRzY29wZS51c2VyLmlkLFxuICAgICAgICAgICAgdXNlclBpYzogc2VsZi4kc2NvcGUudXNlci5waWNcbiAgICAgICAgfTtcblx0XHRcblx0XHRpZiAoc2VsZi50b1VzZXIpXG5cdFx0XHRtZXNzYWdlLnRvID0gc2VsZi50b1VzZXIudWlkOyBcblxuXHRcdHZhciBtc2dQYXRoID0gWydidWlsZGluZ3MnLCBzZWxmLmJ1aWxkaW5nS2V5LCAnbWVzc2FnZXMnXS5qb2luKCcvJyk7XG4gICAgICAgIGZpcmViYXNlLmRhdGFiYXNlKCkucmVmKG1zZ1BhdGgpLnB1c2gobWVzc2FnZSk7XG5cdFx0XG5cdFx0c2VsZi4kc2NvcGUuaW5wdXRNZXNzYWdlID0gJyc7XG5cbiAgICAgICAgc2VsZi4kdGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHNlbGYua2VlcEtleWJvYXJkT3BlbigpO1xuICAgICAgICAgICAgc2VsZi52aWV3U2Nyb2xsLnNjcm9sbEJvdHRvbSh0cnVlKTtcbiAgICAgICAgfSwgMCk7XG4gICAgfTtcblxuICAgIE1lc3NhZ2VzQ29udHJvbGxlci5wcm90b3R5cGUua2VlcEtleWJvYXJkT3BlbiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cdFx0c2VsZi50eHRJbnB1dC5vbmUoJ2JsdXInLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCd0ZXh0YXJlYSBibHVyLCBmb2N1cyBiYWNrIG9uIGl0Jyk7XG4gICAgICAgICAgICBzZWxmLnR4dElucHV0WzBdLmZvY3VzKCk7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBNZXNzYWdlc0NvbnRyb2xsZXIucHJvdG90eXBlLm9uUHJvZmlsZVBpY0Vycm9yID0gZnVuY3Rpb24oZWxlKSB7XG4gICAgICAgIHRoaXMuZWxlLnNyYyA9ICcnOyAvL2ZhbGxiYWNrXG4gICAgfTtcblxuXG5cblxuICAgIC8qXG4gICAgYW5ndWxhclxuICAgICAgICAgICAgLm1vZHVsZSgnYXBwLm1lc3NhZ2VzJylcbiAgICBcbiAgICAgICAgICAgIC5jb250cm9sbGVyKCdtZXNzYWdlc0NvbnRyb2xsZXInLCBbJyRzY29wZScsICckcm9vdFNjb3BlJywgJyRzdGF0ZScsXG4gICAgICAgICAgICAgICAgJyRzdGF0ZVBhcmFtcycsICckaW9uaWNBY3Rpb25TaGVldCcsXG4gICAgICAgICAgICAgICAgJyRpb25pY1BvcHVwJywgJyRpb25pY1Njcm9sbERlbGVnYXRlJywgJyR0aW1lb3V0JywgJyRpbnRlcnZhbCcsXG4gICAgICAgICAgICAgICAgJ2NoYW5uZWxzU2VydmljZScsICdhdXRoU2VydmljZScsXG4gICAgICAgICAgICAgICAgbWVzc2FnZXNDb250cm9sbGVyXG4gICAgICAgICAgICBdKTtcbiAgICAgICAgXHRcbiAgICAgICAgZnVuY3Rpb24gbWVzc2FnZXNDb250cm9sbGVyKCRzY29wZSwgJHJvb3RTY29wZSwgJHN0YXRlLCAkc3RhdGVQYXJhbXMsICRpb25pY0FjdGlvblNoZWV0LFxuICAgICAgICAgICAgJGlvbmljUG9wdXAsICRpb25pY1Njcm9sbERlbGVnYXRlLCAkdGltZW91dCwgJGludGVydmFsLCBjaGFubmVsc1NlcnZpY2UsIGF1dGhTZXJ2aWNlKSB7XG4gICAgXG4gICAgICAgICAgICAkc2NvcGUuY2hhbm5lbElkID0gJHN0YXRlLnBhcmFtcy5jaGFubmVsSWQ7XG4gICAgICAgICAgICAkc2NvcGUuY2hhbm5lbE5hbWUgPSBjaGFubmVsc1NlcnZpY2UuY2hhbm5lbHNbJHNjb3BlLmNoYW5uZWxJZF07XG4gICAgICAgICAgICAkc2NvcGUudXNlciA9IGF1dGhTZXJ2aWNlLnVzZXIoKTtcbiAgICBcbiAgICAgICAgICAgIGlmICghJHNjb3BlLnVzZXIpIHtcbiAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2xvZ2luJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgJHNjb3BlLnVzZXIgPSB7XG4gICAgICAgICAgICAgICAgX2lkOiAkc2NvcGUudXNlci51aWQsXG4gICAgICAgICAgICAgICAgcGljOiAnaHR0cDovL2lvbmljZnJhbWV3b3JrLmNvbS9pbWcvZG9jcy9tY2ZseS5qcGcnLFxuICAgICAgICAgICAgICAgIHVzZXJuYW1lOiAkc2NvcGUudXNlciAmJiAkc2NvcGUudXNlci5kaXNwbGF5TmFtZSA/ICRzY29wZS51c2VyLmRpc3BsYXlOYW1lID8gJ0Fub255bW91cyc7XG4gICAgICAgICAgICB9O1xuICAgIFxuICAgICAgICAgICAgLy8gbW9jayBhY3F1aXJpbmcgZGF0YSB2aWEgJHN0YXRlUGFyYW1zXG4gICAgICAgICAgICAkc2NvcGUudG9Vc2VyID0gbnVsbDtcbiAgICAgICAgICAgIGlmICgkc2NvcGUuY2hhbm5lbElkID09IFwibGFuZGxvcmRcIikge1xuICAgICAgICAgICAgICAgICRcbiAgICAgICAgICAgICAgICAkc2NvcGUudG9Vc2VyID0ge1xuICAgICAgICAgICAgICAgICAgICBfaWQ6ICc1MzRiOGU1YWFhNWU3YWZjMWIyM2U2OWInLFxuICAgICAgICAgICAgICAgICAgICBwaWM6ICdodHRwOi8vaW9uaWNmcmFtZXdvcmsuY29tL2ltZy9kb2NzL3ZlbmttYW4uanBnJyxcbiAgICAgICAgICAgICAgICAgICAgY2hhbm5lbDogJHNjb3BlLmNoYW5uZWxJZFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICRzY29wZS5pbnB1dCA9IHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiBsb2NhbFN0b3JhZ2VbJ3VzZXJNZXNzYWdlLScgKyAkc2NvcGUudG9Vc2VyLl9pZF0gfHwgJydcbiAgICAgICAgICAgIH07XG4gICAgXG4gICAgICAgICAgICB2YXIgbWVzc2FnZUNoZWNrVGltZXI7XG4gICAgXG4gICAgICAgICAgICB2YXIgdmlld1Njcm9sbCA9ICRpb25pY1Njcm9sbERlbGVnYXRlLiRnZXRCeUhhbmRsZSgndXNlck1lc3NhZ2VTY3JvbGwnKTtcbiAgICAgICAgICAgIHZhciBmb290ZXJCYXI7IC8vIGdldHMgc2V0IGluICRpb25pY1ZpZXcuZW50ZXJcbiAgICAgICAgICAgIHZhciBzY3JvbGxlcjtcbiAgICAgICAgICAgIHZhciB0eHRJbnB1dDsgLy8gXl5eXG4gICAgXG4gICAgICAgICAgICAkc2NvcGUuJG9uKCckaW9uaWNWaWV3LmVudGVyJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1VzZXJNZXNzYWdlcyAkaW9uaWNWaWV3LmVudGVyJyk7XG4gICAgXG4gICAgICAgICAgICAgICAgZ2V0TWVzc2FnZXMoKTtcbiAgICBcbiAgICAgICAgICAgICAgICAkdGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9vdGVyQmFyID0gZG9jdW1lbnQuYm9keS5xdWVyeVNlbGVjdG9yKCcjdXNlck1lc3NhZ2VzVmlldyAuYmFyLWZvb3RlcicpO1xuICAgICAgICAgICAgICAgICAgICBzY3JvbGxlciA9IGRvY3VtZW50LmJvZHkucXVlcnlTZWxlY3RvcignI3VzZXJNZXNzYWdlc1ZpZXcgLnNjcm9sbC1jb250ZW50Jyk7XG4gICAgICAgICAgICAgICAgICAgIHR4dElucHV0ID0gYW5ndWxhci5lbGVtZW50KGZvb3RlckJhci5xdWVyeVNlbGVjdG9yKCd0ZXh0YXJlYScpKTtcbiAgICAgICAgICAgICAgICB9LCAwKTtcbiAgICBcbiAgICAgICAgICAgICAgICBtZXNzYWdlQ2hlY2tUaW1lciA9ICRpbnRlcnZhbChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gaGVyZSB5b3UgY291bGQgY2hlY2sgZm9yIG5ldyBtZXNzYWdlcyBpZiB5b3VyIGFwcCBkb2Vzbid0IHVzZSBwdXNoIG5vdGlmaWNhdGlvbnMgb3IgdXNlciBkaXNhYmxlZCB0aGVtXG4gICAgICAgICAgICAgICAgfSwgMjAwMDApO1xuICAgICAgICAgICAgfSk7XG4gICAgXG4gICAgICAgICAgICAkc2NvcGUuJG9uKCckaW9uaWNWaWV3LmxlYXZlJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2xlYXZpbmcgVXNlck1lc3NhZ2VzIHZpZXcsIGRlc3Ryb3lpbmcgaW50ZXJ2YWwnKTtcbiAgICAgICAgICAgICAgICAvLyBNYWtlIHN1cmUgdGhhdCB0aGUgaW50ZXJ2YWwgaXMgZGVzdHJveWVkXG4gICAgICAgICAgICAgICAgaWYgKGFuZ3VsYXIuaXNEZWZpbmVkKG1lc3NhZ2VDaGVja1RpbWVyKSkge1xuICAgICAgICAgICAgICAgICAgICAkaW50ZXJ2YWwuY2FuY2VsKG1lc3NhZ2VDaGVja1RpbWVyKTtcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZUNoZWNrVGltZXIgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgXG4gICAgICAgICAgICAkc2NvcGUuJG9uKCckaW9uaWNWaWV3LmJlZm9yZUxlYXZlJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgaWYgKCEkc2NvcGUuaW5wdXQubWVzc2FnZSB8fCAkc2NvcGUuaW5wdXQubWVzc2FnZSA9PT0gJycpIHtcbiAgICAgICAgICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ3VzZXJNZXNzYWdlLScgKyAkc2NvcGUudG9Vc2VyLl9pZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgXG4gICAgICAgICAgICBmdW5jdGlvbiBnZXRNZXNzYWdlcygpIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUubWVzc2FnZXMgPSBbe1xuICAgICAgICAgICAgICAgICAgICBcIl9pZFwiOiBcIjUzNWQ2MjVmODk4ZGY0ZTgwZTJhMTI1ZVwiLFxuICAgICAgICAgICAgICAgICAgICBcInRleHRcIjogXCJJb25pYyBoYXMgY2hhbmdlZCB0aGUgZ2FtZSBmb3IgaHlicmlkIGFwcCBkZXZlbG9wbWVudC5cIixcbiAgICAgICAgICAgICAgICAgICAgXCJ1c2VySWRcIjogXCI1MzRiOGZiMmFhNWU3YWZjMWIyM2U2OWNcIixcbiAgICAgICAgICAgICAgICAgICAgXCJkYXRlXCI6IFwiMjAxNC0wNC0yN1QyMDowMjozOS4wODJaXCIsXG4gICAgICAgICAgICAgICAgICAgIFwicmVhZFwiOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBcInJlYWREYXRlXCI6IFwiMjAxNC0xMi0wMVQwNjoyNzozNy45NDRaXCJcbiAgICAgICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBcIl9pZFwiOiBcIjUzNWYxM2ZmZWUzYjJhNjgxMTJiOWZjMFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJ0ZXh0XCI6IFwiSSBsaWtlIElvbmljIGJldHRlciB0aGFuIGljZSBjcmVhbSFcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwidXNlcklkXCI6IFwiNTM0YjhlNWFhYTVlN2FmYzFiMjNlNjliXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcImRhdGVcIjogXCIyMDE0LTA0LTI5VDAyOjUyOjQ3LjcwNlpcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwicmVhZFwiOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJyZWFkRGF0ZVwiOiBcIjIwMTQtMTItMDFUMDY6Mjc6MzcuOTQ0WlwiXG4gICAgICAgICAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiX2lkXCI6IFwiNTQ2YTU4NDNmZDRjNWQ1ODFlZmEyNjNhXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcInRleHRcIjogXCJMb3JlbSBpcHN1bSBkb2xvciBzaXQgYW1ldCwgY29uc2VjdGV0dXIgYWRpcGlzY2luZyBlbGl0LCBzZWQgZG8gZWl1c21vZCB0ZW1wb3IgaW5jaWRpZHVudCB1dCBsYWJvcmUgZXQgZG9sb3JlIG1hZ25hIGFsaXF1YS4gVXQgZW5pbSBhZCBtaW5pbSB2ZW5pYW0sIHF1aXMgbm9zdHJ1ZCBleGVyY2l0YXRpb24gdWxsYW1jbyBsYWJvcmlzIG5pc2kgdXQgYWxpcXVpcCBleCBlYSBjb21tb2RvIGNvbnNlcXVhdC4gRHVpcyBhdXRlIGlydXJlIGRvbG9yIGluIHJlcHJlaGVuZGVyaXQgaW4gdm9sdXB0YXRlIHZlbGl0IGVzc2UgY2lsbHVtIGRvbG9yZSBldSBmdWdpYXQgbnVsbGEgcGFyaWF0dXIuIEV4Y2VwdGV1ciBzaW50IG9jY2FlY2F0IGN1cGlkYXRhdCBub24gcHJvaWRlbnQsIHN1bnQgaW4gY3VscGEgcXVpIG9mZmljaWEgZGVzZXJ1bnQgbW9sbGl0IGFuaW0gaWQgZXN0IGxhYm9ydW0uXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcInVzZXJJZFwiOiBcIjUzNGI4ZmIyYWE1ZTdhZmMxYjIzZTY5Y1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJkYXRlXCI6IFwiMjAxNC0xMS0xN1QyMDoxOToxNS4yODlaXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcInJlYWRcIjogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIFwicmVhZERhdGVcIjogXCIyMDE0LTEyLTAxVDA2OjI3OjM4LjMyOFpcIlxuICAgICAgICAgICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBcIl9pZFwiOiBcIjU0NzY0Mzk5YWI0M2QxZDQxMTNhYmZkMVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJ0ZXh0XCI6IFwiQW0gSSBkcmVhbWluZz9cIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwidXNlcklkXCI6IFwiNTM0YjhlNWFhYTVlN2FmYzFiMjNlNjliXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcImRhdGVcIjogXCIyMDE0LTExLTI2VDIxOjE4OjE3LjU5MVpcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwicmVhZFwiOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJyZWFkRGF0ZVwiOiBcIjIwMTQtMTItMDFUMDY6Mjc6MzguMzM3WlwiXG4gICAgICAgICAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiX2lkXCI6IFwiNTQ3NjQzYWVhYjQzZDFkNDExM2FiZmQyXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcInRleHRcIjogXCJJcyB0aGlzIG1hZ2ljP1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJ1c2VySWRcIjogXCI1MzRiOGZiMmFhNWU3YWZjMWIyM2U2OWNcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiZGF0ZVwiOiBcIjIwMTQtMTEtMjZUMjE6MTg6MzguNTQ5WlwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJyZWFkXCI6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBcInJlYWREYXRlXCI6IFwiMjAxNC0xMi0wMVQwNjoyNzozOC4zMzhaXCJcbiAgICAgICAgICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJfaWRcIjogXCI1NDc4MTVkYmFiNDNkMWQ0MTEzYWJmZWZcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwidGV4dFwiOiBcIkdlZSB3aXosIHRoaXMgaXMgc29tZXRoaW5nIHNwZWNpYWwuXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcInVzZXJJZFwiOiBcIjUzNGI4ZTVhYWE1ZTdhZmMxYjIzZTY5YlwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJkYXRlXCI6IFwiMjAxNC0xMS0yOFQwNjoyNzo0MC4wMDFaXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcInJlYWRcIjogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIFwicmVhZERhdGVcIjogXCIyMDE0LTEyLTAxVDA2OjI3OjM4LjMzOFpcIlxuICAgICAgICAgICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBcIl9pZFwiOiBcIjU0NzgxYzY5YWI0M2QxZDQxMTNhYmZmMFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJ0ZXh0XCI6IFwiSSB0aGluayBJIGxpa2UgSW9uaWMgbW9yZSB0aGFuIEkgbGlrZSBpY2UgY3JlYW0hXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcInVzZXJJZFwiOiBcIjUzNGI4ZmIyYWE1ZTdhZmMxYjIzZTY5Y1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJkYXRlXCI6IFwiMjAxNC0xMS0yOFQwNjo1NTozNy4zNTBaXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcInJlYWRcIjogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIFwicmVhZERhdGVcIjogXCIyMDE0LTEyLTAxVDA2OjI3OjM4LjMzOFpcIlxuICAgICAgICAgICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBcIl9pZFwiOiBcIjU0NzgxY2E0YWI0M2QxZDQxMTNhYmZmMVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJ0ZXh0XCI6IFwiWWVhLCBpdCdzIHByZXR0eSBzd2VldFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJ1c2VySWRcIjogXCI1MzRiOGU1YWFhNWU3YWZjMWIyM2U2OWJcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiZGF0ZVwiOiBcIjIwMTQtMTEtMjhUMDY6NTY6MzYuNDcyWlwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJyZWFkXCI6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBcInJlYWREYXRlXCI6IFwiMjAxNC0xMi0wMVQwNjoyNzozOC4zMzhaXCJcbiAgICAgICAgICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJfaWRcIjogXCI1NDc4ZGY4NmFiNDNkMWQ0MTEzYWJmZjRcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwidGV4dFwiOiBcIldvdywgdGhpcyBpcyByZWFsbHkgc29tZXRoaW5nIGh1aD9cIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwidXNlcklkXCI6IFwiNTM0YjhmYjJhYTVlN2FmYzFiMjNlNjljXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcImRhdGVcIjogXCIyMDE0LTExLTI4VDIwOjQ4OjA2LjU3MlpcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwicmVhZFwiOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJyZWFkRGF0ZVwiOiBcIjIwMTQtMTItMDFUMDY6Mjc6MzguMzM5WlwiXG4gICAgICAgICAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiX2lkXCI6IFwiNTQ3ODFjYTRhYjQzZDFkNDExM2FiZmYxXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcInRleHRcIjogXCJDcmVhdGUgYW1hemluZyBhcHBzIC0gaW9uaWNmcmFtZXdvcmsuY29tXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcInVzZXJJZFwiOiBcIjUzNGI4ZTVhYWE1ZTdhZmMxYjIzZTY5YlwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJkYXRlXCI6IFwiMjAxNC0xMS0yOVQwNjo1NjozNi40NzJaXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcInJlYWRcIjogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIFwicmVhZERhdGVcIjogXCIyMDE0LTEyLTAxVDA2OjI3OjM4LjMzOFpcIlxuICAgICAgICAgICAgICAgICAgICB9XTtcbiAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICRzY29wZS4kd2F0Y2goJ2lucHV0Lm1lc3NhZ2UnLCBmdW5jdGlvbihuZXdWYWx1ZSwgb2xkVmFsdWUpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnaW5wdXQubWVzc2FnZSAkd2F0Y2gsIG5ld1ZhbHVlICcgKyBuZXdWYWx1ZSk7XG4gICAgICAgICAgICAgICAgaWYgKCFuZXdWYWx1ZSkgbmV3VmFsdWUgPSAnJztcbiAgICAgICAgICAgICAgICBsb2NhbFN0b3JhZ2VbJ3VzZXJNZXNzYWdlLScgKyAkc2NvcGUudG9Vc2VyLl9pZF0gPSBuZXdWYWx1ZTtcbiAgICAgICAgICAgIH0pO1xuICAgIFxuICAgICAgICAgICAgJHNjb3BlLnNlbmRNZXNzYWdlID0gZnVuY3Rpb24oc2VuZE1lc3NhZ2VGb3JtKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1lc3NhZ2UgPSB7XG4gICAgICAgICAgICAgICAgICAgIHRvSWQ6ICRzY29wZS50b1VzZXIuX2lkLFxuICAgICAgICAgICAgICAgICAgICB0ZXh0OiAkc2NvcGUuaW5wdXQubWVzc2FnZVxuICAgICAgICAgICAgICAgIH07XG4gICAgXG4gICAgICAgICAgICAgICAgLy8gaWYgeW91IGRvIGEgd2ViIHNlcnZpY2UgY2FsbCB0aGlzIHdpbGwgYmUgbmVlZGVkIGFzIHdlbGwgYXMgYmVmb3JlIHRoZSB2aWV3U2Nyb2xsIGNhbGxzXG4gICAgICAgICAgICAgICAgLy8geW91IGNhbid0IHNlZSB0aGUgZWZmZWN0IG9mIHRoaXMgaW4gdGhlIGJyb3dzZXIgaXQgbmVlZHMgdG8gYmUgdXNlZCBvbiBhIHJlYWwgZGV2aWNlXG4gICAgICAgICAgICAgICAgLy8gZm9yIHNvbWUgcmVhc29uIHRoZSBvbmUgdGltZSBibHVyIGV2ZW50IGlzIG5vdCBmaXJpbmcgaW4gdGhlIGJyb3dzZXIgYnV0IGRvZXMgb24gZGV2aWNlc1xuICAgICAgICAgICAgICAgIGtlZXBLZXlib2FyZE9wZW4oKTtcbiAgICBcbiAgICAgICAgICAgICAgICAvL01vY2tTZXJ2aWNlLnNlbmRNZXNzYWdlKG1lc3NhZ2UpLnRoZW4oZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgICRzY29wZS5pbnB1dC5tZXNzYWdlID0gJyc7XG4gICAgXG4gICAgICAgICAgICAgICAgbWVzc2FnZS5faWQgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTsgLy8gOn4pXG4gICAgICAgICAgICAgICAgbWVzc2FnZS5kYXRlID0gbmV3IERhdGUoKTtcbiAgICAgICAgICAgICAgICBtZXNzYWdlLnVzZXJuYW1lID0gJHNjb3BlLnVzZXIudXNlcm5hbWU7XG4gICAgICAgICAgICAgICAgbWVzc2FnZS51c2VySWQgPSAkc2NvcGUudXNlci5faWQ7XG4gICAgICAgICAgICAgICAgbWVzc2FnZS5waWMgPSAkc2NvcGUudXNlci5waWN0dXJlO1xuICAgIFxuICAgICAgICAgICAgICAgICRzY29wZS5tZXNzYWdlcy5wdXNoKG1lc3NhZ2UpO1xuICAgIFxuICAgICAgICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBrZWVwS2V5Ym9hcmRPcGVuKCk7XG4gICAgICAgICAgICAgICAgICAgIHZpZXdTY3JvbGwuc2Nyb2xsQm90dG9tKHRydWUpO1xuICAgICAgICAgICAgICAgIH0sIDApO1xuICAgIFxuICAgICAgICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUubWVzc2FnZXMucHVzaChNb2NrU2VydmljZS5nZXRNb2NrTWVzc2FnZSgpKTtcbiAgICAgICAgICAgICAgICAgICAga2VlcEtleWJvYXJkT3BlbigpO1xuICAgICAgICAgICAgICAgICAgICB2aWV3U2Nyb2xsLnNjcm9sbEJvdHRvbSh0cnVlKTtcbiAgICAgICAgICAgICAgICB9LCAyMDAwKTtcbiAgICBcbiAgICAgICAgICAgICAgICAvL30pO1xuICAgICAgICAgICAgfTtcbiAgICBcbiAgICAgICAgICAgIC8vIHRoaXMga2VlcHMgdGhlIGtleWJvYXJkIG9wZW4gb24gYSBkZXZpY2Ugb25seSBhZnRlciBzZW5kaW5nIGEgbWVzc2FnZSwgaXQgaXMgbm9uIG9idHJ1c2l2ZVxuICAgICAgICAgICAgZnVuY3Rpb24ga2VlcEtleWJvYXJkT3BlbigpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygna2VlcEtleWJvYXJkT3BlbicpO1xuICAgICAgICAgICAgICAgIHR4dElucHV0Lm9uZSgnYmx1cicsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygndGV4dGFyZWEgYmx1ciwgZm9jdXMgYmFjayBvbiBpdCcpO1xuICAgICAgICAgICAgICAgICAgICB0eHRJbnB1dFswXS5mb2N1cygpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgZnVuY3Rpb24gb25Qcm9maWxlUGljRXJyb3IoZWxlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5lbGUuc3JjID0gJyc7IC8vIHNldCBhIGZhbGxiYWNrXG4gICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAkc2NvcGUub25NZXNzYWdlSG9sZCA9IGZ1bmN0aW9uKGUsIGl0ZW1JbmRleCwgbWVzc2FnZSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdvbk1lc3NhZ2VIb2xkJyk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ21lc3NhZ2U6ICcgKyBKU09OLnN0cmluZ2lmeShtZXNzYWdlLCBudWxsLCAyKSk7XG4gICAgICAgICAgICAgICAgJGlvbmljQWN0aW9uU2hlZXQuc2hvdyh7XG4gICAgICAgICAgICAgICAgICAgIGJ1dHRvbnM6IFt7XG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiAnQ29weSBUZXh0J1xuICAgICAgICAgICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogJ0RlbGV0ZSBNZXNzYWdlJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfV0sXG4gICAgICAgICAgICAgICAgICAgIGJ1dHRvbkNsaWNrZWQ6IGZ1bmN0aW9uKGluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKGluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAwOiAvLyBDb3B5IFRleHRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9jb3Jkb3ZhLnBsdWdpbnMuY2xpcGJvYXJkLmNvcHkobWVzc2FnZS50ZXh0KTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAxOiAvLyBEZWxldGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gbm8gc2VydmVyIHNpZGUgc2VjcmV0cyBoZXJlIDp+KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUubWVzc2FnZXMuc3BsaWNlKGl0ZW1JbmRleCwgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmlld1Njcm9sbC5yZXNpemUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgMCk7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH07XG4gICAgXG4gICAgICAgICAgICAvLyB0aGlzIHByb2Igc2VlbXMgd2VpcmQgaGVyZSBidXQgSSBoYXZlIHJlYXNvbnMgZm9yIHRoaXMgaW4gbXkgYXBwLCBzZWNyZXQhXG4gICAgICAgICAgICAkc2NvcGUudmlld1Byb2ZpbGUgPSBmdW5jdGlvbihtc2cpIHtcbiAgICAgICAgICAgICAgICBpZiAobXNnLnVzZXJJZCA9PT0gJHNjb3BlLnVzZXIuX2lkKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGdvIHRvIHlvdXIgcHJvZmlsZVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGdvIHRvIG90aGVyIHVzZXJzIHByb2ZpbGVcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgIFxuICAgICAgICAgICAgLy8gSSBlbWl0IHRoaXMgZXZlbnQgZnJvbSB0aGUgbW9ub3NwYWNlZC5lbGFzdGljIGRpcmVjdGl2ZSwgcmVhZCBsaW5lIDQ4MFxuICAgICAgICAgICAgJHNjb3BlLiRvbigndGFSZXNpemUnLCBmdW5jdGlvbihlLCB0YSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCd0YVJlc2l6ZScpO1xuICAgICAgICAgICAgICAgIGlmICghdGEpIHJldHVybjtcbiAgICBcbiAgICAgICAgICAgICAgICB2YXIgdGFIZWlnaHQgPSB0YVswXS5vZmZzZXRIZWlnaHQ7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ3RhSGVpZ2h0OiAnICsgdGFIZWlnaHQpO1xuICAgIFxuICAgICAgICAgICAgICAgIGlmICghZm9vdGVyQmFyKSByZXR1cm47XG4gICAgXG4gICAgICAgICAgICAgICAgdmFyIG5ld0Zvb3RlckhlaWdodCA9IHRhSGVpZ2h0ICsgMTA7XG4gICAgICAgICAgICAgICAgbmV3Rm9vdGVySGVpZ2h0ID0gKG5ld0Zvb3RlckhlaWdodCA+IDQ0KSA/IG5ld0Zvb3RlckhlaWdodCA6IDQ0O1xuICAgIFxuICAgICAgICAgICAgICAgIGZvb3RlckJhci5zdHlsZS5oZWlnaHQgPSBuZXdGb290ZXJIZWlnaHQgKyAncHgnO1xuICAgICAgICAgICAgICAgIHNjcm9sbGVyLnN0eWxlLmJvdHRvbSA9IG5ld0Zvb3RlckhlaWdodCArICdweCc7XG4gICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgfVxuICAgICAgICAqL1xufSkoKTtcblxuXG5cblxuIiwiKGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBhbmd1bGFyXG4gICAgICAgIC5tb2R1bGUoJ2FwcC5tZXNzYWdlcycpXG5cbiAgICAgICAgLmZpbHRlcignbmwyYnInLCBbJyRmaWx0ZXInLCBubDJicl0pXG5cbiAgICBmdW5jdGlvbiBubDJicigkZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICAgICAgaWYgKCFkYXRhKSByZXR1cm4gZGF0YTtcbiAgICAgICAgICAgIHJldHVybiBkYXRhLnJlcGxhY2UoL1xcblxccj8vZywgJzxiciAvPicpO1xuICAgICAgICB9O1xuICAgIH1cbn0pKCk7IiwiKGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBhbmd1bGFyXG4gICAgICAgIC5tb2R1bGUoJ2FwcC5tZXNzYWdlcycpXG4gICAgICAgIC5zZXJ2aWNlKCdtZXNzYWdlc1NlcnZpY2UnLCBtZXNzYWdlc1NlcnZpY2UpO1xuXG4gICAgZnVuY3Rpb24gbWVzc2FnZXNTZXJ2aWNlKGZpcmViYXNlU2VydmljZSkge1xuICAgICAgICB2YXIgc2VydmljZSA9IHt9O1xuXHRcdFxuICAgICAgICBzZXJ2aWNlLmdldE1lc3NhZ2VzUmVmID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGZpcmViYXNlU2VydmljZS5mYi5kYXRhYmFzZSgpLnJlZignbWVzc2FnZXMnKTtcbiAgICAgICAgfTtcblxuICAgICAgICBzZXJ2aWNlLmFkZE1lc3NhZ2UgPSBmdW5jdGlvbiAobWVzc2FnZSkge1xuICAgICAgICAgICAgcmV0dXJuIGZpcmViYXNlU2VydmljZS5mYi5kYXRhYmFzZSgpLnB1c2gobWVzc2FnZSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gc2VydmljZTtcbiAgICB9XG59KSgpO1xuIiwiKGZ1bmN0aW9uKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGFuZ3VsYXIubW9kdWxlKFwiYXBwLnVzZXJzXCIpXG5cbiAgICAgICAgLnNlcnZpY2UoXCJ1c2Vyc1NlcnZpY2VcIiwgdXNlcnNTZXJ2aWNlKTtcblxuXG4gICAgZnVuY3Rpb24gdXNlcnNTZXJ2aWNlKCRxLCBhdXRoU2VydmljZSkge1xuXHQgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHVwZGF0ZVByb2ZpbGU6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuXG4gICAgICAgICAgICAgICAgYXV0aFNlcnZpY2UudXNlcigpLnVwZGF0ZVByb2ZpbGUoZGF0YSlcbiAgICAgICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gc3VjY2VzcygpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUoXCJQcm9maWxlIHVwZGF0ZWQhXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdXNlciA9IGZpcmViYXNlLmF1dGgoKS5jdXJyZW50VXNlcjtcbiAgICAgICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdCgndXNlci1jaGFuZ2VkJyk7XG4gICAgICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uIGVycm9yKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZWplY3QoZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfVxuICAgIH1cbn0pKCk7IiwiKGZ1bmN0aW9uKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGFuZ3VsYXJcblxuICAgICAgICAubW9kdWxlKCdhcHAnLCBbXG4gICAgICAgICAgICAnaW9uaWMnLFxuICAgICAgICAgICAgJ21vbm9zcGFjZWQuZWxhc3RpYycsXG5cbiAgICAgICAgICAgICdhcHAuZmlyZWJhc2UnLFxuICAgICAgICAgICAgJ2FwcC5maXJlYmFzZScsXG4gICAgICAgICAgICAnYXBwLmF1dGgnLFxuICAgICAgICAgICAgJ2FwcC5jaGFubmVscycsXG4gICAgICAgICAgICAnYXBwLnNpZGVtZW51JyxcbiAgICAgICAgICAgICdhcHAuYnVpbGRpbmdzJyxcbiAgICAgICAgICAgICdhcHAucHJvZmlsZXMnLFxuICAgICAgICAgICAgJ2FwcC5tZXNzYWdlcycsXG4gICAgICAgICAgICAnYXBwLmRpcmVjdG1lc3NhZ2VzJ1xuICAgICAgICBdKVxuXG4gICAgICAgIC5ydW4oZnVuY3Rpb24oJGlvbmljUGxhdGZvcm0sICR0aW1lb3V0LCAkcm9vdFNjb3BlKSB7XG4gICAgICAgICAgICAkaW9uaWNQbGF0Zm9ybS5yZWFkeShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBpZiAod2luZG93LmNvcmRvdmEgJiYgd2luZG93LmNvcmRvdmEucGx1Z2lucy5LZXlib2FyZCkge1xuICAgICAgICAgICAgICAgICAgICBjb3Jkb3ZhLnBsdWdpbnMuS2V5Ym9hcmQuaGlkZUtleWJvYXJkQWNjZXNzb3J5QmFyKHRydWUpO1xuXG4gICAgICAgICAgICAgICAgICAgIGNvcmRvdmEucGx1Z2lucy5LZXlib2FyZC5kaXNhYmxlU2Nyb2xsKHRydWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAod2luZG93LlN0YXR1c0Jhcikge1xuICAgICAgICAgICAgICAgICAgICBTdGF0dXNCYXIuc3R5bGVEZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgfVxuXHRcdFx0XHQvL3RvIGdldCB1c2VyIGluZm9cbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRlbWl0KCd1c2VyLWNoYW5nZWQnKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbn0pKCk7XG5cblxuIiwiKGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBhbmd1bGFyXG4gICAgICAgIC5tb2R1bGUoJ2FwcCcpXG4gICAgICAgIC5zZXJ2aWNlKCdnbG9iYWxzU2VydmljZScsIGdsb2JhbHNTZXJ2aWNlKTtcblxuICAgIGZ1bmN0aW9uIGdsb2JhbHNTZXJ2aWNlKCkge1xuICAgICAgICB2YXIgc2VydmljZSA9IHtcblx0XHRcdHVzZXIgOiBudWxsLCAvL2xvZ2dlZCB1c2VyXG5cdFx0XHRidWlsZGluZyA6IG51bGwgLy9zZWxlY3RlZCBidWlsZGluZ1xuXHRcdH07XG5cbiAgICAgICAgcmV0dXJuIHNlcnZpY2U7XG4gICAgfVxufSkoKTtcbiIsIihmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgYW5ndWxhclxuXG4gICAgICAgIC5tb2R1bGUoJ2FwcCcpXG5cbiAgICAgICAgLnJ1bihbJyRyb290U2NvcGUnLCAnJGxvY2F0aW9uJywgJ2F1dGhTZXJ2aWNlJywgZnVuY3Rpb24gKCRyb290U2NvcGUsICRzdGF0ZSwgYXV0aFNlcnZpY2UpIHtcbiAgICAgICAgICAgICRyb290U2NvcGUuJG9uKCckcm91dGVDaGFuZ2VTdGFydCcsIGZ1bmN0aW9uIChldmVudCkge1xuXG4gICAgICAgICAgICAgICAgaWYgKGF1dGhTZXJ2aWNlLnVzZXIoKSA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnbG9naW4nKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfV0pXG59KSgpO1xuIiwiKGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBhbmd1bGFyXG5cbiAgICAgICAgLm1vZHVsZSgnYXBwJylcblxuICAgICAgICAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlciwgJHVybFJvdXRlclByb3ZpZGVyKSB7XG4gICAgICAgICAgICAkc3RhdGVQcm92aWRlclxuXG4gICAgICAgICAgICAgICAgLnN0YXRlKCdhcHAnLCB7XG4gICAgICAgICAgICAgICAgICAgIHVybDogJy9hcHAnLFxuICAgICAgICAgICAgICAgICAgICBjYWNoZTogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIGFic3RyYWN0OiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3ZpZXdzL3NpZGVtZW51Lmh0bWwnLFxuICAgICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgICAgICAuc3RhdGUoJ2FwcC5idWlsZGluZ3MnLCB7XG4gICAgICAgICAgICAgICAgICAgIHVybDogJy9idWlsZGluZ3MnLFxuICAgICAgICAgICAgICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgICAgICAgICAgICAgJ21lbnVDb250ZW50Jzoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAndmlld3MvYnVpbGRpbmdzLmh0bWwnXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICAgICAgLnN0YXRlKCdhcHAuYnVpbGRpbmcnLCB7XG4gICAgICAgICAgICAgICAgICAgIHVybDogJy9idWlsZGluZ3MvOmJ1aWxkaW5nSWQnLFxuICAgICAgICAgICAgICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgICAgICAgICAgICAgJ21lbnVDb250ZW50Jzoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAndmlld3MvYnVpbGRpbmcuaHRtbCdcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgICAgICAuc3RhdGUoJ2FwcC5jaGFubmVsJywge1xuICAgICAgICAgICAgICAgICAgICB1cmw6ICcvY2hhbm5lbC86Y2hhbm5lbElkJyxcbiAgICAgICAgICAgICAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICdtZW51Q29udGVudCc6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3ZpZXdzL21lc3NhZ2VzL2NoYXQuaHRtbCdcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgICAgICAuc3RhdGUoJ2FwcC5wcm9maWxlJywge1xuICAgICAgICAgICAgICAgICAgICB1cmw6ICcvcHJvZmlsZScsXG4gICAgICAgICAgICAgICAgICAgIGNhY2hlOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICdtZW51Q29udGVudCc6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3ZpZXdzL3Byb2ZpbGUvcHJvZmlsZS5odG1sJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgICAgIC5zdGF0ZSgnYXBwLm1lc3NhZ2VzJywge1xuICAgICAgICAgICAgICAgICAgICB1cmw6ICcvbWVzc2FnZXMnLFxuICAgICAgICAgICAgICAgICAgICBjYWNoZTogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAnbWVudUNvbnRlbnQnOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICd2aWV3cy9tZXNzYWdlcy9tZXNzYWdlcy5odG1sJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSlcblxuXG4gICAgICAgICAgICAgICAgLnN0YXRlKCdhcHAubG9nb3V0Jywge1xuICAgICAgICAgICAgICAgICAgICB1cmw6IFwiL2xvZ2luXCIsXG4gICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlUHJvdmlkZXI6IGZ1bmN0aW9uIChhdXRoU2VydmljZSwgJHN0YXRlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhdXRoU2VydmljZS5sb2dvdXQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnbG9naW4nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLnN0YXRlKCdsb2dpbicsIHtcbiAgICAgICAgICAgICAgICAgICAgdXJsOiBcIi9sb2dpblwiLFxuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogXCJ2aWV3cy9hdXRoL2xvZ2luLmh0bWxcIlxuICAgICAgICAgICAgICAgIH0pO1xuXG5cbiAgICAgICAgICAgIC8vZmFsbGJhY2tcbiAgICAgICAgICAgICR1cmxSb3V0ZXJQcm92aWRlci5vdGhlcndpc2UoJy9sb2dpbicpO1xuXG4gICAgICAgIH0pO1xufSkoKTtcblxuXG5cblxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
