import {configDefaults, defineConfig} from 'vitest/config';

export default defineConfig({
	test: {
		setupFiles: [
			'./vitest.setup.js',
		],
		exclude: [
			...configDefaults.exclude,
			'distribution/*',
		],
	},
});
