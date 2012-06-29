/**
 * @import lib/oz.js
 * @import lib/jquery_src.js
 * @import lib/jquery.mousewheel.js
 */
define('lib/jquery', ['mod/easing', 'lib/jquery_src'], function(elib){
    var $ = jQuery;
    $.easing['jswing'] = $.easing['swing'];
    $.extend($.easing, elib.functions);
    return $;
});
