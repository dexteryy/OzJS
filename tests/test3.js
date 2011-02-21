oz.def("event", "tui.js");
oz.def("network", "tui.js");

oz.def("notify", ["event"], function(ev){
	ev = new ev.Event();

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

oz.def("msg:B", ["finish", "exports", "notify"], function(finish, exports, ev){
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

oz.require(["msg:A", "msg:B", "jsonp:A", "jsonp_data_2.js", "delay:2000"],
function(msgA, msgB, jsonpA, jsonB){
	console.info(msgA, msgB, jsonpA, jsonB);
});

oz.require(["msg:B", "jsonp:A", "delay:1000"],
function(msgB, jsonpA, delayTime){
	console.info(msgB, jsonpA, delayTime);
});
