<!---
layout: intro
title: OzJS - a microkernel for modular javascript, a toolchain for modern front-end, a micro-framework for growable WebApp.
-->

###### [>> 中文版](http://ozjs.org/cn/) <a id="overview">&nbsp;</a>

# OzJS

OzJS is NOT yet another script loader, but a microkernel that provides sorely-missing module mechanism at runtime (that means it mainly works at language-level, not file-level. Use [Ozma.js](http://ozjs.org/ozma/) to process files statically at build time based on the same mechanism) for large/complex javascript program, compatible with the de facto standards ([AMD](https://github.com/amdjs/amdjs-api/wiki/AMD), [NodeJS/CommonJS](http://www.commonjs.org/specs/modules/1.0/) and traditional [module pattern](http://www.adequatelygood.com/2010/3/JavaScript-Module-Pattern-In-Depth)). 

Even better, it was implemented earlier than the well-known RequireJS, so there are differences between [similar APIs](http://ozjs.org/docs/define.html) in philosophy and approach, which bring more value.

The API and code of oz.js are minimalist and stable. It won’t add new features that aren't truly needed (It's absolutely bad practice to meet new requirements through new configuration options or new plugins for a module mechanism provider!). The Oz project now focuses on providing bundles of powerful and yet micro-framework friendly AMD modules.

## Toolchain <a id="toolchain">&nbsp;</a>

#### [OzmaJS](http://ozjs.org/ozma)
* Intelligent autobuild tool for OzJS
* Unique ability to support transparent dynamic dependence
* [Source code](https://github.com/dexteryy/ozma.js)

#### [grunt-ozjs](http://ozjs.org/grunt-ozjs) 
* Grunt tasks for oz.js and ozma.js
* [Source code](https://github.com/dexteryy/grunt-ozjs)

#### [istatic](https://github.com/mockee/istatic)
* A static-file dependency manager more than a package manager
* Let you quickly and automatically add modules of specified (or latest) version to your project
* [grunt-istatic](https://github.com/mockee/grunt-istatic)

#### [OzJS Adapter](http://ozjs.org/adapter): 
* Mini define/require mplementation for old web page
* Transform AMD module into traditional module pattern
* [Source code](https://github.com/dexteryy/OzJS/blob/master/adapter.js)

## Micro-framework <a id="framework">&nbsp;</a>

It is time to stop using All-in-One JavaScript library or framework which bundle all functionalities and solutions within a single global namespace. 

OzJS Project provides plenty of tiny, mutually independent, single purpose modules to help you build(mix and match) your own MVC(or suchlike) framework.

#### [EventMaster](http://ozjs.org/EventMaster)
* A simple, compact and consistent implementation of a variant of CommonJS's Promises and Events
* Provide both Promise/Deferred/Flow pattern and Event/Notify/Observer/PubSub pattern
* [Source code](https://github.com/dexteryy/EventMaster)

#### [URLKit](http://ozjs.org/URLKit)
* A lightweight implementation of routing and URL manager
* Automatic switch between html5 History API and IE's hashbang
* [Source code](https://github.com/dexteryy/URLKit)

#### [DollarJS](http://ozjs.org/DollarJS)
* A jQuery-compatible and non-All-in-One library which is more "Zepto" than Zepto.js
* Focus on DOM operations and mobile platform, wrap native API wherever possible.
* [Source code](https://github.com/dexteryy/DollarJS)

#### [SovietJS](http://ozjs.org/SovietJS)
* Standalone UI event delegate implementation
* Provide multiple styles/modes: override, automatically preventDefault, partial matching, exact matching...
* [Source code](https://github.com/dexteryy/SovietJS)

#### CordJS 
* A tiny, pure, event-based model-view-binder (MVB) library which is far more thin than Backbone 
* Coming soon...

#### [ChoreoJS](http://ozjs.org/ChoreoJS)
* An animation library which uses "stage" and "actor" as metaphors
* Automatic switch between CSS transitions and JS tweening
* Provide a flexible way to write asynchronous sequence of actions
* Support CSS transform value
* [Source code](https://github.com/dexteryy/ChoreoJS)

#### [Mo](http://ozjs.org/mo)
* A collection of OzJS core modules that form a library called "Mo" 
* Modules overview
    * `mo/lang`
        * ES5/6 shim and minimum utilities for language enhancement
    * `mo/domready`
        * Non-plugin implementation of cross-browser DOM ready event
        * Based on OzJS's built-in module -- 'finish'
    * `mo/browsers`
        * Standalone jQuery.browsers supports skin browsers popular in China 
    * `mo/cookie`
        * Simple wrapping for managing cookie 
    * `mo/template`
        * A lightweight and enhanced micro-template implementation, and minimum utilities
    * `mo/network`
        * Standalone jQuery.ajax API and enhanced getJSON, and so on
    * `mo/easing`
        * An easing library supports jquery.js, standalone module and CSS timing functions
    * `mo/mainloop`
        * Implement and manage single loop for WebApp life cycle
        * Provide tweening API for both property animation and frame animation(canvas or css)
    * `mod/uiproxy`
        * Standalone and most efficient implementation of UI event delegation
        * Coming soon...
    * `mo/key`
        * Wrapping API for keyboard events
        * Support key sequence, multiple key press, ...
* [Source code](https://github.com/dexteryy/mo)

#### [Moui](http://ozjs.org/moui)
* A collection of OzJS UI behavior modules that form a library called "Moui" 
* Modules overview
    * `moui/stick`
        * Stick a DOM element to anther from any clock position 
    * `moui/drag`: 
        * Standalone drag & drop library provides HTML5 shim 
    * `moui/danvas`
        * Implement canvas API using DOM elements
    * `moui/mention`
    * `moui/scrollbar`
    * `moui/mapviewer`
    * `moui/dialog`
    * More coming soon...
* [Source code](https://github.com/dexteryy/moui)

#### Other recommended modules
* [db.js](https://github.com/dexteryy/db.js): 
    * Forked from Aaron Powell's db.js, removing Deferred, using EventMaster instead 

## Getting Started <a id="start">&nbsp;</a>

Download [oz.js](https://raw.github.com/dexteryy/OzJS/master/oz.js)

You might also need a domReady module: [domready.js](https://github.com/dexteryy/mo/blob/master/domready.js)

Put them into your project directory, like `./js/lib` and `./js/mo` 

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
    'mo/domready'
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

<br>
See usage for more detail:

* Usage with oz.js & ozma.js: 
    * [demo1: for production or development](http://ozjs.org/ozma/examples/demo1.html) 
    * [demo2: for development](http://ozjs.org/ozma/examples/demo2.html) 
    * [demo3: for production](http://ozjs.org/ozma/examples/demo3.html) 
    * [demo4: for third party package manager](http://ozjs.org/ozma/examples/demo4.html)
* Config example for grunt: [doc](http://ozjs.org/grunt-ozjs/) 
* WebApp demo: [Doubanchou](https://github.com/dexteryy/doubanchou)
* TodoMVC demo: coming soon...

## Tutorials <a id="ref">&nbsp;</a>

* [define & require](http://ozjs.org/docs/define.html)

## In the Real World

* [Alphatown](http://alphatown.com) *2D browser based virtual world*
* [Douban Reader](http://read.douban.com/reader) *Web browser based e-book reader*
* [Douban's contributor system](http://read.douban.com/submit/) *Online self-publishing tool for Douban Reader*
* [Bubbler](http://bubbler.labs.douban.com/) *Webapp to explore social music technology*
* [BugHunter](https://github.com/dexteryy/BugHunter) *Multiplayer "answer first game" or a competition responder system, based on NodeJS and OzJS*

## Follow @ozjs

* [新浪微博](http://weibo.com/ozjs)
* [豆瓣小站](http://site.douban.com/199314/)

## More References

* [d2forum2010: 通用JS时代的模块机制和编译工具(slide)](http://www.slideshare.net/dexter_yy/js-6228773)
* [d2forum2011: 新版阿尔法城背后的前端MVC实践(slide)](http://www.slideshare.net/dexter_yy/mvc-8554206)


## Release History <a id="release">&nbsp;</a>

* 2013.1.18
    * 项目网页更新内容，增加微博和豆瓣小站的链接
    * `SovietJS` v0.0.1 发布
    * `mo/lang` 增加OOP工具`.construct()`
    * `mo/lang` 拆分子模块
    * `ozma.js` 支持windows
* 2012.12.2
    * 新的API文档：[define & require](http://ozjs.org/docs/define.html)
    * `oz.js` v2.5 和 `ozma` v1.4 发布。支持在模块名中使用别名和相对当前文件的路径
    * `oz.js`: 内建模块`module`的值改为nodejs的形式，支持`module.exports =`的用法
    * `oz.js`: `this`不再指向全局变量`oz`
    * `mo`/`ChoreoJS`/`URLKit`/`DollarJS` v1.0.1: 用`this`取代内建模块`host`，需要`oz.js` v2.5+
* 2012.11.21
    * OzJS仓库中的`/mod`拆分为7个子项目和独立仓库
    * `mod/event` 改名为 [EventMaster](https://github.com/dexteryy/EventMaster/)
    * `/mod`中的模块重命名为 [Mo](https://github.com/dexteryy/mo/) 和 [Moui](https://github.com/dexteryy/moui/)
    * 网站重构
* 2012.11.21
    * 首页文档重新组织，增加模块列表和描述
    * `ChoreoJS` v1.0.0 发布
    * `mod/event` 增加disable/enable, progress/notify, merge等方法
    * `mod/mainloop` 更新
    * `mod/lang` 更新
    * `mod/animate` 改名 [ChoreoJS](https://github.com/dexteryy/ChoreoJS/)
    * `mod/url` 改名 [URLKit](https://github.com/dexteryy/URLKit/)
    * `mod/domcanvas` 改名 `mod/danvas`
* 2012.11.13
    * `mod/url` 完善配置参数，增加[示例和文档](http://ozjs.org/URLKit/)
* 2012.10.18
    * `oz.js`: `require.config`增加`debug`参数，可将已发布的线上代码映射到本地源文件
    * `ozma.js` 1.3
        * 完善了CJS风格模块在构建中自动转换为AMD风格的特性
        * config文件增加`ignore`选项，支持传统网站多页面项目的文件组织方式
        * 构建过程中支持远程模块的串行加载，避免额外的Unrecognized module警告
* 2012.10.15
    * `grunt-ozjs` 0.1 [Installation guide](http://ozjs.org/grunt-ozjs)
    * `ozma.js` 1.2 迁移到[独立仓库](https://github.com/dexteryy/ozma.js)
* 2012.10.13
    * `adapter.js`发布beta [示例和文档](http://ozjs.org/examples/adapter/) 
    * `mod/event` 增加`promise.pipe`接口，某些API加了别名 [示例和文档](http://ozjs.org/EventMaster/)
* 2012.10.11
    * `mod/dollar` 发布beta [示例和文档](http://ozjs.org/DollarJS/)
* 2012.9.26
    * `mod/lang` 增加示例
* 2012.9.21
    * `ozma.js` 1.1，npm可更新
    * `ozma.js`对动态加载模块的多路径依赖问题提供完善的构建支持
* 2012.9.20
    * `ozma.js` 支持第三方包管理系统`Jam`，[示例和用法](http://ozjs.org/ozma/)
    * `oz.js`默认启用`define.amd`，`ozma.js`能更好的解析非AMD文件。
* 2012.9.10
    * bugfix: `oz.js`的`new!`插件
