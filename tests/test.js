//var oz = require('oz').oz;

console.log('pkg1.js loaded')

oz.def('oz', 'pkg1.js');
oz.def('moduleA', 'pkg1.js');
oz.def('moduleB', 'pkg1.js');
oz.def('moduleC', 'pkg1.js');


oz.def('domEvent/0.9.2', ['dom, event'], function(dom, event){
	return {};
});

oz.def('cookie', ['jQuery'], function($){
	return function(){};
});

oz.def('oz/2.0.0', ['lang'], function(lang){
	return {};
});


oz.require(['moduleA', 'moduleB'], function(A, B){
	console.info('A and B: ', A, B);
});

oz.require(['oz', 'jQuery'], function(oz, $){
	console.log('require1 go');
	console.info('require1', oz.xx(/y/), $ );
});

oz.declare(function(require){
	console.log('require2 go');
    var cookie = require("cookie");
	var $ = require('oz');
	console.info('require2', $, cookie);
});

oz.require(['moduleB', 'moduleC'], function(B, C){
	console.info('B and C: ', B, C);
});
