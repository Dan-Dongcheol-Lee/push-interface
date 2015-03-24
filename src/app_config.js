var vertx = require('vertx');
var console = require('vertx/console');
var container = require('vertx/container');
var http = require('vertx/http');
var eventBus = vertx.eventBus;

var routeMatcher = new vertx.RouteMatcher()
    // get push interfaces
    .get('/config/push-interfaces/:pushId', function(req) {
        var pushId = req.params().get("pushId");
        console.log('pushId: ' + pushId);
        req.response.end('Return pushId:' + pushId);
    })
    // post push interface
    .post('/config/push-interfaces', function(req) {
        var pushId = req.params().get("pushId");
        console.log('pushId: ' + pushId);
        req.response.end('Return pushId:' + pushId);
    })
    // get custom event handlers
    .get('/config/event-handlers/:handlerId', function(req) {
        var handlerId = req.params().get("handlerId");
        console.log('handlerId: ' + handlerId);
        req.response.end('Return handlerId:' + handlerId);
    })
    // post custom event handler
    .post('/config/event-handlers', function(req) {
        var handlerId = req.params().get("handlerId");
        console.log('handlerId: ' + handlerId);
        req.response.end('Return handlerId:' + handlerId);
    })
    .optionsWithRegEx('\\/([^\\/]+)', function(req) {
        req.response
            .putHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
            .putHeader('Access-Control-Allow-Origin', '*')
            .end();
    });

http.createHttpServer()
    .requestHandler(routeMatcher)
    .listen(container.config.port, 'localhost');
