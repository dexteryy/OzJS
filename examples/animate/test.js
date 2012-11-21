
require.config({
    baseUrl: '../../'
});

require([
    "mod/lang", 
    "lib/jquery", 
    "mod/event", 
    "mod/animate", 
    "mod/easing", 
    "mod/domready"
], function(_, $, Event, choreo, easingLib){

    choreo.config({
        //renderMode: 'js',
        easing: easingLib
    });

    var actor1 = choreo('stage1').actor({
        target: $('#box')[0],
        prop: 'width',
        to: '30%',
        easing: 'easeInOut',
        //delay: 400,
        duration: 1000
    });
    
    console.log('stage1 step:', 0);
    choreo('stage1').complete().play();

    var actor2 = choreo('stage1').actor($('.sprite')[0], {
        'transform': 'scaleX(0.2) scaleY(0.2) scaleZ(0.2)'
    }, 1000, 'easeInOut', 400);

    var actor3 = choreo('stage1').actor($('.sprite')[0], {
        'transform': 'rotate(180deg) translate(100px, -100px)'
    }, 1000, 'easeInOut', 400);

    var stage1_step4_done = new Event.Promise();
    var group1n2 = choreo('stage1').group(actor1, actor2);

    group1n2.follow().done(function(){
        console.info('stage1: ', 1, 2, 'done');
    });

    choreo('stage1').follow().done(function(){
    
        console.log('stage1 step:', 1);

        stage2.cancel();

        actor1.reverse();
        actor2.reverse();
        actor3.reverse();
        choreo('stage1').play();
        console.info('stage1: ', 'reverse');

        var promise = new Event.Promise();

        setTimeout(function(){

            choreo('stage1').pause();
            console.info('stage1: ', 'pause');

            promise.resolve();

        }, 1000);

        return promise;

    }).follow().done(function(){

        console.log('stage1 step:', 2);

        actor5.setto({ right: 0 });
        stage2.play();

        actor1.reverse();
        actor2.reverse();
        actor3.reverse();

        group1n2.follow().done(function(){
            console.info('stage1: ', 'cancel reverse');
        });

        choreo('stage1').play();

        return choreo('stage1').follow();

    }).follow().done(function(){

        console.log('stage1 step:', 3);

        actor2.extendto('scaleX(1.8) scaleY(1.8) scaleZ(1.8)');
        actor3.extendto('rotate(360deg)');

        choreo('stage1').play();

        return choreo('stage1').follow();

    }).follow().done(function(){

        console.log('stage1 step:', 4);

        actor1.setto('0%');
        actor3.extendto('rotate(360deg)');
        actor2.setto('scaleX(1) scaleY(1) scaleZ(1)');
        choreo('stage1').play();

        return choreo('stage1').follow();

    }).follow().done(stage1_step4_done.pipe.resolve);

    actor1.follow().bind(function(res){
        console.info('stage1: ', 1, res);
        res.target.style.background = "#f00";
    });
    
    actor2.follow().bind(function(res){
        console.info('stage1: ', 2, res);
        res.target.style.background = "#00f";
    });

    actor3.follow().bind(function(res){
        console.info('stage1: ', 3, res);
    });


    var stage2 = choreo();

    var actor4 = stage2.actor($('.sprite')[0], {
        'left': '100px',
        'top': '200px',
        'transform': 'rotate(0deg)'
    }, 2000, 'easeInOut').exit();
    
    actor4.follow().bind(function(res){
        console.info('actor4: ', 'done', res);
    });

    stage2.play();

    var actor5 = stage2.actor($('#box')[0], {
        'font-size': '40px',
        'right': '400px'
    }, 2000, 'easeInOut');

    var part1_done = Event.when(
        stage2.follow(), 
        stage1_step4_done
    ).done(function(res1, res2){

        console.info('part1: ', 'done', arguments);

        choreo('stage1').clear();
        stage2.clear();

        actor4.enter(choreo('stage1'));
        actor1.reverse().enter(stage2);
        choreo('stage1').play();
        stage2.play();


    });

});
