# OzJS

OzJS is NOT yet another script loader, but a microkernel provides sorely-missing module mechanism at runtime (that means it mainly works at language-level, not file-level. Use [`ozma.js`](http://dexteryy.github.com/OzJS/examples/buildtool/index.html) to process files statically at build time based on the same mechanism) for large/complex javascript program, compatibles with de facto standard ([AMD](https://github.com/amdjs/amdjs-api/wiki/AMD), [NodeJS/CommonJS](http://www.commonjs.org/specs/modules/1.0/) and traditional [module pattern](http://www.adequatelygood.com/2010/3/JavaScript-Module-Pattern-In-Depth)). 

Even better, it was implemented earlier than well-kown RequireJS, so there's differences in philosophy and approach between [similar APIs](http://github.com/dexteryy/OzJS/blob/master/api.md), which bring more value. 

The API and code of `oz.js` are minimalist and stable. It won’t add new features that aren't truly needed (It's absolutely bad practice to meet new requirements through new configuration option or new plugin for a module mechanism provider!). The Oz project now focuses on providing bundles of powerful yet [micro-framework friendly AMD modules](http://github.com/dexteryy/OzJS/blob/master/mod/README.md).

OzJS才不是神马脚本加载器呢！人家是一个在浏览器端运行时中（就是说它主要服务于语言层级，而不是文件层级。[`ozma.js`](http://dexteryy.github.com/OzJS/examples/buildtool/index.html)可以在静态构建环节中基于同等机制更好的处理文件）为大型或复杂JS程序提供长期以来严重缺失（你懂得！）的模块机制的微！内！核！它兼容当前的事实标准（[AMD](https://github.com/amdjs/amdjs-api/wiki/AMD)，[NodeJS/CommonJS](http://www.commonjs.org/specs/modules/1.0/) 和传统的 [module pattern](http://www.adequatelygood.com/2010/3/JavaScript-Module-Pattern-In-Depth)）。

更妙的是！它比大名鼎鼎的RequireJS实现的更早！所以虽然表面上[用法类似](http://github.com/dexteryy/OzJS/blob/master/api.md)，只是443行 vs 1232行、5K vs 24K的区别，实践中oz的设计和实现能带来更强大的能力和更便捷的体验，理念上则差别更大，改日详述…XD 

`oz.js`的API和代码都是极简和稳定的，不会轻易加新功能（对一个实现模块机制的库来说，通过加入新配置选项或新插件的方式来满足新需求是多么可怕的故事啊！）。Oz项目现在专注于开发一大票能用于自由组合微框架、便于搭建WebApp的通用模块，代码都在`/mod`目录里，正在[逐个发布和完善文档](http://github.com/dexteryy/OzJS/blob/master/mod/README.md)，一个[真实世界中的例子](http://ww4.sinaimg.cn/large/62651c14jw1dvpfdi27o7j.jpg)。

## Getting Started

Download [oz.js](https://raw.github.com/dexteryy/OzJS/master/oz.js)

Maybe you also need a domReady module: [domready.js](https://github.com/dexteryy/OzJS/blob/master/mod/domready.js)

Put them into your project directory, like `./js/lib` and `./js/mod` 

In your web page:

```html
<script src="js/lib/oz.js"></script>
<script>
require.config({
    baseUrl: 'js/'
});

define('jquery', 'lib/jquery.js');

define('app', [
    'jquery', 
    'mod/domready'
], function($){
    var app = {
        // do something with jquery
    };
    return app;
});

require(['app'], function(app){
    // do something with app 
});
</script>
```

That's all! 呵呵后...

Better practice for real production environments:

```html
<script src="dist/js/main.js"></script>
<script>
// define modules need demand loading outside main.js
define('module(dynamic dependence)', 'CDN_URL/filename_with_timestamp.js');
</script>
```

Put `main.js` into `./js` (not `./dist/js`)

```javascript
require.config({
    baseUrl: 'js/',
    distUrl: 'dist/js/'
});

// same as above
```

Install `ozma.js` through NPM: 

```
npm install ozma -g
```

Create a configure file for `ozma`. The default file name is `ozconfig.js`, located under the same directory as `main.js`. In this way you can omit `--config` parameter for `ozma`.
```javascript
{
    "baseUrl": "./js/",
    "distUrl": "./dist/js/",
    "loader": "lib/oz.js",
    "disableAutoSuffix": true
}
```

Build distribution files (one or more): 
```
ozma js/main.js
```

GRATS! That's all you need! See `./dist/js/main.js` for build results, then refresh the web page, see Network Panel in your browser's developer console. 

See usage for more detail:

* Usage with oz.js & ozma.js: [demo1（开发环境或生产环境）](http://dexteryy.github.com/OzJS/examples/buildtool/demo1.html) [demo2（开发环境）](http://dexteryy.github.com/OzJS/examples/buildtool/demo2.html) [demo3（生产环境）](http://dexteryy.github.com/OzJS/examples/buildtool/demo3.html) [demo4（使用第三方包管理系统）](http://dexteryy.github.com/OzJS/examples/buildtool/demo4.html)
* WebApp demo: [Doubanchou](https://github.com/dexteryy/doubanchou)

……以上不用翻译了罢

## Tutorials

* [OzJS中define的9种使用方法和模块种类](http://github.com/dexteryy/OzJS/blob/master/api.md)
* [Ozma.js: Autobuild tool for OzJS based WebApp](http://dexteryy.github.com/OzJS/examples/buildtool/index.html)

## Examples (with docs)

* OzJS Builder (Ozma.js): [usage](http://dexteryy.github.com/OzJS/examples/buildtool/index.html)
* OzJS Adapter: [demo](http://dexteryy.github.com/OzJS/examples/adapter/index.html) 
* mod/lang: [demo](http://dexteryy.github.com/OzJS/examples/lang/index.html) 
* mod/event: [demo](http://dexteryy.github.com/OzJS/examples/event/index.html) 
* mod/dollar: [demo](http://dexteryy.github.com/OzJS/examples/dollar/index.html) 
* mod/animate: [demo](http://dexteryy.github.com/OzJS/examples/animate/index.html) 

例子都写的糙猛快，信息量都在源码里

## In the Real World

* [Alphatown](http://alphatown.com) *2D browser based virtual world*
* [Douban Reader](http://read.douban.com/reader) *Web browser based e-book reader*
* [Douban's contributor system](http://read.douban.com/submit/) *Online self-publishing tool for Douban Reader*
* [Bubbler](http://bubbler.labs.douban.com/) *Webapp to explore social music technology*
* [BugHunter](https://github.com/dexteryy/BugHunter) *Multiplayer "answer first game" or a competition responder system, based on NodeJS and OzJS*

OzJS的设计和开发都偏好自底向上的原则，无论灵感、观念还是代码都完全来自真实的、面向终端用户的互联网产品

## More References

* [d2forum2010: 通用JS时代的模块机制和编译工具(slide)](http://www.slideshare.net/dexter_yy/js-6228773)
* [d2forum2011: 新版阿尔法城背后的前端MVC实践(slide)](http://www.slideshare.net/dexter_yy/mvc-8554206)


## Release History

* 提供`adapter.js`，[示例和文档](http://dexteryy.github.com/OzJS/examples/adapter/index.html) 
* `mod/event` 增加promise.pipe接口，某些API加了别名 [示例和文档](http://dexteryy.github.com/OzJS/examples/event/index.html)
* `mod/dollar` 发布beta版 [示例和文档](http://dexteryy.github.com/OzJS/examples/dollar/index.html)
* `mod/lang` 增加示例
* `Ozma.js` 1.1.0 发布，`npm`可更新
* `Ozma.js`对动态加载模块的多路径依赖问题提供完善的构建支持，[用例演示](http://github.com/dexteryy/OzJS/blob/master/examples/buildtool/js/app.js)
* `Ozma.js` 支持第三方包管理系统`Jam`，[示例和用法](http://dexteryy.github.com/OzJS/examples/buildtool/demo4.html)
* `Oz.js`默认启用`define.amd`，`Ozma.js`能更好的解析非AMD文件。
* bugfix: `Oz.js`的`new!`插件
