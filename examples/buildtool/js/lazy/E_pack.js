
/* @source lazy/C.js */;

define("lazy/C", [
    "C"
], function(C){

    return {
        name: 'lazy/C',
        deps: {
            'C': C
        }
    };

});


/* @source lazy/E.js */;

define("lazy/E", ["C", "lazy/C", "lazy/D"], function(__oz0, __oz1, __oz2, require){

    var C = require('C');
    var lazy_C = require('lazy/C');
    var lazy_D = require('lazy/D');

    return {
        name: 'lazy/E',
        deps: {
            'C': C,
            'lazy/C': lazy_C,
            'lazy/D': lazy_D
        }
    };

});
