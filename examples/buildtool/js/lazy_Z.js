define([
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
