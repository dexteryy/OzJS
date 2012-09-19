/**
 * Copyright (C) 2011, Dexter.Yy, MIT License
 */
define("mod/datasource", ["mod/lang", "mod/network", "mod/template"], function(_, net, tpl){

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
        this._memData = {};
        this.config(option);
    };

    Source.prototype = {

        config: function(n) {
            _.config(this._config, n, _default_config);
        },

        get: function(param, cb){
            var self = this,
                cbDict = this.cbDict,
                cfg = this._config,
                url = tpl.format(cfg.root + cfg.remote, param),
                now = +new Date(),
                cbname = cfg.callback;
            var memData = this._memData[url];
            if (memData) {
                if (_need_update) {
                    delete this._memData[url];
                } else {
                    setTimeout(function(){
                        dataHandler(memData);
                    }, 0);
                    return;
                }
            }
            if (cfg.mock) {
                cbDict[url] = cfg.mock;
            }
            if (cbname) {
                cbname = cbDict[url];
                if (cbname) {
                    var lastdate = parseInt(cbname.split("______")[2], 10);
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
            if (_need_update) {
                _need_update = false;
                if (cb) {
                    cb();
                }
                return;
            }

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
                    if (cb && data) {
                        cb(data);
                    }
                } else {
                    cfg.error(json);
                }
            }
        },

        update: function(param, cb){
            if (param) {
                _need_update = true;
                this.get(param, cb);
            } else {
                this.cbDict = {};
                this._memData = {};
                if (cb) {
                    cb();
                }
            }
        },

        put: function(param, data){
            var cfg = this._config,
                url = tpl.format(cfg.root + cfg.remote, param);
            this._memData[url] = data;
        },

        make: function(param, origin){
            var data,
                cfg = this._config;
            if (cfg.filter) {
                data = cfg.filter(param, origin);
            }
            return data === false ? false : (data || origin);
        }
    };

    return function(option){
        return new Source(option);
    };

});
