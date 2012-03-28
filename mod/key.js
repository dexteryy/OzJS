/**
 * @import lib/oz.js
 * @import lib/jquery.js
 * @import mod/lang.js
 */
define("key", ["jquery", "lang"], function($, _){

    var specialKeys = {
			8: "backspace", 9: "tab", 13: "return", 16: "shift", 17: "ctrl", 18: "alt", 19: "pause",
			20: "capslock", 27: "esc", 32: "space", 33: "pageup", 34: "pagedown", 35: "end", 36: "home",
			37: "left", 38: "up", 39: "right", 40: "down", 45: "insert", 46: "del", 
			96: "0", 97: "1", 98: "2", 99: "3", 100: "4", 101: "5", 102: "6", 103: "7",
			104: "8", 105: "9", 106: "*", 107: "+", 109: "-", 110: ".", 111 : "/", 
			112: "f1", 113: "f2", 114: "f3", 115: "f4", 116: "f5", 117: "f6", 118: "f7", 119: "f8", 
			120: "f9", 121: "f10", 122: "f11", 123: "f12", 144: "numlock", 145: "scroll", 191: "/", 224: "meta"
		},
	
		shiftNums = {
			"`": "~", "1": "!", "2": "@", "3": "#", "4": "$", "5": "%", "6": "^", "7": "&", 
			"8": "*", "9": "(", "0": ")", "-": "_", "=": "+", ";": ":", "'": "\"", ",": "<", 
			".": ">",  "/": "?",  "\\": "|"
		};

    function Keys(opt){
        opt = opt || {};
        var self = this;
        this.target = opt.target || document;
        this.event = opt.event || "keydown";
        this.keyHandlers = {};
        this.rules = [];
        this.sequence = {};
        this.sequenceNums = [];
        this.history = [];
        this.trace = opt.trace;
        this.traceStack = opt.traceStack || [];
        this._handler = function(ev){
            if ( this !== ev.target && (/textarea|select/i.test(ev.target.nodeName) 
                    || ev.target.type === "text") ) {
                return true;
            }
            var handlers = self.keyHandlers[self.event];
            if (!handlers) {
                return true;
            }
            var possible = getKeys(ev),
                handler,
                queue_handler,
                is_disabled = self.lock || !self.check(this, ev);

            if (is_disabled) {
                return false;
            }
            for (var i in possible) {
                handler = handlers[i];
                if (handler) {
                    break;
                }
            }

            if (self.sequenceNums.length) {
                var history = self.history;
                history.push(i);
                if (history.length > 10) {
                    history.shift();
                }

                if (history.length > 1) {
                    for (var j = self.sequenceNums.length - 1; j >= 0; j--) {
                        queue_handler = handlers[history.slice(0 - self.sequenceNums[j]).join("->")];
                        if (queue_handler) {
                            if (self.trace) {
                                self._trace(j);
                            }
                            queue_handler.apply(this, arguments);
                            history.length = 0;
                            return false;
                        }
                    }
                }
            }

            if (handler) {
                if (self.trace) {
                    self._trace(i);
                }
                handler.apply(this, arguments);
            }

        };

        $(this.target).bind(this.event, this._handler);
    }

    Keys.prototype = {

        addHandler: function(event, keyname, fn){
            var self = this,
                handlers = this.keyHandlers[event],
                add = function(kname){
                    var order = kname.split('->');
                    if (order.length > 1) {
                        self.sequence[order.length] = 1;
                        var seq = [];
                        for (var i in self.sequence) {
                            seq.push(parseInt(i, 10));
                        }
                        self.sequenceNums = seq.sort(function(a,b){ return a - b; });
                    }
                    handlers[kname.toLowerCase()] = fn;
                };
            if (!handlers) {
                handlers = this.keyHandlers[event] = {};
            }
            if (Array.isArray(keyname)) {
                keyname.forEach(function(n){
                    add(n);
                });
            } else {
                add(keyname);
            }
            return this;
        },

        _trace: function(key){
            this.traceStack.unshift('[' + key + ']');
            if (this.traceStack.length > this.trace) {
                this.traceStack.pop();
            }
        },

        reset: function(){
            $(this.target).unbind(this.event, this._handler);
            this.keyHandlers = {};
            this.rules = [];
            this.history = [];
            delete this._handler;
            this.lock = false;
        },

        addRule: function(fn){
            this.rules.push(fn);
            return this;
        },

        enable: function(){
            this.lock = false;
        },

        disable: function(){
            this.lock = true;
        },

        check: function(target, ev){
            var re = true,
                r = this.rules;
            for (var i = 0, l = r.length; i < l; i++) {
                if (!r[i].call(target, ev)) {
                    re = false;
                    break;
                }
            }
            return re;
        }

    };

    (["down", "up", "press" ]).forEach(function(name){
        this[name] = function(keyname, fn){
            this.addHandler("key" + name, keyname, fn);
            return this;
        };
    }, Keys.prototype);


    function getKeys(event){
        // Keypress represents characters, not special keys
        var special = event.type !== "keypress" && specialKeys[ event.which ],
            character = String.fromCharCode( event.which ).toLowerCase(),
            key, modif = "", possible = {};

        // check combinations (alt|ctrl|shift+anything)
        if ( event.altKey && special !== "alt" ) {
            modif += "alt+";
        }

        if ( event.ctrlKey && special !== "ctrl" ) {
            modif += "ctrl+";
        }
        
        // TODO: Need to make sure this works consistently across platforms
        if ( event.metaKey && !event.ctrlKey && special !== "meta" ) {
            modif += "meta+";
        }

        if ( event.shiftKey && special !== "shift" ) {
            modif += "shift+";
        }

        if ( special ) {
            possible[ modif + special ] = true;
        } else {
            var k = modif + character;
            if (k) {
                possible[k] = true;
            }
            k = shiftNums[ character ];
            if (k) {
                possible[modif + k] = true;

                // "$" can be triggered as "Shift+4" or "Shift+$" or just "$"
                if ( modif === "shift+" ) {
                    k = shiftNums[ character ];
                    if (k) {
                        possible[k] = true;
                    }
                }
            }
        }

        return possible;
    }

    return function(opt){
        return new Keys(opt);
    };

});


