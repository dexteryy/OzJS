/**
 * @import lib/oz.js
 * @import mod/lang.js
 */
define("mainloop", ["lang"], function(_){

    var ANIMATE_FRAME = "RequestAnimationFrame",
        LONG_AFTER = 4000000000000,

        animateFrame = window['webkit' + ANIMATE_FRAME] || 
            window['moz' + ANIMATE_FRAME] || 
            window['o' + ANIMATE_FRAME] || 
            window['ms' + ANIMATE_FRAME],
        suid = 1,
        fps_limit = 0,
        activeStages = [],
        stageLib = {},

        _default_easing = {
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

        _default_config = {
            fps: 0,
            easing: _default_easing
        };

    function loop(timestamp){
        for (var i = 0, stage, l = activeStages.length; i < l; i++) {
            stage = activeStages[i];
            if (stage) {
                if (timestamp - stage.lastLoop >= fps_limit) {
                    stage.lastLoop = timestamp;
                    stage.renders.call(stage, timestamp);
                }
            }
        }
    }

    var mainloop = {

        config: function(opt){
            _.config(this, opt, _default_config);
            if (opt.fps) {
                fps_limit = this.fps ? (1000/this.fps) : 0;
            }
            if (opt.easing) {
                this.easing = _.mix(_default_easing, this.easing, opt.easing);
            }
            return this;
        },

        run: function(name){
            if (name) {
                var stage = stageLib[name];
                if (stage && !stage.state) {
                    stage.state = 1;
                    activeStages.push(stage);
                }
                if (this.globalSignal) {
                    return this;
                }
            }

            var self = this,
                frameFn = animateFrame,
                clearInterv = clearInterval,
                _loop = loop,
                timer,
                signal = ++suid;

            this.globalSignal = 1;

            function step(timestamp){
                if (suid === signal) {
                    if (!frameFn) {
                        timestamp = +new Date();
                    }
                    _loop(timestamp);
                    if (self.globalSignal) {
                        if (frameFn) {
                            frameFn(step);
                        }
                    } else {
                        clearInterv(timer);
                    }
                }
            }

            if (frameFn) {
                frameFn(step);
            } else {
                timer = setInterval(step, 15);
            }
            return this;
        },

        pause: function(name){
            if (name) {
                var n = activeStages.indexOf(stageLib[name]);
                if (n >= 0) {
                    activeStages.splice(n, 1);
                    stageLib[name].state = 0;
                    stageLib[name].pauseTime = +new Date();
                }
            } else {
                this.globalSignal = 0;
            }
            return this;
        },

        complete: function(name){
            var stage = stageLib[name];
            if (stage) {
                stage.renders.call(stage, LONG_AFTER);
                return this.remove(name);
            }
            return this;
        },

        remove: function(name, fn){
            if (fn) {
                if (stageLib[name]) {
                    stageLib[name].renders.clear(fn);
                }
            } else {
                this.pause(name);
                delete stageLib[name];
            }
            return this;
        },

        info: function(name){
            return stageLib[name];
        },

        addStage: function(name, ctx){
            if (name) {
                stageLib[name] = {
                    name: name,
                    ctx: ctx,
                    state: 1,
                    lastLoop: 0,
                    pauseTime: 0,
                    renders: _.fnQueue()
                };
                activeStages.push(stageLib[name]);
            }
            return this;
        },

        addRender: function(name, fn, ctx){
            if (!stageLib[name]) {
                this.addStage(name, ctx);
            }
            stageLib[name].renders.push(fn);
            return this;
        },

        animate: function(name, current, end, duration, opt){
            var self = this;
            if (opt.delay && !opt.delayed) {
                var args = arguments;
                if (!stageLib[name]) {
                    this.addStage(name);
                }
                setTimeout(function(){
                    opt.delayed = true;
                    self.animate.apply(self, args);
                }, opt.delay);
                return this;
            }
            if (duration) {
                opt.step(current, 0);
            } else {
                opt.step(end, 0);
                if (opt.callback) {
                    setTimeout(function(){
                        opt.callback();
                    }, 0);
                }
                return this;
            }
            var easing = opt.easing,
                start = +new Date(),
                lastPause = 0,
                d = end - current;
            function render(timestamp){
                if (lastPause !== this.pauseTime && start < this.pauseTime) {
                    lastPause = this.pauseTime;
                    start += +new Date() - lastPause;
                }
                var v, time = timestamp - start,
                    p = time/duration;
                if (time <= 0) {
                    return;
                }
                if (p < 1) {
                    if (easing) {
                        p = self.easing[easing](p, time, 0, 1, duration);
                    }
                    if (d < 0) {
                        p = 1 - p;
                        v = end + -1 * d * p;
                    } else {
                        v = current + d * p;
                    }
                }
                if (time >= duration) {
                    opt.step(end, duration);
                    self.remove(name, render);
                    if (opt.callback) {
                        opt.callback();
                    }
                } else {
                    opt.step(v, time);
                }
            }
            return this.addRender(name, render);
        }

    };

    return mainloop;

});
