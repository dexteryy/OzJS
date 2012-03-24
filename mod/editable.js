/**
 * @import lib/oz.js
 * @import lib/jquery.js
 * @import mod/lang.js
 * @import mod/template.js
 * @import mod/network.js
 */
define("editable", ["jquery", "lang", "template", "network"], function($, _, viewkit, net){

    var editable = {

        toEdit: function(hook){
            var btn = $(hook),
                content = hook.parentNode,
                limit = parseInt($(hook).attr("size"), 10),
                mutiline = $(hook).attr("mutiline"),
                cache;

            mutiline = mutiline != "false" && true || false;
            cache = $(".editnow-target", content).html() || "";

            btn.hide().data("editcache", cache).appendTo(document.body);
            content.innerHTML = '<span class="editnow-erea">'
                + (mutiline ? ('<textarea class="editnow-input"></textarea>') : ('<input type="text" value="" class="editnow-input">'))
                + '<input type="button" value="确定" class="editnow-yes"><input type="button" value="取消" class="editnow-no"></span>';
            btn.appendTo($(".editnow-erea", content));

            var input = $('.editnow-input', content).val(cache);
            if (limit) {
                input.keyup(function(e){
                    var v = this.value,
                        str = viewkit.substr(v, limit * 2);
                    if (str.length !== v.length) {
                        this.value = str;
                    }
                });
            }
        },

        toNormal: function(hook, html){
            var btn = $(hook),
                content = hook.parentNode.parentNode,
                emptyMode = btn.attr("emptyMode"),
                normalMode = btn.attr("normalMode") || btn.html(),
                cache = btn.data("editcache"),
                edited = typeof html === "string";
            btn.appendTo(document.body);
            content.innerHTML = '<span class="editnow-target">' 
                + (edited ? html : cache) + '</span>';
            if (edited) {
                btn.html(html ? normalMode : emptyMode);
            }
            btn.appendTo(content).show().removeData("editcache");
        }

    };

    return editable;

});
