// > node_modules/requirejs/bin/r.js -o r-conf.js optimize="none"
({
	baseUrl: 'src/client/app',
	name: 'myproject/mymodule',
	out: 'all.js',
	paths: {
		'angular': '../../../bower_components/angular/angular',
		'angular-loader': '../../../bower_components/angular-loader/angular-loader'
	},
	shim: {
		'angular': {
			exports: 'angular',
			deps: ['angular-loader']
		},
		'angular-loader': {
			exports: 'angular-loader'
		}
	}
})
