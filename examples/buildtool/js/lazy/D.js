define(function(){

    require('lazy/E', function(lazy_E){
        console.info('"lazy/E" in "lazy/D" ready!', lazy_E);
    });

    return {
        name: 'lazy/D',
        deps: {}
    };

});
