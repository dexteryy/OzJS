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
