/**
 * using AMD (Asynchronous Module Definition) API with OzJS
 * see http://ozjs.org for details
 *
 * Copyright (C) 2010-2012, Dexter.Yy, MIT License
 * vim: et:ts=4:sw=4:sts=4
 */
define("mod/scrollbar", [
    "lib/jquery", 
    "mod/lang", 
    "mod/browsers", 
    "mod/drag"
], function($, _, browsers, Drag){

    var ua = navigator.userAgent.toLowerCase(),
        is_webkit = browsers.webkit,
        is_mozilla = browsers.mozilla,
        mozVersion = is_mozilla && parseFloat(browsers.version, 10),
        is_chrome = ua.indexOf('chrome') > 0,

        EDGE_WIDTH = 5,
        MIN_TRACK = 30,

        TPL_BAR = '<a href="javaScript:;" class="oz-scrollbar"></a>';

    var scrollbar = {
    
        init: function(box, opt){
            // params transform
            var hasShadow=false, fix, scrollTop;
            var scrollQueue = _.fnQueue();
            if (typeof opt === 'object') {
                fix = opt.fix;
                hasShadow = (opt.hasShadow === undefined) ? false : opt.hasShadow;
                scrollTop = opt.scrollTop;
            } else {
                scrollTop = opt;
            }

            if (!box) {
                return;
            }

            var sbObj = $(box).data("_oz_scrollbar");
            if (!sbObj) {
                sbObj = {};
                $(box).data("_oz_scrollbar", sbObj);
            }
            sbObj.onScroll = onScroll;

            if (scrollTop !== undefined) {
                box.scrollTop = scrollTop;
            }
            // 如果不需要滚动, 直接推出，并且清除上次的滚动相关元素 + 数据
            var outer_h = box.offsetHeight - EDGE_WIDTH*2 - (fix || 0)*2,
                inner_h = box.scrollHeight,
                bar_h = outer_h / inner_h * outer_h;
            if (outer_h <= 0) {
                this.clear(box);
                return;
            }
            if (bar_h < MIN_TRACK) {
                bar_h = MIN_TRACK;
            }
            var track_h = outer_h - bar_h;
            if (track_h <= EDGE_WIDTH*2) {
                this.clear(box);
                return;
            } else {
                this.resetData(box);
            }


            if ( is_webkit || (browsers.msie && parseInt(browsers.version, 10) < 9)) {
            // use native scrollbar
                $(box).css({
                    'overflow-y': 'auto'
                });
                $(box).scroll(onScroll);
            } else {
            // use dom to imitate
                var bar = $(".oz-scrollbar", box);
                if (!bar[0]) {
                    bar = $(TPL_BAR).appendTo(box);
                }
                bar.css({
                    top: box.scrollTop / (inner_h - outer_h) * track_h + box.scrollTop + EDGE_WIDTH,
                    height: bar_h
                });

                sbObj.scrollbar = bar;

                sbObj.drag = Drag({
                    handler: bar[0],
                    whenDraging: scrolling
                }).enable();

                sbObj.onWheel = onWheel;

                scrollQueue.push(syncBar);

                $(box).mousewheel(onWheel).scroll(onScroll);
                $("iframe", box).each(function(){
                    if (this.contentWindow) {
                        $(this.contentWindow.document).mousewheel(onWheel);
                    }
                });
            }

            if (hasShadow) {
            // add shadow
                var topShadow = $('<div class="oz-scroll-top-shadow"></div>');
                var bottomShadow = $('<div class="oz-scroll-bottom-shadow"></div>');
                var parent = $(box).parent();

                topShadow.insertBefore(box);
                bottomShadow.insertAfter(box);

                topShadow.css({
                    'top': box.offsetTop,
                    'left': box.offsetLeft,
                    'width': box.offsetWidth
                });
                bottomShadow.css({
                    'bottom': parent[0].offsetHeight - box.offsetTop - box.offsetHeight,
                    'left': box.offsetLeft,
                    'width': box.offsetWidth
                });

                sbObj.topShadow = topShadow;
                sbObj.bottomShadow = bottomShadow;

            // syncShadow
                syncShadow();
                scrollQueue.push(syncShadow);
            }

            function scrolling(start, end){
                sbObj.dragging = true;
                var d = end ? end[1] - start[1] : start,
                    y = d + parseFloat(bar[0].style.top || 0) - box.scrollTop - EDGE_WIDTH;
                if (y < 0) {
                    y = 0;
                } else if (y > track_h) {
                    y = track_h;
                }
                box.scrollTop = y / track_h * (inner_h - outer_h);
                bar[0].style.top = y + box.scrollTop + EDGE_WIDTH + "px";
            }

            function onScroll(){
                scrollQueue.call();
            }

            function syncBar() {
                if (!sbObj.dragging) {
                    var t = box.scrollTop;
                    bar[0].style.top = t / (inner_h - outer_h) * track_h + t + EDGE_WIDTH + "px";
                }
                sbObj.dragging = false;
            }

            function syncShadow() {
                var percentage = box.scrollTop / (box.scrollHeight - box.clientHeight);
                if (percentage <= 0.1) {
                    topShadow.css('opacity', percentage * 10);
                    bottomShadow.css('opacity', 1);
                } else if (percentage >= 0.9) {
                    topShadow.css('opacity', 1);
                    bottomShadow.css('opacity', (1 - percentage) * 10);
                } else {
                    topShadow.css('opacity', 1);
                    bottomShadow.css('opacity', 1);
                }
            }

            function onWheel(e, delta, deltaX, deltaY){
                var t = e.target;
                var x;
                if (is_webkit) {
                    x = 1;
                    if (is_chrome) {
                        // chrome也是幅值，无语。
                        x = Math.abs(deltaY) * 10;
                    }
                } else if (is_mozilla) {
                    // firefox3.5 支持MozMousePixelScroll可以精确到像素
                    // https://developer.mozilla.org/en/Gecko-Specific_DOM_Events
                    if (mozVersion >= 3.5) {
                        x = Math.abs(deltaY) * 0.1;
                    } else {
                        x = Math.abs(deltaY) * 30;
                    }
                } else {
                    // http://msdn.microsoft.com/en-us/library/ms535142%28v=vs.85%29.aspx
                    // ie, firefox 3.5以下, delta不是精确值而是幅度
                    x = Math.abs(deltaY) * 20;
                }
                if (t.nodeName === "TEXTAREA") {
                    var top = t.scrollTop;
                    if (deltaY > 0 && top > 0) {
                        return;
                    }
                    t.scrollTop += 5;
                    if (deltaY < 0 && t.scrollTop > top) {
                        return;
                    }
                }
                scrolling(-x * deltaY);
                return false;
            }

        },

        clear: function(box){
            var _box = $(box);
            var sbObj = _box.data('_oz_scrollbar');
            if (sbObj) {
                sbObj.scrollbar && sbObj.scrollbar.remove();
                this.resetData(box);
            }
        },

        resetData: function(box){
            var _box = $(box);
            var sbObj = _box.data("_oz_scrollbar");
            if (sbObj) {
                sbObj.topShadow && sbObj.topShadow.remove();
                sbObj.bottomShadow && sbObj.bottomShadow.remove();
                sbObj.drag && sbObj.drag.disable();
                _box.unbind("scroll", sbObj.onScroll);
                if (sbObj.onWheel) {
                    _box.unbind("mousewheel", sbObj.onWheel);
                    $("iframe", box).each(function(){
                        if (this.contentWindow) {
                            $(this.contentWindow.document).unbind("mousewheel", sbObj.onWheel);
                        }
                    });
                }
            }
        }

    };

    return scrollbar;

});
