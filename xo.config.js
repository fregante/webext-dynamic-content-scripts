import globals from 'globals';

/**
@type {import('xo').FlatXoConfig}
*/
const xoConfig = [
	{
		// Parcel aliases, not real packages
		ignores: ['source/package.json', 'test/package.json'],
	},
	{
		// `source/package.json` and `test/package.json` are the nearest package.json, but they don't list dependencies
		files: ['source/**', 'test/**'],
		rules: {
			'import-x/no-extraneous-dependencies': 'off',
			'n/no-extraneous-import': 'off',
		},
	},
	{
		// Mocks (`jest-chrome`) are loosely typed
		files: ['source/**/*.test.ts'],
		rules: {
			'@typescript-eslint/no-unsafe-member-access': 'off',
			'@typescript-eslint/no-unsafe-call': 'off',
		},
	},
	{
		// Sets up the test environment globals
		files: ['vitest.setup.js'],
		rules: {
			'unicorn/no-global-object-property-assignment': 'off',
		},
	},
	{
		// The demo extension imports modules for their side effects
		files: ['test/demo-extension/**'],
		rules: {
			'import-x/no-unassigned-import': 'off',
		},
	},
	{
		languageOptions: {
			globals: {
				...globals.browser,
				chrome: 'readonly',
			},
		},
		rules: {
			// Manifest keys are snake_case
			'@typescript-eslint/naming-convention': 'off',
			'unicorn/prefer-top-level-await': 'off',
		},
	},
];

export default xoConfig;
