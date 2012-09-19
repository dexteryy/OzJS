/**
 * Copyright (C) 2011, Dexter.Yy, MIT License
 */
define('mod/uiproxy', ["lib/jquery", "mod/lang"], function($, _){

    var typeTable = {
        "NODENAME": "hasTag",
        ".": "hasClass",
        "#": "hasId",
        "@": "hasAttr"
    };

    function Proxy(proxyObj, opt){
        // 默认不包含hasAttr
        this._table = { hasClass: {}, hasId: {}, hasTag: {} };
        if (opt) {
            this.trace = opt.trace;
            this.traceStack = opt.traceStack || [];
        }
        if (proxyObj) {
            this.parseProxyObj(proxyObj);
        }
    }
    Proxy.prototype = {
        parseProxyObj: function(proxyObj){
            var checked = false, v;
            for (var n in proxyObj) {
                v  = proxyObj[n];
                if (!checked) { //检查代理对象格式
                    checked = true;
                    if (!_.isFunction(v)) {
                        //直接覆盖
                        _.mix(this._table, proxyObj);
                        break;
                    }
                }
                n.split(',').forEach(function(k){
                    this.matchEvent(k, v);
                }, this);
            }
            return this;
        },
        matchEvent: function(n, v){
            var name,
                table = this._table,
                prefix = n.match(/^[\.#]/);
            if (prefix) {
                prefix = prefix[0];
                name = n.substr(1);
                if ('.' == prefix)
                    name = name.split('.').join(' ');//TODO classNames顺序BUG
                else if ('@' == prefix && !table.hasAttr)
                    table.hasAttr = {};
            } else {
                prefix = "NODENAME";
                name = n;
            }
            if (v)
                table[typeTable[prefix]][name] = v;
            else if (v === false)
                delete table[typeTable[prefix]][name];
            else
                return table[typeTable[prefix]][name];
        },

        dispatchEvent: function(e){
            var t = e.target, table = this._table;
            var handler = table.hasId[t.id] || table.hasClass[t.className] || table.hasTag[t.nodeName.toLowerCase()] || null;
            if (!handler && table.hasAttr) {
                var a, value, attr;
                for (var n in table.hasAttr) {
                    a = n.split('=');
                    attr = $(t).attr(a[0]);
                    value = a[1];
                    if (value && attr == value || !value && attr)
                        handler = table.hasAttr[n];
                }
            }
            if (handler) {
                if (this.trace) {
                    this.traceStack.unshift('<' + t.nodeName + '#' + (t.id || '') + '>.' + (t.className || '').split(/\s+/).join('.'));
                    if (this.traceStack.length > this.trace) {
                        this.traceStack.pop();
                    }
                }
                return handler.call(t, e);
            } else {
                return 'NOMATCH';
            }
        },
        /**
         * @param {obj} 只允许传用选择器做键名的对象
         */ 
        bind: function(name, handler){
            var proxyObj = name;
            if (typeof name === 'string') {
                proxyObj = {};
                proxyObj[name] = handler;
            }
            return this.parseProxyObj(proxyObj);
        },
        /**
         * @param {string} name 选择器
         */ 
        unbind: function(name){
            if (name)
                this.matchEvent(name, false);
            else
                this._table = { hasClass: {}, hasId: {}, hasTag: {} };
            return this;
        }
    };
    
    function addProxy(box, event, proxyObj, opt) {
        var newproxy = new Proxy(proxyObj, opt);
        $(box).bind(event, handler);
        var unbind = newproxy.unbind;
        newproxy.unbind = function(name){
            if (!name)
                $(box).unbind(event, handler);
            unbind.call(newproxy, name);
        };
        return newproxy;
        function handler(e){
            var result = newproxy.dispatchEvent(e);
            if (result !== "NOMATCH") {
                if (opt && opt.defaultReturn) 
                    return result;
                else if (result === undefined)
                    e.preventDefault();
                else
                    return result || false;
            }
        }
    }

    return {
        proxyClass: Proxy,
        add: addProxy
    };
});

