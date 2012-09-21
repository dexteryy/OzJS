
/* @source lazy/C.js */;

define("lazy/C", [
    "C"
], function(C){

    return {
        name: 'lazy/C',
        deps: {
            'C': C
        }
    };

});


/* @source lazy/X.js */;

define("lazy/X", [
    "lazy/C"
], function(lazy_C){

    return {
        name: 'lazy/X',
        deps: {
            'lazy/C': lazy_C
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
