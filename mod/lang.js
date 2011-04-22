/**
 * @author Dexter.Yy (dexter.yy at gmail.com)
 */
oz.def("lang", function(require, exports){

    var oz = this;

    exports.fnQueue = function(){
        var queue= [], dup = false;
        
        function getCallMethod(type){
            return function(){
                var re, fn;
                dup = this.concat([]).reverse();
                while (fn = dup.pop()) {
                    re = fn[type].apply(fn, arguments);
                }
                dup = false;
                return re;
            };
        }

        oz.mix(queue, {
            call: getCallMethod('call'),
            apply: getCallMethod('apply'),
            clear: function(func){
                if (!func) {
                    this.length = 0;
                } else {
                    var size = this.length,
                        popsize = size - dup.length;
                    for (var i = this.length - 1; i >= 0; i--) {
                        if (this[i] === func) {
                            this.splice(i, 1);
                            if (dup && i >= popsize)
                                dup.splice(size - i - 1, 1);
                        }
                    }
                    if (i < 0)
                        return false;
                }
                return true;
            }
        });
        return queue;
    };

    //补充ECMAScript5的方法, 除ie外都有native实现
    var _aproto = Array.prototype;
    if (!_aproto.filter)
        _aproto.filter = function(fn, sc){
            var r = [];
            for(var i = 0, l = this.length; i < l; i++){
                if( (i in this) && fn.call(sc, this[i], i, this) )
                    r.push(this[i]);
            }
            return r;
        };
        
    if (!_aproto.forEach) 
        _aproto.forEach = function(fn, sc){
            for(var i = 0, l = this.length; i < l; i++){
                if (i in this)
                    fn.call(sc, this[i], i, this);
            }
        };

    if (!_aproto.map) 
        _aproto.map = function(fn, sc){
            for(var i = 0, copy = [], l = this.length; i < l; i++){
                if (i in this)
                    copy[i] = fn.call(sc, this[i], i, this);
            }
            return copy;
        };

    if (!_aproto.indexOf) 
        _aproto.indexOf = function(elt, from){
            var l = this.length;
            from = parseInt(from) || 0;
            if (from < 0)
                from += l;
            for (; from < l; from++) {
                if (from in this && this[from] === elt)
                    return from;
            }
            return -1;
        };

    if (!_aproto.lastIndexOf) 
        _aproto.lastIndexOf = function(elt, from){
            var l = this.length;
            from = parseInt(from) || l - 1;
            if (from < 0)
                from += l;
            for (; from > -1; from--) {
                if (from in this && this[from] === elt)
                    return from;
            }
            return -1;
        };

});
