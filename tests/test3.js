
oz.def("notify", ["event"], function(Event){
	var ev = Event();

	setTimeout(function(){
		ev.fire("msg:A", ["hey jude"]);
	}, 4000);

	setTimeout(function(){
		ev.fire("msg:B", ["hi jimmy"]);
	}, 1000);

	return ev;
});

oz.def("msg:A", ["finish", "notify"], function(finish, ev){
	var o = {};
	ev.bind("msg:A", function(msg){
		o.message = msg;
		finish();
	});
	return o;
});

oz.def("msg:B", ["finish", "notify"], function(finish, ev, require, exports){
	ev.bind("msg:B", function(msg){
		exports.message = msg;
		finish();
	});
});

oz.def("delay:2000", ["finish", "msg:A", "msg:B", "jsonp:A", "jsonp_data_2.js"], function(finish){
	setTimeout(function(){
		finish();
	}, 2000);
});

oz.def("delay:1000", ["finish"], function(finish){
	var o = {};
	setTimeout(function(){
		o.time = new Date();
		finish();
	}, 1000);
	return o;
});

oz.def("jsonp:A", ["finish", "network"], function(finish, net){
	var response = {};
	net.getJSON("jsonp_data_1.js", {}, function(json){
		response.data = json;
		finish();
	}, { callback: "jsoncallback_temp" });
	return response;
});

oz.def("jsonp_data_2.js");

oz.def("click1", ["finish", "domReady"], function(finish){
	console.log("domReady for click1")
	var evObj = {};
	document.getElementById("btn1").onclick = function(e){
		oz.mix(evObj, e);
		finish();
	};
	return evObj;
});

oz.require(function(require){
    var msgA = require("msg:A"),
        msgB = require("msg:B"), 
        jsonpA = require("jsonp:A"), 
        jsonpB = require("jsonp_data_2.js"), 
        delay = require("delay:2000");
	console.info(msgA, msgB, jsonpA, jsonpB);
});

oz.require(["msg:B", "jsonp:A", "delay:1000"], function(msgB, jsonpA, delayTime){
	console.info(msgB, jsonpA, delayTime);
});

oz.require(["click1"], function(btn1){
	console.info("click1", btn1);
});

oz.require(["delay:2000"], function(delayTime, require){
    var btn1 = require("click1"),
        msgA = require("msg:A"),
        jsonpA = require("jsonp:A");
	console.info("click1", btn1, msgA, jsonpA, delayTime);
});

oz.require(["domReady", "event"], function(f, Event){
	console.log("domReady for click2")

	document.getElementById("readytest1").innerHTML += "oz ready1: " + new Date() + "<br>";
	document.getElementById("readytest2").innerHTML += "oz ready2: " + new Date() + "<br>";

	var ev = Event();
	document.getElementById("btn2").onclick = function(e){
		ev.enable("click2", [e]);
	};

	oz.def("click2", ["finish"], function(finish){
		var evObj = {};
		ev.bind("click2", function(e){
			oz.mix(evObj, e);
			finish();
		});
		return evObj;
	});

	oz.require(["click1", "click2", "jsonp_data_2.js"], function(btn1, btn2, jsonpB){
		console.info("click1+2", btn1, btn2, jsonpB);
	});

});
