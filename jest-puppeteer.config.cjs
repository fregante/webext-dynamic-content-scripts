const path = require('node:path');
const process = require('node:process');

module.exports = {
	launch: {
		product: process.env.BROWSER ?? 'chrome',
		headless: false,
		args: [
			'--disable-extensions-except=' + path.resolve(__dirname, 'test/dist/mv' + process.env.TARGET),
			'--window-size=400,800',
		],
	},
};
