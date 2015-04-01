var u = require('app_utils.js');
var vertx = require('vertx');
var console = require('vertx/console');
var container = require('vertx/container');
var config = container.config;
var http = require('vertx/http');
var eventBus = vertx.eventBus;
var PUSH_LOG_PERSISTOR = 'push_log.persistor';

var queryPushInterfaces = function(callback) {
    var queryString = 'SELECT * '
                    + ' FROM push_interface '
                    + ' ORDER BY created_date desc';
    var query = {action: 'select', stmt: queryString, values: [[]]};
    eventBus.send(PUSH_LOG_PERSISTOR, query, function(result) {
        callback(result);
    });
};

var routeMatcher = new vertx.RouteMatcher()
    // get push interfaces
    .get('/config/push-interfaces', function(req) {
        queryPushInterfaces(function(result) {
            var resultJson = u.toJson(result);
            console.log('Responded to config/push-interfaces: ' + resultJson);
            req.response.end(resultJson);
        });
    })
    .get('/config/push-interfaces/:pushId', function(req) {
        var pushId = req.params().get("pushId");
        var queryString = 'SELECT * '
                        + ' FROM push_interface '
                        + ' WHERE push_id = ? ';
        var query = {action: 'select', stmt: queryString, values: [[pushId]]};
        eventBus.send(PUSH_LOG_PERSISTOR, query, function(result) {
            var resultJson = u.toJson(result);
            console.log('Responded to config/push-interfaces/' + pushId + ': ' + resultJson);
            req.response.end(resultJson);
        });
    })
    // post push interface
    .post('/config/push-interfaces', function(req) {
        req.dataHandler(function(buffer) {
            var reqJs = u.toJs(req, buffer);
            if (u.failedResult(reqJs)) {
                return;
            }
            if (!u.validateRequired(req, reqJs.pushId, 'pushId is required')) {
                return;
            }
            var insertString = 'INSERT INTO push_interface (push_id, created_date, creator, '
                        + 'port, inbound_addr, outbound_addr, handler, logging, msg_filter, desc) '
                        + 'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
            var query = {action: 'insert', stmt: insertString, values: [[
                reqJs.pushId, reqJs.createdDate, reqJs.creator,
                reqJs.port, reqJs.inboundAddr, reqJs.outboundAddr, reqJs.handler,
                reqJs.logging, reqJs.msgFilter, reqJs.desc
            ]]};
            eventBus.send(PUSH_LOG_PERSISTOR, query, function(result) {
                req.response.end(u.toJson(result));
            });
        });
    })
    // make push interface files
    .post('/config/push-interfaces/make', function(req) {
        req.dataHandler(function(buffer) {
            queryPushInterfaces(function(result) {
                var resultJson = u.toJson(result);
                console.log('Responded to config/push-interfaces/make: ' + resultJson);
                if (result.status === 'ok') {

                    vertx.fileSystem.readFile('app_verticle.template', function(buffer) {

                        var template = buffer;

                        var pushes = result.result;
                        for (var i = 0; i < pushes.length; i++) {
                            var appFile = config.pushInterfaceDir + '/' + pushes[i].pushId + '.js';

                            console.log('copy app_verticle_template.js to ' + appFile);

                            var appContent = template.replace(/:pushId/g, pushes[i].PUSH_ID)
                                .replace(/:inboundAddr/g, pushes[i].INBOUND_ADDR)
                                .replace(/:port/g, pushes[i].PORT)
                                .replace(/:handler/g, pushes[i].HANDLER);


                            console.log('generated app content: [' + appContent + ']');

                            vertx.fileSystem.writeFileSync(appFile, appContent);
                        }
                    });

                    req.response.end(u.success('made all push interface files successfully'));
                } else {
                    req.response.end(resultJson);
                }
            });
        });
    })
    // get event handlers
    .get('/config/event-handlers', function(req) {
        var queryString = 'SELECT * '
                        + ' FROM push_event_handler '
                        + ' ORDER BY created_date desc';
        var query = {action: 'select', stmt: queryString, values: [[]]};
        eventBus.send(PUSH_LOG_PERSISTOR, query, function(result) {

            console.log('u:' + u.toJson({status: 'OK'}));

            var resultJson = u.toJson(result);
            console.log('Responded to config/event-handlers: ' + resultJson);
            req.response.end(resultJson);
        });
    })
    .get('/config/event-handlers/:handlerId', function(req) {
        var handlerId = req.params().get("handlerId");
        var queryString = 'SELECT * '
                        + ' FROM push_event_handler '
                        + ' WHERE handler_id = ? ';
        var query = {action: "select", stmt: queryString, values: [[handlerId]]};
        eventBus.send(PUSH_LOG_PERSISTOR, query, function(result) {
            var resultJson = u.toJson(result);
            console.log('Responded to config/event-handlers/' + handlerId + ': ' + resultJson);
            req.response.end(resultJson);
        });
    })
    // post event handler
    .post('/config/event-handlers', function(req) {
        req.dataHandler(function(buffer) {
            var reqJs = toJs(req, buffer);
            if (u.failedResult(reqJs)) {
                return;
            }
            if (!u.validateRequired(req, reqJs.handlerId, 'handlerId is required')) {
                return;
            }
            var insertString = 'INSERT INTO push_event_handler (handler_id, created_date, creator, '
                        + 'handler_func, desc) '
                        + 'VALUES (?, ?, ?, ?, ?)';
            var query = {action: 'insert', stmt: insertString, values: [[
                reqJs.handlerId, reqJs.createdDate, reqJs.creator,
                reqJs.handlerFunc, reqJs.desc
            ]]};
            eventBus.send(PUSH_LOG_PERSISTOR, query, function(result) {
                req.response.end(u.toJson(result));
            });
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
