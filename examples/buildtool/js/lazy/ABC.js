// 本文件的目的是生成lazy A、B、C的打包文件，使用其中任一模块时，会预加载其他模块，减少连接时间和请求数
require([
    "lazy/A",
    "lazy/B",
    "lazy/C"
], function(lazy_A, lazy_B, lazy_C){

    console.info('"lazy/ABC" ready!', {
        'lazy/A': lazy_A,
        'lazy/B': lazy_B,
        'lazy/C': lazy_C
    });

});
