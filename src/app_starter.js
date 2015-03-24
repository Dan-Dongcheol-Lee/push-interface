var vertx = require('vertx');
var console = require('vertx/console');
var container = require('vertx/container');
var config = container.config;
var eventBus = vertx.eventBus;

container.deployModule('com.bloidonia~mod-jdbc-persistor~2.1.3',
    config.dataPersistor.instances, config.dataPersistor,
    function(err, deployID) {
    if (!err) {
        console.log('The mod-jdbc-persistor has been deployed, deployment ID is ' + deployID);

        var message = {
            'action': 'execute',
            'stmt': 'CREATE TABLE IF NOT EXISTS push_log '
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

        eventBus.send('push_log.persistor', message);

    } else {
        console.log('Deployment mod-jdbc-persistor failed! ' + err.getMessage());
    }
});

container.deployVerticle('app_config.js', config.appConfig.instances, config.appConfig,
function(err, deployID) {
  if (!err) {
    console.log('The app_config has been deployed, deployment ID is ' + deployID);
  } else {
    console.log('Deployment app_config failed! ' + err.getMessage());
  }
});

container.deployVerticle('app_monitor.js', config.appConfig.instances, config.appMonitor,
function(err, deployID) {
  if (!err) {
    console.log('The app_monitor has been deployed, deployment ID is ' + deployID);
  } else {
    console.log('Deployment app_monitor failed! ' + err.getMessage());
  }
});
