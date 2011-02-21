oz.def("lang", function(){
	return {
		fnQueue: function(){
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
		}
	};
});

oz.def("oop", function(){
	var obj_uuid = 0;

	var O = {
		ns: function(namespace, v, parent){
			var i, p = parent || window, n = namespace.split(".").reverse();
			while ((i = n.pop()) && n.length > 0) {
				if (typeof p[i] === 'undefined') {
					p[i] = {};
				} else if (typeof p[i] !== "object") {
					return false;
				}
				p = p[i];
			}
			if (typeof v != "undefined")
				p[i] = v;
			return p[i];
		},
		newClass: function(father, ex){
			return !ex ? O.clone(false, father) : O.clone(father, ex);
		},
		clone: function(oldone, ex){
			var newobj,
				isClass = !oldone || oz.isFunction(oldone), //继承操作
				constructorFn = ex && !oz.isFunction(ex) && ex.initialize || ex; //子类构造函数
			if (!isClass) {
				newobj = function(){
					if(constructorFn)
						constructorFn.apply(this, arguments);
				};
				newobj.prototype = oldone;
				return new newobj();	
			} else {
				 //为module内部定义的类提供相关方法
				var c = { _sandbox: ex.sandbox, _default: ex.attr };
				newobj = function(){ //构造函数
					if (this.constructor === newobj) { // 如果this指向子类实例，已经执行过以下的初始化代码
						this.objectId = "TUI-object-" + ++obj_uuid; //实例的唯一ID
						var p = c;
						if (p._sandbox && p._default)
							this.attr(p._sandbox, p._default); //初始化私有属性的默认值
					}
					if(constructorFn) //执行构造函数的自定义部分
						constructorFn.apply(this, arguments);
				};
				// 原型继承, 子类构造函数里需要显示调用父类构造函数
				var newproto = oldone ? this.clone(oldone.prototype) : {};
				// 混入其他超类方法
				if (ex.mixin) 
					oz.mix.apply(this, ([newproto]).concat(ex.mixin)); 
				// 加入子类方法, 覆盖混入和继承
				oz.mix(newproto, ex, { 
					constructor: newobj, // 恢复
					superClass: oldone || Object //在子类的构造函数中可以用this.superClass访问父类
				});
				delete newproto.initialize;
				if (c._sandbox) {
					delete newproto.sandbox; //沙盒一定要删除，不能暴露出去
					newproto.attr = function(sandbox, attrname, value){ //通过sandbox参数杜绝来自外部的访问
						return sandbox.attr.call(this, attrname, value);
					};
				}
				newobj.prototype = newproto;
				return newobj;
			}
		}
	};

	return O;
});

oz.def("event", ["require", "lang", "oop"], function(require){
	var newClass = require("oop").newClass;
	var fnQueue = require("lang").fnQueue;

	var Event = newClass({
		initialize: function(){
			this.queue = {};
			this.status = {};
			this.evObjCache = {};
		},
		alone: function(type){
			var cache = this.evObjCache[type];
			if (cache)
				return cache;
			var self = this, newEv = {},
				override = { 'bind': 1, 'unbind': 1, 'fire': 1, 'enable': 1, 'disable': 1, 'wait': 1 };
			for (var i in self) {
				if (override[i]) {
					newEv[i] = (function(origin){
						return function(){
							return origin.apply(self, [].concat.apply([type], arguments));
						};
					})(self[i]);
				}
			}
			return this.evObjCache[type] = newEv;
		},
		bind: function(type, handler){
			if (typeof type !== 'string') {
				var bind = arguments.callee;
				for (var p in type) {
					bind(p, type[p]);
				}
				return this;
			}
			var data = this.queue,
				status = this.status[type];
			if (!data[type])
				data[type] = fnQueue();
			if (status)
				handler.apply(this, status);
			data[type].push(handler);
			return this;
		},
		unbind: function(type, handler){
			var data = this.queue;
			if(data[type]) 
				data[type].clear(handler);
			return this;			
		},
		fire: function(type, params){
			var data = this.queue;
			if (data[type])
				data[type].apply(this, params || []);
			return this;
		},
		enable: function(type, params){
			var data = this.queue,
				args = params || [];
			this.status[type] = args;
			// ie bug，下面的循环执行不是阻塞的，可能会被插入其他异步回调
			// 所以必须在这之前先更新状态
			if (data[type]) {
				data[type].apply(this, args);
			}
			return this;
		},
		disable: function(type){
			delete this.status[type];
			return this;
		},
		wait: function(type, fn){
			var self = this;
			this.bind(type, function(){
				self.unbind(type, arguments.callee);
				fn.apply(self, arguments);
			});
			return this;
		}
	});

	return { Event: Event };
});


