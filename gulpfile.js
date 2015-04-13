var gulp = require('gulp');
var zip = require('gulp-zip');
var uglify = require('gulp-uglify');
var bower = require('gulp-bower');
var vinylPaths = require('vinyl-paths');
var del = require('del');

var groupId = 'fullbox';
var moduleId = 'mod-push-interface';
var version = '1.0.0';
var distZipFile = groupId + '~' + moduleId + '~' + version + '.zip';

gulp.task('bower', function() {
  return bower('./bower_components')
    .on('end', function() {
        gulp.src(['src/lib/**/*', '!src/lib/*.jar'], {dot: true})
            .pipe(vinylPaths(del));
        return gulp.src(['bower_components/**/*.min.js'])
            .pipe(gulp.dest('src/lib/'));
    });
});

gulp.task('clean', function(cb) {
  del(['build/*', 'dist/*', '!dist/mods'], cb);
});

gulp.task('compress', function() {
  gulp.src('src/*.js')
    .pipe(uglify({hoist_vars: true}))
    .pipe(gulp.dest('build'));
});

gulp.task('default', ['clean'], function () {
    return gulp.src(['src/**/*'])
        .pipe(zip(distZipFile))
        .pipe(gulp.dest('dist'));
});

gulp.task('copy', ['clean'], function () {
    gulp.src(['src/*.json', 'src/*.template'])
        .pipe(gulp.dest('build'));
    return gulp.src(['src/lib/**/*'])
        .pipe(gulp.dest('build/lib'));
});

gulp.task('pack', ['clean', 'compress', 'copy'], function () {
    return gulp.src(['build/**/*'])
        .pipe(zip(distZipFile))
        .pipe(gulp.dest('dist'));
});