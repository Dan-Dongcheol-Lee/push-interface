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

eventBus.registerLocalHandler('service.deploy', function(message) {

});

eventBus.registerLocalHandler('service.un-deploy', function(message) {

});

eventBus.registerLocalHandler('service.deploy-all', function(message) {

});

eventBus.registerLocalHandler('service.un-deploy-all', function(message) {

});