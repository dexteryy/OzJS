
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

/* @source lazy/B.js */;

define("lazy/B", [
    "B",
    "lazy/D"
], function(B, lazy_D){

    return {
        name: 'lazy/B',
        deps: {
            'B': B,
            'lazy/D': lazy_D
        }
    };

});

/* @source lazy/A.js */;

define("lazy/A", [
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

/* @source lazy/ABC.js */;

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

/* autogeneration */
define("lazy/ABC", ["lazy/A", "lazy/B", "lazy/C"], function(){});
