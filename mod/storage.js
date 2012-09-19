/**
 * Copyright (C) 2011, Dexter.Yy, MIT License
 */
define("mod/storageclass", ["lib/jquery", "mod/event", "mod/lang"], function($, Event, _){

    var fnQueue = _.fnQueue;
    /**
     * @private 根据浏览器生成相应的存取方法
     */ 
    function setOperator(self){
        var win = self.win,
            doc = self.doc = win.document.documentElement;
        if (win.localStorage) { //firefox3.5, ie8, safari4
            self.setItem = function(n, v){
                win.localStorage.setItem(n, v);
            };
            self.getItem = function(n){
                return win.localStorage.getItem(n);
            };
            self.removeItem = function(n){
                win.localStorage.removeItem(n);
            };
        } else if (win.globalStorage) { //firefox2
            self.setItem = function(n, v){
                win.globalStorage[win.document.domain].setItem(n, v);
            };
            self.getItem = function(n){
                return (win.globalStorage[win.document.domain].getItem(n) || {}).value;
            };
            self.removeItem = function(n){
                win.globalStorage[win.document.domain].removeItem(n);
            };
        } else if (win.ActiveXObject) { //ie5.0+
            doc.addBehavior("#default#userdata");
            self.setItem = function(n, v){
                doc.setAttribute("tui", v);
                doc.save(n);
            };
            self.getItem = function(n){
                try {
                    doc.load(n);
                    return doc.getAttribute("tui");
                } catch (ex) {
                    return null;
                }
            };
            self.removeItem = function(n){
                try {
                    doc.load(n);
                    doc.expires = (new Date(315532799000)).toUTCString();
                    doc.save(n);
                } catch (ex) {}
            };
        }
        if (win !== window) {  // 跨域时getItem返回带ready方法的对象
            self.originGetItem = self.getItem;
            self.getItem = function(n){
                return {
                    ready: function(fn){
                        var _self = self;
                        fn.call(_self, _self.originGetItem.call(_self, n)); 
                    }
                };
            };
        }
    }

    /**
     * @private  生成装饰器，在跨域的情况下，把存取操作都延迟执行，等待iframe加载完
     */ 
    function getWrap(methodname){
        return function(){ // this指向storageClass
            var self = this, args = arguments;
            function fn(){
                self[methodname].apply(self, args);
            }
            self.cache.push(fn);
        };
    }

    /**
     * @private 已加载完成的iframe
     */ 
    var load_history = {};

    var remotes = Event();

    var cache = {};

    /**
     * @static
     * @public 路径别名
     */ 
    var alias = {
        'global': '/'   // 默认的跨域存储路径
    };

    function storageClass(opt){
        var self = this;

        if (!opt || !opt.path) {
            self.win = window;
            self.path = 'default';
            setOperator(self);
        } else {
            if (!/^(\/|http)/.test(opt.path))
                opt.path = alias[opt.path];

            var path = self.path = opt.path;
            if (!cache[path]) {
                cache[path] = fnQueue();
            }

            if (!load_history[path]) {
                load_history[path] = true;
                $(function(){
                    $('<iframe width="0" height="0" frameborder="0" src="' 
                        + path + '" style="visibility:hidden; position: absolute"></iframe>')
                        .load(function(){
                            remotes.resolve(path, [this]);
                            cache[path].call(self); // 执行延迟的存取操作
                        })
                        .appendTo("body");
                });
            }

            remotes.bind(path, function(myloader){
                self.win = myloader.contentWindow;
                setOperator(self);
            });
        }
    }

    storageClass.prototype = {
        /**
         * @public 存数据
         * @params {string} n 键名
         * @params {*} v 值
         */ 
        setItem: getWrap('setItem'),
        /**
         * @public 获取数据
         * @params {string} n 键名
         * @return {string|object} 跨域的时候返回带有ready方法的对象
         */ 
        getItem: function(n){
            var self = this;
            return {
                ready: function(fn){
                    if (self.originGetItem) {
                        fn.call(self, self.originGetItem.call(self, n));    
                    } else {
                        var newfn = function(){
                            var _self = self;
                            fn.call(_self, _self.originGetItem.call(_self, n)); 
                        };
                        cache[self.path].push(newfn);
                    }
                }
            };
        },
        /**
         * @public 删除数据
         * @params {string} n 键名
         */ 
        removeItem: getWrap('removeItem')
    };

    storageClass.alias = alias;

    return storageClass;

});


/**
 * @public 访问存储类的接口
 * @params {string} n 键名@域名路径
 * @params {*} v 值
 * @return {string|object|undefined} 除取值外没有访问值
 */ 
define("storage", ["storageClass"], function(storageClass){
    var db = {
        'default': new storageClass()
    };

    return function(n, v){
        var mydb,
            m = n.split('@'),
            url = m[1];
        n = m[0];
        if (!url) {               // 当前域名和路径下的存取
            mydb = db['default'];
        } else {                  // 跨域存取
            mydb = db[url];
            if (!mydb)
                mydb = db[url] = new storageClass({ path: url });
        }
        if (typeof v === "undefined")
            return mydb.getItem(n);
        else if (v === false)
            mydb.removeItem(n);
        else
            mydb.setItem(n, v);
    };
});
