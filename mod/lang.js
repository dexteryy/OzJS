/**
 * Copyright (C) 2011, Dexter.Yy, MIT License
 */
define("mod/lang", ["host"], function(host, require, exports){

    var oz = this,
        Array = host.Array,
        String = host.String,
        Object = host.Object,
        Function = host.Function,
        window = host.window,
        _toString = Object.prototype.toString,
        _aproto = Array.prototype;

    if (!_aproto.filter) {
        _aproto.filter = function(fn, sc){
            var r = [];
            for (var i = 0, l = this.length; i < l; i++){
                if( (i in this) && fn.call(sc, this[i], i, this) )
                    r.push(this[i]);
            }
            return r;
        };
    }
        
    if (!_aproto.forEach) {
        _aproto.forEach = oz._forEach;
    }

    if (!_aproto.map) {
        _aproto.map = function(fn, sc){
            for (var i = 0, copy = [], l = this.length; i < l; i++){
                if (i in this)
                    copy[i] = fn.call(sc, this[i], i, this);
            }
            return copy;
        };
    }

    if (!_aproto.reduce) {
        _aproto.reduce = function(fn, sc){
            for (var i = 1, prev = this[0], l = this.length; i < l; i++){
                if (i in this) {
                    prev = fn.call(sc, prev, this[i], i, this);
                }
            }
            return prev;
        };
    }

    if (!_aproto.indexOf) {
        _aproto.indexOf = function(elt, from){
            var l = this.length;
            from = parseInt(from, 10) || 0;
            if (from < 0)
                from += l;
            for (; from < l; from++) {
                if (from in this && this[from] === elt)
                    return from;
            }
            return -1;
        };
    }

    if (!_aproto.lastIndexOf) {
        _aproto.lastIndexOf = function(elt, from){
            var l = this.length;
            from = parseInt(from, 10) || l - 1;
            if (from < 0)
                from += l;
            for (; from > -1; from--) {
                if (from in this && this[from] === elt)
                    return from;
            }
            return -1;
        };
    }

    if (!Array.isArray) {
        Array.isArray = function(obj) {
            return exports.type(obj) === "array";
        };
    }

    var rnotwhite = /\S/,
        trimLeft = /^\s+/,
        trimRight = /\s+$/;
    if (rnotwhite.test( "\xA0")) {
        trimLeft = /^[\s\xA0]+/;
        trimRight = /[\s\xA0]+$/;
    }
    if (!String.prototype.trim) {
        String.prototype.trim = function(text) {
            return text == null ?  "" : text.toString().replace(trimLeft, "").replace(trimRight, "");
        };
    }

    if (!Object.keys) {
        Object.keys = function(obj) {
            var keys = [];
            for (var prop in obj) {
                if ( obj.hasOwnProperty(prop) ) {
                    keys.push(prop);
                }
            }
            return keys;
        };
    }

    if (!Object.create) {
        Object.create = oz._clone;
    }

    if (!Object.getPrototypeOf) {
        Object.getPrototypeOf = function (obj) {
            return obj.__proto__ || obj.constructor.prototype;
        };
    }
    

    if (!Function.prototype.bind) {
        Function.prototype.bind = function (oThis) {
            if (typeof this !== "function")
                throw new TypeError("Function.prototype.bind - what is trying to be fBound is not callable");
            var aArgs = Array.prototype.slice.call(arguments, 1), 
                fToBind = this, 
                fBound = function () {
                    return fToBind.apply(this instanceof fBound ? this : oThis || window, 
                        aArgs.concat(Array.prototype.slice.call(arguments)));    
                };
            fBound.prototype = Object.create(this.prototype);
            return fBound;
        };
    }
    

    exports.fnQueue = function(){
        var queue = [], dup = false;
        
        function getCallMethod(type){
            return function(){
                var re, fn;
                for (var i = 0, l = this.length; i < l; i++) {
                    fn = this[i];
                    if (fn) {
                        re = fn[type].apply(fn, arguments);
                    } else {
                        break;
                    }
                }
                return re;
            };
        }

        mix(queue, {
            call: getCallMethod('call'),
            apply: getCallMethod('apply'),
            clear: function(func){
                if (!func) {
                    this.length = 0;
                } else {
                    var size = this.length,
                        popsize = size - dup.length;
                    for (var i = this.length - 1; i >= 0; i--) {
                        if (this[i] === func) {
                            this.splice(i, 1);
                            if (dup && i >= popsize)
                                dup.splice(size - i - 1, 1);
                        }
                    }
                    if (i < 0)
                        return false;
                }
                return true;
            }
        });

        return queue;
    };


    exports.ns = function(namespace, v, parent){
        var i, p = parent || window, n = namespace.split(".").reverse();
        while ((i = n.pop()) && n.length > 0) {
            if (typeof p[i] === 'undefined') {
                p[i] = {};
            } else if (typeof p[i] !== "object") {
                return false;
            }
            p = p[i];
        }
        if (typeof v !== 'undefined')
            p[i] = v;
        return p[i];
    };

    /**
     * @public mix multiple objects
     * @param {object}
     * @param {object}
     * @param {object}
     * ...
     */ 
    var mix = exports.mix = function(target) {
        var objs = arguments, l = objs.length, o;
        if (l == 1) {
            objs[1] = target;
            l = 2;
            target = this;
        }
        for (var i = 1; i < l; i++) {
            o = objs[i];
            for (var n in o) {
                target[n] = o[n];
            }
        }
        return target;
    };

    exports.config = function(cfg, opt, default_cfg){
        for (var i in default_cfg) {
            if (opt.hasOwnProperty(i)) {
                cfg[i] = opt[i];
            } else if (typeof cfg[i] === 'undefined') {
                cfg[i] = default_cfg[i];
            }
        }
        return cfg;
    };

    exports.occupy = function(target, obj){
        for (var i in target) {
            if (obj[i] === undefined) {
                delete target[i];
            }
        }
        return mix(target, obj);
    };

    var _typeMap = {};
    _aproto.forEach.call("Boolean Number String Function Array Date RegExp Object".split(" "), function(name , i){
        this[ "[object " + name + "]" ] = name.toLowerCase();
    }, _typeMap);

    function type(obj) {
        return obj == null ?
            String(obj) :
            _typeMap[ _toString.call(obj) ] || "object";
    }

    exports.type = type;

    exports.isFunction = oz._isFunction;

    exports.isWindow = oz._isWindow;

    exports.semver = oz._semver;


    /**
     * @public 去掉数组里重复成员
     * @note 支持所有成员类型，包括dom，对象，数组，布尔，null等
     * @testcase var b=[1,3,5];unique([1,3,4,5,null,false,$(".pack")[0],b,"ab","cc",[1,3],3,6,b,1,false,null,"null","","false","",$(".pack")[0],"cc"]);
     */
    exports.unique = function(array) {
        var i, l, ret = [], record = {}, objs = [], uniq_id = 1, it, tmp;
        var type = {
            "number": function(n){ return "__oz_num" + n; },
            "string": function(n){ return n; },
            "boolean": function(n){ return "__oz" + n; },
            "object": function(n){ 
                if (n === null) {
                    return "__oz_null";
                }
                if (!n.__oz_unique_flag) {
                    n.__oz_unique_flag = ++uniq_id;
                    objs.push(n);
                }
                return n.__oz_unique_flag;
            },
            "undefined": function(n){ return "__oz_undefined"; }
        };
        for (i = 0, l = array.length; i < l; i++) {
            it = tmp = array[i];
            tmp = type[typeof it](it);
            if (!record[tmp]) {
                ret.push(it);
                record[tmp] = true;
            }
        }
        for (i = 0, l = objs.length; i < l; i++) {
            delete objs[0].__oz_unique_flag;
        }
        return ret;
    };


});
