define([
    "lib/jquery",
    "mod/lang",
    "mod/event",
    "mod/network",
    "mod/domready"
], function($, _, Event, net){

    var ev = Event();
    var a = 'none';
    var b = 'none';

    function printA(){
        console.info("a: ", a);
    }

    function printB(){
        console.info("b: ", b);
    }

    function delay(n){
        var subject = "delay:" + n;
        setTimeout(function(){
            ev.fire(subject, [new Date().getSeconds()]);
        }, n);
        return ev.promise(subject);
    }

    ev.bind("msg:A", function(msg){
        a = msg;
    });

    ev.bind("msg:B", function(msg){
        a = b = msg;
    });

    delay(1000).then(function(){
        ev.fire("msg:A", ["hey jude"]);
    });

    delay(2000).then(function(){

        net.getJSON("jsonp_data_2.js", {}, function(json){
            ev.resolve("jsonp:B", [json]);
        }, { callback: "jsoncallback_temp2", isScript: true });

        setTimeout(function(){
            ev.reject("jsonp:B");
        }, 1000);

        return ev.promise("jsonp:B");

    }).follow().done(function(json){

        ev.fire("msg:B", ["hi jimmy", json]);
        return ev.promise("msg:B");

    }).follow().then(function(msg){
        
        ev.fire("msg:A", ["hey jude, " + msg]);

    }).end().fail(function(){

        net.getJSON("jsonp_data_1.js", {}, function(json){
            ev.resolve("jsonp:A", [json]);
        }, { callback: "jsoncallback_temp", isScript: true });

        return ev.promise("jsonp:A");
        
    }).follow().then(function(json){

        ev.fire("msg:A", ["hey jude, ...", json]);
        ev.fire("msg:B", ["hi jimmy"]);

    });

    $("#btn1").click(function(e){
        b = "btn1";
        ev.fire("click:btn1", [e.target]);
    });

    $("#btn2").click(function(e){
        b = "btn2";
        ev.promise("clicked:btn2").resolve([e.target]);
    });

    var all_events = ["msg:A", "msg:B", "jsonp:A", "jsonp:B",
            "delay:1000", "delay:2000", "delay:3000", "delay:4000",
            "click:btn1", "clicked:btn2"];

    all_events.forEach(function(subject){
        ev.bind(subject, function(){
            console.log(this.subject, arguments);
        });
    });

    ev.when("msg:A", "msg:B", "jsonp:A", "jsonp:B", "click:btn1", "clicked:btn2")
        .then(function(){
            console.warn("all done!", arguments);
            printA();
            printB();
        });

    Event.when(
        ev.when("msg:A", "msg:B").then(function(){
            console.warn("recieve all messages");
        }), 
        ev.when("click:btn1", "clicked:btn2").any().then(function(){
            console.warn("click one button");
        })
    ).then(function(){
        console.warn("recieve all messages, click one button", arguments);
    });

    ev.when("msg:A", "msg:B", "jsonp:A", "jsonp:B").some(3) 
        .then(function(){
            console.warn("recieve 3/4", arguments);
        });

    delay(3000).then(printA);

    delay(4000).then(printA);

    delay(5000).then(printA);

    return 'test_event is evaluated';
});
