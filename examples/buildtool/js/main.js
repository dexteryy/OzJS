
require.config({
    baseUrl: 'js/',
    distUrl: 'dist/',
    aliasUrl: {
        "lib": "../lib/",
        "external": "../../../lib/"
    }
});

define('non-AMD_script_1', ['non-AMD_script_2']);

define('lib/jquery.mousewheel', ['lib/jquery_src'], '{lib}jquery.mousewheel.js');
define('lib/jquery_src', '{external}jquery_src.js');

define('domain', function(){
    return window._main_domain_;
});

require([
    'jquery',
    'app'
], function($, app){

    console.info('app ready!', app);

});


