// eslint-disable-next-line n/prefer-process-get-builtin-module -- CommonJS config, `process` can't be used without triggering `n/prefer-global/process`
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
