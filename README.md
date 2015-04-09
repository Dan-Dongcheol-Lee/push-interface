# Push Interface Vert.x Module (ongoing)

## How to build push-interface project

The following procedure needs to be performed for deploying push-interface module.
Install nodejs and vertx in your desktop or server.
- For nodejs, refer to https://nodejs.org
- For vertx, refer to http://vertx.io/install.html

Install gulp related tasks by using npm.
- /> npm install

Run 'gulp bower', 'gulp' to build a module distribution.
- /> gulp bower
- /> gulp

'fullbox~mod-push-interface~1.0.0.zip' file will be created in 'dist' directory.

Run the following command to start up push-interface module
with conf.json in 'src' directory which can be used for the module configuration.
- dist/> vertx runzip fullbox~mod-push-interface~1.0.0.zip -conf conf.json


## RESTful APIs for push interface

push-interface application provides RESTful APIs to manage and deploy push interfaces and event handlers.
The following APIs are available at the moment.

### http://host:port/config/setup [POST]
This API must be called once to setup all necessary directories such as push interfaces app files and the backup directory.

### http://host:port/config/push-interfaces [GET]
This API performs searching push interfaces.

### http://host:port/config/push-interfaces/:pushId [GET]
This API performs searching a push interface by pushId.

### http://host:port/config/push-interfaces [POST]
This API performs adding the given push interface for request:
```javascript
{"pushId": "P1",
"createdDate": "2015-01-01 12:12:12",
"creator": "DanLee",
"port": 12200,
"inboundAddr": "in1",
"outboundAddr": "out1",
"handler": "H1",
"logging": false,
"msgFilter": null,
"desc": "Description"}
```

### http://host:port/config/event-handlers [GET]
This API performs searching event handlers.

### http://host:port/config/event-handlers/:handlerId [GET]
This API performs searching an event handler by handlerId.

### http://host:port/config/event-handlers [POST]
This API performs adding the given event handler for request:
```javascript
{"handlerId": "H1",
"createdDate": "2015-01-01 12:12:12",
"creator": "DanLee",
"handlerFunc": "function(message, replier) { eventBus.publish(':outboundAddr', message); }",
"desc": "H1 event handler function"
}
```

### http://host:port/config/push-interfaces/deploy-all [POST]
This API performs generating and deploying all push interfaces.

### http://host:port/config/push-interfaces/deploy [POST]
This API performs generating and deploying a push interface by pushId for request:
```javascript
{"pushId": "P1"}
```

### http://host:port/config/push-interfaces/undeploy [POST]
This API performs un-deploying a push interface by pushId for request:
```javascript
{"pushId": "P1"}
```

### http://host:port/config/push-interfaces/undeploy-all [POST]
This API performs un-deploying all push interfaces.
