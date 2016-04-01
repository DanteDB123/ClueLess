var gulp = require('gulp');

gulp.task('default', function(){
	exec('node app.js', function(err, stdout, stderr){
		console.log(stdout);
		console.log(stderr);
		cb(err);
	});
});