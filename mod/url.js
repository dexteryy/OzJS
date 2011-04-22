/**
 * @author Dexter.Yy (dexter.yy at gmail.com)
 */
oz.def("url", function(){

    function hashRoute(route, handler){
        var rule = Array.isArray(route) ? route[0] : route;
        if (typeof rule === "object") {
            for (var i in route) {
                hashRoute.call(this, i, route[i]);
            }
        }
        if (typeof rule !== "string") {
            return false;
        }
        var hash = this.win.location.hash,
            re_route = "^#!?" + (rule && rule.replace(/\/?$/, '/?').replace(/:\w+/g, '([^\/]+)') || "") + "(\\?.*|$)",
            args = hash.match(new RegExp(re_route));
        if (!args) {
            if (hash !== rule) {
                return rule !== route && hashRoute.call(this, route.slice(1), handler) || false;
            } else {
                args = [""];
            }
        }
        var params = {},
            kv = args.pop().replace(/^\?/, '').split(/&/);
        for (var i = 0, a, l = kv.length; i < l; i++) {
            a = kv[i].split("=");
            params[a[0]] = a[1];
        }
        args[0] = params;
        handler.apply(this, args);
        return true;
    }

    function URLkit(win, opt){
        var self = this;
        this.win = win;
        this._route_config = [];
        this._hash_cache = "";
        this.handler = function(){
            self._route_config.forEach(function(args){
                hashRoute.apply(self, args);
            });
        };
    }

    URLkit.prototype = {
        listen: function(){
            var self = this,
                docmode = document.documentMode;
            if ('onhashchange' in this.win && ( docmode === undefined || docmode > 7 )) {
                this.win.addEventListener("hashchange", this.handler, false);
                this.handler();
            } else {
                this.timer = setInterval(function(){
                    if (self.win.location.hash === self._hash_cache) {
                        return;
                    }
                    self._hash_cache = self.win.location.hash;
                    self.handler();
                }, 100);
            }
            return this;
        },
        stop: function(){
            this.win.removeEventListener("hashchange");
            clearInterval(this.timer);
            return this;
        },
        route: function(){
            this._route_config.push(arguments);
            return this;
        }
    };

    return function(win, opt){
        return new URLkit(win, opt);
    };
});
