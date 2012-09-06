
/* @source lazy_Y.js */;

define("lazy_Y", [
    "lazy_D"
], function(lazy_D){

    return {
        name: 'lazy_Y',
        deps: {
            'lazy_D': lazy_D
        }
    };

});

/* @source lazy_X.js */;

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

/* @source lazy_XY.js */;

define("lazy_XY", [
    "lazy_X",
    "lazy_Y"
], function(lazy_X, lazy_Y){

    return {
        name: 'lazy_XY',
        deps: {
            'lazy_X': lazy_X,
            'lazy_Y': lazy_Y
        }
    };

});
