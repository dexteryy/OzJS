define([
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
