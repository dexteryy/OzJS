/**
 * using AMD (Asynchronous Module Definition) API with OzJS
 * see http://dexteryy.github.com/OzJS/ for details
 *
 * Copyright (C) 2010-2012, Dexter.Yy, MIT License
 * vim: et:ts=4:sw=4:sts=4
 */
define("mod/animate", [
    "mod/lang", 
    "mod/event", 
    "mod/mainloop", 
    "host"
], function(_, Event, mainloop, window){

    var VENDORS = ['Moz', 'webkit', 'ms', 'O'],
        EVENT_NAMES = {
            'Moz': 'transitionend',
            'webkit': 'webkitTransitionEnd',
            'ms': 'MSTransitionEnd',
            'O': 'oTransitionEnd'
        },
        TRANSFORM,
        TRANSFORM_PROPS = { 'rotate': 1, 
            'rotateX': 1, 'rotateY': 1, 'rotateZ': 1, 
            'scale': 2, 'scale3d': 3, 
            'scaleX': 1, 'scaleY': 1, 'scaleZ': 1, 
            'skew': 2, 'skewX': 1, 'skewY': 1, 
            'translate': 2, 'translate3d': 3, 
            'translateX': 1, 'translateY': 1, 'translateZ': 1 },
        TRANSIT_EVENT,
        RE_TRANSFORM = /(\w+)\(([^\)]+)/,
        RE_PROP_SPLIT = /\)\s+/,
        RE_UNIT = /^[-\d\.]+/,
        doc = window.document,
        test_elm = doc.body,
        _getComputedStyle = (doc.defaultView || {}).getComputedStyle,
        _array_slice = Array.prototype.slice,
        css3_prefix,
        useCSS = false,
        hash_id = 0,
        stage_id = 0,
        _hash_pool = [],
        _stage = {},
        _transition_sets = {},
        _transform_promise = {},
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
        };

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

    function Stage(name){
        if (!name) {
            name = '_oz_anim_stage_' + stage_id++;
        }
        this.name = name;
        if (useCSS) {
            this.actorOpts = [];
        } else {
            mainloop.addStage(name);
        }
    }

    Stage.prototype = {

        run: function(){
            if (useCSS) {
                this.actorOpts.state = 1;
                this.actorOpts.forEach(run);
            } else {
                mainloop.run(this.name);
            }
            return this;
        },

        pause: function(){
            if (useCSS) {
                this.actorOpts.state = 0;
                this.actorOpts.forEach(stop);
            } else {
                mainloop.pause(this.name);
            }
            return this;
        },

        remove: function(){
            if (useCSS) {
                this.pause();
                this.actorOpts.length = 0;
                gc();
            } else {
                mainloop.remove(this.name);
            }
            return this;
        },

        complete: function(){
            if (useCSS) {
                this.actorOpts.state = 0;
                this.actorOpts.forEach(complete);
                this.actorOpts.length = 0;
                gc();
            } else {
                mainloop.complete(this.name);
            }
            return this;
        },

        actor: function(opt){
            var self = this,
                name = this.name,
                actors;
            if (!opt.promise) {
                opt.promise = new Event.Promise();
            }

            if (useCSS) {

                if (opt.from === undefined) {
                    opt.from = getStyleValue(opt.target, opt.prop);
                }
                if (opt.prop === 'transform') {
                    actors = splitTransformSet(opt).map(function(sub_opt){
                        sub_opt.promise = opt.promise;
                        return self.actor(sub_opt);
                    });
                    return new Actor(self.name, actors);
                }
                this.actorOpts.push(opt);
                if (this.actorOpts.state === 1) {
                    this.actorOpts.forEach(run);
                }
                return new Actor(self.name, opt);

            } else {

                if (opt.prop === 'transform') {
                    var hasCallback = false;
                    actors = [];
                    splitTransformProps(opt, function(newopt){
                        if (!hasCallback) {
                            hasCallback = true;
                        }
                        actors.push(self.actor(newopt));
                    });
                    return new Actor(self.name, actors);
                } else {
                    renderOpt(name, opt);
                    return new Actor(self.name, opt);
                }

            }

        },

        group: function(actor){
            var self = this,
                actors = _array_slice.call(arguments, 1);
            if (actor.follow) {
                return new Actor(this.name, actors);
            }
            actors = actors.map(function(opt){
                return self.actor(opt);
            });
            return new Actor(this.name, actors);
        }

    };

    function Actor(stageName, opt){
        if (Array.isArray(opt)) {
            this.members = opt;
        } else {
            this._opt = opt;
        }
        this.stageName = stageName;
    }

    Actor.prototype = {

        enter: function(){
            if (this.members) {
                this.members.forEach(function(actor){
                    actor.enter();
                });
            } else {
                if (useCSS) {
                    run(this._opt);
                } else {
                    renderOpt(this.stageName, this._opt);
                }
            }
            return this;
        },

        exit: function(){
            if (this.members) {
                this.members.forEach(function(actor){
                    actor.exit();
                });
            } else {
                if (useCSS) {
                    stop(this._opt);
                } else {
                    delete this._opt.from;
                    mainloop.remove(this.stageName, this._render);
                }
                this._opt.promise.reset();
            }
            return this;
        },

        follow: function(){
            if (this.members) {
                return Event.when.apply(Event, this.members.map(function(actor){
                    return actor._opt.promise;
                }));
            } else {
                return this._opt.promise;
            }
        }
        
    };

    function elm2hash(elm){
        var hash = elm._oz_fx;
        if (!hash) {
            hash = _hash_pool.pop() || ++hash_id;
            elm._oz_fx = hash;
            elm.removeEventListener(TRANSIT_EVENT, whenTransitionEnd);
            elm.addEventListener(TRANSIT_EVENT, whenTransitionEnd);
        }
        if (!_transition_sets[hash]) {
            _transition_sets[hash] = { target: elm };
        }
        return hash;
    }

    function whenTransitionEnd(e){
        var promise,
            hash = this._oz_fx,
            sets = _transition_sets[hash];
        if (sets) {
            if (e.propertyName === TRANSFORM) {
                for (var i in TRANSFORM_PROPS) {
                    delete sets[i];
                }
                promise = _transform_promise[hash];
                delete _transform_promise[hash];
                this.style[css3_prefix + 'Transition'] = transitionStr(hash);
            } else {
                var opt = sets[e.propertyName];
                if (opt) {
                    delete sets[opt.prop];
                    this.style[css3_prefix + 'Transition'] = transitionStr(hash);
                    promise = opt.promise;
                }
            }
            if (promise) {
                promise.resolve([this]);
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
                delete sets.target._oz_fx;
                delete _transition_sets[hash];
                delete _transform_promise[hash];
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
            unit = getUnit(opt.from, opt.to),
            time = +new Date() - opt.startTime,
            progress = time / (opt.duration || 1);
        if (sets) {
            clearTimeout((sets[opt.prop] || {})._runtimer);
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
        opt._runtimer = setTimeout(function(){
            delete opt._runtimer;
            elm.style[css3_prefix + 'Transition'] = str;
            setStyleProp(elm, opt.prop, opt.to);
        }, 0);
    }

    function renderOpt(name, opt){
        if (opt.from === undefined) {
            opt.from = getStyleValue(opt.target, opt.prop);
        }
        var elm = opt.target,
            end = parseFloat(opt.to),
            current = parseFloat(opt.from),
            unit = getUnit(opt.from, opt.to);
        mainloop.addAnimate(name, current, end, opt.duration, {
            easing: opt.easing,
            //easing: opt.easing || 'linear',
            delay: opt.delay,
            step: function(v){
                setStyleProp(elm, opt.prop, v + unit);
            },
            callback: function(){
                opt.promise.resolve([elm]);
            }
        });
    }

    function getUnit(from, to){
        var from_unit = from.toString().replace(RE_UNIT, ''),
            to_unit = to.toString().replace(RE_UNIT, '');
        return parseFloat(from) === 0 && to_unit 
            || parseFloat(to) === 0 && from_unit 
            || from_unit || to_unit;
    }

    function getStyleValue(node, name){
        return node && (node.style[css_method(name)] 
            || getPropertyValue(node, name));
    }

    function getPropertyValue(node, name){
        return _getComputedStyle 
            ? _getComputedStyle(node, '').getPropertyValue(name)
            : node.currentStyle[name];
    }

    function css_method(name){
        return name.replace(/-+(.)?/g, function($0, $1){
            return $1 ? $1.toUpperCase() : '';
        }); 
    }

    function splitTransformSet(opt){
        var hash = elm2hash(opt.target);
        _transform_promise[hash] = opt.promise;
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
                        to: v
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

    function animate(name){
        var stage = _stage[name];
        if (stage) {
            return stage;
        }
        stage = _stage[name] = new Stage(name);
        return stage;
    }

    _.mix(animate, {

        VERSION: '2.0.0',

        renderMode: useCSS ? 'css' : 'js',

        config: function(opt){
            if (opt.easing) {
                _.mix(timing_values, opt.easing.values);
                _.mix(timing_functions, opt.easing.functions);
                mainloop.config({ easing: timing_functions });
            }
            if (/(js|css)/.test(opt.renderMode)) {
                useCSS = opt.renderMode === 'css';
                this.renderMode = opt.renderMode;
            }
        },

        transform: transform

    });

    return animate;

});
