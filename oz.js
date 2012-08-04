/**
 * OzJS: microkernel for modular javascript 
 * compatible with CommonJS Asynchronous Modules
 * Copyright (C) 2010-1011, Dexter.Yy
 * Licensed under The MIT License
 * @example https://github.com/dexteryy/OzJS/tree/master/tests
 * vim:set ts=4 sw=4 sts=4 et:
 */ 
(function(undefined){

var window = this,
    _toString = Object.prototype.toString,
    _RE_PLUGIN = /(.*)!(.+)/,
    _RE_DEPS = /\Wrequire\((['"]).+?\1\)/g,
    _RE_SUFFIX = /\.\w+$/,
    _builtin_mods = { "require": 1, "exports": 1, "module": 1, "host": 1, "finish": 1 },

    _muid = 0,
    _config = {},
    _mods = {},
    _scripts = {},
    _waitings = {},
    _latestMod,

    forEach = Array.prototype.forEach || function(fn, sc){
        for(var i = 0, l = this.length; i < l; i++){
            if (i in this)
                fn.call(sc, this[i], i, this);
        }
    };

function isFunction(obj) {
    return _toString.call(obj) === "[object Function]";
}

function isWindow(obj) {
    return "setInterval" in obj;
}

function clone(obj) {
    function NewObj(){}
    NewObj.prototype = obj;
    return new NewObj();
}

/**
 * @public compare version number (Semantic Versioning format)
 * @param {string}
 * @param {string}
 * @return {boolean} v1 >= v2 == true
 */ 
function semver(v1, v2){
    v1 = v1.split('.');
    v2 = v2.split('.');
    var result, l = v1.length;
    if (v2.length > l)
        l = v2.length;
    for (var i = 0; i < l; i++) {
        result = (v1[i] || 0) - (v2[i] || 0);
        if (result === 0)
            continue;
        else
            break;
    }
    return result >= 0;
}

/**
 * @public define / register a module and its meta information
 * @param {string} module name. optional as unique module in a script file
 * @param {string[]} dependencies. optional
 * @param {function} module code, execute only once on the first call 
 */ 
function define(fullname, deps, block){
    if (!block) {
        if (deps) {
            block = deps;
        } else {
            block = fullname;
            fullname = "";
        }
        if (typeof fullname !== 'string') {
            deps = fullname;
            fullname = "";
        } else if (typeof block === 'string') {
            deps = [];
        } else if (!deps) {
            deps = seek(block);
        } else {
            deps = [];
        }
    }
    var name = fullname.split('@'),
        host = isWindow(this) ? this : window,
        ver = name[1];
    name = name[0];
    var mod = _mods[fullname] = {
        name: name,
        fullname: fullname,
        id: ++_muid,
        version: ver,
        host: host,
        deps: deps || []
    };
    if (fullname === "") { // capture anonymous module
        _latestMod = mod;
    }
    if (typeof block !== 'string') {
        mod.block = block;
        mod.loaded = 2;
    } else { // remote module
        mod.url = block;
    }
    if (mod.block && !isFunction(mod.block)) { // json module
        mod.exports = block;
    }
    if (name !== fullname) { // compare version number, link to the newest version
        var current = _mods[name];
        if (!current ||
                !current.block && (!current.url || current.loaded) ||
                current.version && semver(ver, current.version)) {
            _mods[name] = mod;
        }
    }
}

/**
 * @public run a code block its dependencies 
 * @param {string[]} [module fullname] dependencies
 * @param {function}
 */ 
function require(deps, block) {
    if (!block) {
        block = deps;
        deps = seek(block);
    }
    var m, remotes = 0, // counter for remote scripts
        host = isWindow(this) ? this : window,
        list = scan.call(host, deps);  // calculate dependencies, find all required modules
    for (var i = 0, l = list.length; i < l; i++) {
        m = list[i];
        if (m.url && m.loaded !== 2) { // remote module
            remotes++;
            m.loaded = 1; // status: loading
            fetch(m, function(){
                this.loaded = 2; // status: loaded 
                var lm = _latestMod;
                if (lm) { // capture anonymous module
                    lm.name = this.name;
                    lm.fullname = this.fullname;
                    lm.version = this.version;
                    _mods[lm.fullname] = lm;
                    if (_mods[lm.name] && _mods[lm.name].fullname === lm.fullname) {
                        _mods[lm.name] = lm;
                    }
                    _latestMod = null;
                }
                // loaded all modules, calculate dependencies all over again
                if (--remotes <= 0) {
                    require.call(host, deps, block);
                }
            });
        }
    }
    if (!remotes) {
        list.push({
            deps: deps,
            host: host,
            block: block
        });
        return exec(list.reverse());
    }
}

/**
 * @private execute modules in a sequence of dependency
 * @param {object[]} [module object]
 */ 
function exec(list){
    var mod, mid, tid, result, isAsync, 
        depObjs, exportObj,
        wt = _waitings;
    while (mod = list.pop()) {
        if (!mod.block || !mod.running && mod.exports !== undefined) {
            continue;
        }
        depObjs = [];
        exportObj = {}; // for "exports" module
        mod.deps[mod.block.hiddenDeps ? 'unshift' : 'push']("require", "exports", "module");
        for (var i = 0, l = mod.deps.length; i < l; i++) {
            mid = mod.deps[i];
            switch(mid) {
                case 'require':
                    depObjs.push(requireFn);
                    break;
                case 'exports':
                    depObjs.push(exportObj);
                    break;
                case 'module':
                    depObjs.push(mod);
                    break;
                case 'host':
                    depObjs.push(mod.host);
                    break;
                case 'finish':  // execute asynchronously
                    tid = mod.fullname;
                    if (!wt[tid]) // for delay execute
                        wt[tid] = [list];
                    else
                        wt[tid].push(list);
                    depObjs.push(function(result){
                        // HACK: no guarantee that this function will be invoked after while() loop termination in Chrome/Safari 
                        setTimeout(function(){
                            // 'mod' equal to 'list[list.length-1]'
                            if (result) {
                                mod.exports = result;
                            }
                            if (!wt[tid])
                                return;
                            forEach.call(wt[tid], function(list){
                                this(list);
                            }, exec);
                            delete wt[tid];
                            mod.running = 0;
                        }, 0);
                    });
                    isAsync = 1;
                    break;
                default:
                    depObjs.push((_mods[mid] || {}).exports);
                    break;
            }
        }
        if (!mod.running) {
            // execute module code. arguments: [dep1, dep2, ..., require, exports, module]
            result = mod.block.apply(oz, depObjs) || null;
            mod.exports = result || exportObj; // use empty exportObj for "finish"
            for (var v in exportObj) {
                if (v) {
                    mod.exports = exportObj;
                }
                break;
            }
            //console.log(mod.fullname, mod.exports)
        }
        if (isAsync) { // skip, wait for finish() 
            mod.running = 1;
            break;
        }
    }
}

/**
 * @private observer for script loader, prevent duplicate requests
 * @param {object} module object
 * @param {function} callback
 */ 
function fetch(m, cb){
    var url = m.url,
        observers = _scripts[url];
    if (!observers) {
        observers = _scripts[url] = [cb];
        getScript.call(m.host || this, url, function(){
            forEach.call(observers, function(ob){
                ob.call(this);
            }, m);
            _scripts[url] = 1;
        });
    } else if (observers === 1) {
        cb.call(m);
    } else {
        observers.push(cb);
    }
}

/**
 * @private search and sequence all dependencies, based on DFS
 * @param {string[]} a set of module names
 * @param {object[]} a sequence of modules, for recursion
 * @return {object[]} a sequence of modules
 */ 
function scan(m, list){
    list = list || [];
    if (!m[0]) {
        return list;
    }
    var history = list.history;
    if (!history)
        history = list.history = {};
    var deps, dep, mid, plugin, truename;
    if (m[1]) {
        deps = m;
        m = false;
    } else {
        mid = m[0];
        plugin = _RE_PLUGIN.exec(mid);
        if (plugin) {
            mid = plugin[2];
            plugin = plugin[1];
        }
        if (!_mods[mid] && !_builtin_mods[mid]) {
            var ver = m[0].split('@');
            if (_RE_SUFFIX.test(ver[0])) {
                ver = ver[1] ? ver[0].replace(_RE_SUFFIX, function($0){ return '-' + ver[1] + $0; }) : ver[0];
            } else {
                ver = (ver[1] ? (ver[0] + '-' + ver[1]) : ver[0]) + '.js';
            }
            define(m[0], (_config.baseUrl || '') + ver);
        }
        m = _mods[mid];
        if (m) {
            truename = m.fullname;
            if (plugin === "new") {
                mid = plugin + "!" + mid;
                m = _mods[mid] = clone(m);
                m.fullname = mid;
                m.exports = undefined;
                m.running = undefined;
                m.host = this;
            } else if (history[truename]) {
                return list;
            }
        } else {
            return list;
        }
        if (!history[truename]) {
            deps = m.deps || [];
            // find require information within the code
            // for server-side style module
            //deps = deps.concat(seek(m));
            history[truename] = true;
        } else {
            deps = [];
        }
    }
    for (var i = deps.length - 1; i >= 0; i--) {
        if (!history[deps[i]]) {
            scan.call(this, [deps[i]], list);
        }
    }
    if (m) {
        list.push(m);
    }
    return list;
}

/**
 * @experiment 
 * @private analyse module code 
 *          to find out dependencies which have no explicit declaration
 * @param {object} module object
 */ 
function seek(block){
    var hdeps = block.hiddenDeps || [];
    if (!block.hiddenDeps) {
        var code = block.toString(),
            h = null;
        hdeps = block.hiddenDeps = [];
        while (h = _RE_DEPS.exec(code)) {
            hdeps.push(h[0].slice(10, -2));
        }
    }
    return hdeps.slice();
}

/**
 * @private for "require" module
 */ 
function requireFn(name){
    return (_mods[name] || {}).exports;
}

/**
 * @public non-blocking script loader
 * @param {string}
 * @param {object} config
 */ 
function getScript(url, op){
    var doc = isWindow(this) ? this.document : document,
        s = doc.createElement("script");
    s.type = "text/javascript";
    s.async = "async"; //for firefox3.6
    if (!op)
        op = {};
    else if (isFunction(op))
        op = { callback: op };
    if (op.charset)
        s.charset = op.charset;
    s.src = url;
    var h = doc.getElementsByTagName("head")[0];
    s.onload = s.onreadystatechange = function(__, isAbort){
        if ( isAbort || !s.readyState || /loaded|complete/.test(s.readyState) ) {
            s.onload = s.onreadystatechange = null;
            if (h && s.parentNode) {
                h.removeChild(s);
            }
            s = undefined;
            if (!isAbort && op.callback) {
                op.callback();
            }
        }
    };
    h.insertBefore(s, h.firstChild);
}

require.config = function(opt){
    for (var i in opt) {
        _config[i] = opt[i];
    }
};

window.oz = {
    def: define,
    define: define,
    require: require,
    config: require.config,
    _semver: semver,
    _getScript: getScript,
    _clone: clone,
    _forEach: forEach,
    _isFunction: isFunction,
    _isWindow: isWindow
};
window.define = define;
window.require = require;

})();
