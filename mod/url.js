/**
 * @import lib/oz.js
 * @import mod/lang.js
 * @import mod/browsers.js
 */
define("url", ["lang", "browsers"], function(_, browsers){

    var encode = encodeURIComponent,
        decode = decodeURIComponent;

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
        var hash = this.getHash(),
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
            if (a[0]) {
                params[a[0]] = a[1];
            }
        }
        args[0] = params;
        handler.apply(this, args);
        return true;
    }

    /**
     * @return {array}  例如"#!/page/1/?name=yy&no=3"
     *                  返回值为[{ "name": "yy", "no": "3" }, "page", "1"]
     */
    function parse(s){
        s = /#/.test(s) ? s.replace(/.*?#!?\/?/, "") : '';
        if (!s)
            return [{}];
        s = s.split('/');
        var kv, p = {}, hasParam,
            o = s.pop(),
            prule = /\?.*/,
            kvrule = /([^&=\?]+)(=[^&=]*)/g;
        if (o) {
            var end = o.replace(prule, '');
            if (/=/.test(o)) {
                if (end && prule.test(o)) {
                    s.push(end);
                }
                while (kv = kvrule.exec(o)) {
                    p[kv[1]] = kv[2].substr(1);
                }
            } else {
                s.push(end);
                p = {};
            }
            s.unshift(p);
        }
        return s;
    }

    function param(obj){
        obj = $.isArray(obj) ? obj.slice() : [obj];
        var s = obj.shift(), o = [];
        obj = obj.filter(function(a){ return a !== ""; });
        for (var k in s) {
            if (k) {
                o.push(k + '=' + s[k]);
            }
        }
        if (o.length) {
            obj.push('?' + o.join("&"));
        }
        return obj.join('/');
    }

    function URLkit(win, opt){
        var self = this;
        opt = opt || {};
        opt.win = win;
        this.set(opt);
        this._route_config = [];
        this._hash_cache = false;
        this.handler = function(){
            var succ;
            self._route_config.forEach(function(args){
                succ = hashRoute.apply(self, args);
            });
            if (!succ) {
                self._defaultHandler.apply(self, self.parse(self.getHash()));
            }
        };
    }

    URLkit.prototype = {

        set: function(opt){
            this.win = opt.win || window;
            this.location = opt.location || this.win.location;
            return this;
        },

        getHash: function(){
            return this.location.hash || "#";
        },

        listen: function(){
            var self = this,
                w = this.win,
                docmode = document.documentMode;
            if ('onhashchange' in w  && (docmode === undefined || docmode > 7)) {
                if ('addEventListener' in w) {
                    w.addEventListener("hashchange", this.handler, false);
                } else {
                    w.attachEvent("onhashchange", this.handler);
                }
                this.handler();
            } else {
                (function(){
                    if (self.getHash() !== self._hash_cache) {
                        self._hash_cache = self.getHash();
                        self.handler();
                    }
                    self.timer = setTimeout(arguments.callee, 100);
                })();
            }
            return this;
        },

        stop: function(){
            this.win.removeEventListener("hashchange");
            clearInterval(this.timer);
            return this;
        },

        route: function(route, handler){
            if (route === "default") {
                this._defaultHandler = handler;
            } else {
                this._route_config.push([route, handler]);
            }
            return this;
        },

		hash: function(name, value, disableBack){
			var params, data, n,
				isMuti = typeof name === 'object',
				loc = this.location,
                loc_hash = this.getHash(),
                hash = this.parse(loc_hash),
				l = hash.length;
			if (isMuti) {
				data = name;
				disableBack = value;
			} else {
				data = {};
				data[name] = value;
			}
			if (isMuti || value !== undefined) {
				params = hash[0];
                var isEmpty = true;
				for (var i in data) {
                    isEmpty = false;
					name = encode(i);
					value = data[i] ? encode(data[i]) : "";
                    n = parseInt(name);
					if (n != name) {
                        if (!value) {
                            delete params[name];
                        } else {
                            params[name] = value;
                        }
					} else if (n >= 0) {
						hash[n + 1] = value;
					}
				}
                if (isEmpty) {
                    return;
                }
                var hashstr = /#!?\/?/.exec(loc_hash)[0] + this.param(hash),
                    chref = loc.href.replace(/#.*/, "");
				if (disableBack) {
					loc.replace(chref + hashstr);
				} else {
					loc.href = chref + hashstr;
				}
			} else {
                n = parseInt(name);
				if (n != name) {
                    var v = hash[0][name];
					return v && decode(v);
				} else if (n >= 0) {
					return decode(hash[n + 1]);
				}
			}
		},

        parse: parse,
        param: param
    };

    if (browsers.msie && browsers.msie < 7) {
        URLkit.prototype.getHash = function(){
            return this.location.href.replace(/.+#/, '#');
        };
    }

    var exports = function(win, opt){
        return new URLkit(win, opt);
    };

    exports.parse = parse;
    exports.param = param;

    return exports;

});
