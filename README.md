[中文版](https://github.com/dexteryy/OzJS/blob/master/README_cn.md)

# OzJS

OzJS is NOT yet another script loader, but a microkernel that provides sorely-missing module mechanism at runtime (that means it mainly works at language-level, not file-level. Use [ozma.js](http://ozjs.org/examples/buildtool/index.html) to process files statically at build time based on the same mechanism) for large/complex javascript program, compatible with the de facto standards ([AMD](https://github.com/amdjs/amdjs-api/wiki/AMD), [NodeJS/CommonJS](http://www.commonjs.org/specs/modules/1.0/) and traditional [module pattern](http://www.adequatelygood.com/2010/3/JavaScript-Module-Pattern-In-Depth)). 

Even better, it was implemented earlier than the well-known RequireJS, so there are differences between [similar APIs](http://github.com/dexteryy/OzJS/blob/master/api.md) in philosophy and approach, which bring more value.

The API and code of oz.js are minimalist and stable. It won’t add new features that aren't truly needed (It's absolutely bad practice to meet new requirements through new configuration options or new plugins for a module mechanism provider!). The Oz project now focuses on providing bundles of powerful and yet micro-framework friendly AMD modules.

## Toolchain

#### [OzmaJS](https://github.com/dexteryy/ozma.js)
* Intelligent autobuild tool for OzJS
* [Usage](http://ozjs.org/examples/buildtool/index.html)

#### [grunt-ozjs](https://github.com/dexteryy/grunt-ozjs) 
* Grunt tasks for oz.js and ozma.js
* [Examples](https://github.com/dexteryy/grunt-ozjs/blob/master/grunt.js) 

#### [OzJS Adapter](https://github.com/dexteryy/OzJS/blob/master/adapter.js): 
* Mini define/require mplementation for old web page
* Transform AMD module into traditional module pattern
* [Examples](http://ozjs.org/examples/adapter/index.html) 

## Micro-framework 

Stop using All-in-One JavaScript library or framework which bundle all functionalities and solutions within a single global namespace. 
You can mix and match and choose some tiny and single purpose modules to build your own MVC(or suchlike) framework.

#### [EventJS](https://github.com/dexteryy/OzJS/blob/master/mod/event.js) (`mod/event`): 
* A simple, compact and consistent implementation of a variant of CommonJS's Promises and Events
* Provide both Promise/Deferred/Flow pattern and Event/Notify/Observer/PubSub pattern
* [API docs and examples](http://ozjs.org/examples/event/index.html) 

#### [DollarJS](https://github.com/dexteryy/OzJS/blob/master/mod/dollar.js) (`mod/dollar`): 
* A jQuery-compatible and non-All-in-One library which is more "Zepto" than Zepto.js
* Focus on DOM operations and mobile platform, wrap native API wherever possible.
* [API docs and examples](http://ozjs.org/examples/dollar/index.html) 

#### [ChoreoJS](https://github.com/dexteryy/OzJS/blob/master/mod/choreo.js) (`mod/choreo`): 
* An animation library which uses "stage" and "actor" as metaphors
* Automatic switch between CSS transitions and JS tweening
* Provide a flexible way to write asynchronous sequence of actions
* Support CSS transform value
* [API docs and examples](http://ozjs.org/examples/choreo/index.html) 

#### [URLKit](https://github.com/dexteryy/OzJS/blob/master/mod/urlkit.js) (`mod/urlkit`): 
* A lightweight implementation of routing and URL manager
* Automatic switch between html5 History API and IE's hashbang
* [API docs and examples](http://ozjs.org/examples/urlkit/index.html) 

#### [DanvasJS](https://github.com/dexteryy/OzJS/blob/master/mod/danvas.js) (`mod/danvas`): 
* Implement canvas API using DOM elements

#### Other Commonly-Used Modules
* [mod/lang](https://github.com/dexteryy/OzJS/blob/master/mod/lang.js): 
    * ES5/6 shim and minimum utilities for language enhancement
    * [API docs and examples](http://ozjs.org/examples/lang/index.html) 
* [mod/domready](https://github.com/dexteryy/OzJS/blob/master/mod/domready.js): 
    * Non-plugin implementation of cross-browser DOM ready event
    * Based on OzJS's built-in module -- 'finish'
* [mod/browsers](https://github.com/dexteryy/OzJS/blob/master/mod/browsers.js): 
    * Standalone jQuery.browsers supports skin browsers popular in China 
* [mod/template](https://github.com/dexteryy/OzJS/blob/master/mod/template.js): 
    * A lightweight and enhanced micro-template implementation, and minimum utilities
* [mod/network](https://github.com/dexteryy/OzJS/blob/master/mod/network.js): 
    * Standalone jQuery.ajax API and enhanced getJSON, and so on
* [mod/key](https://github.com/dexteryy/OzJS/blob/master/mod/key.js): 
    * Wrapping API for keyboard events
    * Support key sequence, multiple key press, ...
* `mod/uiproxy`: 
    * Standalone and most efficient implementation of UI event delegation
    * Coming soon...
* `mod/drag`: 
    * Standalone drag & drop library provides HTML5 shim 
    * Coming soon...
* [mod/easing](https://github.com/dexteryy/OzJS/blob/master/mod/easing.js): 
    * An easing library supports jquery.js, standalone module and CSS timing functions
* [mod/mainloop](https://github.com/dexteryy/OzJS/blob/master/mod/mainloop.js): 
    * Implement and manage single loop for WebApp life cycle
    * Provide tweening API for both property animation and frame animation(canvas or css)
* [mod/datasource](https://github.com/dexteryy/OzJS/blob/master/mod/datasource.js): 
    * Wrap and manage remote data
* `mod/localmodel`: 
    * A pure, event-based model-view-binder (MVB) implementation
    * Coming soon...
* [mod/db](https://github.com/dexteryy/db.js): 
    * Forked from Aaron Powell's db.js, removing Deferred, using EventJS instead 
* More coming soon...

## Getting Started

Download [oz.js](https://raw.github.com/dexteryy/OzJS/master/oz.js)

You might also need a domReady module: [domready.js](https://github.com/dexteryy/OzJS/blob/master/mod/domready.js)

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

That's all! But for development environments only.

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

* Usage with oz.js & ozma.js: 
    * [demo1: for production or development](http://ozjs.org/examples/buildtool/demo1.html) 
    * [demo2: for development](http://ozjs.org/examples/buildtool/demo2.html) 
    * [demo3: for production](http://ozjs.org/examples/buildtool/demo3.html) 
    * [demo4: for third party package manager](http://ozjs.org/examples/buildtool/demo4.html)
* Config example for grunt: [doc](https://github.com/dexteryy/grunt-ozjs/blob/master/README.md) 
* WebApp demo: [Doubanchou](https://github.com/dexteryy/doubanchou)

## Tutorials

* [OzJS中define的9种使用方法和模块种类](http://github.com/dexteryy/OzJS/blob/master/api.md)

## In the Real World

* [Alphatown](http://alphatown.com) *2D browser based virtual world*
* [Douban Reader](http://read.douban.com/reader) *Web browser based e-book reader*
* [Douban's contributor system](http://read.douban.com/submit/) *Online self-publishing tool for Douban Reader*
* [Bubbler](http://bubbler.labs.douban.com/) *Webapp to explore social music technology*
* [BugHunter](https://github.com/dexteryy/BugHunter) *Multiplayer "answer first game" or a competition responder system, based on NodeJS and OzJS*

## More References

* [d2forum2010: 通用JS时代的模块机制和编译工具(slide)](http://www.slideshare.net/dexter_yy/js-6228773)
* [d2forum2011: 新版阿尔法城背后的前端MVC实践(slide)](http://www.slideshare.net/dexter_yy/mvc-8554206)


## Release History

* 2012.11.21
    * 首页文档重新组织，增加模块列表和描述
    * `ChoreoJS` v1.0.0 发布
    * `mod/event` 增加disable/enable, progress/notify, merge等方法
    * `mod/mainloop` 更新
    * `mod/lang` 更新
    * `mod/animate` 改名 `ChoreoJS`
    * `mod/url` 改名 `URLKit`
    * `mod/domcanvas` 改名 `DanvasJS`
* 2012.11.13
    * `mod/url` 完善配置参数，增加[示例和文档](http://ozjs.org/examples/urlkit/index.html)
* 2012.10.18
    * `oz.js`: `require.config`增加`debug`参数，可将已发布的线上代码映射到本地源文件
    * `ozma.js` 1.3
        * 完善了CJS风格模块在构建中自动转换为AMD风格的特性
        * config文件增加`ignore`选项，支持传统网站多页面项目的文件组织方式
        * 构建过程中支持远程模块的串行加载，避免额外的Unrecognized module警告
* 2012.10.15
    * `grunt-ozjs` 0.1 [Installation guide](https://github.com/dexteryy/grunt-ozjs)
    * `ozma.js` 1.2 迁移到[独立仓库](https://github.com/dexteryy/ozma.js)
* 2012.10.13
    * `adapter.js`发布beta [示例和文档](http://ozjs.org/examples/adapter/index.html) 
    * `mod/event` 增加`promise.pipe`接口，某些API加了别名 [示例和文档](http://ozjs.org/examples/event/index.html)
* 2012.10.11
    * `mod/dollar` 发布beta [示例和文档](http://ozjs.org/examples/dollar/index.html)
* 2012.9.26
    * `mod/lang` 增加示例
* 2012.9.21
    * `ozma.js` 1.1，npm可更新
    * `ozma.js`对动态加载模块的多路径依赖问题提供完善的构建支持，[用例演示](http://github.com/dexteryy/OzJS/blob/master/examples/buildtool/js/app.js)
* 2012.9.20
    * `ozma.js` 支持第三方包管理系统`Jam`，[示例和用法](http://ozjs.org/examples/buildtool/demo4.html)
    * `oz.js`默认启用`define.amd`，`ozma.js`能更好的解析非AMD文件。
* 2012.9.10
    * bugfix: `oz.js`的`new!`插件
