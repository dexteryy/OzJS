/**
 * Danvas
 * Implement canvas API using DOM elements
 *
 * using AMD (Asynchronous Module Definition) API with OzJS
 * see http://dexteryy.github.com/OzJS/ for details
 *
 * Copyright (C) 2010-2012, Dexter.Yy, MIT License
 * vim: et:ts=4:sw=4:sts=4
 */
define("mod/danvas", [
    "mod/lang", 
    "mod/template",
    "mod/browsers"
], function(_, tpl, browsers){

        var _canvas_attrs = {
            globalAlpha: 1,
            globalCompositeOperation: "source-over",
            fillStyle: "black",
            strokeStyle: "black",         // @TODO
            shadowOffsetX: 0,             // @TODO
            shadowOffsetY: 0,             // @TODO
            shadowBlur: 0,                // @TODO
            shadowColor: "black",         // @TODO
            font: "10px sans-serif",
            textAlign: "left",
            textBaseline: "bottom",
            _otherClass: ""
        },

        _state_cache = {},

        is_ie8lt = browsers.msie && browsers.msie < 9,

        TPL_RECT = '<a href="{{href}}" class="danvas-sprite-rect{{otherClass}}" '
            + 'style="position:absolute;top:{{top}}px;left:{{left}}px;width:{{width}}px;'
            + 'height:{{height}}px;background-color:{{fillStyle}};' 
            + '{{opacity_style}}" {{bindData}}></a>',

        TPL_IMAGE = '<img class="danvas-sprite-image{{otherClass}}" src="{{src}}" '
            + 'style="position:absolute;top:{{top}}px;left:{{left}}px;'
            + 'width:{{width}}px;height:{{height}}px;' 
            + '{{opacity_style}}" {{bindData}} />',

        TPL_TEXT = '<span class="danvas-sprite-text{{otherClass}}" style="position:absolute;'
            + 'top:{{top}};bottom:{{bottom}};left:{{left}};right:{{right}};'
            + '{{width}};color:{{fillStyle}};font:{{font}};' 
            + '{{opacity_style}}" {{bindData}}>{{text}}</span>';

    function Danvas(box){
        this.canvas = box;
        _.mix(this, _canvas_attrs);
        this.pos = [0, 0];
        this.buffer = [];
    }

    Danvas.prototype = {

        render: function(){
            this.canvas.appendChild(tpl.str2html(this.buffer.join("")));
            this.buffer = [];
        },

        translate: function(x, y){
            var pos = this.pos;
            pos[0] += x;
            pos[1] += y;
        },

        save: function(){
            var s = _state_cache;
            for (var i in _canvas_attrs) {
                s[i] = this[i];
            }
            s.pos = [this.pos[0], this.pos[1]];
        },

        restore: function(){
            var s = _state_cache;
            for (var i in _canvas_attrs) {
                this[i] = s[i];
            }
            this.pos[0] = s.pos[0];
            this.pos[1] = s.pos[1];
        },

        clearRect: function(x, y, w, h){ // @TODO
            this.canvas.innerHTML = '';
        },

        fillRect: function(x, y, w, h){
            var pos = this.pos,
                data = this.bindData,
                datastr = [];
            if (data) {
                for (var i in data){
                    datastr.push(i + '="' + data[i] + '" ');
                }
            }
            var html = tpl.format(TPL_RECT, {
                left: pos[0] + x,
                top: pos[1] + y,
                width: w,
                height: h,
                href: this._href || 'javascript:;',
                bindData: datastr.join(""),
                otherClass: this._otherClass && (" " + this._otherClass),
                opacity_style: _getOpatity(this.globalAlpha),
                fillStyle: this.fillStyle
            });
            if (this.globalCompositeOperation == "source-over") {
                this.buffer.push(html);
            } else {
                this.buffer.unshift(html);
            }
        },

        fillText: function(text, x, y, maxWidth){
            var pos = this.pos,
                ox = pos[0] + x,
                oy = pos[1] + y,
                data = this.bindData,
                datastr = [];
            if (data) {
                for (var i in data){
                    datastr.push(i + '="' + data[i] + '" ');
                }
            }
            var info = {
                top: "auto",
                bottom: "auto",
                left: "auto",
                right: "auto",
                width: maxWidth ? 'width:' + maxWidth + 'px;overflow:hidden;display:inline-block;' : '',
                text: text,
                font: this.font,
                bindData: datastr.join(""),
                otherClass: this._otherClass && (" " + this._otherClass),
                opacity_style: _getOpatity(this.globalAlpha),
                fillStyle: this.fillStyle
            };
            if (this.textBaseline === "top") {
                info.top = oy + 'px'; 
            } else {
                info.bottom = this.canvas.offsetHeight - oy + 'px';
            }
            if (this.textAlign === "right") {
                info.right = this.canvas.offsetWidth - ox + 'px'; 
            } else {
                info.left = ox + 'px';
            }
            var html = tpl.format(TPL_TEXT, info);
            if (this.globalCompositeOperation == "source-over") {
                this.buffer.push(html);
            } else {
                this.buffer.unshift(html);
            }
        },

        drawImage: function(imgObj, x, y, w, h){
            var pos = this.pos,
                data = this.bindData,
                datastr = [];
            if (data) {
                for (var i in data){
                    datastr.push(i + '="' + data[i] + '" ');
                }
            }
            var html = tpl.format(TPL_IMAGE, {
                src: imgObj.src,
                left: pos[0] + x,
                top: pos[1] + y,
                width: w,
                height: h,
                bindData: datastr.join(""),
                otherClass: this._otherClass && (" " + this._otherClass),
                opacity_style: _getOpatity(this.globalAlpha)
            });
            if (this.globalCompositeOperation == "source-over") {
                this.buffer.push(html);
            } else {
                this.buffer.unshift(html);
            }
        }

    };

    function _getOpatity(alpha){
        if (alpha == 1) {
            return '';
        }
        return is_ie8lt ? 'filter:alpha(opacity=' + (alpha*100) + ');zoom:1;'
                        : 'opacity:' + alpha + ';';

    }

    return function(dom){
        return new Danvas(dom);
    };

});
