/**
 * OzJS: Asynchronous Modules define and require
 * (c) 2010 Dexter.Yy
 * Licensed under The MIT License
 */ 
(function(){

var window = this,
	uuid = 0,

	toString = Object.prototype.toString,

	typeMap = {},
	_mods = {},
	_exportsObj = {},
	_latestMod;

var oz = {
	def: define,
	require: require,

	mix: function(target) {
		var objs = arguments, l = objs.length, o, copy;
		if (l == 1) {
			objs[1] = target;
			l = 2;
			target = oz;
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
	},

	isNewer: function(v1, v2){
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
};

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
	if (mod.block && !oz.isFunction(mod.block)) {
		mod.exports = block;
	}
	if (name !== fullname) {
		var current = _mods[name];
		if (!current ||
				!current.block && (!current.url || current.loaded) ||
				current.version && oz.isNewer(ver, current.version)) {
			_mods[name] = mod;
		}
	}
}

function require(deps, block) {
	var list = scanModule(deps);
	var m, remotes = 0;
	for (var i = 0, l = list.length; i < l; i++) {
		m = list[i];
		if (m.url && m.loaded !== 2) {
			remotes++;
			m.loaded = 1;
			loadModule(m, complete);
		}
	}

	if (!remotes) {
		var mod, eObj = _exportsObj, mix = oz.mix;
		list.push({
			deps: deps,
			block: block
		});
		for (i = 0, l = list.length; i < l; i++) {
			mod = list[i];
			if (mod.exports || !mod.block) {
				continue;
			}
			for (var prop in eObj) {
				delete eObj[prop];
			}
			depObjs = [];
			for (var j = 0, k = mod.deps.length; j < k; j++) {
				depObjs.push((_mods[mod.deps[j]] || {}).exports);
			}
			mod.exports = mod.block.apply(mod, depObjs);
			if (!mod.exports && Object.keys(eObj).length) {
				mod.exports = mix({}, eObj);
			}
		}

		//console.info('list', list);
		//console.info('_mods', _mods);
	}
	function complete(){
		this.loaded = 2;
		if (_latestMod) {
			_latestMod.name = this.url;
			_mods[this.url] = _latestMod;
			_latestMod = null;
		}
		if (--remotes <= 0) {
			require(deps, block);
		}
	}
}

function loadModule(m, cb){
	var observers = m.onload;
	if (!observers) {
		observers = m.onload = [cb];
		oz.getScript(m.url, function(){
			for (var i = 0, l = observers.length; i < l; i++) {
				observers[i].call(m);
			}
			delete m.onload;
		});
	} else {
		observers.push(cb);
	}
}

function scanModule(m, list){
	list = list || [];
	var history = list.history;
	if (!history)
		history = list.history = {};
	if (typeof m === 'string') {
		m = [m];
	}
	var deps, dep;
	if (m[1]) {
		deps = m;
		m = false;
	} else {
		m = _mods[m[0]];
		if (!m)
			return list;
		deps = m.deps || [];
		history[m.name] = true;
	}
	for (var i = deps.length - 1; i >= 0; i--) {
		dep = _mods[deps[i]];
		if (dep && !history[dep.name])
			scanModule(dep.name, list);
	}
	if (m) {
		list.push(m);
	}
	return list;
}



// fix ES5 compatibility
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

"Boolean Number String Function Array Date RegExp Object".split(" ").forEach(function(name , i){
	typeMap[ "[object " + name + "]" ] = name.toLowerCase();
}, typeMap);

oz.mix({
	type: function(obj) {
		return obj == null ?
			String(obj) :
			typeMap[ toString.call(obj) ] || "object";
	},

	isFunction: function(obj) {
		return oz.type(obj) === "function";
	},

	isArray: Array.isArray || function(obj) {
		return oz.type(obj) === "array";
	}
});


oz.def('require', function(){
	var mods = _mods;
	return function(fullname){
		return (mods[fullname] || {}).exports;
	};
});

oz.def('exports', function(){
	return _exportsObj;
});


oz.getScript = function(url, op){
	var s = document.createElement("script");
	s.type = "text/javascript";
	s.async = true; //for firefox3.6
	if (!op)
		op = {};
	else if (oz.isFunction(op))
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
};


// for nodejs
if (typeof process !== 'undefined') {
    var fs = require("fs");
	loadModule = function(m, cb){
		setTimeout(function(){
			var url = m.url.replace(/^server!/, ''),
				filename = url.replace(/.+\//, ''),
				content = fs.readFileSync(url);
			if (url !== m.url) {
				process.compile('oz.def("'
					+ filename.replace(/\.\w+$/, '')
							.replace(/-([\d\.]+)$/, '\/$1')
					+ '", ["require", "exports"],'
					+ ' function(require, exports){' + content + '});',
				filename);
			} else {
				process.compile(content, filename);
			}
			cb.call(m);
		}, 100);
	}
	exports.oz = oz;
}

return (window.oz = window.Ozzy = oz);

})();