oz.def("network", ["exports", "require", "oop"], function(exports, require){
	var ns = require("oop").ns;
	var uuid4jsonp = 1;

	var httpParam = function(a) {
		var s = [];
	    if (a.constructor == Array) {
	        for (var i = 0; i < a.length; i++)
	            s.push(a[i].name + "=" + encodeURIComponent(a[i].value));
	    } else {
	        for (var j in a)
	            s.push(j + "=" + encodeURIComponent(a[j]));
	    }
	    return s.join("&").replace(/%20/g, "+");
	};

	var ajax = function(s){
		var options = {
			type: s.type || "GET",
			url: s.url || "",
			data: s.data || null,
			dataType: s.dataType,
			contentType: s.contentType || "application/x-www-form-urlencoded",
			username: s.username || null,
			password: s.password || null,
			timeout: s.timeout || 0,
			processData: s.processData || true,
			beforeSend: s.beforeSend || function(){},
			complete: s.complete || function(){},
			handleError: s.handleError || function(){},
			success: s.success || function(){},
			accepts: {
				xml: "application/xml, text/xml",
				html: "text/html",
				script: "text/javascript, application/javascript",
				json: "application/json, text/javascript",
				text: "text/plain",
				_default: "*/*"
			}
		};
		
		if ( options.data && options.processData && typeof options.data != "string" )
			options.data = httpParam(options.data);
		if ( options.data && options.type.toLowerCase() == "get" ) {
			options.url += (options.url.match(/\?/) ? "&" : "?") + options.data;
			options.data = null;
		}
		
		var status, data, requestDone = false, xhr = window.ActiveXObject ? new ActiveXObject("Microsoft.XMLHTTP") : new XMLHttpRequest();
		xhr.open( options.type, options.url, true, options.username, options.password );
		try {
			if ( options.data )
				xhr.setRequestHeader("Content-Type", options.contentType);
			xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
			xhr.setRequestHeader("Accept", s.dataType && options.accepts[ s.dataType ] ?
				options.accepts[ s.dataType ] + ", */*" :
				options.accepts._default );
		} catch(e){}
		
		if ( options.beforeSend )
			options.beforeSend(xhr);
			
		var onreadystatechange = function(isTimeout){
			if ( !requestDone && xhr && (xhr.readyState == 4 || isTimeout == "timeout") ) {
				requestDone = true;
				if (ival) {
					clearInterval(ival);
					ival = null;
				}

				status = isTimeout == "timeout" && "timeout" || !httpSuccess( xhr ) && "error" || "success";

				if ( status == "success" ) {
					try {
						data = httpData( xhr, options.dataType );
					} catch(e) {
						status = "parsererror";
					}
					
					options.success( data, status );
				} else
					options.handleError( xhr, status );
				options.complete( xhr, status );
				xhr = null;
			}
		};

		var ival = setInterval(onreadystatechange, 13); 
		if ( options.timeout > 0 )
			setTimeout(function(){
				if ( xhr ) {
					xhr.abort();
					if( !requestDone )
						onreadystatechange( "timeout" );
				}
			}, options.timeout);	
			
		xhr.send(options.data);

		function httpSuccess(r) {
			try {
				return !r.status && location.protocol == "file:" || ( r.status >= 200 && r.status < 300 ) || r.status == 304 || r.status == 1223 || TUI.browser.safari && r.status == undefined;
			} catch(e){}
			return false;
		}
		function httpData(r,type) {
			var ct = r.getResponseHeader("content-type");
			var xml = type == "xml" || !type && ct && ct.indexOf("xml") >= 0;
			var data = xml ? r.responseXML : r.responseText;
			if ( xml && data.documentElement.tagName == "parsererror" )
				throw "parsererror";
			if ( type == "script" )
				eval.call( window, data );
			if ( type == "json" )
				data = eval("(" + data + ")");
			return data;
		}
		return xhr;
	};

	exports.ajax = ajax;
	exports.params = httpParam;

	exports.getJSON = function(url, data, fn, op){
		var domain = url.match(/https?\:\/\/(.+?)\//);
		if (fn) {
			if ((!op || !op.isScript) && domain && domain[1] === window.location.host) {
				ajax({
					url: url,
					data: data,
					success: fn,
					dataType: "json"
				});
				return true;
			}
		}
		op = oz.mix({
			charset: "gbk",
			callback: "tuijsonp" + ++uuid4jsonp
		}, op || {});
		if (op.random)
			data[op.random] = +new Date();
		var cbName = op.callbackName || 'jsoncallback';
		data[cbName] = op.callback;
		url = [url, /\?/.test(url) ? "&" : "?", httpParam(data)].join("");
		if (fn)
			ns(op.callback, fn);
		delete op.callback;
		oz.getScript(url, op);
	};

});

