/*!
 * OzJS 
 * The easy way to write modular javascript, fix the biggest weakness of javascript
 * Asynchronous Module implementation, compatible with CommonJS
 * (c) 2010 Dexter.Yy (dexter.yy at gmail.com)
 * Licensed under The MIT License
 */

/**
 * @example https://github.com/dexteryy/OzJS/tree/master/tests
 * vim:set ts=4 sw=4 sts=4 et:
 */ 

(function(undefined){

var window = this,
    uuid = 0,

    toString = Object.prototype.toString,
    typeMap = {},
    depRxp = /\Wrequire\(".+?"\)/g,

    _mods = {},
    _scripts = {},
    _waitings = {},
    _latestMod;

function type(obj) {
    return obj == null ?
        String(obj) :
        typeMap[ toString.call(obj) ] || "object";
}

function isFunction(obj) {
    return type(obj) === "function";
}

/**
 * @public mix multiple objects
 * @param {object}
 * @param {object}
 * @param {object}
 * ...
 */ 
function mix(target) {
    var objs = arguments, l = objs.length, o, copy;
    if (l == 1) {
        objs[1] = target;
        l = 2;
        target = this;
    }
    for (var i = 1; i < l; i++) {
        o = objs[i];
        for (var n in o) {
            copy = o[n];
            if (copy != null)
                target[n] = copy;
        }
    }
    return target;
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
        if (result == 0)
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
            if (typeof fullname !== 'string') {
                fullname = "";
            }
        }
        if (typeof fullname === 'string') {
            deps = [];
        } else {
            deps = fullname;
            fullname = "";
        }
    }
    var name = fullname.split('/'),
        ver = name[1];
    name = name[0];
    var mod = _mods[fullname] = {
        name: name,
        fullname: fullname,
        id: ++uuid,
        version: ver,
        deps: deps || []
    };
    if (fullname === "") { // capture anonymous module
        _latestMod = mod;
    }
    if (typeof block !== 'string') {
        mod.block = block;
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
 * @param {function} for custom execute
 */ 
function require(deps, block, handler) {
    var m, remotes = 0, // counter for remote scripts
        list = scan(deps);  // calculate dependencies, find all required modules
    for (var i = 0, l = list.length; i < l; i++) {
        m = list[i];
        if (m.url && m.loaded !== 2) { // remote module
            remotes++;
            m.loaded = 1; // status: loading
            fetch(m, function(){
                this.loaded = 2; // status: loaded 
                if (_latestMod) { // capture anonymous module
                    // use script URL as module name
                    _latestMod.name = _latestMod.fullname = this.url;
                    _mods[this.url] = _latestMod;
                    _latestMod = null;
                }
                // loaded all modules, calculate dependencies all over again
                if (--remotes <= 0) {
                    require(deps, block, handler);
                }
            });
        }
    }
    if (!remotes) {
        list.push({
            deps: deps,
            block: block
        });
        return (handler || exec)(list.reverse());
    }
}

/**
 * @public Wrappings style API
 * @param {function}
 */ 
function declare(block){
    var deps = seek({
        block: block
    });
    return require(deps, block, function(list){
        list[0].deps = []; // remove arguments
        exec(list);
    });
}

/**
 * @private execute modules in a sequence of dependency
 * @param {object[]} [module object]
 */ 
function exec(list){
    var mod, mid, tid, result, isAsync, depObjs, exportObj, wt = _waitings;
    while (mod = list.pop()) {
        if (!mod.block || !mod.running && mod.exports !== undefined) {
            continue;
        }
        depObjs = [];
        exportObj = {}; // for "exports" module
        //console.warn(mod.fullname, mod.deps)
        mod.deps.push("require", "exports", "module"); // default arguments
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
                case 'finish':  // execute asynchronously
                    tid = mod.fullname;
                    if (!wt[tid]) // for delay execute
                        wt[tid] = [list];
                    else
                        wt[tid].push(list);
                    depObjs.push(function(){
                        if (!wt[tid])
                            return;
                        wt[tid].forEach(function(list){
                            this(list);
                        }, exec);
                        delete wt[tid];
                        mod.running = 0;
                    });
                    isAsync = 1;
                    break;
                default:
                    depObjs.push((_mods[mid] || {}).exports);
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
        getScript(url, function(){
            observers.forEach(function(ob){
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
    var history = list.history;
    if (!history)
        history = list.history = {};
    var deps, dep;
    if (m[1]) {
        deps = m;
        m = false;
    } else {
        m = _mods[m[0]];
        if (!m)
            return list;
        deps = m.deps || [];
        // find require information within the code
        // for server-side style module
        deps = deps.concat(seek(m));
        history[m.fullname] = true;
    }
    for (var i = deps.length - 1; i >= 0; i--) {
        dep = _mods[deps[i]];
        if (dep && !history[dep.fullname])
            scan([dep.fullname], list);
    }
    if (m) {
        list.push(m);
    }
    return list;
}

/**
 * @private analyse module code 
 *          to find out dependencies which have no explicit declaration
 * @param {object} module object
 */ 
function seek(m){
    var hdeps = m.hiddenDeps || [];
    if (!m.hiddenDeps && isFunction(m.block)) {
        var code = m.block.toString(),
            h = null;
        hdeps = m.hiddenDeps = [];
        while (h = depRxp.exec(code)) {
            hdeps.push(h[0].slice(10, -2));
        }
    }
    return hdeps;
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
    var s = document.createElement("script");
    s.type = "text/javascript";
    s.async = true; //for firefox3.6
    if (!op)
        op = {};
    else if (isFunction(op))
        op = { callback: op };
    if (op.charset)
        s.charset = op.charset;
    s.src = url;
    h = document.getElementsByTagName("head")[0];
    var done = false;
    s.onload = s.onreadystatechange = function(){
        if ( !done && (!this.readyState || this.readyState == "loaded" || this.readyState == "complete") ) {
            done = true;
            s.onload = s.onreadystatechange = null;
            h.removeChild(s);
            if (op.callback)
                op.callback();
        }
    };
    h.appendChild(s);
}


// fix ES5 compatibility
var _aproto = Array.prototype;
if (!_aproto.forEach) 
    _aproto.forEach = function(fn, sc){
        for(var i = 0, l = this.length; i < l; i++){
            if (i in this)
                fn.call(sc, this[i], i, this);
        }
    };

if (!Array.isArray)
    Array.isArray = function(obj) {
        return type(obj) === "array";
    };


"Boolean Number String Function Array Date RegExp Object".split(" ").forEach(function(name , i){
    typeMap[ "[object " + name + "]" ] = name.toLowerCase();
}, typeMap);


window.oz = {
    def: define,
    require: require,
    declare: declare,
    mix: mix,
    semver: semver,
    getScript: getScript,
    type: type,
    isFunction: isFunction
};

})();

