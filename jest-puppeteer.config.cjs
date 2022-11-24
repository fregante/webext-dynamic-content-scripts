const path = require('path');
const process = require('process');

module.exports = {
	launch: {
		headless: false,
		args: [
			'--disable-extensions-except=' + path.resolve(__dirname, 'test/dist/mv' + process.env.TARGET),
			'--window-size=400,800',
		],
	},
};
