/**
 * @import lib/oz.js
 */
define("browsers", [], function(){

	// Use of jQuery.browser is frowned upon.
	// More details: http://docs.jquery.com/Utilities/jQuery.browser
    var match;
    try {
        var ua = navigator.userAgent.toLowerCase(),
            rmobilesafari = /apple.*mobile.*safari/,
            rwebkit = /(webkit)[ \/]([\w.]+)/,
            ropera = /(opera)(?:.*version)?[ \/]([\w.]+)/,
            rmsie = /(msie) ([\w.]+)/,
            rmozilla = /(mozilla)(?:.*? rv:([\w.]+))?/;

            match = rmobilesafari.test(ua) && [0, "mobilesafari"] ||
                rwebkit.exec(ua) ||
                ropera.exec(ua) ||
                rmsie.exec(ua) ||
                ua.indexOf("compatible") < 0 && rmozilla.exec(ua) ||
                [];
    } catch (ex) {
        match = [];
    }

    var result = { 
        browser: match[1] || "", 
        version: match[2] || "0" 
    };
    if (match[1]) {
        result[match[1]] = parseInt(result.version) || true;
    }

    return result;

});
