var gulp = require('gulp');
var runSequence = require('run-sequence');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');

//Minify files, and bundle together
gulp.task('bundle1_step1', function(){
    var sdkBundle1 = [
        "scripts/angular/ng-infinite-scroll.custom.js",
        "scripts/owlCarousel/owlCarousel.js",
        "scripts/buildfire/components/carousel/carousel.js"
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
        "scripts/jquery/jquery-1.11.2.min.js",
        "scripts/angular/angular.min.js",
        "scripts/angular/ui-bootstrap.min.js",
        "scripts/jquery/jquery-ui.min.js",
        "scripts/_bundles/bundle1.min.js"
    ];

    return gulp.src(sdkBundle1, {base: '.'})
        
        /// merge all the JS files together.
        .pipe(concat('bundle1.min.js'))

        ///output here
        .pipe(gulp.dest('scripts/_bundles'));
});

gulp.task('build', function(callback){
    runSequence('bundle1_step1', 'bundle1_step2', callback);
});