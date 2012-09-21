require.config({
    baseUrl: 'js/',
    distUrl: 'dist_jam/'
});

require([
    'backbone'
], function(Backbone) {

    console.info('"backbone" ready!', Backbone);

});
