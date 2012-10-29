/**
 * using AMD (Asynchronous Module Definition) API with OzJS
 * see http://dexteryy.github.com/OzJS/ for details
 *
 * Copyright (C) 2010-2012, Dexter.Yy, MIT License
 * vim: et:ts=4:sw=4:sts=4
 */
define('mod/mapviewer', [
    'mod/lang', 
    'mod/browsers', 
    'mod/event', 
    "mod/mainloop", 
    "mod/drag"
], function(_, browsers, Event, mainloop, Drag){

    var uuid = 1,
        need_ignore_reflow = browsers.msie && browsers.msie > 8 && browsers.msie < 10
                            || browsers.mozilla && browsers.mozilla < 5;

    function MapViewer(opt){
        this.config = _.mix({
            map: null,
            viewport: null,
            step: false,
            drag: true,
            origin: true,
            event: true
        }, opt);

        var self = this,
            mp = this.map = opt.map,
            vp = this.viewport = opt.viewport;

        this.uuid = ++uuid;

        this.set();
    }

    MapViewer.prototype = {

        set: function(opt){
            if (opt) {
                _.mix(this.config, opt);
            } else {
                opt = this.config;
            }

            var self = this,
                fix,
                vp = this.viewport,
                mp = this.map,
                cfg = this.config,
                o = opt.origin;

            if (opt.event === true) {
                this.event = Event();
            } else if(opt.event) {
                this.event = opt.event;
            }

            if (cfg.edgeWidth) {
                fix = cfg.width - cfg.edgeWidth;
                mp.style.width = cfg.edgeWidth + (fix > 0 ? fix : 0) + 'px';
            }
            if (cfg.edgeHeight) {
                fix = cfg.height - cfg.edgeHeight;
                mp.style.height = cfg.edgeHeight + (fix > 0 ? fix : 0) + 'px';
            }

            if (opt.width || opt.height) {
                vp.style.width = opt.width + "px";
                vp.style.height = opt.height + "px";
                this.event.fire("resize", [opt]);
            }

            if (o === true) {
                o = cfg.origin = [
                    (mp.offsetWidth - vp.offsetWidth) / 2,
                    (mp.offsetHeight - vp.offsetHeight) / 2
                ];
            }
            if (o) {
                vp.scrollLeft = o[0];
                vp.scrollTop = o[1];
            }

            if (opt.drag === true) {
                if (!this.dragOpt) {
                    this.dragOpt = Drag({
                        handler: mp,
                        whenDraging: function(start, end){
                            var vp = self.viewport,
                                x = vp.scrollLeft - end[0] + start[0],
                                y = vp.scrollTop - end[1] + start[1];
                            self.locate(x, y);
                            if (cfg.whenDraging) {
                                cfg.whenDraging([x + vp.offsetWidth / 2, y + vp.offsetHeight / 2], start, end);
                            }
                        }
                    });
                }
                this.dragOpt.enable();
            } else if (this.dragOpt && opt.drag === false){
                this.dragOpt.disable();
            }

        },

        move: function(x, y, duration, effect){
            var vp = this.viewport;
            return this.locate(vp.scrollLeft + x, vp.scrollTop + y, duration, effect);
        },

        locate: function(x, y, duration, effect){
            var self = this,
                vp = this.viewport;
            if (!x) {
                return [
                    vp.scrollLeft + vp.offsetWidth / 2,
                    vp.scrollTop + vp.offsetHeight / 2 
                ];
            }
            if (!duration) {
                if (need_ignore_reflow) {
                    vp.style.visibility = 'hidden';
                }
                vp.scrollLeft = x;
                vp.scrollTop = y;
                if (need_ignore_reflow) {
                    vp.style.visibility = 'visible';
                }
                self.event.fire("moveEnd");
            } else {
                var stage = "mapViewer-" + this.uuid + ":move";
                mainloop.remove(stage).addAnimate(stage, vp.scrollLeft, x, duration, {
                    easing: effect || 'linear',
                    step: function(v){
                        vp.scrollLeft = v;
                    }
                }).addAnimate(stage, vp.scrollTop, y, duration, {
                    easing: effect || 'linear',
                    step: function(v){
                        vp.scrollTop = v;
                    },
                    callback: function(v){
                        mainloop.remove(stage);
                        self.event.fire("moveEnd");
                    }
                }).run(stage);
            }
            return this.event.promise("moveEnd");
        }

    };




    return function(opt){
        return new MapViewer(opt);
    };

});
