define([
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
