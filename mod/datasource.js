/**
 * @import lib/oz.js
 * @import mod/network.js
 * @import mod/template.js
 */
define("dataSource", ["network", "template"], function(net, tpl){

    var floor = Math.floor,

        _need_update = false,
    
        _default_config = {
            root: "",
            remote: "",
            post: false,
            data: {},
            filter: function(){},
            expire: 0, 
            charset: "utf-8",
            mock: false,  
            callback: "",
            error: function(){}
        };


    var Source = function(option){
        this.cbDict = {};
        this._config = {};
        this.config(option);
    };

    Source.prototype = {

        config: function(n) {
            var d = _default_config,
                cfg = this._config;
            for (var i in d) {
                cfg[i] = n.hasOwnProperty(i) ? n[i] : d[i];
            }
        },

        set: function(opt){
            var d = _default_config,
                cfg = this._config;
            for (var i in opt) {
                if (!d.hasOwnProperty(i)) {
                    cfg[i] = opt[i];
                }
            }
        },

        get: function(param, cb){
            var self = this,
                cbDict = this.cbDict,
                cfg = this._config,
                url = tpl.format(cfg.root + cfg.remote, param),
                now = +new Date(),
                cbname = cfg.callback;
            if (cfg.mock) {
                cbDict[url] = cfg.mock;
            }
            if (cbname) {
                cbname = cbDict[url];
                if (cbname) {
                    var lastdate = parseInt(cbname.split("______")[2]);
                    if (_need_update || now - lastdate >= cfg.expire*3600000) {
                        cbname = false;
                    }
                }
                if (!cbname) {
                    cbname = cbDict[url] = [cfg.callback, floor(Math.random()*10000), now].join("______");
                }
            }
            //console.log("\n\n", url, _need_update, "\n\n");
            //console.info(cbname)
            _need_update = false;

            var tm_str = 'oz_tm=' + encodeURIComponent(cbname);

            if (cfg.post) {
                url = url.split(/\?/);
                url[0] += /\?/.test(url[0]) ? '&' + tm_str : '?' + tm_str;
                net.ajax({
                    type: "POST",
                    url: url[0],
                    data: [url[1], net.params(cfg.data)].join("&"),
                    dataType: "json",
                    success: dataHandler
                });
            } else {
                url += /\?/.test(url) ? '&' + tm_str : '?' + tm_str;
                net.getJSON(url, {}, dataHandler, {
                    charset: cfg.charset,
                    callback: cbname,
                    error: cfg.error
                });
            }

            function dataHandler(json){
                if (json) {
                    var data = self.make(param, json);
                    if (cb) {
                        cb(data);
                    }
                } else {
                    cfg.error(json);
                }
            }
        },

        update: function(param, cb){
            _need_update = true;
            if (param) {
                this.get(param, cb);
            } else {
                this.cbDict = {};
                if (cb) {
                    cb();
                }
            }
        },

        make: function(param, origin){
            var data,
                cfg = this._config;
            if (cfg.filter) {
                data = cfg.filter(param, origin);
            }
            return data || origin;
        }
    };

    return function(option){
        return new Source(option);
    };

});
