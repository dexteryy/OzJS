define([
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
