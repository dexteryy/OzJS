
/* @source lazy/Y.js */;

define("lazy/Y", [
    "lazy/D"
], function(lazy_D){

    return {
        name: 'lazy/Y',
        deps: {
            'lazy/D': lazy_D
        }
    };

});

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

/* @source lazy/XY.js */;

define("lazy/XY", [
    "lazy/X",
    "lazy/Y"
], function(lazy_X, lazy_Y){

    return {
        name: 'lazy/XY',
        deps: {
            'lazy/X': lazy_X,
            'lazy/Y': lazy_Y
        }
    };

});
