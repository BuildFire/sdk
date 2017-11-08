var gulp = require('gulp');
var runSequence = require('run-sequence');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');

//Minify files, and bundle together
gulp.task('bundle1_step1', function(){
    var sdkBundle1 = [
        "scripts/buildfire/components/carouselLight/carouselLight.js",
        "scripts/buildfire/components/pluginInstance/sortableList.js"
    ];

    return gulp.src(sdkBundle1, {base: '.'})

        /// obfuscate and minify the JS files
        .pipe(uglify())

        /// merge all the JS files together. If the
        .pipe(concat('bundle1.min.js'))

        ///output here
        .pipe(gulp.dest('scripts/_bundles'));
});

//Concat the remaining files
gulp.task('bundle1_step2', function(){
    var sdkBundle1 = [
        "scripts/buildfire.js",
        "scripts/_bundles/bundle1.min.js"
    ];

    return gulp.src(sdkBundle1, {base: '.'})
        
        /// merge all the JS files together.
        .pipe(concat('bundle1.min.js'))

        ///output here
        .pipe(gulp.dest('scripts/_bundles'));
});

gulp.task('minifyBuildfire', function(){
    return gulp.src("scripts/buildfire.js", {base: '.'})

        .pipe(sourcemaps.init())

        .pipe(uglify())

        .pipe(concat('buildfire.min.js'))

        .pipe(sourcemaps.write('maps'))

        ///output here
        .pipe(gulp.dest('scripts'));
});

gulp.task('minifyCarouselLight', function(){
    return gulp.src("scripts/buildfire/components/carouselLight/carouselLight.js", {base: '.'})

        .pipe(sourcemaps.init())

        .pipe(uglify())

        .pipe(concat('carouselLight.min.js'))

        .pipe(sourcemaps.write('maps'))

        ///output here
        .pipe(gulp.dest('scripts/buildfire/components/carouselLight'));
});

gulp.task('build', function(callback){
    runSequence('bundle1_step1', 'bundle1_step2','minifyBuildfire','minifyCarouselLight', callback);
});