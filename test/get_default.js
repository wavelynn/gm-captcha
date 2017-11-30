var captcha = require('../index.js');

var config = {
	backgroundColor: '#ffffff',
	color: '#000000',
	height: 32, 
	count: 6, 
	noise: true, 
	
};
var ret = captcha(config);