/**
 * @import lib/oz.js
 * @import lib/jquery_src.js
 * @import lib/jquery.mousewheel.js
 */
oz.def('jquery', ['easing', 'finish', 'jquery-src'], function(elib, finish){
    var $ = jQuery;
    $.easing['jswing'] = $.easing['swing'];
    $.extend($.easing, elib);
    oz.require(["jquery-mousewheel"], function(){
        finish($);
    });
});
