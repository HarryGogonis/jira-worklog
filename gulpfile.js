var gulp = require('gulp'),
    watch = require('gulp-watch'),
    wiredep = require('wiredep').stream,
    uglify = require('gulp-uglify'),
    concat = require('gulp-concat'),
    rename = require('gulp-rename')
    eslint = require ('gulp-eslint'),
    notify = require('gulp-notify'),
    clean = require('gulp-clean'),
    inject = require('gulp-inject'),
    gulpBrowser = require('gulp-browser');

gulp.task('clean', function () {
  return gulp.src('dist/', {read: false})
    .pipe(clean());
});

gulp.task('scripts', ['clean'], function () {
  return gulp.src('src/scripts/*.js')
    .pipe(gulpBrowser.browserify({
        transform: 'babelify',
        options: {presets: ['es2015']}
    }))
    .pipe(concat('app.js'))
    .pipe(rename({ suffix: '.min' }))
    //.pipe(uglify())
    .pipe(gulp.dest('dist/'))
    .pipe(notify({ message: 'Scripts task complete' }));
});

gulp.task('lint', function () {
  return gulp.src('src/scripts/**/*.js')
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

gulp.task('wiredep', ['scripts'], function () {
  return gulp.src('src/index.html')
    .pipe(wiredep())
    .pipe(gulp.dest('dist/'))
    .pipe(inject(gulp.src(['dist/app.min.js'], { read: false }), { relative: true }))
    .pipe(gulp.dest('dist/'));
});

gulp.task('watch', function () {
  return watch('src/scripts/**/*.js', { ignoreInitial: false });
  // TODO do something useful, like run a simple http server
});

gulp.task('build', ['lint', 'wiredep']);

gulp.task('default', ['build']);
