/**
 * @author Dexter.Yy (dexter.yy at gmail.com)
 */
oz.def("oop", function(require, exports){
    var oz = this,
        obj_uuid = 0;

    function clone(oldone, ex){
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
                    this.objectId = "oz-object-" + ++obj_uuid; //实例的唯一ID
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

    exports.ns = function(namespace, v, parent){
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
    };

    exports.newClass = function(father, ex){
        return !ex ? clone(false, father) : clone(father, ex);
    };
});

