var vertx = require('vertx');
var console = require('vertx/console');
var container = require('vertx/container');
var http = require('vertx/http');
var eventBus = vertx.eventBus;

var toJs = function(jsObject) {
    return JSON.parse(jsObject);
};

var failure = function(msg) {
    return {status: 'failed', message: msg};
}

var success = function(msg, result) {
    return {status: 'ok', message: msg, result: result};
}

var validateRequired = function(req, property, message) {
    if (!property) {
        req.response.statusCode(400).end(failure(message));
        return false;
    }
    return true;
};

var routeMatcher = new vertx.RouteMatcher()
    // get push interfaces
    .get('/config/push-interfaces', function(req) {
        var pushInterfaces = vertx.getMap('config.push-interfaces').values();
        console.log('push-interfaces: ' + pushInterfaces);
        req.response.end(pushInterfaces);
    })
    .get('/config/push-interfaces/:pushId', function(req) {
        var pushId = req.params().get("pushId");
        var pushInterface = vertx.getMap('config.push-interfaces').get(pushId);
        console.log('pushId: ' + pushId + ', pushInterface: ' + pushInterface);
        req.response.end(pushInterface);
    })
    // post push interface
    .post('/config/push-interfaces', function(req) {
        req.dataHandler(function(buffer) {
            console.log('I received ' + buffer.length() + ' bytes');
            var reqJson = toJs(buffer.toString());
            if (!validateRequired(req, reqJson.pushId, 'pushId is required')) {
                return;
            }
            console.log('pushId: ' + buffer.toString());
            vertx.getMap('config.push-interfaces').put(reqJson.pushId, reqJson);
            req.response.end(success('Added a push interface successfully', reqJson));
        });
    })
    // get event handlers
    .get('/config/event-handlers', function(req) {
        var eventHandlers = vertx.getMap('config.event-handlers').values();
        console.log('eventHandlers: ' + eventHandlers);
        req.response.end(eventHandlers);
    })
    .get('/config/event-handlers/:handlerId', function(req) {
        var handlerId = req.params().get("handlerId");
        console.log('handlerId: ' + handlerId);
        var eventHandler = vertx.getMap('config.event-handlers').get(handlerId);
        console.log('handlerId: ' + handlerId + ', eventHandler: ' + eventHandler);
        req.response.end(eventHandler);
    })
    // post event handler
    .post('/config/event-handlers', function(req) {
        req.dataHandler(function(buffer) {
            console.log('I received ' + buffer.length() + ' bytes');
            var reqJson = toJs(buffer.toString());
            if (!validateRequired(req, reqJson.handlerId, 'handlerId is required')) {
                return;
            }
            console.log('pushId: ' + buffer.toString());
            vertx.getMap('config.event-handlers').put(reqJson.handlerId, reqJson);
            req.response.end(success('Added an event handler successfully', reqJson));
        });
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
