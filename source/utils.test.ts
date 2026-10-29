import {test, type TestContext} from 'node:test';
import type * as Utils from './utils.ts';

const manifest: chrome.runtime.Manifest = {
	name: 'required',
	manifest_version: 2,
	version: '0.0.0',
	content_scripts: [
		{
			js: [
				'script.js',
			],
			matches: [
				'https://content-script.example.com/*',
			],
		},
	],
	permissions: [
		'https://permission-only.example.com/*',
	],
	optional_permissions: [
		'*://*/*',
	],
};

let importCount = 0;

// `webext-permissions` is mocked, so the module must be imported after the mock
async function setup(t: TestContext) {
	Object.assign(globalThis, {chrome: {runtime: {getManifest: () => manifest}}});

	const queryPermissionsDiff = t.mock.fn(async () => ({
		added: {
			origins: ['https://granted.example.com/*'],
			permissions: [],
		},
	}));
	t.mock.module('webext-permissions', {namedExports: {queryPermissionsDiff}});

	return await import(`./utils.ts?${importCount++}`) as typeof Utils;
}

test('isContentScriptStaticallyRegistered', async (t: TestContext) => {
	const {isContentScriptStaticallyRegistered: s} = await setup(t);
	t.assert.ok(
		s('https://content-script.example.com'),
		'it should find a script in matches',
	);
	t.assert.ok(
		s('https://content-script.example.com/sub-page'),
		'it should match a sub-page of matches',
	);

	t.assert.ok(!s('https://nope.content-script.example.com'),
		'it should not match a subdomain that is not in patches',
	);
	t.assert.ok(!s('https://permission-only.example.com'),
		'it should ignore non-content script permissions',
	);

	t.assert.ok(!s('https://granted.example.com/granted'),
		'it should ignore dynamic permissions',
	);
	t.assert.ok(!s('https://www.example.com/page'),
		'it should ignore unrelated sites',
	);
	t.assert.ok(!s('https://example.com/page'),
		'it should ignore unrelated sites',
	);
});

test('isContentScriptDynamicallyRegistered', async (t: TestContext) => {
	const {isContentScriptDynamicallyRegistered: s} = await setup(t);

	t.assert.ok(
		await s('https://granted.example.com'),
		'it should find a granted host permission unrelated sites');

	t.assert.ok(!await s('https://content-script.example.com'),
		'it should not use an origin in matches');

	t.assert.ok(!await s('https://www.example.com/page'),
		'it should ignore unrelated sites');
	t.assert.ok(!await s('https://example.com/page'),
		'it should ignore unrelated sites');
});

test('isContentScriptRegistered', async (t: TestContext) => {
	const {isContentScriptRegistered: s} = await setup(t);
	t.assert.strictEqual(
		await s('https://content-script.example.com'),
		'static',
		'it should find a script in matches',
	);
	t.assert.strictEqual(
		await s('https://content-script.example.com/sub-page'),
		'static',
		'it should match a sub-page of matches',
	);

	t.assert.strictEqual(
		await s('https://permission-only.example.com'),
		false,
		'it should ignore non-content script permissions',
	);
	t.assert.strictEqual(
		await s('https://example.com/page'),
		false,
		'it should ignore unrelated sites',
	);
});
