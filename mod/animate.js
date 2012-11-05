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

    var VENDORS = ['', 'Moz', 'webkit', 'ms', 'O'],
        EVENT_NAMES = {
            '': 'transitionend',
            'Moz': 'transitionend',
            'webkit': 'webkitTransitionEnd',
            'ms': 'MSTransitionEnd',
            'O': 'oTransitionEnd'
        },
        TRANSIT_EVENT,
        TRANSFORM_PROPS = { 'rotate': -2, 
            'rotateX': -1, 'rotateY': -1, 'rotateZ': -1, 
            'scale': 2, 'scale3d': 3, 
            'scaleX': -1, 'scaleY': -1, 'scaleZ': -1, 
            'skew': 2, 'skewX': -1, 'skewY': -1, 
            'translate': 2, 'translate3d': 3, 
            'translateX': -1, 'translateY': -1, 'translateZ': -1 },
        TRANSFORM_DEFAULT = 'rotateX(0) rotateY(0) rotateZ(0)'
            + ' translateX(0) translateY(0) translateZ(0)'
            + ' scaleX(1) scaleY(1) scaleZ(1) skewX(0) skewY(0)',
        ACTOR_OPS = ['target', 'props', 'duration', 'easing', 'delay', 'promise'],
        RE_TRANSFORM = /(\w+)\(([^\)]+)/,
        RE_PROP_SPLIT = /\)\s+/,
        RE_UNIT = /^[-\d\.]+/,
        test_elm = window.document.body,
        _arry_push = Array.prototype.push,
        _array_slice = Array.prototype.slice,
        _getComputedStyle = (document.defaultView || {}).getComputedStyle,
        vendor_prop = { 'transform': '', 'transition': '' },
        useCSS = false,
        hash_id = 0,
        stage_id = 0,
        render_id = 0,
        _hash_pool = [],
        _stage = {},
        _transition_sets = {},
        _transform_promise = {},
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

    function fixPropName(lib, prefix, true_prop, succ){
        for (var prop in lib) {
            true_prop = prefix ? ('-' + prefix + '-' + prop) : prop;
            if (css_method(true_prop) in test_elm.style) {
                lib[prop] = true_prop;
                TRANSIT_EVENT = EVENT_NAMES[prefix];
                succ = true;
                continue;
            }
        }
        return succ;
    }
    
    for (var i = 0, l = VENDORS.length; i < l; i++) {
        if (fixPropName(vendor_prop, VENDORS[i])) {
            break;
        }
    }
    fixPropName(vendor_prop, '');

    var TRANSFORM = vendor_prop['transform'],
        TRANSITION = vendor_prop['transition'],
        TRANSFORM_METHOD = css_method(TRANSFORM),
        TRANSITION_METHOD = css_method(TRANSITION); 
    if (TRANSFORM_METHOD && TRANSITION_METHOD) {
        useCSS = true;
    }

    function Stage(name){
        if (!name) {
            name = '_oz_anim_stage_' + stage_id++;
        }
        if (_stage[name]) {
            return _stage[name];
        }
        _stage[name] = this;
        this.name = name;
        this._promise = new Event.Promise();
        this._count = 0;
        this._optCache = [];
        if (useCSS) {
            this._actorOpts = [];
        } else {
            mainloop.addStage(name);
        }
    }

    Stage.prototype = {

        run: function(){
            //console.info('run', this._count, this._optCache.length)
            if (!this._count) {
                this._optCache.forEach(function(opt){
                    this.actor(opt);
                }, this);
            }
            if (useCSS) {
                if (!this._actorOpts.state) {
                    this._actorOpts.state = 1;
                    this._actorOpts.forEach(run);
                }
            } else {
                mainloop.run(this.name);
            }
            return this;
        },

        pause: function(){
            if (useCSS) {
                this._actorOpts.state = 0;
                this._actorOpts.forEach(function(opt){
                    opt.from = stop(opt);
                });
            } else {
                mainloop.pause(this.name);
            }
            return this;
        },

        clear: function(){
            this.cancel();
            this._optCache.forEach(function(opt){
                opt._cached = false;
            });
            this._optCache.length = 0;
            return this;
        },

        cancel: function(){
            if (useCSS) {
                this._actorOpts.forEach(stop);
                this._actorOpts.state = 0;
                this._actorOpts.length = 0;
                gc();
            } else {
                mainloop.remove(this.name);
            }
            this._optCache.forEach(function(opt){
                if (!opt._inactive) {
                    opt.promise.reject([{
                        target: opt.target, 
                        succ: false
                    }]).disable();
                }
            });
            return this;
        },

        complete: function(){
            if (useCSS) {
                if (this._actorOpts.state) {
                    this._actorOpts.forEach(function(opt){
                        complete(opt);
                        opt.promise.resolve([{
                            target: opt.target, 
                            succ: true 
                        }]).disable();
                    });
                }
            } else {
                mainloop.complete(this.name);
            }
            return this;
        },

        actor: function(opt, opt2){
            var self = this, actors;
            if (opt2) {
                if (opt.nodeType) {
                    var base_opt = {}, props;
                    ACTOR_OPS.forEach(function(op, i){
                        if (op === 'props') {
                            props = this[i];
                        } else {
                            base_opt[op] = this[i];
                        }
                    }, arguments);
                    actors = Object.keys(props).map(function(prop){
                        return self.actor(_.mix({ 
                            prop: prop,
                            to: props[prop]
                        }, this));
                    }, base_opt);
                    if (actors.length === 1) {
                        return actors[0];
                    }
                } else {
                    actors = _array_slice.call(arguments);
                    actors = actors.map(function(opt){
                        return self.actor(opt);
                    });
                }
                return new Actor(actors, self);
            }

            clearTimeout(this._end_timer);
            opt.prop = vendor_prop[opt.prop] || opt.prop;
            opt._inactive = false;
            if (opt.promise) {
                opt.promise.reset().enable();
            }
            if (!opt._is_split) {
                this._count++;
                //console.info('count+', this._count)
                if (!opt._cached) {
                    opt._option_from = opt.from;
                }
            }
            if (opt.from === undefined) {
                opt.from = opt._origin_from = getStyleValue(opt.target, opt.prop);
            }

            var actorObj, name = this.name;

            if (opt.prop === TRANSFORM) {
                var transform_promise = new Event.Promise(),
                    collect_split = function(sub_opt){
                        sub_opt._is_split = true;
                        sub_opt.promise = transform_promise;
                        actors.push(self.actor(sub_opt));
                    };
                actors = [];
                if (useCSS) {
                    splitTransformSet(opt, transform_promise)
                        .forEach(collect_split);
                } else {
                    splitTransformProps(opt, collect_split);
                }
                actorObj = new Actor(actors, self, opt);
                opt.promise = actorObj.follow();
            }

            if (!actorObj) {
                if (!opt.promise) {
                    opt.promise = new Event.Promise();
                }
                if (useCSS) {
                    this._actorOpts.push(opt);
                    if (this._actorOpts.state === 1) {
                        run(opt);
                    }
                } else {
                    renderOpt(name, opt);
                }
                actorObj = new Actor(opt, self);
            }

            if (!opt._cached && !opt._is_split) {
                opt._cached = true;
                this._optCache.push(opt);
                opt._watcher = function(res){
                    opt._inactive = true;
                    opt.from = opt._option_from;
                    //console.info('wathc', self._count-1, self.name, opt.promise)
                    if (--self._count > 0) {
                        return;
                    }
                    self._end_timer = setTimeout(function(){
                        if (useCSS) {
                            self._actorOpts.state = 0;
                            self._actorOpts.length = 0;
                            gc();
                        }
                        self._promise[
                            res.succ ? 'resolve': 'reject'
                        ]([{ succ: res.succ }]).reset();
                    }, 0);
                };
                opt.promise.bind(opt._watcher);
                //console.info(actorObj)
            }

            return actorObj;
        },

        group: function(actor){
            var self = this,
                actors = _array_slice.call(arguments).filter(function(actor){
                    return actor.stage === self;
                });
            return new Actor(actors, this);
        },

        follow: function(){
            return this._promise;
        }

    };

    function Actor(actors, stage, opt){
        opt = opt || {};
        if (Array.isArray(actors)) {
            this.members = actors;
            var promise = opt.promise;
            opt.promise = Event.when.apply(Event, 
                this.members.map(function(actor){
                    return actor.follow();
                }));
            if (promise) {
                Event.pipe(opt.promise, promise);
                opt.promise = promise;
            }
        } else {
            if (opt.promise) {
                actors.promise = opt.promise;
            }
            opt = actors;
        }
        this._opt = opt;
        this.stage = stage;
    }

    Actor.prototype = {

        enter: function(stage){
            if (this.members) {
                this.members.forEach(function(actor){
                    actor.enter(stage);
                });
            } else {
                if (stage) {
                    if (this.stage) {
                        this.exit();
                    }
                    this.stage = stage;
                }
                this.stage.actor(this._opt);
            }
            return this;
        },

        exit: function(){
            if (!this.stage) {
                return this;
            }
            if (this.members) {
                this.members.forEach(function(actor){
                    actor.exit();
                });
            } else {
                if (useCSS) {
                    clearMember(this.stage._actorOpts, this._opt);
                    stop(this._opt);
                } else {
                    mainloop.remove(this.stage.name, this._opt._render);
                }
                //console.info('exit', this.stage._optCache.length)
                clearMember(this.stage._optCache, this._opt);
                this.follow().reject([{
                    target: this._opt.target,
                    succ: false
                }]).disable();
                delete this.stage;
                reset_actor(this._opt);
                if (this._opt._watcher) {
                    this._opt.promise.unbind(this._opt._watcher);
                }
            }
            return this;
        },

        copy: function(){
            if (this.members) {
                return new Actor(this.members.map(function(actor){
                    actor.copy();
                }));
            } else {
                var opt = reset_actor(_.copy(this._opt));
                opt.promise = new Event.Promise();
                return new Actor(opt);
            }
        },

        reverse: function(){
            if (this.members) {
                return this.members.forEach(function(actor){
                    actor.reverse();
                });
            } else {
                var opt = this._opt,
                    stage = this.stage,
                    from = opt.from,
                    option = opt._option_from;
                if (this.stage) {
                    this.exit();
                }
                this.stage = stage;
                opt.from = option ? opt.to : undefined;
                opt.to = from || opt._origin_from;
                delete opt._option_from;
                stage.actor(opt);
            }
            return this;
        },

        follow: function(){
            return this._opt.promise;
        }
        
    };

    function reset_actor(opt){
        opt.from = opt._option_from;
        delete opt._cached;
    }

    function clearMember(array, member){
        var n = array.indexOf(member);
        if (n !== -1) {
            array.splice(n, 1);
        }
    }

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
        var self = this,
            hash = this._oz_fx,
            sets = _transition_sets[hash];
        if (sets) {
            if (e.propertyName === TRANSFORM) { 
                for (var i in TRANSFORM_PROPS) {
                    delete sets[i];
                }
                var promises = _transform_promise[hash] || [];
                delete _transform_promise[hash];
                this.style[TRANSITION_METHOD] = transitionStr(hash);
                promises.forEach(function(promise){
                    promise.resolve([{
                        target: self,
                        succ: true
                    }]).disable();
                }); 
            } else {
                var opt = sets[e.propertyName];
                if (opt) {
                    delete sets[opt.prop];
                    this.style[TRANSITION_METHOD] = transitionStr(hash);
                    if (opt.promise) {
                        opt.promise.resolve([{
                            target: this,
                            succ: true
                        }]).disable();
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
                delete sets.target._oz_fx;
                delete _transition_sets[hash];
                delete _transform_promise[hash];
                _hash_pool.push(hash);
            }
        }
    }

    function setStyleProp(elm, prop, v){
        if (TRANSFORM_PROPS[prop]) {
            if (TRANSFORM) {
                transform(elm, prop, v);
            }
        } else {
            elm.style[css_method(prop)] = v;
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
        var current = parseTransformPropValue(getStyleValue(elm, TRANSFORM));
        if (v) {
            var kv = parseTransformPropValue(prop + '(' + v + ')');
            _.mix(current, kv);
            elm.style[TRANSFORM_METHOD] = Object.keys(current).map(function(prop){
                return prop + '(' + this[prop] + ')';
            }, current).join(' ');
        } else {
            return current[prop];
        }
    }

    function stop(opt){
        var from,
            elm = opt.target,
            hash = elm2hash(elm),
            sets = _transition_sets[hash],
            current = parseFloat(opt.from),
            end = parseFloat(opt.to),
            d = end - current,
            unit = getUnit(opt.from, opt.to),
            time = opt._startTime ? (+new Date() - opt._startTime) : 0;
        if (time < 0) {
            time = 0;
        }
        var progress = time / (opt.duration || 1);
        if (sets && sets[opt.prop] === opt) {
            clearTimeout((sets[opt.prop] || {})._runtimer);
            delete sets[opt.prop];
        } else {
            progress = 0;
        }
        if (!progress) {
            return opt.from;
        }
        var str = transitionStr(hash);
        elm.style[TRANSITION_METHOD] = str;
        if (progress < 1) {
            if (timing_functions[opt.easing]) {
                progress = timing_functions[opt.easing](progress, time, 0, 1, opt.duration);
            }
            from = current + d * progress + unit;
        } else {
            from = opt.to;
        }
        setStyleProp(elm, opt.prop, from);
        return from;
    }

    function complete(opt){
        var elm = opt.target,
            hash = elm2hash(elm),
            sets = _transition_sets[hash];
        if (sets) {
            delete sets[opt.prop];
        }
        var str = transitionStr(hash);
        elm.style[TRANSITION_METHOD] = str;
        setStyleProp(elm, opt.prop, opt.to);
    }

    function run(opt){
        if (!opt.prop || opt.from == opt.to) {
            return;
        }
        var elm = opt.target,
            hash = elm2hash(elm);
        opt._startTime = +new Date() + (opt.delay || 0);
        _transition_sets[hash][opt.prop] = opt;
            //console.info('rrrrr', opt.prop, opt.from)
        setStyleProp(elm, opt.prop, opt.from);
        var str = transitionStr(hash);
        opt._runtimer = setTimeout(function(){
            //console.info('cccccc', opt.prop, opt.to)
            delete opt._runtimer;
            elm.style[TRANSITION_METHOD] = str;
            setStyleProp(elm, opt.prop, opt.to);
        }, 0);
    }

    function renderOpt(name, opt){
        var elm = opt.target,
            end = parseFloat(opt.to),
            current = parseFloat(opt.from),
            rid = opt.delay && ('_oz_anim_' + render_id++),
            unit = getUnit(opt.from, opt.to);
        mainloop.addAnimate(name, current, end, opt.duration, {
            easing: opt.easing,
            delay: opt.delay,
            step: function(v){
                setStyleProp(elm, opt.prop, v + unit);
            },
            renderId: rid,
            callback: function(){
                opt.promise.resolve([{
                    target: elm,
                    succ: true
                }]).disable();
            }
        });
        opt._render = mainloop.getRender(rid);
    }

    function getUnit(from, to){
        var from_unit = (from || '').toString().replace(RE_UNIT, ''),
            to_unit = (to || '').toString().replace(RE_UNIT, '');
        return parseFloat(from) === 0 && to_unit 
            || parseFloat(to) === 0 && from_unit 
            || to_unit || from_unit;
    }

    function getStyleValue(node, name){
        if (TRANSFORM_PROPS[name]) {
            return transform(node, name) || 0;
        }
        if (name === TRANSFORM) {
            return node && node.style[
                TRANSFORM_METHOD || name
            ] || TRANSFORM_DEFAULT;
        }
        var method = css_method(name);
        var r = node && (node.style[method] 
            || (_getComputedStyle 
                ? _getComputedStyle(node, '').getPropertyValue(name)
                : node.currentStyle[name]));
        return (r && /\d/.test(r)) && r || 0;
    }

    function css_method(name){
        return name.replace(/-+(.)?/g, function($0, $1){
            return $1 ? $1.toUpperCase() : '';
        }); 
    }

    function splitTransformSet(opt, promise){
        var hash = elm2hash(opt.target),
            combo = _transform_promise[hash];
        if (!combo) {
            combo = _transform_promise[hash] = [];
        }
        combo.push(promise);
        return splitTransformProps(opt);
    }

    function splitTransformProps(opt, fn){
        var split_opts = [], 
            to_lib = parseTransformPropValue(opt.to),
            from_lib = parseTransformPropValue(opt.from) || {};
        Object.keys(to_lib).forEach(function(prop){
            var newopt = _.mix(_.copy(opt), {
                prop: prop,
                from: from_lib[prop],
                to: to_lib[prop]
            });
            delete newopt._origin_from;
            this.push(newopt);
            if (fn) {
                fn(newopt);
            }
        }, split_opts);
        return split_opts;
    }

    function parseTransformPropValue(value){
        var lib = {};
        value.split(RE_PROP_SPLIT).forEach(function(str){
            var kv = str.match(/([^\(\)]+)/g),
                values = kv[1].split(/\,\s*/),
                isSupported = TRANSFORM_PROPS[kv[0]],
                is3D = isSupported === 3,
                isSingle = isSupported < 0 || values.length <= 1,
                xyz = isSingle ? [''] : ['X', 'Y', 'Z'];
            if (!isSupported) {
                return;
            }
            values.forEach(function(v, i){
                if (v && i <= xyz.length && is3D || isSingle && i < 1 || !isSingle && i < 2) {
                    var k = kv[0].replace('3d', '') + xyz[i];
                    this[k] = v;
                }
            }, this);
        }, lib);
        return lib;
    }

    function exports(name){
        return new Stage(name);
    }

    _.mix(exports, {

        VERSION: '2.1.0',
        renderMode: useCSS ? 'css' : 'js',
        Stage: Stage,
        Actor: Actor,

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

    return exports;

});
