#!/usr/bin/env node

//var util = require('util');
var fs = require('fs');
var path = require('path');
var vm = require('vm');
var optimist;
var jsdom = require("jsdom").jsdom;
var Oz = require('./lib/oz');

var INDENTx1 = '';
var STEPMARK = '\033[34m==>\033[0m';
var RE_AUTOFIXNAME = /define\((?=[^'"])/;
var RE_REQUIRE = /(^|\s)require\((\[[\w'"\/\-\:,\n\r\s]*\]|.+)\,/gm;
var CONFIG_BUILT_CODE = '\nrequire.config({ enable_ozma: true });\n\n';
var _DEFAULT_CONFIG = {
    "baseUrl": "./",
    "distUrl": null,
    "loader": null,
    "aliases": null,
    "disableAutoSuffix": false 
};
var _runtime;
var logger = Object.create(console);
var _config = {};
var _build_script = '';
var _loader_config_script = '';
var _current_scope_mods = Oz._config.mods;
var _capture_require;
var _require_holds = [];
var _scripts = {};
var _code_cache = {};
var _code_bottom = '';
var _mods_code_cache = {};
var _file_scope_cache = {};
var _build_history = {};
var _lazy_loading = [];
var _is_global_scope = true;
var _delay_exec;
var _loader_readed;
var _output_count = 0;
var _begin_time;

/**
 * implement hook
 */
Oz.require = function(deps, block){
    if (_capture_require) {
        _require_holds.push.apply(_require_holds, typeof deps === 'string' ? [deps] : deps);
    } else {
        return Oz.oz.require.apply(this, arguments);
    }
};

/**
 * override
 */ 
Oz.require.config = function(opt){
    for (var i in opt) {
        if (i === 'aliases') {
            if (!_config[i]) {
                _config[i] = {};
            }
            for (var j in opt[i]) {
                _config[i][j] = opt[i][j];
            }
        } else if (i === 'baseUrl') {
            continue;
        }
        Oz._config[i] = opt[i];
    }
};

/**
 * implement hook
 */
Oz.exec = function(list){
    var output_code = '', count = 0;
    if (_is_global_scope) {
        var loader = _config.loader || Oz._config.loader;
        if (loader) {
            if (_loader_readed) {
                list.push({
                    fullname: '__loader__',
                    url: loader
                });
            } else {
                return _delay_exec = function(){
                    Oz.exec(list);
                };
            }
        } else {
            output_code += CONFIG_BUILT_CODE;
        }
    }
    logger.log(STEPMARK, 'Building');
    list.reverse().forEach(function(mod){
        if (mod.is_reset) {
            mod = Oz._config.mods[mod.fullname];
        }
        if (mod.url || !mod.fullname) {
            if (mod.built 
                || !mod.fullname && !_is_global_scope) {
                return;
            }
            var import_code = this[mod.fullname || ''];
            if (!import_code) {
                return;
            }
            // semicolons are inserted between files if concatenating would cause errors.
            output_code += '\n/* @source ' + (mod.url || '') + ' */;\n\n'
                            + import_code;
            if (mod.fullname !== '__loader__') {
                _mods_code_cache[_build_script].push(import_code);
            } else if (_is_global_scope) {
                if (_loader_config_script) {
                    output_code += _loader_config_script;
                }
                output_code += CONFIG_BUILT_CODE;
            }
            if (mod.url && mod.url !== _build_script) {
                count++;
                logger.log(INDENTx1, '\033[36m' + 'import: ', mod.url + '\033[0m');
            }
            mod.built = true;
        }
    }, _code_cache);
    var output = _config.disableAutoSuffix ? _build_script 
                                : Oz.truename(_build_script);
    if (!_is_global_scope) {
        var alias = _config.aliases || Oz._config.aliases;
        if (alias) {
            output = true_url(output, alias);
        }
        output = (_config.distUrl || _config.baseUrl) + output;
    } else if (_config.distUrl) {
        output = _config.distUrl + path.resolve(output)
                                        .replace(path.resolve(_config.baseUrl) + '/', '');
    }
    output_code += _code_bottom;
    writeFile3721(output, output_code, function(err){
        if (err) {
            throw err;
        }
        logger.log(INDENTx1, count, 'files');
        logger.log(INDENTx1, 'target: ', '\033[4m' + output + '\033[0m');
        logger.log(INDENTx1, 'Success!\n');
        _output_count++;
        _is_global_scope = false;
        if (!seek_lazy_module()) {
            logger.log(_output_count + ' files, built in ' 
                        + (+new Date() - _begin_time) + 'ms');
        }
    });
};

/**
 * implement hook
 */
Oz.fetch = function(m, cb){
    var url = m.url,
        is_undefined_mod,
        observers = _scripts[url];
    if (!observers) {
        observers = _scripts[url] = [[cb, m]];
        read(m, function(data){
            if (data) {
                try {
                    _capture_require = true;
                    vm.runInContext(data, _runtime);
                    _capture_require = false;
                    merge(Oz._config.mods[m.fullname].deps, _require_holds);
                    _require_holds.length = 0;
                } catch(ex) {
                    logger.info(INDENTx1, '\033[31m' + 'Unrecognized module: ', m.fullname + '\033[0m');
                    _capture_require = false;
                    _require_holds.length = 0;
                }
                if (Oz._config.mods[m.fullname] === m) {
                    is_undefined_mod = true;
                }
            }
            observers.forEach(function(args){
                args[0].call(args[1]);
            });
            if (data) {
                if (is_undefined_mod) {
                    if (Oz._config.mods[m.fullname] === m) {
                        _code_cache[m.fullname] += '\n/* autogeneration */' 
                            + '\ndefine("' + m.fullname + '", [' 
                            + (m.deps && m.deps.length ? ('"' + m.deps.join('", "') + '"') : '')
                            + '], function(){});\n';
                    } else {
                        auto_fix_name(m.fullname);
                    }
                }
            }
            _scripts[url] = 1;
        });
    } else if (observers === 1) {
        cb.call(m);
    } else {
        observers.push([cb, m]);
    }
};

function mix(target) {
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
}

function merge(origins, news){
    if (Array.isArray(origins)) {
        var lib = {};
        origins.forEach(function(i){
            lib[i] = 1;
        }, lib);
        news.forEach(function(i){
            if (!this[i]) {
                origins.push(i);
            }
        }, lib);
    } else {
        for (var i in news) {
            if (!origins.hasOwnProperty(i)) {
                origins[i] = news[i];
            }
        }
    }
    return origins;
}

function config(cfg, opt, default_cfg){
    for (var i in default_cfg) {
        if (opt.hasOwnProperty(i)) {
            if (default_cfg[i] && typeof default_cfg[i] === 'object' && !Array.isArray(opt[i])) {
                if (!cfg[i]) {
                    cfg[i] = default_cfg[i];
                }
                for (var j in opt[i]) {
                    cfg[i][j] = opt[i][j];
                }
            } else {
                cfg[i] = opt[i];
            }
        } else if (typeof cfg[i] === 'undefined') {
            cfg[i] = default_cfg[i];
        }
    }
    return cfg;
}

function unique(list){
    var r = {}, temp = list.slice();
    for (var i = 0, v, l = temp.length; i < l; i++) {
        v = temp[i];
        if (!r[v]) {
            r[v] = true;
            list.push(v);
        }
    }
    list.splice(0, temp.length);
    return list;
}

function mkdir_p(dirPath, mode, callback) {
    fs.mkdir(dirPath, mode, function(err) {
        if (err && err.errno === 34) {
            return mkdir_p(path.dirname(dirPath), mode, function(){
                mkdir_p(dirPath, mode, callback);
            });
        }
        if (callback) {
            callback(err);
        }
    });
}

function writeFile3721(target, content, callback){
    fs.writeFile(target, content, function(err){
        if (err && err.errno === 34) {
            return mkdir_p(path.dirname(target), 0777, function(){
                writeFile3721(target, content, callback);
            });
        }
        if (callback) {
            callback(err);
        }
    });
}

function disable_methods(obj, cfg){
    cfg = cfg || obj;
    for (var i in cfg) {
        obj[i] = function(){};
    }
}

function read(m, cb){
    var url = m.url;
    var alias = _config.aliases || Oz._config.aliases;
    if (alias) {
        url = true_url(url, alias);
    }
    var file = path.resolve(_config.baseUrl + url);
    if (!fs.existsSync(file)) {
        setTimeout(function(){
            logger.log(INDENTx1, '\033[31m' + 'Undefined module: ', m.fullname + '\033[0m');
            cb();
        }, 0);
        return;
    }
    fs.readFile(file, 'utf-8', function(err, data){
        if (err) {
            return logger.error("\033[31m", 'ERROR: Can not read "' + file + '"\033[0m');
        }
        if (data) {
            _code_cache[m.fullname] = data;
        }
        cb(data);
    });
}

function seek_lazy_module(){
    if (!_lazy_loading.length) {
        var code, clip;
        for (var file in _mods_code_cache) {
            code = _mods_code_cache[file];
            clip = code.pop();
            _current_scope_mods = _file_scope_cache[file];
            break;
        }
        if (!clip) {
            delete _mods_code_cache[file];
            if (!code) {
                return false;
            } else {
                return seek_lazy_module();
            }
        }
        var r;
        while (r = RE_REQUIRE.exec(clip)) {
            if (r[2]) {
                var deps_str = r[2].trim();
                if (deps_str == 'deps')
                if (!/^\[?["']/.test(deps_str)) {
                    logger.log('\n\033[31m' + 'WARN: "require(' + deps_str + '," is unanalyzable' + '\033[0m\n');
                    continue;
                }
                if (!/^\[/.test(deps_str)) {
                    deps_str = '[' + deps_str + ']';
                }
                _lazy_loading.push.apply(_lazy_loading, eval(deps_str));
            }
        }
        if (!_lazy_loading.length) {
            return seek_lazy_module();
        }
        unique(_lazy_loading);
    }
    var mid = _lazy_loading.pop();
    if (!mid) {
        return false;
    }
    var mods = _current_scope_mods || Oz._config.mods;
    var m = mods[mid];
    if (m && m.loaded == 2) {
        return seek_lazy_module();
    }
    var new_build = m && m.url || Oz.autoname(mid);
    if (_build_history[new_build]) {
        return seek_lazy_module();
    }
    _build_history[new_build] = true;
    switch_build_script(new_build);
    Oz._config.mods = _file_scope_cache[new_build] = mix({}, mods);
    logger.log(STEPMARK, 'Runing', '"' + mid + '"(' + '\033[4m' + new_build + '\033[0m' + ')', 'as build script');
    logger.log(STEPMARK, 'Analyzing');
    Oz.require(mid, function(){});
    return true;
}

function switch_build_script(url){
    _build_script = url;
    _mods_code_cache[_build_script] = [];
}

function auto_fix_name(mid){
    _code_cache[mid] = _code_cache[mid].replace(RE_AUTOFIXNAME, function($0){
        return $0 + '"' + mid + '", ';
    });
}

function true_url(url, alias){
    return url.replace(/\{(\w+)\}/g, function(e1, e2){
        return alias[e2] || "";
    });
}

function load_config(file){
    if (!fs.existsSync(file)) {
        return false;
    }
    var json;
    try {
        json = JSON.parse(fs.readFileSync(file, 'utf-8'));
    } catch(ex) {
        logger.error("\033[31m", 'ERROR: Can not parse', file, ' [' 
            + ex.toString().replace(/\s*\n/g, '') + ']', "\033[0m");
        throw ex;
    }
    config(_config, json, _DEFAULT_CONFIG);
    return _config;
}

function main(argv, args, opt){
    opt = opt || {};

    if (!_runtime) {
        var doc = jsdom("<html><head></head><body></body></html>");
        var win = doc.createWindow();
        _runtime = vm.createContext(
            merge(Oz, win)
        );
        _runtime.window = _runtime;
        _runtime.console = Object.create(logger);

        if (args['jam']) {
            logger.log(STEPMARK, 'Building for Jam');
            var jam_dir = 'jam/';
            fs.readFile(jam_dir + 'require.config.js', 'utf-8', function(err, data){
                if (err) {
                    return logger.error("\033[31m", 'ERROR: Directory "./' + jam_dir + '" not found in the current path', "\033[0m");
                }
                vm.runInContext(data, _runtime);
                var autoconfig = _runtime.jam.packages.map(function(m){
                    return 'define("' + m.name + '", "' 
                        + path.join(m.location, m.main) + '");\n';
                }).join('');
                vm.runInContext(autoconfig, _runtime);
                _config.loader = jam_dir + 'oz.js';
                fs.readFile(path.join(path.dirname(args.$0), 'lib/oz.js'), 'utf-8', function(err, data){
                    writeFile3721(jam_dir + 'oz.config.js', [autoconfig].join('\n'), function(){
                        logger.log(INDENTx1, 'updating', '\033[4m' + jam_dir + 'oz.config.js' + '\033[0m');
                        writeFile3721(_config.loader, [data, autoconfig].join('\n'), function(){
                            logger.log(INDENTx1, 'updating', '\033[4m' + _config.loader + '\033[0m');
                            if (args._.length) {
                                main(argv, args, { 
                                    loader: _config.loader, 
                                    loader_config: autoconfig 
                                });
                            }
                        });
                    });
                });
            });
            return;
        }
    }

    if (!args._.length) {
        optimist.showHelp(logger.warn);
        logger.error("\033[31m", 'ERROR: Missing input file', "\033[0m");
        return false;
    }
    _begin_time = +new Date();

    switch_build_script(args._[0]);
    var input_dir = path.dirname(_build_script);

    if (args['silent']) {
        disable_methods(logger);
    }

    if (!args['enable-modulelog']) {
        disable_methods(_runtime.console);
    }

    logger.log(STEPMARK, 'Configuring');
    var cfg;
    if (args['config']) {
        cfg = load_config(args['config']);
    }
    if (!cfg) {
        cfg = load_config(path.join(input_dir, 'ozconfig.json'));
    }
    if (!cfg) {
        cfg = config(_config, _DEFAULT_CONFIG, _DEFAULT_CONFIG);
        logger.warn("\033[31m", "Can not find config file, using defaults: ", "\033[0m", 
            "\n", '\033[36m', cfg, '\033[0m');
    }

    fs.readFile(_build_script, 'utf-8', function(err, data){
        if (err) {
            return logger.error("\033[31m", 'ERROR: Can not read "' + _build_script + '"\033[0m');
        }
        _code_cache[''] = data;
        logger.log(STEPMARK, 'Analyzing');
        _capture_require = true;
        vm.runInContext(data, _runtime);
        _capture_require = false;
        Oz.define('__main__', _require_holds.slice(), function(){});
        _require_holds.length = 0;
        Oz.require('__main__', function(){});
        //read loader script
        var loader = _config.loader || Oz._config.loader;
        if (loader) {
            if (opt.loader !== loader) {
                _loader_config_script = opt.loader_config;
            }
            read({
                fullname: '__loader__',
                url: loader
            }, function(){
                _loader_readed = true;
                if (_delay_exec) {
                    _delay_exec();
                }
            });
        }
    });
}

exports.exec = function(){
    optimist = require('optimist')
        .alias('s', 'silent')
        .alias('c', 'config')
        .boolean('jam')
        .boolean('silent')
        .boolean('enable-modulelog')
        .usage('Autobuild tool for OzJS based WebApp.\nUsage: $0 [build script] --config [configuration file]');
    main(process.argv, optimist.argv);
};

if (!module.parent) {
    exports.exec();
}
