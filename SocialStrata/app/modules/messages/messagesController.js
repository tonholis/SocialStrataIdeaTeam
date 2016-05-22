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




