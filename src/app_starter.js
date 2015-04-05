var vertx = require('vertx');
var console = require('vertx/console');
var container = require('vertx/container');
var eventBus = require('vertx/event_bus');
var config = container.config;
var PUSH_LOG_PERSISTOR = 'push_log.persistor';

container.deployModule('com.bloidonia~mod-jdbc-persistor~2.1.3',
    config.dataPersistor.instances, config.dataPersistor,
    function(err, deployID) {
    if (!err) {
        console.log('The [mod-jdbc-persistor] has been deployed, deployment ID is ' + deployID);
        var createPushLog = {
            action: 'execute',
            stmt: 'CREATE TABLE IF NOT EXISTS push_log '
                  + '(id VARCHAR(100) NOT NULL, '
                  + 'sent_date VARCHAR(30), '
                  + 'sender VARCHAR(100), '
                  + 'sender_app_id VARCHAR(100), '
                  + 'received_date VARCHAR(30), '
                  + 'receiver VARCHAR(100), '
                  + 'receiver_app_id VARCHAR(100), '
                  + 'message VARCHAR(1000), '
                  + 'status VARCHAR(100), '
                  + 'CONSTRAINT push_log_pk PRIMARY KEY(id))'
        };
        eventBus.send(PUSH_LOG_PERSISTOR, createPushLog);

        var createPushInterface = {
            action: 'execute',
            stmt: 'CREATE TABLE IF NOT EXISTS push_interface '
                + '(push_id VARCHAR(100) NOT NULL, '
                + 'created_date VARCHAR(30), '
                + 'creator VARCHAR(100), '
                + 'port INTEGER, '
                + 'inbound_addr VARCHAR(100), '
                + 'outbound_addr VARCHAR(100), '
                + 'handler VARCHAR(100), '
                + 'logging CHAR(1), '
                + 'msg_filter VARCHAR(2000), '
                + 'desc VARCHAR(2000), '
                + 'deploy_id VARCHAR(100), '
                + 'CONSTRAINT push_interface_pk PRIMARY KEY(push_id))'
        };
        eventBus.send(PUSH_LOG_PERSISTOR, createPushInterface);

        var createPushEventHandler = {
            action: 'execute',
            stmt: 'CREATE TABLE IF NOT EXISTS push_event_handler '
                + '(handler_id VARCHAR(100) NOT NULL, '
                + 'created_date VARCHAR(30), '
                + 'creator VARCHAR(100), '
                + 'handler_func VARCHAR(4000), '
                + 'desc VARCHAR(2000), '
                + 'CONSTRAINT push_event_handler_pk PRIMARY KEY(handler_id))'
        };
        eventBus.send(PUSH_LOG_PERSISTOR, createPushEventHandler);

    } else {
        console.log('Deployment [mod-jdbc-persistor] failed! ' + err.getMessage());
    }
});

container.deployVerticle('app_service.js', config.appService.instances, config.appService,
function(err, deployID) {
  if (!err) {
    console.log('The [app_service] has been deployed, deployment ID is ' + deployID);
  } else {
    console.log('Deployment [app_service] failed! ' + err.getMessage());
  }
});

container.deployVerticle('app_config.js', config.appConfig.instances, config.appConfig,
function(err, deployID) {
  if (!err) {
    console.log('The [app_config] has been deployed, deployment ID is ' + deployID);
  } else {
    console.log('Deployment [app_config] failed! ' + err.getMessage());
  }
});

//container.deployVerticle('app_monitor.js', config.appMonitor.instances, config.appMonitor,
//function(err, deployID) {
//  if (!err) {
//    console.log('The [app_monitor] has been deployed, deployment ID is ' + deployID);
//  } else {
//    console.log('Deployment [app_monitor] failed! ' + err.getMessage());
//  }
//});
