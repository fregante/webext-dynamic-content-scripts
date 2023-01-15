import {defineConfig} from 'vitest/config';

export default defineConfig({
	test: {
		globals: true,
		cache: false,
		setupFiles: [
			'./vitest.setup.js',
		],
	},
});
