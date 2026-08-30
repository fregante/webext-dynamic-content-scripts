const path = require('node:path');

module.exports = {
	launch: {
		headless: false,
		args: [
			'--disable-extensions-except=' + path.resolve(__dirname, 'test/dist'),
			'--window-size=400,800',
		],
	},
};
