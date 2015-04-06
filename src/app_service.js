var vertx = require('vertx');
var console = require('vertx/console');
var container = require('vertx/container');
var file = require('vertx/file_system');
var eventBus = require('vertx/event_bus');
var u = require('app_utils.js');
var config = container.config;

var createDirs = function(dirs, callback) {
    dirs.forEach(function(dir) {
        file.mkDirSync(dir, true);
    });
    callback();
};

var backupApp = function(appPath, backupDir) {
    if (file.existsSync(appPath)) {
        var path = appPath.replace(/\\/g, '/');
        var backupFile = backupDir + '/' + path.substring(path.lastIndexOf('/') + 1);
        // TODO Might consider even backup this with timestamp later.
        if (file.existsSync(backupFile)) {
            file.deleteSync(backupFile);
        }
        file.moveSync(path, backupFile);
    }
};

var deployService = function(fileName, callback) {
    // Allow only verticles in javascript.
    container.deployVerticle('rhino:' + fileName, 2, {},
    function(err, deployId) {
        if (!err) {
            console.log('The [' + fileName + '] has been deployed, deployment ID is ' + deployId);
        } else {
            console.log('Deployment [' + fileName + '] failed! ' + err.getMessage());
        }
        callback(err, deployId);
    });
}

var undeployService = function(fileName, deployId, callback) {
    if (deployId) {
        container.undeployVerticle(deployId,
            function() {
                console.log('The [' + fileName + ', ' + deployId + '] has been undeployed');
                callback();
            });
    } else {
        callback();
    }
}

eventBus.registerLocalHandler('service.setup', function(message) {
    createDirs([message.appDir, message.backupDir], function() {
        var appFiles = file.readDirSync(message.appDir, '.*\.js');
        console.log('Directory contains these app js files: ' + appFiles.length);
        for (var i = 0; i < appFiles.length; i++) {
            var appFile = appFiles[i];
            console.log('appFile: ' + appFile);
            backupApp(appFile, message.backupDir);
        }
        console.log('All app js files were moved for backup successfully');
    });
});

eventBus.registerLocalHandler('service.deploy', function(message, replier) {
    console.log('service.deploy: ' + u.toJson(message));
    undeployService(message.fileName, message.deployId, function(err) {
        if (!err) {
            backupApp(message.appFile, message.backupDir);
            file.createFileSync(message.appFile);
            file.writeFile(message.appFile, message.appContent, function() {
                console.log(message.pushId + ' has been written successfully.');
                deployService(message.appFile, function(err, deployId) {
                    if (!err) {
                        replier(u.success('The [' + message.pushId + '] has been deployed', {
                            pushId: message.pushId, deployId: deployId
                        }));
                    } else {
                        replier(u.failure('The [' + message.pushId + '] failed to deploy: ' + err.getMessage(), {
                            pushId: message.pushId
                        }));
                    }
                });
            });
        } else {
            replier(u.failure('The [' + message.pushId + '] failed to un-deploy: ' + err.getMessage(), {
                pushId: message.pushId
            }));
        }
    });
});

eventBus.registerLocalHandler('service.un-deploy', function(message, replier) {
    undeployService(message.fileName, message.deployId, function() {
        replier(u.success('The [' + fileName + ', ' + deployId + '] has been undeployed'));
    });
});

eventBus.registerLocalHandler('service.deploy-all', function(message) {

});

eventBus.registerLocalHandler('service.un-deploy-all', function(message) {

});