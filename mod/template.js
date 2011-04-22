/**
 * @author Dexter.Yy (dexter.yy at gmail.com)
 */
oz.def("template", function(require, exports){

    function escapeHTML(str){
        str = str || '';
        var xmlchar = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            "'": "&#39;",
            '"': "&quot;",
            "{": "&#123;",
            "}": "&#125;",
            "@": "&#64;"
        };
        return str.replace(/[<>'"\{\}&@]/g, function($1){
            return xmlchar[$1];
        });
    }

    /**
     * @public 按字节长度截取字符串
     * @param {string} str是包含中英文的字符串
     * @param {int} limit是长度限制（按英文字符的长度计算）
     * @param {function} cb返回的字符串会被方法返回
     * @return {string} 返回截取后的字符串,默认末尾带有"..."
     */
    function substr(str, limit, cb){
        if(!str || typeof str !== "string")
            return '';
        var sub = str.substr(0, limit).replace(/([^\x00-\xff])/g, '$1 ').substr(0, limit).replace(/([^\x00-\xff])\s/g, '$1');
        return cb ? cb.call(sub, sub) : (str.length > sub.length ? sub + '...' : sub);
    }


    exports.escapeHTML = escapeHTML;
    exports.substr = substr;

    /**
     * @public 把JS模板转换成最终的html
     * @param {string} tpl是模板文本
     * @param {object} op是模板中的变量
     * @return {string} 返回可使用的html
     */
    exports.format = function(tpl, op){
        return tpl.replace(/{{(\w+)}}/g, function(e1,e2){
            return op[e2] != null ? op[e2] : "";
        });        
    };

    // From Underscore.js 
    // JavaScript micro-templating, similar to John Resig's implementation.
    var tplSettings = {
        cache: {},
        evaluate: /\{%([\s\S]+?)%\}/g,
        interpolate: /\{%=([\s\S]+?)%\}/g
    };
    exports.convertTpl = function(str, data){
        var c  = tplSettings;
        var tmpl = 'var __p=[],print=function(){__p.push.apply(__p,arguments);};' 
                + "obj=oz.mix(obj||{}, __oz_tplkit);" 
                + 'with(obj){__p.push(\'' +
                str.replace(/\\/g, '\\\\')
                    .replace(/'/g, "\\'")
                    .replace(c.interpolate, function(match, code) {
                        return "'," + code.replace(/\\'/g, "'") + ",'";
                    })
                    .replace(c.evaluate || null, function(match, code) {
                        return "');" + code.replace(/\\'/g, "'")
                                            .replace(/[\r\n\t]/g, ' ') + "__p.push('";
                    })
                    .replace(/\r/g, '\\r')
                    .replace(/\n/g, '\\n')
                    .replace(/\t/g, '\\t')
                + "');}return __p.join('');";
        var func = !/\W/.test(str) ? c.cache[str] = c.cache[str] || 
                                        exports.convertTpl(document.getElementById(str).innerHTML)
                                   : new Function('obj', tmpl);
        return data ? func(data) : func;
    };

    // for simple template
    window.__oz_tplkit = {
        escapeHTML: escapeHTML,
        substr: substr
    };

});

