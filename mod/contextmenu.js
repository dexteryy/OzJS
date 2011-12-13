/**
 * @import lib/oz.js
 * @import lib/jquery.js
 * @import mod/lang.js
 * @import mod/template.js
 */
define('contextmenu', ['jquery', 'lang', 'template'], function($, _, tpl){

    var box_tpl = '<div id="oz_contextmenu" class="oz-contextmenu" style="position:absolute;left:-3000px;top:0"></div>',
        item_tpl = '<li class="{{specialClass}}"><a href="#{{name}}">{{title}}</a></li>';

    function Contextmenu(opt){
        var cmds = [];
        for (var i in opt) {
            opt[i].name = i;
            cmds[opt[i].order] = opt[i];
        }
        this.cmds = _.unique(cmds);
        this.data = opt;
    }

    Contextmenu.prototype = {

        set: function(name, opt){
            this.data[name] = _.mix(this.data[name] || {}, opt);
        },

        show: function(cursor){
            var self = this,
                win = $(window),
                box = this.node;
            if (!box) {
                box = this.node = $(box_tpl).appendTo('body').mousedown(function(e){
                    var href = e.target.href;
                    if (e.button == 2 || !href) {
                        return;
                    }
                    var i = href.match(/#(.*)/)[1],
                        handler = (self.data[i] || {}).handler;
                    if (handler) {
                        handler.call(box[0], e);
                        self.close();
                    }
                });
                box[0].innerHTML = '<ul>' + self.cmds.map(function(item){
                    if (item && !item.disabled) {
                        if (item.split) {
                            item.specialClass = 'split';
                        }
                        return tpl.format(item_tpl, item);
                    } else {
                        return '';
                    }
                }).join('') + '</ul>';
                self.width = box[0].offsetWidth;
                self.height = box[0].offsetHeight;
            }
            var pos = {},
                w = win.width(),
                h = win.height();
            if (cursor[0] + self.width > w) {
                pos.right = w - cursor[0];
                pos.left = "auto";
            } else {
                pos.left = cursor[0];
                pos.right = "auto";
            }
            if (cursor[1] + self.height > h) {
                pos.bottom = $(document).height() - cursor[1] - win.scrollTop();
                pos.top = "auto";
            } else {
                pos.top = cursor[1];
                pos.bottom = "auto";
            }
            box.css(pos).show();
        },

        close: function(){
            this.node.hide();
        }

    };

    return function(opt){
        return new Contextmenu(opt);
    };

});
