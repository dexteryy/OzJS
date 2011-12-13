/**
 * @import lib/oz.js
 * @import lib/jquery.js
 */
define('drag', ['jquery'], function($){

    function Drag(opt){

        var clearTimeout = window.clearTimeout,
            setTimeout = window.setTimeout,

            start,
            isMove = true,
            preventDefault = typeof opt.preventDefault === "undefined" ? true : false,
            whenDragStart = opt.whenDragStart || function(){},
            whenDraging = opt.whenDraging || function(){},
            whenDragEnd = opt.whenDragEnd || function(){},
            whenClick = opt.whenClick || function(){},
            handler = this.handler = $(opt.handler);

        this.dragHandle = function(e){
            if (!isMove || e.button == 2){
                return;
            }
            if (preventDefault) {
                e.preventDefault();
            }
            isMove = false;
            $(document).mousemove(draging).mouseup(dragEnd);
        }; 

        function dragStart(e) {
            start = [e.pageX, e.pageY];
            whenDragStart(start);
            handler.mouseover(dragDisable).mouseout(dragDisable).click(dragDisable);
        }

        function draging(e){
            e.preventDefault();
            if (!isMove) {
                isMove = true;
                dragStart(e);
            }
            var prev = start;
            start = [e.pageX, e.pageY];
            whenDraging(prev, start); 
        }

        function dragEnd(e){
            $(this).unbind("mousemove", draging).unbind("mouseup", dragEnd);
            if (isMove) {
                handler.unbind("mouseover", dragDisable).unbind("mouseout", dragDisable).unbind("click", dragDisable);
                whenDragEnd(start);
            } else {
                whenClick(e);
                isMove = true;
            }
        }

        function dragDisable(){
            return false;
        }

    }

    Drag.prototype = {

        enable: function(){
            if (!this.enabled) {
                this.handler.bind("mousedown", this.dragHandle);
                this.enabled = true;
            }
            return this;
        },

        disable: function(){
            if (this.enabled) {
                this.handler.unbind("mousedown", this.dragHandle);
                this.enabled = false;
            }
            return this;
        }

    };

    return function(opt){
        return new Drag(opt);
    };

});
