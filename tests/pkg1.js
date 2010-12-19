//console.info(2, oz)
oz.yy = 3;

oz.def('jQuery/1.4.3', 'jQuery-1.4.3.js');

oz.def('lang', [], function(){
	return {
		type: function(obj){
			return oz.type(obj);
		}
	};
});

oz.def('dom', ['require', 'exports', 'event', 'lang'], function(require, exports, event){
	exports.dom = {
		yy: function(o){
			var zz = require('lang').type;
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

oz.def('oz/3.0.0', ['require', 'jQuery', 'domEvent/1.1.0', 'lang'], function(require, $, domEvent, lang){
	return {
		xx: function(o){
			var dom = require('dom').dom;
			return dom.yy(o);
		}
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
