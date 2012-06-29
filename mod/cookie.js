/**
 * @import lib/oz.js
 */
define("mod/cookie", function(){

    return function(win, n, v, op){
        if(typeof win == "string") {
            op = v;
            v = n;
            n = win;
            win = window;
        }
        if(v !== undefined) {
            op = op || {};
            var date, expires = "";
            if(op.expires) {
                if(op.expires.constructor == Date) {
                    date = op.expires;
                } else {
                    date = new Date();
                    date.setTime(date.getTime() + (op.expires * 24 * 60 * 60 * 1000));
                }
                expires = '; expires=' + date.toGMTString();
            }
            var path = op.path ? '; path=' + op.path : '';
            var domain = op.domain ? '; domain=' + op.domain : '';
            var secure = op.secure ? '; secure' : '';
            win.document.cookie = [n, '=', encodeURIComponent(v), expires, path, domain, secure].join('');
        } else {
            v = win.document.cookie.match( new RegExp( "(?:\\s|^)" + n + "\\=([^;]*)") );
            return v ? decodeURIComponent(v[1]) : null;
        }
    };

});

