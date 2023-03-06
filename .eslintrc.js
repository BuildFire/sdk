module.exports = {
	'env': {
		'browser': true,
		'es2020': true
	},
	'extends': 'eslint:recommended',
	'parserOptions': {
		'ecmaVersion': 2020
	},
	'rules': {
		'indent': [
			'error',
			'tab'
		],
		'linebreak-style': [
			'error',
			'unix'
		],
		'quotes': [
			'error',
			'single'
		],
		'semi': [
			'error',
			'always'
		]
	},
	"globals": {
		"dynamicEngine": true,
		"tinymce": true,
		"FastClick": true
	}
};
