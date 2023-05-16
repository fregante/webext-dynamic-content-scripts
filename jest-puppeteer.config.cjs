const path = require('node:path');
const process = require('node:process');

module.exports = {
	launch: {
		headless: false,
		args: [
			'--disable-extensions-except=' + path.resolve(__dirname, 'test/dist/mv' + (process.env.TARGET ?? 2)),
			'--window-size=400,800',
		],
	},
};
