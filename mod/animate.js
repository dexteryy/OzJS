/**
 * @import lib/oz.js
 * @import mod/lang.js
 * @import mod/mainloop.js
 */
define("mod/animate", ["mod/lang", "mod/mainloop"], function(_, mainloop){

    var VENDORS = ['Moz', 'webkit', 'ms', 'O'],
        EVENT_NAMES = {
            'Moz': 'transitionend',
            'webkit': 'webkitTransitionEnd',
            'ms': 'MSTransitionEnd',
            'O': 'oTransitionEnd'
        },
        TRANSFORM,
        TRANSFORM_PROPS = { 'rotate': 1, 'rotateX': 1, 'rotateY': 1, 'rotateZ': 1, 'scale': 2, 'scale3d': 3, 'scaleX': 1, 'scaleY': 1, 'scaleZ': 1, 'skew': 2, 'skewX': 1, 'skewY': 1, 'translate': 2, 'translate3d': 3, 'translateX': 1, 'translateY': 1, 'translateZ': 1 },
        TRANSIT_EVENT,
        RE_TRANSFORM = /(\w+)\(([^\)]+)/,
        RE_PROP_SPLIT = /\)\s+/,
        css3_prefix,
        useCSS = false,
        hash_id = 0,
        _hash_pool = [],
        _stage = {},
        _transition_sets = {},
        _transform_callback = {},
        _propname_cache = {},
        timing_values = {
            linear: 'linear',
            easeIn: 'ease-in',
            easeOut: 'ease-out',
            easeInOut: 'ease-in-out'
        },
        timing_functions = {
            linear: function(x, t, b, c) {
                return b + c * x;
            },
            easeIn: function (x, t, b, c, d) {
                return c*(t/=d)*t + b;
            },
            easeOut: function (x, t, b, c, d) {
                return -c *(t/=d)*(t-2) + b;
            },
            easeInOut: function (x, t, b, c, d) {
                if ((t/=d/2) < 1) return c/2*t*t + b;
                return -c/2 * ((--t)*(t-2) - 1) + b;
            }
        },
        test_elm = document.createElement('div');

    for (var i = 0, l = VENDORS.length; i < l; i++) {
        css3_prefix = VENDORS[i];
        if ((css3_prefix + 'Transform') in test_elm.style) {
            if ((css3_prefix + 'Transition') in test_elm.style) {
                useCSS = true;
            }
            break;
        }
        css3_prefix = false;
    }
    if (css3_prefix) {
        TRANSFORM = '-' + css3_prefix.toLowerCase() + '-transform';
        TRANSIT_EVENT = EVENT_NAMES[css3_prefix];
    }

    var animate = {

        useCSS: useCSS,

        config: function(opt){
            if (opt.easing) {
                _.mix(timing_values, opt.easing.values);
                _.mix(timing_functions, opt.easing.functions);
                mainloop.config({ easing: timing_functions });
            }
            return this;
        },

        transform: transform,

        addStage: function(name){
            var opts = Array.prototype.slice.call(arguments, 1);
            if (useCSS) {
                for (var i = 0, l = opts.length; i < l; i++) {
                    if (opts[i].prop === 'transform') {
                        opts.splice.apply(opts, [i, 1].concat(splitTransformSet(opts[i])));
                        return this.addStage.apply(this, [name].concat(opts));
                    }
                }
                _stage[name] = opts;
                opts.forEach(run);
            } else {
                opts.forEach(function(opt){
                    animateInloop(name, opt);
                });
            }
            if (!mainloop.globalSignal) {
                mainloop.run();
            }
            return this;
        },

        pause: function(name){
            if (useCSS) {
                var opts = _stage[name];
                if (opts) {
                    opts.forEach(stop);
                }
            } else {
                mainloop.pause(name);
            }
            return this;
        },

        run: function(name){
            if (useCSS) {
                var opts = _stage[name];
                if (opts) {
                    opts.forEach(run);
                }
            } else {
                mainloop.run(name);
            }
            return this;
        },

        remove: function(name){
            if (useCSS) {
                var opts = _stage[name];
                if (opts) {
                    opts.forEach(stop);
                    delete _stage[name];
                    gc();
                }
            } else {
                mainloop.remove(name);
            }
            return this;
        },

        complete: function(name){
            if (useCSS) {
                var opts = _stage[name];
                if (opts) {
                    opts.forEach(complete);
                    delete _stage[name];
                    gc();
                }
            } else {
                mainloop.complete(name);
            }
            return this;
        }

    };

    function elm2hash(elm){
        var hash = elm.getAttribute('_oz_fx');
        if (!hash) {
            hash = _hash_pool.pop() || ++hash_id;
            elm.setAttribute('_oz_fx', hash);
            elm.removeEventListener(TRANSIT_EVENT, whenTransitionEnd);
            elm.addEventListener(TRANSIT_EVENT, whenTransitionEnd);
        }
        if (!_transition_sets[hash]) {
            _transition_sets[hash] = { target: elm };
        }
        return hash;
    }

    function whenTransitionEnd(e){
        var hash = this.getAttribute('_oz_fx'),
            sets = _transition_sets[hash];
        if (sets) {
            if (e.propertyName === TRANSFORM) {
                for (var i in TRANSFORM_PROPS) {
                    delete sets[i];
                }
                var callback = _transform_callback[hash];
                delete _transform_callback[hash];
                this.style[css3_prefix + 'Transition'] = transitionStr(hash);
                if (callback) {
                    callback.call(this);
                }
            } else {
                var opt = sets[e.propertyName];
                if (opt) {
                    delete sets[opt.prop];
                    this.style[css3_prefix + 'Transition'] = transitionStr(hash);
                    if (opt.callback) {
                        opt.callback.call(this);
                    }
                }
            }
        }
    }

    function gc(){
        var no_plain, sets;
        for (var hash in _transition_sets) {
            no_plain = false;
            sets = _transition_sets[hash];
            for (var i in sets) {
                if (sets[i] && sets[i].prop) {
                    no_plain = true;
                    break;
                }
            }
            if (!no_plain) {
                sets.target.removeAttribute('_oz_fx');
                delete _transition_sets[hash];
                delete _transform_callback[hash];
                _hash_pool.push(hash);
            }
        }
    }

    function setStyleProp(elm, prop, v){
        if (TRANSFORM_PROPS[prop]) {
            if (css3_prefix) {
                transform(elm, prop, v);
            }
        } else {
            var jsProp = _propname_cache[prop];
            if (!jsProp) {
                jsProp = _propname_cache[prop] = prop.split('-').map(function(str, i){
                    if (i) {
                        return str.replace(/^\w/, function(c){ return c.toUpperCase(); });
                    } else {
                        return str;
                    }
                }).join('');
            }
            elm.style[jsProp] = v;
        }
    }

    function transitionStr(hash){
        var sets = _transition_sets[hash];
        if (sets) {
            var str = [], opt;
            for (var prop in sets) {
                opt = sets[prop];
                if (opt && opt.prop) {
                    str.push([
                        TRANSFORM_PROPS[opt.prop] && TRANSFORM || opt.prop, 
                        (opt.duration || 0) + 'ms', 
                        timing_values[opt.easing] || 'linear', 
                        (opt.delay || 0) + 'ms'
                    ].join(' '));
                }
            }
            return str.join(",");
        } else {
            return '';
        }
    }

    function transform(elm, prop, v){
        var added = false;
        var str = elm.style[css3_prefix + 'Transform'].split(RE_PROP_SPLIT).map(function(propStr){
            if (propStr) {
                var p = RE_TRANSFORM.exec(propStr) || [];
                if (prop === p[1]) {
                    if (v) {
                        added = true;
                        return prop + '(' + v + ')';
                    } else {
                        added = p[2];
                    }
                } else if (v) {
                    return (/\)$/).test(propStr) ? propStr : propStr + ')';
                }
            }
        });
        if (v) {
            if (!added) {
                str.push(prop + '(' + v + ')');
            }
            elm.style[css3_prefix + 'Transform'] = str.join(' ');
        } else {
            return added;
        }
    }

    function stop(opt){
        var elm = opt.target, 
            hash = elm2hash(elm),
            sets = _transition_sets[hash],
            current = parseFloat(opt.from),
            end = parseFloat(opt.to),
            d = end - current,
            unit = current == opt.from ? 0 : opt.from.replace(/^[-\d\.]+/, ''),
            time = +new Date() - opt.startTime,
            progress = time / (opt.duration || 1);
        if (sets) {
            delete sets[opt.prop];
        }
        if (progress < 1) {
            if (timing_functions[opt.easing]) {
                progress = timing_functions[opt.easing](progress, time, 0, 1, opt.duration);
            }
            opt.from = current + d * progress + unit;
        } else {
            opt.from = opt.to;
        }
        var str = transitionStr(hash);
        //setTimeout(function(){
            elm.style[css3_prefix + 'Transition'] = str;
            setStyleProp(elm, opt.prop, opt.from);
        //}, 0);
    }

    function complete(opt){
        var elm = opt.target, 
            hash = elm2hash(elm),
            sets = _transition_sets[hash];
        if (sets) {
            delete sets[opt.prop];
        }
        var str = transitionStr(hash);
        //setTimeout(function(){
            elm.style[css3_prefix + 'Transition'] = str;
            setStyleProp(elm, opt.prop, opt.to);
        //}, 0);
    }

    function run(opt){
        if (!opt.prop || opt.from == opt.to) {
            return;
        }
        var elm = opt.target, 
            hash = elm2hash(elm);
        opt.startTime = +new Date() + (opt.delay || 0);
        _transition_sets[hash][opt.prop] = opt;
        setStyleProp(elm, opt.prop, opt.from);
        var str = transitionStr(hash);
        setTimeout(function(){
            elm.style[css3_prefix + 'Transition'] = str;
            setStyleProp(elm, opt.prop, opt.to);
        }, 0);
    }

    function animateInloop(name, opt){
        if (opt.prop === 'transform') {
            var hasCallback = false;
            splitTransformProps(opt, function(newopt){
                if (!hasCallback) {
                    hasCallback = true;
                    newopt.callback = opt.callback;
                }
                animateInloop(name, newopt);
            });
        } else {
            var elm = opt.target, 
                current = parseFloat(opt.from),
                end = parseFloat(opt.to),
                unit = current == opt.from ? 0 : opt.from.replace(/^[-\d\.]+/, '');
            mainloop.animate(name, current, end, opt.duration, {
                easing: opt.easing,
                //easing: opt.easing || 'linear',
                delay: opt.delay,
                step: function(v){
                    setStyleProp(elm, opt.prop, v + unit);
                },
                callback: function(){
                    if (opt.callback) {
                        opt.callback.call(elm);
                    }
                }
            });
        }
    }

    function splitTransformSet(opt){
        var hash = elm2hash(opt.target);
        _transform_callback[hash] = opt.callback;
        return splitTransformProps(opt);
    }

    function splitTransformProps(opt, fn){
        var split_opts = [],
            fromProps = opt.from.split(RE_PROP_SPLIT);
        opt.to.split(RE_PROP_SPLIT).forEach(function(propStr, i){
            var to = RE_TRANSFORM.exec(propStr),
                from_values = RE_TRANSFORM.exec(fromProps[i])[2].split(/\,\s*/),
                to_values = to[2].split(/\,\s*/),
                isSupported = TRANSFORM_PROPS[to[1]],
                is3D = isSupported === 3,
                isSingle = isSupported === 1 || to_values.length <= 1,
                xyz = isSingle ? [''] : ['X', 'Y', 'Z'],
                v, newopt;
            if (!isSupported) {
                return;
            }
            to_values.forEach(function(v, i){
                if (v && i <= xyz.length && is3D || isSingle && i < 1 || !isSingle && i < 2) {
                    newopt = _.mix({}, opt, {
                        prop: to[1].replace('3d', '') + xyz[i],
                        from: from_values[i],
                        to: v,
                        callback: null
                    });
                    this.push(newopt);
                    if (fn) {
                        fn(newopt);
                    }
                }
            }, this);
        }, split_opts);
        return split_opts;
    }

    return animate;

});
