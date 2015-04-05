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
        file.move(path, backupDir + '/' + path.substring(path.lastIndexOf('/') + 1));
    }
};

var deployService = function(fileName, callback) {
    container.deployVerticle(fileName, 2, {},
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
        console.log('Directory contains these app js files');
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
            var appFile = message.appDir + '/' + message.fileName;
            var appContent = generateAppContent(message.appTemplateContent, message.appInfo);
            file.createFileSync(appFile);
            file.writeFile(appFile, appContent, function() {
                console.log(appFile + ' has been written successfully.');
                deployService(message.fileName, function(err, deployId) {
                    if (!err) {
                        replier(u.success('The [' + message.fileName + '] has been deployed', {deployId: deployId}));
                    } else {
                        replier(u.failure('Deployment [' + fileName + '] failed! ' + err.getMessage()));
                    }
                });
            });
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