gulp    = require('gulp')
del     = require('del')
coffee  = require('gulp-coffee')
uglify  = require('gulp-uglify-es').default
webpack = require('webpack-stream')

gulp.task 'clean', ->
  del(['dist/**/*'])

gulp.task 'coffee', gulp.series('clean', ->
  gulp.src('lib/**/*.coffee')
    .pipe(coffee(bare: true))
    .pipe(uglify())
    .pipe(gulp.dest('dist'))
)

# NOTE: DISABLE bower SINCE USING NPM
gulp.task 'default', gulp.series('coffee')

gulp.task 'watch', ->
  gulp.watch ['lib/**/*.coffee'], gulp.series('default')
