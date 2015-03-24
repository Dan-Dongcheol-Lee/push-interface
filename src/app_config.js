var vertx = require('vertx');
var console = require('vertx/console');
var container = require('vertx/container');
var http = require('vertx/http');
var eventBus = vertx.eventBus;

var routeMatcher = new vertx.RouteMatcher()
    // get push interfaces
    .get('/animals/dogs', function(req) {
        req.response.end('You requested dogs');
    })
    // post push interface
    .get('/animals/cats', function(req) {
        req.response.end('You requested cats');
    })
    // get custom event handlers

    // post custom event handler
    .optionsWithRegEx('\\/([^\\/]+)', function(req) {
        req.response
            .putHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
            .putHeader('Access-Control-Allow-Origin', '*')
            .end();
    });

http.createHttpServer()
    .requestHandler(routeMatcher)
    .listen(container.config.port, 'localhost');
