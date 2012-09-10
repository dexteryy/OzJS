
/* @source lazy/X.js */;

define("lazy/X", [
    "lazy/D"
], function(lazy_D){

    return {
        name: 'lazy/X',
        deps: {
            'lazy/D': lazy_D
        }
    };

});

/* @source lazy/Z.js */;

define("lazy/Z", [
    "lazy/X",
    "lazy/A"
], function(lazy_X, lazy_A){

    return {
        name: 'lazy/Z',
        deps: {
            'lazy/X': lazy_X,
            'lazy/A': lazy_A
        }
    };

});
