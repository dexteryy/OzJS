/**
 * Copyright (C) 2011, Dexter.Yy, MIT License
 *
 * @import lib/oz.js
 * @import mod/lang.js
 */
oz.def("event", ["lang"], function(_){

    var fnQueue = _.fnQueue,
        slice = Array.prototype.slice;

    function Promise(opt){
        if (opt) {
            this.subject = opt.subject;
        }
        this.doneHandlers = fnQueue();
        this.failHandlers = fnQueue();
        this.observeHandlers = fnQueue();
        this.spareQueue = fnQueue();
        this.status = 0;
        this.argsCache = [];
    }

    var actors = Promise.prototype = {

        then: function(handler, errorHandler){
            if (handler) {
                if (this.status === 1) {
                    handler.apply(this, this.argsCache);
                } else {
                    this.doneHandlers.push(handler);
                }
            }
            if (errorHandler) {
                if (this.status === 2) {
                    errorHandler.apply(this, this.argsCache);
                } else {
                    this.failHandlers.push(errorHandler);
                }
            }
            return this;
        },

        done: function(handler){
            return this.then(handler);
        },

        fail: function(handler){
            return this.then(false, handler);
        },

        bind: function(handler){
            if (this.status) {
                handler.apply(this, this.argsCache);
            }
            this.observeHandlers.push(handler);
            return this;
        },

        unbind: function(handler){
            this.observeHandlers.clear(handler);
            return this;            
        },

        fire: function(params){
            this.observeHandlers.apply(this, params);
            var onceHandlers = this.doneHandlers;
            this.doneHandlers = this.spareQueue;
            onceHandlers.apply(this, params);
            onceHandlers.length = 0;
            this.spareQueue = onceHandlers;
            return this;
        },

        error: function(params){
            this.observeHandlers.apply(this, params);
            var onceHandlers = this.failHandlers;
            this.failHandlers = this.spareQueue;
            onceHandlers.apply(this, params); 
            onceHandlers.length = 0;
            this.spareQueue = onceHandlers;
            return this;
        },

        resolve: function(params){
            this.status = 1;
            this.argsCache = params;
            return this.fire(params);
        },

        reject: function(params){
            this.status = 2;
            this.argsCache = params;
            return this.error(params);
        },

        reset: function(){
            this.status = 0;
            this.argsCache = [];
            this.doneHandlers.length = 0;
            this.failHandlers.length = 0;
            return this;
        },

        all: function(){
            this._count = this._total;
            return this;
        },

        any: function(){
            this._count = 1;
            return this;
        },

        some: function(n){
            this._count = n;
            return this;
        }

    };

    actors.wait = actors.then;

    function when(n){
        var mutiArgs = [],
            mutiPromise = new Promise();
        mutiPromise._count = mutiPromise._total = arguments.length;
        Array.prototype.forEach.call(arguments, function(promise, i){
            var mutiPromise = this;
            promise.then(callback, callback);
            function callback(params){
                mutiArgs[i] = params;
                if (--mutiPromise._count === 0) {
                    mutiPromise.resolve.call(mutiPromise, mutiArgs);
                }
            }
        }, mutiPromise);
        return mutiPromise;
    }

    function dispatchFactory(i){
        return function(subject){
            var promise = this.lib[subject];
            if (!promise) {
                promise = this.lib[subject] = new Promise({ subject: subject });
            }
            promise[i].apply(promise, slice.call(arguments, 1));
            return this;
        };
    }

    function Event(){
        this.lib = {};
    }

    Event.prototype = (function(methods){
        for (var i in actors) {
            methods[i] = dispatchFactory(i);
        }
        return methods;
    })({});

    Event.prototype.promise = function(subject){
        var promise = this.lib[subject];
        if (!promise) {
            promise = this.lib[subject] = new Promise({ subject: subject });
        }
        return promise;
    };

    Event.prototype.when = function(){
        var args = [];
        for (var i = 0, l = arguments.length; i < l; i++) {
            args.push(this.promise(arguments[i]));
        }
        return when.apply(this, args);
    };

    function exports(){
        return new Event();
    }

    exports.Promise = Promise;
    exports.when = when;

    return exports;
});
