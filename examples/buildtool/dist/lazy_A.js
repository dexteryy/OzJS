
/* @source lazy_D.js */

define("lazy_D", function(){

    return {
        name: 'lazy_D',
        deps: {}
    };

});

/* @source lazy_A.js */

define("lazy_A", [
    "A",
    "lazy_D"
], function(A, lazy_D){

    // 模块内执行的require不会在主发布文件中增加新的依赖，而是单独生成新的发布文件
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
