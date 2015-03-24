# Push Interface Vert.x Module

* How to build push-interface project

The following procedure needs to be performed for deploying push-interface module.
Install nodejs and vertx in your desktop or server.
- For nodejs, refer to https://nodejs.org
- For vertx, refer to http://vertx.io/install.html

Install gulp related tasks by using npm.
- /> npm install --save-dev gulp gulp-zip gulp-uglify gulp-bower del vinyl-paths

Run 'gulp' to build a distribution.
- /> gulp

'fullbox~mod-push-interface~1.0.0.zip' file will be created in 'dist' directory.

Run the following command to start up push-interface module.
- dist/> vertx runzip fullbox~mod-push-interface~1.0.0.zip -conf conf.json
