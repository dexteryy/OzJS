/**
 * mini define/require mplementation for old web page
 * transformed AMD module into traditional module pattern
 * demo: 
 * see http://ozjs.org for details
 *
 * Copyright (C) 2010-2012, Dexter.Yy, MIT License
 * vim: et:ts=4:sw=4:sts=4
 */

// 这个define的实现会让amd模块声明变成传统的module pattern
function define(fullname, deps, block){
    if (!block) {
        if (deps) {
            block = deps;
        } else {
            block = fullname;
            fullname = [];
        }
        if (typeof fullname !== 'string') {
            deps = fullname;
            fullname = "";
        } else {
            deps = [];
        }
    }
    var callee = define,
        len = deps.length,
        exports = {},
        opt = callee._global_exports[fullname] || {},
        current_ns = callee._current_ns = opt.ns 
            || callee._current_ns || callee._ns || 'window';
    deps = ((/^function\s*\(([^\)]*)\)/
                .exec(block.toString()) || [])[1] || '')
                .replace(/\s+/g, '').split(',');
    deps.length = len;
    var args = deps.map(function(name){
        return (window[current_ns] || {})[name];
    });
    args.push(function(reqs, callback){
        if (callback) {
            require(reqs, callback);
        } else {
            return (callee._global_exports[reqs] || {}).exports;
        }
    });
    args.push(exports);
    exports = opt.exports = block.apply(this, args) || exports;
    if (opt.names) {
        opt.names.forEach(function(name){
            name = name.split('.');
            var context = window, i = name[0];
            if (name[1]) {
                context = context[i] = context[i] || {};
                i = name[1];
            }
            context[i] = exports;
        });
    }
    callee._current_ns = null;
}

// require的实现跟define一样，不过是异步的
function require(reqs){
    if (typeof reqs === 'string') {
        reqs = [reqs];
    }
    var args = arguments;
    setTimeout(function(){
        define.apply(this, args);
    }, 0);
}

define._global_exports = {};

// 为模块设置命名空间，既可以避免产生全局变量，
// 也可以隔离不同体系的模块（比如'mod/event'和'jquery/event'），避免命名冲突
define.ns = function(mid, namespace){
    if (!namespace) {
        this._ns = mid;
    } else {
        var opt = this._global_exports;
        if (!opt[mid]) {
            opt[mid] = { 
                names: [] 
            };
        }
        opt[mid].ns = namespace;
    }
};

// 将模块的exports映射到全局命名空间下，让没有封装到amd模块里的代码也可以使用
define.config = function(mid, vars){
    if (typeof mid === 'object') {
        for (var i in mid) {
            this.config(i, mid[i]);
        }
        return;
    }
    var opt = this._global_exports;
    if (!opt[mid]) {
        opt[mid] = {
            ns: this._ns,
            names: []
        };
    }
    if (typeof vars === 'string') {
        vars = [vars];
    }
    [].push.apply(opt[mid].names, vars);
};

require.config = function(){};
