<!---
layout: intro
title: OzJS - a microkernel for modular javascript, a toolchain for modern front-end, a micro-framework for growable WebApp.
-->

<a id="overview"> </a>
# OzJS Project 

OzJS is NOT yet another script loader, but a microkernel that provides sorely-missing module mechanism at runtime (that means it mainly works at language-level, not file-level. Use [Ozma.js](http://ozjs.org/ozma/) to process files statically at build time based on the same mechanism) for large/complex javascript program, compatible with the de facto standards ([AMD](https://github.com/amdjs/amdjs-api/wiki/AMD), [NodeJS/CommonJS](http://www.commonjs.org/specs/modules/1.0/) and traditional [module pattern](http://www.adequatelygood.com/2010/3/JavaScript-Module-Pattern-In-Depth)). 

Even better, it was implemented earlier than the well-known RequireJS, so there are differences between [similar APIs](http://ozjs.org/docs/define.html) in philosophy and approach, which bring more value.

The API and code of oz.js are minimalist and stable. It won’t add new features that aren't truly needed (It's absolutely bad practice to meet new requirements through new configuration options or new plugins for a module mechanism provider!). 

The OzJS Project now focuses on providing bundles of powerful and yet micro-framework friendly AMD modules.

<a id="toolchain"> </a>
## Toolchain

#### [generator-ozjs](http://ozjs.org/generator-ozjs) 
> * Scaffolding tool for OzJS which offers a packaging workflow integrates toolchain, micro-framework and many best practices
> * oz.js + bower + Grunt + Mo + Moui + ...
> * [Source code](https://github.com/dexteryy/generator-ozjs)
> * [OzJS app template](https://github.com/dexteryy/ozjs-app-template)

#### [OzmaJS](http://ozjs.org/ozma)
> * Intelligent autobuild tool for OzJS
> * Unique ability to support transparent dynamic dependence
> * [Source code](https://github.com/dexteryy/ozma.js)

#### [grunt-ozjs](http://ozjs.org/grunt-ozjs)
> * Grunt tasks for oz.js and ozma.js
> * [Source code](https://github.com/dexteryy/grunt-ozjs)
> * [gulp-ozjs](https://github.com/kebot/gulp-ozjs) - gulp tasks for oz.js and ozma.js

#### [karma-ozjs](http://ozjs.org/karma-ozjs)
> * A Karma plugin. Adapter for OzJS framework
> * [Source code](https://github.com/dexteryy/karma-ozjs)

#### [grunt-dispatch](http://ozjs.org/grunt-dispatch)
> * Bower mate, copy the necessary files of package(like `bower\_components/`) directory to your `src/` directory
> * [Source code](https://github.com/dexteryy/grunt-dispatch)

#### [grunt-furnace](http://ozjs.org/grunt-furnace)
> * Transform code from one format to another
> * template > AMD, AMD > CJS, CJS > AMD...
> * [Source code](https://github.com/dexteryy/grunt-furnace)
> * [karma-furnace-preprocessor](https://github.com/dexteryy/karma-furnace-preprocessor) - A Karma plugin. Convert code from one format to another (like grunt-furnace)

#### [OzJS Adapter](http://ozjs.org/adapter): 
> * Mini define/require mplementation for old web page
> * Transform AMD module into traditional module pattern
> * [Source code](https://github.com/dexteryy/OzJS/blob/master/contrib/adapter.js)

<a id="framework"> </a>
## Micro-framework

It is time to stop using All-in-One JavaScript library or framework which bundle all functionalities and solutions within a single global namespace. 

OzJS Project provides plenty of tiny, mutually independent, single purpose modules to help you build(mix and match) your own MVC(or suchlike) framework.

#### [Mo](http://ozjs.org/mo)
> * A collection of OzJS core modules that form a library called "Mo" 
> * Modules overview
>   * `mo/lang`
>     * ES5/6 shim and minimum utilities for language enhancement
>   * `mo/domready`
>     * Non-plugin implementation of cross-browser DOM ready event
>     * Based on OzJS's built-in module -- 'finish'
>   * `mo/browsers`
>     * Standalone jQuery.browsers supports skin browsers popular in China 
>   * `mo/template`
>     * A lightweight and enhanced micro-template implementation, and minimum utilities
>   * `mo/network`
>     * Standalone jQuery.ajax API and enhanced getJSON, and so on
>   * `mo/easing`
>     * An easing library supports jquery.js, standalone module and CSS timing functions
>   * `mo/mainloop`
>     * Implement and manage single loop for WebApp life cycle
>     * Provide tweening API for both property animation and frame animation(canvas or css)
>   * `mo/key`
>     * Wrapping API for keyboard events
>     * Support key sequence, multiple key press, ...
>   * `mo/console`
>     * Debulg tool
> * [Source code](https://github.com/dexteryy/mo)

#### [EventMaster](http://ozjs.org/EventMaster)
> * A simple, compact and consistent implementation of a variant of CommonJS's Promises and Events
> * [Source code](https://github.com/dexteryy/EventMaster)

#### [NervJS](http://ozjs.org/NervJS)
> * A tiny, pure, event-based model wrapper for the MVC or MDV (Model-driven Views) pattern.
> * [Source code](https://github.com/dexteryy/NervJS)

#### [DollarJS](http://ozjs.org/DollarJS)
> * A jQuery-compatible and non-All-in-One library which is more "Zepto" than Zepto.js
> * [Source code](https://github.com/dexteryy/DollarJS)

#### [SovietJS](http://ozjs.org/SovietJS)
> * Standalone UI event delegate implementation
> * [Source code](https://github.com/dexteryy/SovietJS)

#### [URLKit](http://ozjs.org/URLKit)
> * A lightweight implementation of routing and URL manager
> * [Source code](https://github.com/dexteryy/URLKit)

<a id="ui"> </a>
## UI Toolkit

#### [Moui](http://ozjs.org/moui)
> * OO-based UI behavior modules behind [CardKit](http://ozjs.org/CardKit/)'s view components
> * Modules overview
>   * `moui/control`
>     * Minimal stateful component
>   * `moui/picker`
>     * Compose of `Control` objects
>   * `moui/overlay`
>     * Minimal overlay component
>   * `moui/actionview`
>     * Inherit from `Overlay`
>     * Compose of `Picker` objects
>   * `moui/modalview`
>     * Inherit from `Overlay`
>   * `moui/growl`
>     * Inherit from `Overlay`
>   * `moui/ranger`
>     * Minimal range component
>   * `moui/util/stick`
>     * Stick a DOM element to anther from any clock position 
>   * [More](http://ozjs.org/moui)
> * [Source code](https://github.com/dexteryy/moui)

#### [DarkDOM](http://ozjs.org/DarkDOM)
> * Design your own markup languages on a higher level of abstraction than HTML
> * Build responsive cross-screen UI components
> * [Source code](https://github.com/dexteryy/DarkDOM)

#### [CardKit](http://ozjs.org/CardKit)
> * A mobile UI library provides a series of building blocks to help you build mobile web apps quickly and simply, or transfer entire website to mobile-first web app for touch devices. 
> * CardKit building blocks are all _use-html-as-configure-style_ (like Custom Elements, directive...) components built on [DarkDOM](https://github.com/dexteryy/DarkDOM) and [Moui](https://github.com/dexteryy/moui).
> * [Source code](https://github.com/douban-f2e/CardKit)

#### [Momo (MoMotion)](http://ozjs.org/momo)
> * A framework and a collection for separate and simple implementation of touch gestures
> * [Source code](https://github.com/dexteryy/momo)

#### [ChoreoJS](http://ozjs.org/ChoreoJS)
> * An animation library which uses "stage" and "actor" as metaphors
> * [Source code](https://github.com/dexteryy/ChoreoJS)

<a id="start"> </a>
## Tutorials 

* [Getting Started with oz.js and ozma.js](http://ozjs.org/docs/start.html)
* [define & require](http://ozjs.org/docs/define.html)

## Quick Start

Install the [scaffolding/workflow tool](http://ozjs.org/generator-ozjs) then try the [ozjs:app](http://ozjs.org/generator-ozjs#app) generator.

<a id="demo"> </a>
## Demo App 

* [Doubanchou](https://github.com/dexteryy/doubanchou) - Lottery / Draft app
* [Doubanchou II: Pachislot](https://github.com/dexteryy/pachislot) - Lottery app
* [BugHunter](https://github.com/dexteryy/BugHunter) - Multiplayer "answer first game" or a competition responder system
* [Demonstory](https://github.com/douban-f2e/demonstory) -  real time movie acts by web page elements
* TodoMVC: coming soon...

## In the Real World

* [Alphatown](http://alphatown.com) - *2D browser based virtual world*
* [Douban Reader](http://read.douban.com/reader) - *Web browser based e-book reader*
* [Douban's contributor system](http://read.douban.com/submit/) - *Online self-publishing tool for Douban Reader*
* [Bubbler](http://bubbler.labs.douban.com/) - *Webapp to explore social music technology*
* Code - *Douban's Github clone for internal use*

<a id="ref"> </a>
## Follow @ozjs 

* [新浪微博](http://weibo.com/ozjs)
* [豆瓣小站](http://site.douban.com/199314/)

## More References

* [d2forum2010: 通用JS时代的模块机制和编译工具(slide)](http://www.slideshare.net/dexter_yy/js-6228773)
* [d2forum2011: 新版阿尔法城背后的前端MVC实践(slide)](http://www.slideshare.net/dexter_yy/mvc-8554206)

## License

Copyright (c) 2010 - 2014 dexteryy  
Licensed under the MIT license.
