gulp    = require('gulp')
del     = require('del')
coffee  = require('gulp-coffee')
uglify  = require('gulp-uglify')
rename  = require('gulp-rename')
webpack = require('webpack-stream')

gulp.task 'clean', ->
  del(['dist/**/*'])

gulp.task 'coffee', ['clean'], ->
  gulp.src('lib/**/*.coffee')
    .pipe(coffee(bare: true))
    .pipe(gulp.dest('dist'))
    # .pipe(uglify())


# NOTE: DISABLE bower SINCE USING NPM
gulp.task 'default', [
  'coffee'
]

gulp.task 'watch', ->
  gulp.watch ['lib/**/*.coffee'], ['default']
