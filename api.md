# 草稿：oz.js中define的9种使用方法和模块种类 

## define


1. AMD风格，推荐写法，可以直接合并到生产环境的打包文件中，模块可在保持全局唯一的前提下任意命名，不一定要跟script文件的URL相关

    ```javascript

        define('module_name', [
            "host", // 内建模块
            "module_dependency"
        ], function(window, module_dependency, require, exports){
            return { myname: 'yy' };
        });

    ```


2. AMD风格，省略模块命名，用于临时调试或小项目，合并到生产环境之前需借助预处理工具补全模块名 

    ```javascript

        define([
            "host",
            "module_dependency"
        ], function(window, module_dependency, require, exports){
            return { myname: 'yy' };
        });

    ```


3. 异步模块，依赖它的代码会等到finish函数调用后才执行

    ```javascript

        define([
            "finish",
            "module_dependency"
        ], function(finish, module_dependency, require, exports){
            setTimeout(function(){
                exports.myname = 'xx';
                finish({ myname: 'yy' }); //如果finish有参数，会替代原有的exports对象
            }, 1000);
            // 不支持return
        });

    ```


4. 带版本号的模块名，在require或声明依赖时只需要写@前的部分，如果定义过多个版本的同名模块，会自动切换到最新版本。也可以在require时写明特定版本号

    ```javascript

        define('module_name@1.2.4', [], function(require, exports){
            return { myname: 'yy' };
        });

    ```


5. 远程模块，直接映射模块名到任意script文件的URL，URL和模块可以是一对多关系

    ```javascript

        define('module_name', "http://module/path/file");

    ```


6. 声明远程模块的依赖关系能实现script文件的串行下载，等到依赖的所有文件下载完成之后，当前模块的文件才会开始下载（适用于缺少AMD封装的传统script文件，如jquery.mousewheel.js，对于有AMD封装的模块文件，应尽量并行下载）

    ```javascript

        define('module_name', [
            "host",
            "module_dependency"
        ], "http://module/path/file");

    ```


7. 同6，但省略URL，仍然视为远程模块，会基于模块名自动生成URL（参考require用法中的【模块状态1】）

    ```javascript

        define('module_name', [
            "host",
            "module_dependency"
        ]);

    ```


8. CommonJS风格，只有当define的参数不包含依赖数组时才会尝试从模块代码中解析依赖关系，在生产环境中作压缩时需避免替换局部变量"require"

    ```javascript

        define('module_name', function(require, exports){
            var window = require("host");
            var module_dependency = require("module_dependency");
            exports.myname = 'yy'; //也支持return
        });

    ```


9. CommonJS风格，省略模块命名，同2和8

    ```javascript

        define(function(require, exports){
            var window = require("host");
            var module_dependency = require("module_dependency");
            exports.myname = 'yy';
        });

    ```


## require


1. require等同于无命名、会在声明之后立刻执行的模块

    【模块状态1】：如果"module_dependency"事先没有声明过（即没有执行过define），会用baseUrl加上模块名生成URL, 自动声明一个远程模块，之后同【状态2】

    【模块状态2】：如果"module_dependency"已声明为远程模块，会先下载script文件，执行其中的define代码后，再重新监测依赖关系，之后同【状态3】

    【模块状态3】：如果"module_dependency"已声明过代码部分，会先执行模块代码，获得return的对象或exports对象，再执行require的代码块 

    ```javascript

        require.config({
            baseUrl: '../'
        });

        require([
            "module_dependency"
        ], function(module_dependency){

        });

    ```


2. require的参数用法类似define，同样支持CommonJS风格

    ```javascript

        require(function(require){
            var window = require("host");
            var module_dependency = require("module_dependency");
        });

    ```


3. 模块名称前的new!是一个插件，功能是重新执行模块代码，生成新的return对象或exports对象

    ```javascript

        require([
            "new!module_dependency"
        ], function(module_dependency){

        });

    ```


4. require函数执行时的this会被作为内建模块"host"的值，经常用于在iframe页面里调用父页面中已执行过的模块

    ```javascript

        require.call(window, [
            "new!module_dependency"
        ], function(module_dependency){

        });

    ```
