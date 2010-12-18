//var oz = require('oz').oz;

console.log('pkg1.js loaded')

oz.def('oz', 'pkg1.js');


oz.def('domEvent/0.9.2', ['dom, event'], function(dom, event){
	return {};
});

oz.def('cookie', ['jQuery'], function($){
	return function(){};
});

oz.def('oz/2.0.0', ['lang'], function(lang){
	return {};
});

oz.require(['oz', 'jQuery'], function(oz, $){
	console.log('require1 go');
	console.info('require1', oz.xx(/y/), $ );
});

oz.require(['require', 'cookie', 'oz'], function(require, cookie){
	console.log('require2 go');
	var $ = require('oz');
	console.info('require2', $, cookie);
});
