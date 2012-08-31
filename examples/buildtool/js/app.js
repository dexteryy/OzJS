define([
    "A",
    "B"
], function(A, B){

    require('lazy_A', function(lazy_A){
        console.info('lazy_A ready!', lazy_A);
    });

    require('non-AMD_script_1', function(){
        console.info('non-AMD_script_1 ready!');
    });

    return {
        name: 'app',
        deps: {
            'A': A,
            'B': B
        }
    };

});
