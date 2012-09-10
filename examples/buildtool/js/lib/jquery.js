define([
    'mod/easing', 
    'lib/jquery_src', 
    'lib/jquery.mousewheel'
], function(elib){
    var $ = jQuery;
    $.easing['jswing'] = $.easing['swing'];
    $.extend($.easing, elib.functions);
    return $;
});
