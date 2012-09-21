define([
    "A",
    "lazy/D"
], function(A, lazy_D){

    // 模块内执行的require不会在主发布文件中增加新的依赖，而是单独生成新的发布文件
    require([
        'lazy/Z', 
        'non_AMD/script_1'
    ], function(lazy_Z){
        console.info('"lazy/Z" in "lazy/A" ready!', lazy_Z);
    });

    return {
        name: 'lazy/A',
        deps: {
            'A': A,
            'lazy/D': lazy_D
        }
    };

});
