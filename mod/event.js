/**
 * @author Dexter.Yy (dexter.yy at gmail.com)
 */
oz.def("event", function(require){
    var fnQueue = require("lang").fnQueue;

    function Event(){
        this.queue = {};
        this.status = {};
        this.evObjCache = {};
    }
    Event.prototype = {
        alone: function(type){
            var cache = this.evObjCache[type];
            if (cache)
                return cache;
            var self = this, newEv = {},
                override = { 'bind': 1, 'unbind': 1, 'fire': 1, 'enable': 1, 'disable': 1, 'wait': 1 };
            for (var i in self) {
                if (override[i]) {
                    newEv[i] = (function(origin){
                        return function(){
                            return origin.apply(self, [].concat.apply([type], arguments));
                        };
                    })(self[i]);
                }
            }
            return this.evObjCache[type] = newEv;
        },
        bind: function(type, handler){
            if (typeof type !== 'string') {
                var bind = arguments.callee;
                for (var p in type) {
                    bind(p, type[p]);
                }
                return this;
            }
            var data = this.queue,
                status = this.status[type];
            if (!data[type])
                data[type] = fnQueue();
            if (status)
                handler.apply(this, status);
            data[type].push(handler);
            return this;
        },
        unbind: function(type, handler){
            var data = this.queue;
            if(data[type]) 
                data[type].clear(handler);
            return this;            
        },
        fire: function(type, params){
            var data = this.queue;
            if (data[type])
                data[type].apply(this, params || []);
            return this;
        },
        enable: function(type, params){
            var data = this.queue,
                args = params || [];
            this.status[type] = args;
            // ie bug，下面的循环执行不是阻塞的，可能会被插入其他异步回调
            // 所以必须在这之前先更新状态
            if (data[type]) {
                data[type].apply(this, args);
            }
            return this;
        },
        disable: function(type){
            delete this.status[type];
            return this;
        },
        wait: function(type, fn){
            var self = this;
            this.bind(type, function(){
                self.unbind(type, arguments.callee);
                fn.apply(self, arguments);
            });
            return this;
        }
    };

    return function(){
        return new Event();
    }
});
