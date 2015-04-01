var u = require('app_utils.js');
var vertx = require('vertx');
var console = require('vertx/console');
var container = require('vertx/container');
var config = container.config;
var http = require('vertx/http');
var file = require('vertx/file_system');
var eventBus = vertx.eventBus;
var PUSH_LOG_PERSISTOR = 'push_log.persistor';


var findPushInterfaces = function(callback) {
    var sql = 'SELECT * '
            + ' FROM push_interface '
            + ' ORDER BY created_date desc';
    var query = {action: 'select', stmt: sql, values: [[]]};
    eventBus.send(PUSH_LOG_PERSISTOR, query, function(result) {
        callback(result);
    });
};

var findPushInterfaceById = function(pushId, callback) {
    var sql = 'SELECT * '
            + ' FROM push_interface '
            + ' WHERE push_id = ? ';
    var query = {action: 'select', stmt: sql, values: [[pushId]]};
    eventBus.send(PUSH_LOG_PERSISTOR, query, function(result) {
        callback(result);
    });
};

var insertPushInterface = function(reqJs, callback) {
    var sql = 'INSERT INTO push_interface (push_id, created_date, creator, '
            + 'port, inbound_addr, outbound_addr, handler, logging, msg_filter, desc) '
            + 'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    var query = {action: 'insert', stmt: sql, values: [[
        reqJs.pushId, reqJs.createdDate, reqJs.creator,
        reqJs.port, reqJs.inboundAddr, reqJs.outboundAddr, reqJs.handler,
        reqJs.logging, reqJs.msgFilter, reqJs.desc
    ]]};
    eventBus.send(PUSH_LOG_PERSISTOR, query, function(result) {
        callback(result);
    });
};

var findEventHandlers = function(callback) {
    var sql = 'SELECT * '
            + ' FROM push_event_handler '
            + ' ORDER BY created_date desc';
    var query = {action: 'select', stmt: sql, values: [[]]};
    eventBus.send(PUSH_LOG_PERSISTOR, query, function(result) {
        callback(result);
    });
};

var findEventHandlerById = function(handlerId, callback) {
    var sql = 'SELECT * '
            + ' FROM push_event_handler '
            + ' WHERE handler_id = ? ';
    var query = {action: "select", stmt: sql, values: [[handlerId]]};
    eventBus.send(PUSH_LOG_PERSISTOR, query, function(result) {
        callback(result);
    });
};

var insertEventHandler = function(reqJs, callback) {
    var sql = 'INSERT INTO push_event_handler (handler_id, created_date, creator, '
            + 'handler_func, desc) '
            + 'VALUES (?, ?, ?, ?, ?)';
    var query = {action: 'insert', stmt: sql, values: [[
        reqJs.handlerId, reqJs.createdDate, reqJs.creator,
        reqJs.handlerFunc, reqJs.desc
    ]]};
    eventBus.send(PUSH_LOG_PERSISTOR, query, function(result) {
        callback(result);
    });
}

var generateAppContent = function(template, pushItem) {
    return template.replace(/:pushId/g, pushItem.PUSH_ID)
        .replace(/:inboundAddr/g, pushItem.INBOUND_ADDR)
        .replace(/:port/g, pushItem.PORT)
        .replace(/:handler/g, pushItem.HANDLER);
};

var routeMatcher = new vertx.RouteMatcher()
    // get push interfaces
    .get('/config/push-interfaces', function(req) {
        findPushInterfaces(function(result) {
            var resultJson = u.toJson(result);
            console.log('Responded to config/push-interfaces: ' + resultJson);
            req.response.end(resultJson);
        });
    })
    .get('/config/push-interfaces/:pushId', function(req) {
        var pushId = req.params().get("pushId");
        findPushInterfaceById(pushId, function(result) {
            var resultJson = u.toJson(result);
            console.log('Responded to config/push-interfaces/' + pushId + ': ' + resultJson);
            req.response.end(resultJson);
        });
    })
    // post push interface
    .post('/config/push-interfaces', function(req) {
        req.dataHandler(function(buffer) {
            var reqJs = u.toJs(req, buffer);
            if (u.failedResult(reqJs)) { return; }
            if (!u.validateRequired(req, reqJs.pushId, 'pushId is required')) { return; }
            insertPushInterface(reqJs, function(result) {
                req.response.end(u.toJson(result));
            });
        });
    })
    // make push interface files
    .post('/config/push-interfaces-build', function(req) {
        req.dataHandler(function(buffer) {
            findPushInterfaces(function(result) {
                console.log('Responded to config/push-interfaces-build: ' + u.toJson(result));
                if (result.status === 'ok') {
                    file.readFile(config.pushInterfaceTemplate, function(cause, fileBuffer) {
                        var template = fileBuffer.toString();
                        var pushes = result.result;
                        for (var i = 0; i < pushes.length; i++) {
                            var fileName = pushes[i].PUSH_ID + '.js';
                            var appFile = config.pushInterfaceDir + '/' + fileName;
                            var appContent = generateAppContent(template, pushes[i]);
                            //console.log('generated app content: [' + appContent + ']');
                            file.createFile(appFile, function() {
                                file.writeFile(appFile, appContent, function() {
                                    console.log(appFile + ' has been written successfully.');
//                                    container.deployVerticle(fileName, 1, {},
//                                    function(err, deployID) {
//                                      if (!err) {
//                                        console.log('The [' + fileName + '] has been deployed, deployment ID is ' + deployID);
//                                      } else {
//                                        console.log('Deployment [' + fileName + '] failed! ' + err.getMessage());
//                                      }
//                                    });
                                });
                            });
                        }
                    });
                    req.response.end(u.success('All push interface files have been built successfully'));
                } else {
                    req.response.end(resultJson);
                }
            });
        });
    })
    // get event handlers
    .get('/config/event-handlers', function(req) {
        findEventHandlers(function(result) {
            var resultJson = u.toJson(result);
            console.log('Responded to config/event-handlers: ' + resultJson);
            req.response.end(resultJson);
        });
    })
    .get('/config/event-handlers/:handlerId', function(req) {
        var handlerId = req.params().get("handlerId");
        findEventHandlerById(handlerId, function(result) {
            var resultJson = u.toJson(result);
            console.log('Responded to config/event-handlers/' + handlerId + ': ' + resultJson);
            req.response.end(resultJson);
        });
    })
    // post event handler
    .post('/config/event-handlers', function(req) {
        req.dataHandler(function(buffer) {
            var reqJs = toJs(req, buffer);
            if (u.failedResult(reqJs)) { return; }
            if (!u.validateRequired(req, reqJs.handlerId, 'handlerId is required')) { return; }
            insertEventHandler(reqJs, function(result) {
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
