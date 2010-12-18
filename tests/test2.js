oz.def("a", ['require', 'b'], function(require, b){
	console.info('b', b)
    return {
		b: function(){
			var b = require('b');
			console.info('bb', b)
		},
        color: "red",
        size: "unisize"
    };
});

oz.def("b", ['a'], function(a){
	console.info('a', a)
	a.b();
    return {
		a: 1
    };
});

oz.def('c.js');
oz.def('d.js');

oz.require(["a", "b", "c.js", "d.js"], function(a, b, c, d){
	console.info(a, b, c, d);
});
