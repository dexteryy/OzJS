/**
 * @import lib/oz.js
 * @import lib/jquery.js
 * @import mod/lang.js
 * @import mod/template.js
 * @import mod/mainloop.js
 * @import mod/event.js
 * @import mod/scrollbar.js
 */
define("dialog", [
    "jquery", 
    "lang", 
    "template", 
    "mainloop",
    "event",
    "scrollbar"
], function($, _, tpl, mainloop, Event, scrollbar){

	// private methods and properties.
	var _id = 'dui-dialog',
	_ids = [],
	_current_dlg = null,
	_isIE6 = ($.browser.msie && $.browser.version === '6.0') ? true: false,
	_cache = {},

	//button callback. _button_callback[button id] = function.
	_button_callback = {},

	_CSS_DLG = 'dui-dialog',
	_CSS_BTN_CLOSE = 'dui-dialog-close',
	_CSS_DIV_BORDER = 'dui-dialog-shd',
	_CSS_DIV_SHADOW = 'dui-dialog-shd2',
	_CSS_DIV_CONTENT = 'dui-dialog-content',
	_CSS_IFRM = 'dui-dialog-iframe',
    _CSS_MASK = 'dui-mask',

	_TXT_CONFIRM = '确定',
	_TXT_CANCEL = '取消',
	_TXT_TIP = '提示',
	_TXT_LOADING = '下载中，请稍候...',

	_templ = '<div id="{{id}}" class="{{css_dlg}}" style="{{css_ishide}}">\
				<span class="{{css_shd}}"></span>\
				<div class="{{css_content}}">\
					{{title}}\
					<div class="dui-dialog-bd"></div>\
				</div>\
                {{bn_close}}\
			</div>',
	_templ_btn_close = '<a href="#" class="' + _CSS_BTN_CLOSE + '">X</a>',
	_templ_title = '<div class="dui-dialog-hd"><h3>{{title}}</h3></div>',
	_templ_iframe = '<iframe class="' + _CSS_IFRM + '"></iframe>',
    _templ_mask = '<div id="dui-mask" style="display:none;width:{{width}}px;height:{{height}}px;position:absolute;top:0;left:0;"></div>',
    _templ_panel = '<div class="dui-dialog-panel"><div class="shd"></div><div class="box"><div class="bd"></div><div class="ft"></div></div></div>',

	_button_config = {
		'confirm': {
			text: _TXT_CONFIRM,
			method: function(o) {
				o.close();
			}
		},
		'cancel': {
			text: _TXT_CANCEL,
			method: function(o) {
				o.close();
			}
		}
	},

	_default_config = {
		url: '',
        iframeURL: '',
		content: '',
		title: _TXT_TIP,
		width: 0,
		height: 0,
		visible: false,
        customClassName: '',
		iframe: false,
		maxWidth: 960,
        borderWidth: 6,
		autoupdate: false,
		cache: true,
		buttons: [],
		callback: null,
		dataType: 'text',
		isStick: false,
        isTrueShadow: false,
        isHideMask: true,
		isHideClose: false,
		isHideTitle: false
	},

	// mix config setting.
	_config = function(n, d) {
		var cfg = {},
		i;
		for (i in d) {
			if (d.hasOwnProperty(i)) {
				cfg[i] = typeof n[i] !== 'undefined' ? n[i] : d[i];
			}
		}
		return cfg;
	},

	_formCollection = function(frm) {
		var els = frm.elements,
		i = 0,
		el, data = [],
		getValue = {
			'select-one': function(el) {
				return encodeURIComponent(el.name) + '=' + encodeURIComponent(el.options[el.selectedIndex].value);
			},
			'select-multiple': function(el) {
				var i = 0,
				opt, values = [];
				for (; opt = el.options[i++];) {
					if (opt.selected) {
						values.push(encodeURIComponent(el.name) + '=' + encodeURIComponent(opt.value));
					}
				}
				return values.join('&');
			},
			'radio': function(el) {
				if (el.checked) {
					return encodeURIComponent(el.name) + '=' + encodeURIComponent(el.value);
				}
			},
			'checkbox': function(el) {
				if (el.checked) {
					return encodeURIComponent(el.name) + '=' + encodeURIComponent(el.value);
				}
			}
		};
		for (; el = els[i++];) {
			if (getValue[el.type]) {
				data.push(getValue[el.type](el));
			} else {
				data.push(encodeURIComponent(el.name) + '=' + encodeURIComponent(el.value));
			}
		}

		return data.join('&').replace(/\&{2,}/g, '&');
	},

	dialog = function(cfg) {
		var c = cfg || {};
		this.config = _config(c, _default_config);
		this.init();
	};

	dialog.prototype = {
		init: function() {
			if (!this.config) {
				return;
			}
            this.event = Event();

			this.render();
		},

		render: function() {
			var cfg = this.config,
                id = _id + _ids.length,
                body = $('body');

			_ids.push(id);

            var mask = $("#" + _CSS_MASK);
            if (!mask[0]) {
                var win = $(window);
                mask = $(tpl.format(_templ_mask, {
                    width: win.width(),
                    height: win.height()
                }));
                mask.appendTo(body);
            }

            body.append(tpl.format(_templ, {
                id: id,
                css_ishide: cfg.visible ? '': 'visibility:hidden;top:-999em;left:-999em;',
                css_dlg: _CSS_DLG + (cfg.customClassName ? ' ' + cfg.customClassName : ''),
                css_shd: cfg.isTrueShadow ? _CSS_DIV_SHADOW : _CSS_DIV_BORDER,
                css_content: _CSS_DIV_CONTENT,
                title: tpl.format(_templ_title, { title:  cfg.title }),
                bn_close: _templ_btn_close
            }));

			this.id = id;
			this.node = $('#' + id);
			this.box = $('.dui-dialog-content', this.node);
			this.title = $('.dui-dialog-hd', this.node);
			this.body = $('.dui-dialog-bd', this.node);
			this.btnClose = $('.' + _CSS_BTN_CLOSE, this.node);
			this.shadow = $('.' + (cfg.isTrueShadow ? _CSS_DIV_SHADOW : _CSS_DIV_BORDER), this.node);
			this.iframe = $('.' + _CSS_IFRM, this.node);
            this.mask = mask;

			this.set(cfg);
		},

		bind: function() {
            var o = this,
                body = $("body"),
                win = $(window);

			win.bind({
				resize: onResize,
				scroll: onScroll
			});

            if (!o.config.isHideClose) {

                this.btnClose.click(onClose);

                $(document).keyup(onKeypress);
                if (this.iframeContent) {
                    this.event.bind("frameOnload", function(){
                        $(o.iframeWindow[0].document).keyup(onKeypress);
                    });
                    this.event.wait("close", function(){
                        o.event.unbind("frameOnload");
                    });
                }

            }

            this.unbind = function(){
                win.unbind({
                    resize: onResize,
                    scroll: onScroll
                });
                if (!o.config.isHideClose) {
                    this.btnClose.unbind("click", onClose);
                    $(document).unbind("keyup", onKeypress);
                    if (this.iframeWindow) {
                        $(this.iframeWindow[0].document).unbind("keyup", onKeypress);
                    }
                }
            };

            function onResize() {
                if (_isIE6) {
                    return;
                }
                o.updatePosition();
                o.mask.css({
                    width: win.width(),
                    height: win.height()
                });
            }

            function onScroll() {
                if (!_isIE6) {
                    return;
                }
                o.updatePosition();
            }

            function onKeypress(e) {
				if (e.keyCode === 27) {
                    if (!({ "INPUT": 1, "TEXTAREA": 1 })[e.target.nodeName]) {
                        o.close();
                    }
				}
            }

            function onClose(e) {
				o.close();
				e.preventDefault();
			}
		},

        unbind: function(){},

		updateSize: function() {
			var w = this.node.width(),
			h,
            border_width = this.config.borderWidth,
			screen_height = $(window).height(),
			cfg = this.config;

			var bd = $('.dui-dialog-bd', this.node).eq(0).css({
				'height': 'auto'
			});

			h = this.node.height();

			if (w > cfg.maxWidth) {
				w = cfg.maxWidth;
				this.node.css('width', w + 'px');
			}

			if (h > screen_height) {
				bd = $('.dui-dialog-bd', this.node).eq(0).css({
					'height': (screen_height - 150) + 'px'
				});
			}
            scrollbar.init(bd[0], {hasShadow: true});

			h = this.node.height();

			this.shadow.width(w + border_width*2).height(h + border_width*2);
			this.iframe.width(w + border_width*2).height(h + border_width*2);
		},

		updatePosition: function() {
			if (this.config.isStick)
				return;
			var w = this.node.width(),
			h = this.node.height(),
			win = $(window),
            body = $("body"),
            border_width = this.config.borderWidth,
			t = _isIE6 ? win.scrollTop() : 0;
			this.node.css({
				left: Math.floor(win.width() / 2 - w / 2 - border_width) + 'px',
				top: Math.floor(win.height() / 2 - h / 2 - border_width) + t + 'px'
			});
		},

		set: function(cfg) {
			var title, close, html_str, el, id = this.id,
			num = [],
			that = this,
			genId = function(str) {
				num.push(0);
				return id + '-' + str + '-' + num.length;
			};

			if (!cfg) {
				return;
			}

			// set width and height.
			if (cfg.width) {
				this.node.css('width', cfg.width + 'px');
				this.config.width = cfg.width;
			}

			if (cfg.height) {
				this.node.css('height', cfg.height + 'px');
				this.config.height = cfg.height;
			}

            //if (cfg.customClassName) {
                //this.node[0].className = _CSS_DLG + " " + cfg.customClassName;
            //} else {
                //this.node[0].className = _CSS_DLG;
            //}

			// set buttons
			if ($.isArray(cfg.buttons) && cfg.buttons[0]) {
				el = $('.dui-dialog-ft', this.node);
				html_str = [];

				$(cfg.buttons).each(function() {
					var bn = arguments[1],
					bnId = genId('bn');
					if (typeof bn === 'string' && _button_config[bn]) {
						html_str.push('<span class="bn-flat"><input type="button" id="' + bnId + '" class="' + _id + '-bn-' + bn + '" value="' + _button_config[bn].text + '" /></span> ');
						_button_callback[bnId] = _button_config[bn].method;
					} else {
						html_str.push('<span class="bn-flat"><input type="button" id="' + bnId + '" class="' + _id + '-bn" value="' + bn.text + '" /></span> ');
						_button_callback[bnId] = bn.method;
					}
				});

				if (!el[0]) {
					el = this.body.parent().append('<div class="dui-dialog-ft">' + html_str.join('') + '</div>');
				} else {
					el.html(html_str.join('')).show();
				}

				// bind event.
				$('.dui-dialog-ft input', this.node).click(function(e) {
					var func = _button_callback[this.id];
					if (func) {
						func(that);
					}
				});

				this.footer = $('.dui-dialog-ft', this.node);
			} else {
				$('.dui-dialog-ft', this.node).hide().html('');
                this.footer = null;
			}

			if (typeof cfg.isTrueShadow === "boolean") {
                if (cfg.isTrueShadow) {
                    this.shadow[0].className = _CSS_DIV_SHADOW;
                    this.config.borderWidth = 0;
                } else {
                    this.shadow[0].className = _CSS_DIV_BORDER;
                }
				this.config.isTrueShadow = cfg.isTrueShadow;
            }

			// set hidden close button
			if (typeof cfg.isHideClose === "boolean") {
				if (cfg.isHideClose) {
					this.btnClose.hide();
				} else {
					this.btnClose.show();
				}
				this.config.isHideClose = cfg.isHideClose;
			}

			// set hidden title 
			if (typeof cfg.isHideTitle === "boolean") {
				if (cfg.isHideTitle) {
					this.title.hide();
                    this.box.addClass("notitle");
				} else {
					this.title.show();
                    this.box.removeClass("notitle");
				}
				this.config.isHideTitle = cfg.isHideTitle;
			}

			if (typeof cfg.isHideMask === "boolean") {
                this.config.isHideMask = cfg.isHideMask;
            }

			// set title.
			if (cfg.title) {
				this.setTitle(cfg.title);
				this.config.title = cfg.title;
			}

			// set enable iframe
			if (typeof cfg.iframe !== 'undefined') {
				if (!cfg.iframe) {
					this.iframe.hide();
				} else if (!this.iframe[0]) {
					this.node.prepend(_templ_iframe);
					this.iframe = $('.' + _CSS_IFRM, this.node);
				} else {
					this.iframe.show();
				}
				this.config.iframe = cfg.iframe;
			}

			// set content.
			if (cfg.content) {
				this.body.html(typeof cfg.content === 'object' ? $(cfg.content).html() : cfg.content);
                this.body[0].scrollTop = 0;
                this.iframeWindow = this.iframeContent = null;
				this.config.content = cfg.content;
            }
            
            if (cfg.iframeURL) {
                if (this.footer) {
                    this.footer.hide();
                }
                if (this.iframeContent) {
                    this.iframeContent.remove();
                    this.iframeWindow = null;
                }
                if (!cfg.content) {
                    this.body.html('');
                }
                this.iframeContent = $('<iframe class="dui-dialog-iframebd" frameborder="0" scrolling="no"></iframe>')
                    .load(function(){
                        if (that.footer) {
                            that.footer.show();
                        }
                        that.iframeWindow = $(this.contentWindow);
                        that.event.fire("frameOnload", [that]);
                    });
                this.body[0].appendChild(this.iframeContent[0]);
                this.body[0].scrollTop = 0;
            }
            this.config.iframeURL = cfg.iframeURL;

			// fetch content by URL.
			if (cfg.url) {
				if (cfg.cache && _cache[cfg.url]) {
					if (cfg.dataType === 'text' || ! cfg.dataType) {
						this.setContent(_cache[cfg.url]);
					}
					if (cfg.callback) {
						cfg.callback(_cache[cfg.url], this);
					}
				} else if (cfg.dataType === 'json') {
					this.setContent(_TXT_LOADING);
					if (this.footer) {
						this.footer.hide();
					}
					$.getJSON(cfg.url, function(data) {
                        if (that.footer) {
                            that.footer.show();
                        }
						_cache[cfg.url] = data;
						if (cfg.callback) {
							cfg.callback(data, that);
						}
					});
				} else {
					this.setContent(_TXT_LOADING);
					if (this.footer) {
						this.footer.hide();
					}
					$.ajax({
						url: cfg.url,
						dataType: cfg.dataType,
						success: function(content) {
							_cache[cfg.url] = content;
							if (that.footer) {
								that.footer.show();
							}
							that.setContent(content);
							if (cfg.callback) {
								cfg.callback(content, that);
							}
						}
					});
				}
			}

			var pos = cfg.position;
			if (pos) {
				this.node.css({
					left: pos[0] + 'px',
					top: pos[1] + 'px'
				});
			}

			if (typeof cfg.autoupdate === "boolean") {
				this.config.autoupdate = cfg.autoupdate;
			}

			if (typeof cfg.isStick === "boolean") {
				if (cfg.isStick) {
					this.node[0].style.position = "absolute";
				} else {
					this.node[0].style.position = "";
				}
				this.config.isStick = cfg.isStick;
			}

			return this.update();
		},

		update: function() {
			this.updateSize();
			this.updatePosition();
            //this.event.fire("update", [this]);
			return this;
		},

		setContent: function(str) {
			this.body.html(str);
            this.body[0].scrollTop = 0;
            this.iframeWindow = this.iframeContent = null;
			return this.update();
		},

		setTitle: function(str) {
			$('h3', this.title).html(str);
			return this;
		},

		// submit form in dialog
		submit: function(callback) {
			var that = this,
			frm = $('form', this.node);
			frm.submit(function(e) {
				e.preventDefault();

				var url = this.getAttribute('action', 2),
				type = this.getAttribute('method') || 'get',
				data = _formCollection(this);

				$[type.toLowerCase()](url, data, function(da) {
					if (callback) {
						callback(da);
					}
				},
				'json');
			});

			frm.submit();
		},

        confirm: function(str, fn, opt){
            var self = this,
                btn_cfg = _button_config,
                box = this.box,
                panel = box.find(".dui-dialog-panel");
            if (!panel[0]) {
                panel = $(_templ_panel).appendTo(box);
            }
            panel.find(".bd")[0].innerHTML = str;
            opt = opt || {};
            var buttons = opt.buttons || fn && ["confirm", "cancel"] || ["confirm"];
            panel.find(".ft")[0].innerHTML = buttons.map(function(btn){
                return '<span class="bn-flat"><input type="button" class="btn-' + btn + '" value="' + btn_cfg[btn].text + '" /></span>';
            }).join("");
            panel.find(".btn-confirm").click(function(){
                self.clearPanel(fn);
            });
            panel.find(".btn-cancel").click(function(){
                self.clearPanel();
            });
            panel.show();
            var h = panel.height(),
                w = box.width();
            panel.find(".box").css({
                top: -h,
                left: w/4,
                width: w/2
            }).animate({
                top: 0
            }, 400, "easeInOutQuint");
            this.panelEnabled = true;
        },

        clearPanel: function(cb){
            var panel = this.box.find(".dui-dialog-panel");
            if (panel[0]) {
                var self = this,
                    h = panel.height();
                panel.find(".box").animate({
                    top: -1000
                }, 400, "easeInOutQuint", function(){
                    panel.hide();
                    panel.find(".ft").find("input").remove();
                    self.panelEnabled = false;
                    if (cb) {
                        cb();
                    }
                });
            }
        },

		open: function() {
            var body = $('body');
			this.node.appendTo("body").css('visibility', 'visible').show();
            if (this.config.iframeURL) {
                this.iframeContent.attr("src", this.config.iframeURL);
            }
            if (!this.config.isHideMask) {
                var win = $(window);
                this.mask.css({
                    width: win.width(),
                    height: win.height()
                }).show();
            }
			this.bind();

            var self = this, 
                bd = self.body[0],
                iframeHeightCache = 0,
                heightCache = bd.scrollHeight;
            if (this.config.autoupdate) {
                mainloop.addRender("dialog" + this.id, function(){
                    try{
                        if (self.iframeWindow && self.iframeContent) {
                            var iframeHeight = self.iframeWindow[0].document.body.offsetHeight;
                            if (iframeHeight !== iframeHeightCache) {
                                iframeHeightCache = iframeHeight;
                                bd.style.height = 'auto';
                                self.iframeContent.css("height", iframeHeight);
                            }
                        }
                    } catch(ex) {
                        return;
                    }
                    if (bd.scrollHeight === heightCache) {
                        return;
                    }
                    var scrollTopCache = bd.scrollTop;
                    heightCache = bd.scrollHeight;
                    self.update();
                    bd.scrollTop = scrollTopCache;
                });
            }
            self.update();
            this.event.fire("open", [this]);
			return this;
		},

		close: function() {
            if (this.panelEnabled) {
                var self = this;
                this.clearPanel(function(){
                    self.close();
                });
                return this;
            }
			this.node.hide();
            this.mask.hide();
			this.unbind();
            mainloop.remove("dialog" + this.id);
            this.event.fire("close", [this]);
			return this;
		}
	};

	return function(cfg, isMulti) {
		// use sigleton dialog mode by default.
		if (!isMulti && _current_dlg) {
			return cfg ? _current_dlg.set(cfg) : _current_dlg;
		}

		if (!_current_dlg && ! isMulti) {
			_current_dlg = new dialog(cfg);
			return _current_dlg;
		}

		return new dialog(cfg);
	};

});

