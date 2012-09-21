define([
    "A",
    "B"
], function(A, B){

    // 模块内执行的require不会在主发布文件中增加新的依赖，而是单独生成新的发布文件
    // 当模块内包含多处require时，他们的依赖关系会分别计算，不会互相干扰。
    require('lazy/A', function(lazy_A){
        console.info('"lazy/A" in "app" ready!', lazy_A);
    });

    // 这里的'lazy/XY'和'lazy/A'演示了动态加载模块在构建中的“路径”问题
    // 'lazy/XY'和'lazy/A'在构建后都将依赖'lazy/D'，而'lazy/D'会再次动态加载'lazy/E'
    // 假设在产品代码中'lazy/XY'和'lazy/A'的调用顺序不确定，则'lazy/E'的发布文件需要能使用两种依赖关系链
    // 所以'lazy/E'的发布文件中需要包含两种依赖关系的合集
    // 在本示例中意味着要包含'lazy/C'，即使'lazy/XY'的发布文件已经包含'lazy/C'
    require('lazy/XY', function(lazy_XY){
        console.info('"lazy/XY" in "app" ready!', lazy_XY);
    });

    require('non_AMD/script_1', function(){
        console.info('"non_AMD/script_1" in "app" ready!');
    });

    return {
        name: 'app',
        deps: {
            'A': A,
            'B': B
        }
    };

});
