
// 这里的配置也会被构建工具读取，所以不适合写在html的inline script中
require.config({
    // 仅用于运行时和oz.js，构建工具需要另外的baseUrl配置（见ozconfig_standalone.json）
    baseUrl: 'js/',
    // 相对baseUrl的路径，可在远程模块声明的参数中使用（不可在模块名中使用）
    // 构建工具也会重用此处的配置，所以在配置文件中可省略
    aliases: {
        "lib": "../lib/",
        "external": "../../../lib/"
    },
    // 因为此处没有配置distUrl，构建后的发布文件会存放在同级目录下，并自动改名
    // 这个选项可以让oz.js在动态加载远程模块时也对url作自动改名，获取构建后的文件
    // 这个选项的功能是有局限的，一般只用于本地快速调试，如果发布文件在CDN里有特殊的URL，需要在html里配置（见demo1.html底部)
    enableAutoSuffix: true
});

// 不支持AMD的传统脚本文件，打包入发布文件时会自动生成AMD声明
// 此处声明远程模块的方式在文档api.md里有说明。
define('non_AMD/script_1', ['non_AMD/script_2']);

// 确保发布文件中jquery插件的代码位于jquery代码之后
// 构建工具会将{lib}和{external}替换为aliases中配置的相对路径
define('lib/jquery.mousewheel', ['lib/jquery_src'], '{lib}jquery.mousewheel.js');
define('lib/jquery_src', '{external}jquery_src.js');

// 与文件无关的named module声明，缺少这项声明时，构建工具会警告Undefined module
define('domain', function(){
    return window._main_domain_;
});

// 全局作用域下的require会触发构建，构建工具会基于require所处文件生成发布文件，并将依赖的所有文件按顺序打包到发布文件中。
// 如果打包进来的文件中也包含全局作用域下的require，会将所有依赖累加在一起
require([
    'lib/jquery',
    'app'
], function($, app){

    console.info('app ready!', app);

    // 模块内执行的require不会在主发布文件中增加新的依赖，而是单独生成新的发布文件
    // 此处利用了这个特性和html中定义的全局变量，在运行时环境中会被忽略，而在静态环境中会让构建工具生成lazy_ABC的打包文件
    if (!window._main_domain_) {
        require('lazy/ABC', function(lazy_A){
            console.info('(for nodejs) lazy/ABC ready!', lazy_A);
        });
    }

});


