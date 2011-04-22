//console.info(2, oz)
oz.yy = 3;

oz.def('jQuery/1.4.3', 'jQuery-1.4.3.js');
oz.def('jquery-source', '../lib/jquery.js');
oz.def('jquery', ['jquery-source'], function(){ return jQuery; });

oz.def('lang/0.0.1', function(){
	return {
		type: function(obj){
            console.info(obj.toString(), oz.type(obj))
			return oz.type(obj);
		}
	};
});

oz.def('dom', ['event'], function(event, require, exports){
    var zz = require('lang/0.0.1').type;
	exports.dom = {
		yy: function(o){
            console.info("zz", require('lang/0.0.1'))
			return zz(o);
		}
	};
});

oz.def('event', ['lang'], function(lang){
	return { event: {} };
});

oz.def('domEvent/1.1.0', ['exports', 'dom', 'event'], function(exports, dom, event){
	exports.domEvent = {};
});

oz.def('oz/3.0.0', function(require, exports){
    var $ = require("jQuery");
    var ev = require('domEvent/1.1.0');
    var lang  = require("lang");
	exports.xx = function(o){
        var dom = require('dom').dom;
        return dom.yy(o);
	};
});

oz.def('jQuery/1.4.2', [], function(){
	return {};
});

oz.def('moduleA', function(){
	return { A: 1 };
});

oz.def('moduleB', function(){
	return { B: 1 };
});

oz.def('moduleC', function(){
	return { C: 1 };
});
