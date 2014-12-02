var gulp = require('gulp');
var uglify = require('gulp-uglify');
var notify = require('gulp-notify');

gulp.task('js', function () {
    return gulp.src('src/jquery.jmap.js')
        .pipe(uglify())
        .pipe(gulp.dest('src/min'))
        .pipe(notify({ message: 'Finished minifying JavaScript'}));
});

gulp.task('default', function () {
    gulp.run('js');

    gulp.watch('*/*.js', function () {
        gulp.run('js');
    });
});