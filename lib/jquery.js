/**
 * @import lib/oz.js
 * @import lib/jquery_src.js
 * @import lib/jquery.mousewheel.js
 */
oz.def('jquery', ['easing'], function(elib){
    var $ = jQuery;
    $.easing['jswing'] = $.easing['swing'];
    $.extend($.easing, elib.functions);
    return $;
});
