# OzJS

OzJS is a microkernel for modular javascript, with bundles of powerful yet [micro-framework friendly AMD modules](http://github.com/dexteryy/OzJS/blob/master/mod/).

oz.js是一个比RequireJS历史更悠久的AMD/浏览器端模块实现，表面上用法类似，只是443行 vs 1232行、5K vs 24K的区别，实践中oz的设计和实现能带来更强大的能力和更便捷的体验，理念上则差别更大，改日详述…XD

`/mods`目录下是可自主搭建WebApp框架的模块库，正在[逐个发布和完善文档](http://github.com/dexteryy/OzJS/blob/master/mod/)，一个[真实世界中的例子](http://ww4.sinaimg.cn/large/62651c14jw1dvpfdi27o7j.jpg)。

`/examples`相当于文档。


## Tutorials

* [OzJS中define的9种使用方法和模块种类](http://github.com/dexteryy/OzJS/blob/master/api.md)
* [Ozma.js: Autobuild tool for OzJS based WebApp](http://dexteryy.github.com/OzJS/examples/buildtool/index.html)

## Examples (with docs)

例子都写的糙猛快，信息量都在源码里

* OzJS Builder (Ozma.js): [usage](http://dexteryy.github.com/OzJS/examples/buildtool/index.html) [demo1](http://dexteryy.github.com/OzJS/examples/buildtool/demo1.html) [demo2](http://dexteryy.github.com/OzJS/examples/buildtool/demo2.html) [demo3](http://dexteryy.github.com/OzJS/examples/buildtool/demo3.html) [demo4](http://dexteryy.github.com/OzJS/examples/buildtool/demo4.html)
* mod/lang: [demo](http://dexteryy.github.com/OzJS/examples/lang/index.html) 
* mod/event: [demo](http://dexteryy.github.com/OzJS/examples/event/index.html) 
* mod/animate: [demo](http://dexteryy.github.com/OzJS/examples/animate/index.html) 

## In the Real World

* [Alphatown](http://alphatown.com) *2D browser based virtual world*
* [Douban Reader](http://read.douban.com/reader) *Web browser based e-book reader*
* [Douban's contributor system](http://read.douban.com/submit/) *Online self-publishing tool for Douban Reader*
* [Bubbler](http://bubbler.labs.douban.com/) *Webapp to explore social music technology*
* [BugHunter](https://github.com/dexteryy/BugHunter) *Multiplayer "answer first game" or a competition responder system, based on NodeJS and OzJS*

## More References

* [d2forum2010: 通用JS时代的模块机制和编译工具(slide)](http://www.slideshare.net/dexter_yy/js-6228773)
* [d2forum2011: 新版阿尔法城背后的前端MVC实践(slide)](http://www.slideshare.net/dexter_yy/mvc-8554206)


## Changelog

* `mod/lang` 增加示例
* `Ozma.js` 1.1.0 发布，`npm`可更新
* `Ozma.js`对动态加载模块的多路径依赖问题提供完善的构建支持，[用例演示](http://github.com/dexteryy/OzJS/blob/master/examples/buildtool/js/app.js)
* `Ozma.js` 支持第三方包管理系统`Jam`，[示例和用法](http://dexteryy.github.com/OzJS/examples/buildtool/demo4.html)
* `Oz.js`默认启用`define.amd`，`Ozma.js`能更好的解析非AMD文件。
* bugfix: `Oz.js`的`new!`插件
