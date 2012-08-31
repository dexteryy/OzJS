
/* @source lazy_X.js */

define("lazy_X", [
    "lazy_D"
], function(lazy_D){

    return {
        name: 'lazy_X',
        deps: {
            'lazy_D': lazy_D
        }
    };

});

/* @source lazy_Z.js */

define("lazy_Z", [
    "lazy_X",
    "lazy_A"
], function(lazy_X, lazy_A){

    return {
        name: 'lazy_Z',
        deps: {
            'lazy_X': lazy_X,
            'lazy_A': lazy_A
        }
    };

});
