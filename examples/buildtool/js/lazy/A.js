define([
    "A",
    "lazy/D"
], function(A, lazy_D){

    // 模块内执行的require不会在主发布文件中增加新的依赖，而是单独生成新的发布文件
    require([
        'lazy/XY', 
        'lazy/Z', 
        'lazy/C',
        'non_AMD/script_1'
    ], function(lazy_XY, lazy_Z, lazy_C){
        console.info('lazy/XY ready!', lazy_XY, lazy_Z, lazy_C);
    });

    return {
        name: 'lazy/A',
        deps: {
            'A': A,
            'lazy/D': lazy_D
        }
    };

});
