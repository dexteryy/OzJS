/**
 * @import lib/oz.js
 * @import mod/lang.js
 * @import mod/mainloop.js
 */
define("animate", ["lang", "mainloop"], function(_, mainloop){

    var VENDORS = [
            'Moz',
            'webkit',
            'ms',
            'O'
        ],
        TRANSFORM,
        TRANSFORM_PROPS = {
            'rotate': 1,
            'scale': 1,
            'scaleX': 1,
            'scaleY': 1,
            'skew': 1,
            'skewX': 1,
            'skewY': 1,
            'translate': 1,
            'translateX': 1,
            'translateY': 1
        },
        //NON_STYLE_PROPS = [
            //'scrollTop',
            //'scrollLeft'
        //],
        RE_TRANSFORM = /(\w+)\(([^\,\)]+)/,
        css3_prefix,
        useCSS = false,
        hash_id = 0,
        _hash_pool = [],
        _stage = {},
        _transition_sets = {},
        _propname_cache = {},
        test_elm = document.createElement('div'),
        timing_values = {},
        timing_functions = {};

    for (var i = 0, l = VENDORS.length; i < l; i++) {
        css3_prefix = VENDORS[i];
        if ((css3_prefix + 'Transform') in test_elm.style) {
            if ((css3_prefix + 'Transition') in test_elm.style) {
                if (css3_prefix !== 'Moz' && css3_prefix !== 'O') {
                    useCSS = true;
                }
            }
            break;
        }
        css3_prefix = false;
    }
    if (css3_prefix) {
        TRANSFORM = '-' + css3_prefix.toLowerCase() + '-transform';
        for (var j in TRANSFORM_PROPS) {
            TRANSFORM_PROPS[j] = TRANSFORM;
        }
    }

    var animate = {

        config: function(opt){
            if (opt.easing) {
                _.mix(timing_values, opt.easing.values);
                _.mix(timing_functions, opt.easing.functions);
                mainloop.config({ easing: opt.easing.functions });
            }
        },

        addStage: function(name){
            var opts = Array.prototype.slice.call(arguments, 1);
            if (useCSS) {
                for (var i = 0, l = opts.length; i < l; i++) {
                    if (opts[i].prop === 'transform') {
                        opts.splice.apply(opts, [i, 1].concat(splitTransformSet(opts[i])));
                        this.addStage.apply(this, [name].concat(opts));
                        return;
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
        }

    };

    function elm2hash(elm){
        var hash = elm.getAttribute('_oz_fx');
        if (!hash) {
            hash = _hash_pool.pop() || ++hash_id;
            elm.setAttribute('_oz_fx', hash);
            var eventName = css3_prefix.toLowerCase() + 'TransitionEnd';
            elm.removeEventListener(eventName, whenTransitionEnd);
            elm.addEventListener(eventName, whenTransitionEnd);
        }
        if (!_transition_sets[hash]) {
            _transition_sets[hash] = {};
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
                this.style[css3_prefix + 'Transition'] = transitionStr(hash);
                var callback = sets.transformCallback;
                delete sets.transformCallback;
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
                if (sets[i].prop) {
                    no_plain = true;
                    break;
                }
            }
            if (!no_plain) {
                delete _transition_sets[hash];
                _hash_pool.push(hash);
            }
        }
    }

    function setStyleProp(style, prop, v){
        if (TRANSFORM_PROPS[prop]) {
            if (css3_prefix) {
                setTransform(style, prop, v);
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
            style[jsProp] = v;
        }
    }

    function transitionStr(hash){
        var sets = _transition_sets[hash];
        if (sets) {
            var str = [], opt, transform = TRANSFORM_PROPS;
            for (var prop in sets) {
                opt = sets[prop];
                if (opt.prop) {
                    str.push([
                        transform[opt.prop] || opt.prop, 
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

    function setTransform(style, prop, v){
        var added = false;
        var str = style[css3_prefix + 'Transform'].split(/\s+/).map(function(propStr){
            if (prop === (propStr.match(RE_TRANSFORM) || [])[1]) {
                added = true;
                return prop + '(' + v + ')';
            } else {
                return propStr;
            }
        });
        if (!added) {
            str.push(prop + '(' + v + ')');
        }
        style[css3_prefix + 'Transform'] = str.join(' ');
    }

    function stop(opt){
        var elm = opt.target, 
            style = elm.style,
            hash = elm2hash(elm),
            sets = _transition_sets[hash],
            current = parseFloat(opt.from),
            end = parseFloat(opt.to),
            d = end - current,
            unit = current == opt.from ? 0 : opt.from.replace(/^\d+/, ''),
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
        setTimeout(function(){
            style[css3_prefix + 'Transition'] = str;
            setStyleProp(style, opt.prop, opt.from);
        }, 0);
    }

    function complete(opt){
        var elm = opt.target, 
            style = elm.style,
            hash = elm2hash(elm),
            sets = _transition_sets[hash];
        if (sets) {
            delete sets[opt.prop];
        }
        var str = transitionStr(hash);
        setTimeout(function(){
            style[css3_prefix + 'Transition'] = str;
            setStyleProp(style, opt.prop, opt.to);
        }, 0);
    }

    function run(opt){
        if (!opt.prop || opt.from == opt.to) {
            return;
        }
        var elm = opt.target, 
            style = elm.style,
            hash = elm2hash(elm);
        opt.startTime = +new Date() + (opt.delay || 0);
        _transition_sets[hash][opt.prop] = opt;
        setStyleProp(style, opt.prop, opt.from);
        var str = transitionStr(hash);
        setTimeout(function(){
            style[css3_prefix + 'Transition'] = str;
            setStyleProp(style, opt.prop, opt.to);
        }, 0);
    }

    function animateInloop(name, opt){
        if (opt.prop === 'transform') {
            var fromProps = opt.from.split(/\s+/);
            opt.to.split(/\s+/).forEach(function(propStr, i){
                var p = propStr.match(RE_TRANSFORM);
                var newpopt = _.mix({}, this, {
                    prop: p[1],
                    from: fromProps[i].match(RE_TRANSFORM)[2],
                    to: p[2]
                });
                if (i) {
                    delete newpopt.callback;
                }
                animateInloop(name, newpopt);
            }, opt);
        } else {
            var elm = opt.target, 
                style = elm.style, 
                current = parseFloat(opt.from),
                end = parseFloat(opt.to),
                unit = current == opt.from ? 0 : opt.from.replace(/^\d+/, '');
            mainloop.animate(name, current, end, opt.duration, {
                easing: opt.easing,
                //easing: opt.easing || 'linear',
                delay: opt.delay,
                step: function(v){
                    setStyleProp(style, opt.prop, v + unit);
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
        var hash = elm2hash(opt.target),
            fromProps = opt.from.split(/\s+/);
        _transition_sets[hash].transformCallback = opt.callback;
        return opt.to.split(/\s+/).map(function(propStr, i){
            var p = propStr.match(RE_TRANSFORM);
            var newpopt = _.mix({}, this, {
                prop: p[1],
                from: fromProps[i].match(RE_TRANSFORM)[2],
                to: p[2],
                callback: null
            });
            return newpopt;
        }, opt);
    }

    return animate;

});
