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
