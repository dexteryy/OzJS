
/* @source lazy_C.js */

define("lazy_C", [
    "C"
], function(C){

    return {
        name: 'lazy_C',
        deps: {
            'C': C
        }
    };

});


/* @source lazy_D.js */

define("lazy_D", function(){

    return {
        name: 'lazy_D',
        deps: {}
    };

});

/* @source lazy_B.js */

define("lazy_B", [
    "B",
    "lazy_D"
], function(B, lazy_D){

    return {
        name: 'lazy_B',
        deps: {
            'B': B,
            'lazy_D': lazy_D
        }
    };

});

/* @source lazy_A.js */

define("lazy_A", [
    "A",
    "lazy_D"
], function(A, lazy_D){

    require([
        'lazy_XY', 
        'lazy_Z', 
        'lazy_C',
        'non-AMD_script_1'
    ], function(lazy_XY, lazy_Z, lazy_C){
        console.info('lazy_XY ready!', lazy_XY, lazy_Z, lazy_C);
    });

    return {
        name: 'lazy_A',
        deps: {
            'A': A,
            'lazy_D': lazy_D
        }
    };

});

/* @source lazy_ABC.js */

require([
    "lazy_A",
    "lazy_B",
    "lazy_C"
], function(lazy_A, lazy_B, lazy_C){

    console.info('lazy_ABC ready!', {
        'lazy_A': lazy_A,
        'lazy_B': lazy_B,
        'lazy_C': lazy_C
    });

});

/* autogeneration */
define("lazy_ABC", ["lazy_A", "lazy_B", "lazy_C"], function(){});
