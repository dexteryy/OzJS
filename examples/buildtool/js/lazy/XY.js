define([
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
