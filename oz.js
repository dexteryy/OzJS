/**
 * OzJS: Asynchronous Modules define and require
 * (c) 2010 Dexter.Yy
 * Licensed under The MIT License
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
        id: ++uuid,
        version: ver,
        deps: deps || []
    };
    if (fullname === "") {
        _latestMod = mod;
    }
    if (typeof block !== 'string') {
        mod.block = block;
    } else {
        mod.url = block;
    }
    if (mod.block && !isFunction(mod.block)) {
        mod.exports = block;
    }
    if (name !== fullname) {
        var current = _mods[name];
        if (!current ||
                !current.block && (!current.url || current.loaded) ||
                current.version && semver(ver, current.version)) {
            _mods[name] = mod;
        }
    }
}

function require(deps, block) {
    var m, remotes = 0, list = scan(deps);
    for (var i = 0, l = list.length; i < l; i++) {
        m = list[i];
        if (m.url && m.loaded !== 2) {
            remotes++;
            m.loaded = 1;
            fetch(m, function(){
                this.loaded = 2;
                if (_latestMod) {
                    _latestMod.name = this.url;
                    _mods[this.url] = _latestMod;
                    _latestMod = null;
                }
                if (--remotes <= 0) {
                    require(deps, block);
                }
            });
        }
    }
    if (!remotes) {
        list.push({
            deps: deps,
            block: block
        });
        exec(list.reverse());
    }
}

function exec(list){
    var mod, mid, tid, result, isAsync, depObjs, exportObj, wt = _waitings;
    while (mod = list.pop()) {
        if (!mod.block || !mod.running && mod.exports !== undefined) {
            continue;
        }
        depObjs = [];
        exportObj = {};
        mod.deps.push("require", "exports", "module");
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
                case 'finish':
                    tid = mod.name;
                    if (!wt[tid])
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
            result = mod.block.apply(oz, depObjs) || null;
            mod.exports = result;
            for (var i in exportObj) {
                if (i) {
                    mod.exports = exportObj;
                }
                break;
            }
            //console.info(mod)
        }
        if (isAsync) {
            mod.running = 1;
            break;
        }
    }
}

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

function scan(m, list){
    list = list || [];
    var history = list.history;
    if (!history)
        history = list.history = {};
    if (typeof m === 'string') {
        m = [m];
    }
    var deps, dep, hdeps;
    if (m[1]) {
        deps = m;
        m = false;
    } else {
        m = _mods[m[0]];
        if (!m)
            return list;
        deps = m.deps || [];
        hdeps = m.hiddenDeps || [];
        if (!m.hiddenDeps && isFunction(m.block)) {
            var code = m.block.toString(),
                h = null;
            hdeps = m.hiddenDeps = [];
            while (h = depRxp.exec(code)) {
                hdeps.push(h[0].slice(10, -2));
            }
        }
        deps = deps.concat(hdeps);
        //console.info(deps, m.deps)
        history[m.name] = true;
    }
    for (var i = deps.length - 1; i >= 0; i--) {
        dep = _mods[deps[i]];
        if (dep && !history[dep.name])
            scan(dep.name, list);
    }
    if (m) {
        list.push(m);
    }
    return list;
}

function requireFn(name){
    return (_mods[name] || {}).exports;
}

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
            //防止ie内存泄漏
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
    mix: mix,
    semver: semver,
    getScript: getScript,
    type: type,
    isFunction: isFunction
};

})();


