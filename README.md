# OzJS

OzJS is a microkernel for modular javascript, with bundles of powerful yet micro-framework friendly [AMD](http://requirejs.org/docs/whyamd.html) modules.

比[RequireJS](http://requirejs.org/)更早采用所谓AMD风格，简单比较：表面上是接口和用法更简洁、`define`更强大、400行 vs 1222行、3.7K vs 24K，理念上差别更大，改日详述…

`/mods`目录里是可自主搭建WebApp框架的模块库，正逐步开源，一个[真实世界中的例子](http://ww4.sinaimg.cn/large/62651c14jw1dvpfdi27o7j.jpg)。

作者繁忙，文档欠奉，你就先照着RequireJS那样用罢，要了解更多请看范例的源码和教程。

## Tutorials

* [OzJS中define的9种使用方法和模块种类](https://github.com/dexteryy/OzJS/blob/master/api.md)

## Examples

这些例子都写的糙猛快，请看源码

* [Event Module](https://github.com/dexteryy/OzJS/blob/master/tests/test_event.html)
* [Animate Module](https://github.com/dexteryy/OzJS/blob/master/tests/test_animate.html)

## In the Real World

* [Alphatown: A 2D Browser Based Virtual World](http://alphatown.com)
* [BugHunter: A multiplayer "answer first game" or a competition responder system, based on NodeJS and OzJS](https://github.com/dexteryy/BugHunter)

## More References

* [d2forum2010: 通用JS时代的模块机制和编译工具(slide)](http://www.slideshare.net/dexter_yy/js-6228773)
* [d2forum2011: 新版阿尔法城背后的前端MVC实践(slide)](http://www.slideshare.net/dexter_yy/mvc-8554206)

## Changelog

2012-8-30

    oz.js:

    * 远程模块的URL可省略baseUrl
    * 移除旧接口，window.oz仅用于扩展和复用
    * bugfix

    ozma.js:

    * 对于运行时global scope中多个require并行执行的情况，生成更高效的代码
    * bugfix

2012-8-29

    oz.js:

    * 支持传统script文件的串行下载
    * 支持声明远程模块时省略URL
    * 远程模块声明不会覆盖同名的本地模块
    * 模块内的require函数支持单个参数（预先加载依赖）和两个参数的用法（按需加载）
    * 为构建工具提供支持，支持在nodejs环境下使用

    ozma.js:

    * 新的构建工具，取代tuicompiler
    * 在静态分析阶段获取运行时的模块信息和依赖关系
    * 支持为传统script合并自动生成模块声明
    * 支持为匿名模块文件中的代码自动补全模块名
