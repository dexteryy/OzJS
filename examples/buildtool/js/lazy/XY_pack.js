
/* @source lazy/D.js */;

define("lazy/D", [], function(){

    require('lazy/E', function(lazy_E){
        console.info('"lazy/E" in "lazy/D" ready!', lazy_E);
    });

    return {
        name: 'lazy/D',
        deps: {}
    };

});

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
