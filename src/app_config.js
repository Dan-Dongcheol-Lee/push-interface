var vertx = require('vertx');
var console = require('vertx/console');
var container = require('vertx/container');
var config = container.config;
var http = require('vertx/http');
var file = require('vertx/file_system');
var eventBus = require('vertx/event_bus');
var u = require('app_utils.js');
var PUSH_LOG_PERSISTOR = 'push_log.persistor';


var findPushInterfaces = function(predicates, callback) {
    console.log('Called finedPushInterfaces: predicates: ' + u.toJson(predicates));

    var sql = 'SELECT * '
            + ' FROM push_interface '
        if (predicates.deployIdIsNull) {
            + ' WHERE deploy_id is null '
        }
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

var updateDeployIdPushInterface = function(pushId, deployId, callback) {
    var sql = 'UPDATE push_interface SET deploy_id = ? WHERE push_id = ?';
    var query = {action: 'update', stmt: sql, values: [[deployId, pushId]]};
    eventBus.send(PUSH_LOG_PERSISTOR, query, function(result) {
        result.pushId = pushId;
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

var doWithEventHandler = function(pushApp, callback) {
    findEventHandlerById(pushApp.HANDLER, function(data) {
        if (data.status !== 'ok') {
            // TODO Handler an exception
            return;
        }
        if (data.result.length === 0) {
            // TODO Handler an exception
            return;
        }
        var handlerFunction = data.result[0].HANDLER_FUNC;
        console.log('handlerId: ' + data.result[0].HANDLER_ID + ', function: ' + handlerFunction);
        callback(pushApp, handlerFunction);
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

var generateAppContent = function(template, pushItem, handlerFunction) {
    return template.replace(/:pushId/g, pushItem.PUSH_ID)
        .replace(/:port/g, pushItem.PORT)
        .replace(/:handlerId/g, pushItem.HANDLER)
        .replace(/:handlerFunction/g, handlerFunction)
        .replace(/:inboundAddr/g, pushItem.INBOUND_ADDR)
        .replace(/:outboundAddr/g, pushItem.OUTBOUND_ADDR)
        .replace(/:needToLog/g, pushItem.LOGGING)
        .replace(/:msgFilter/g, pushItem.MSG_FILTER);
};

var routeMatcher = new vertx.RouteMatcher()
    .post('/config/setup', function(req) {
        eventBus.send('service.setup', {
            appDir: config.pushInterfaceDir, backupDir: config.pushInterfaceBackupDir
        }, function (reply) {
            if (reply.status === 'ok') {
                console.log('app service setup finished successfully');
            } else {
                console.log('Unable to setup app service: ' + reply.message);
            }
        });
    })
    // get push interfaces
    .get('/config/push-interfaces', function(req) {
        findPushInterfaces({deployIdIsNull: false}, function(result) {
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
            findPushInterfaces({deployIdIsNull: true}, function(pushData) {
                console.log('Responded to config/push-interfaces-build: ' + u.toJson(pushData));
                if (pushData.status === 'ok') {
                    file.readFile(config.pushInterfaceTemplate, function(cause, fileBuffer) {
                        var templateContent = fileBuffer.toString();
                        var pushes = pushData.result;
                        for (var i = 0; i < pushes.length; i++) {
                            doWithEventHandler(pushes[i], function(pushApp, handlerFunction) {
                                eventBus.send('service.deploy', {
                                    pushId: pushApp.PUSH_ID,
                                    fileName: pushApp.PUSH_ID + '.js',
                                    deployId: pushApp.DEPLOY_ID,
                                    appFile: config.pushInterfaceDir + '/' + pushApp.PUSH_ID + '.js',
                                    appDir: config.pushInterfaceDir,
                                    backupDir: config.pushInterfaceBackupDir,
                                    appContent: generateAppContent(templateContent, pushApp, handlerFunction)
                                }, function(reply) {
                                    // TODO update deploy result with deploy id
                                    if (reply.status === 'ok') {
                                        updateDeployIdPushInterface(reply.result.pushId, reply.result.deployId, function(data) {
                                            console.log('Result of updateDeployIdPushInterface: ' + u.toJson(data));
                                        });
                                    }
                                });
                            });
                        }
                    });
                    req.response.end(u.success('All push interface files have been built successfully. Please check them respectively'));
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
            var reqJs = u.toJs(req, buffer);
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
