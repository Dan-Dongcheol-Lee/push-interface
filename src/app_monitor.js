var moment = require('lib/moment.min.js');
var vertx = require('vertx');
var console = require('vertx/console');
var container = require('vertx/container');
var http = require('vertx/http');
var eventBus = vertx.eventBus;
var lastSentTime = java.lang.System.currentTimeMillis();
var PUSH_LOG_PERSISTOR = 'push_log.persistor';

var toJson = function(jsObject) {
    return JSON.stringify(jsObject);
};

var routeMatcher = new vertx.RouteMatcher()
    .get('monitor/query-apps', function(req) {
        var queryString = "SELECT distinct sender_app_id, 'sender_app' as app_type "
                        + " FROM push_log "
                        + " UNION ALL "
                        + " SELECT distinct receiver_app_id, 'receiver_app' as app_type "
                        + " FROM push_log ";
        var query = { action: 'select', stmt: queryString, values: [[]] };
        eventBus.send(PUSH_LOG_PERSISTOR, query, function(result) {
            req.response.end(result);
        });
    })
    .get('monitor/receiver-apps/:receiverAppId', function(req) {
        var receiverAppId = req.params().get("receiverAppId");
        if (!receiverAppId || receiverAppId === '') {
            req.response.end({status: "error", message: "'receiverAppId' argument is required"});
            return;
        }
        var queryString = "SELECT receiver_app_id, SUBSTR(received_date,1,10) as received_date, "
                        + " count(*) as cnt "
                        + " FROM push_log "
                        + " WHERE receiver_app_id = ? AND received_date IS NOT NULL "
                        + " GROUP BY receiver_app_id, SUBSTR(received_date,1,10) "
                        + " ORDER BY SUBSTR(received_date,1,10) ";
        var query = {action: "select", stmt: queryString, values: [[receiverAppId]]};
        eventBus.send(PUSH_LOG_PERSISTOR, query, function(result) {
            req.response.end(result);
            console.log("Responded to monitor/receiver-apps: " + toJson(result));
        });
    })
    .get('monitor/sender-apps/:senderAppId', function(req) {
        var senderAppId = req.params().get("senderAppId");
        if (!senderAppId || senderAppId === '') {
            req.response.end({status: "error", message: "'senderAppId' argument is required"});
            return;
        }
        var queryString = "SELECT sender_app_id, SUBSTR(sent_date,1,10) as sent_date, count(*) as cnt "
                          + " FROM push_log "
                          + " WHERE sender_app_id = ? AND sent_date IS NOT NULL "
                          + " GROUP BY sender_app_id, SUBSTR(sent_date,1,10) "
                          + " ORDER BY SUBSTR(sent_date,1,10) ";
        var query = {action: "select", stmt: queryString, values: [[senderAppId]]};
        eventBus.send(PUSH_LOG_PERSISTOR, query, function(result) {
            req.response.end(result);
            console.log("Responded to monitor/sender-apps: " + toJson(result));
        });
    })
    .optionsWithRegEx('\\/([^\\/]+)', function(req) {
        req.response
            .putHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
            .putHeader('Access-Control-Allow-Origin', '*')
            .end();
    });

var startMonitorHeap = function() {
        vertx.setPeriodic(1000, function(timerID) {
            var runtime = java.lang.Runtime.getRuntime();
            var heapStatus = {
                cores: runtime.availableProcessors(),
                freeMem: runtime.freeMemory(),
                maxMem: runtime.maxMemory(),
                totalMem: runtime.totalMemory(),
                date: new java.util.Date().toString()
            };
            eventBus.publish("monitor.heap-status", heapStatus);
            console.log('Published monitor.heap-status: ' + toJson(heapStatus));
        });
    };

var startMonitorSentMessage = function() {
        vertx.setPeriodic(1000, function(timerID) {
            var formattedLastSentTime = moment(lastSentTime).format('YYYY-MM-DD HH:mm:ss');
            var queryString = "SELECT status, "
                            + " TO_CHAR(CURRENT_TIMESTAMP, 'YYYY-MM-DD HH24:MI:SS') as sent_time, "
                            + " count(*) as cnt "
                            + " FROM push_log "
                            + " WHERE TO_TIMESTAMP('" + formattedLastSentTime
                            + "', 'YYYY-MM-DD HH24:MI:SS') <= TO_TIMESTAMP(sent_date, 'YYYY-MM-DD HH24:MI:SS') "
                            + " GROUP BY status, TO_CHAR(CURRENT_TIMESTAMP, 'YYYY-MM-DD HH24:MI:SS') ";
            var query = { action: 'select', stmt: queryString, values: [[]] };
            eventBus.send(PUSH_LOG_PERSISTOR, query, function(result) {
                eventBus.publish("monitor.sent-message-status", result);
                console.log("Published monitor.send-message-status: last sent time: "
                            + formattedLastSentTime + ", result: " + toJson(result));
                lastSentTime = java.lang.System.currentTimeMillis();
            });
        });
    };

http.createHttpServer()
    .requestHandler(routeMatcher)
    .listen(container.config.port, 'localhost', function(err) {
        if (err) {
            console.log('Unable to start a server: ' + err);
        } else {

//            registerQueryApps(eventBus);
//            registerQuerySenderApps(eventBus, logger);
//            registerQueryReceiverApps(eventBus, logger);

            startMonitorHeap();
            startMonitorSentMessage();
        }
    });