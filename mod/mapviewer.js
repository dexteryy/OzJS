/**
 * @import lib/oz.js
 * @import mod/lang.js
 * @import mod/event.js
 * @import mod/mainloop.js
 * @import mod/drag.js
 */
define('mod/mapviewer', [
    'mod/lang', 
    'mod/event', 
    "mod/mainloop", 
    "mod/drag"
], function(_, Event, mainloop, Drag){

    var uuid = 1;

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
                vp = this.viewport,
                mp = this.map,
                o = opt.origin;

            if (opt.event === true) {
                this.event = Event();
            } else if(opt.event) {
                this.event = opt.event;
            }

            if (opt.width || opt.height) {
                vp.style.width = opt.width + "px";
                vp.style.height = opt.height + "px";
                this.event.fire("resize", [opt]);
            }

            if (o === true) {
                o = this.config.origin = [
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
                            var vp = self.viewport;
                            self.locate(
                                vp.scrollLeft - end[0] + start[0],
                                vp.scrollTop - end[1] + start[1]
                            );
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
                vp.scrollLeft = x;
                vp.scrollTop = y;
                self.event.fire("moveEnd");
            } else {
                var stage = "mapViewer-" + this.uuid + ":move";
                mainloop.animate(stage, vp.scrollLeft, x, duration, {
                    easing: effect || 'linear',
                    step: function(v){
                        vp.scrollLeft = v;
                    }
                }).animate(stage, vp.scrollTop, y, duration, {
                    easing: effect || 'linear',
                    step: function(v){
                        vp.scrollTop = v;
                    },
                    callback: function(v){
                        mainloop.remove(stage);
                        self.event.fire("moveEnd");
                    }
                });
            }
            return this.event.promise("moveEnd");
        }

    };




    return function(opt){
        return new MapViewer(opt);
    };

});
