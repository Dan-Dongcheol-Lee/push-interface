var vertx = require('vertx');
var console = require('vertx/console');
var container = require('vertx/container');
var http = require('vertx/http');
var eventBus = vertx.eventBus;

var httpServer = http.createHttpServer();
var sockJSServer = vertx.createSockJSServer(httpServer);
sockJSServer.bridge({prefix : '/:pushId'}, [{address: ':inboundAddr'}], [{}]);
httpServer.listen(:port, 'localhost', function(err) {
    if (err) {
        console.log('Unable to start a server: ' + err);
    } else {
        eventBus.registerHandler(':inboundAddr', function(message)) {
            console.log('Yippee! The handler info has been propagated across the cluster');

            eval(':handler()');
        };
        console.log('Started the server(:pushId) successfully');
    }
});
