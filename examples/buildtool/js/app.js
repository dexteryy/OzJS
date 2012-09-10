define([
    "A",
    "B"
], function(A, B){

    // 模块内执行的require不会在主发布文件中增加新的依赖，而是单独生成新的发布文件
    require('lazy/A', function(lazy_A){
        console.info('lazy/A ready!', lazy_A);
    });

    require('non_AMD/script_1', function(){
        console.info('non_AMD/script_1 ready!');
    });

    return {
        name: 'app',
        deps: {
            'A': A,
            'B': B
        }
    };

});
