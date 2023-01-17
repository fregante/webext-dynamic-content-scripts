import {chrome} from 'jest-chrome';
import {test, vi, beforeAll, assert} from 'vitest';
import {getAdditionalPermissions} from 'webext-additional-permissions';
import {isContentScriptStaticallyRegistered, isContentScriptDynamicallyRegistered, isContentScriptRegistered} from './utils.js';

vi.mock('webext-additional-permissions');

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

const getAdditionalPermissionsMock = vi.mocked(getAdditionalPermissions);

beforeAll(() => {
	getAdditionalPermissionsMock.mockImplementation(async () => ({
		origins: ['https://granted.example.com/*'],
		permissions: [],
	}));
	chrome.runtime.getManifest.mockImplementation(() => manifest);
});

test('isContentScriptStaticallyRegistered', () => {
	const s = isContentScriptStaticallyRegistered;
	assert.isTrue(
		s('https://content-script.example.com'),
		'it should find a script in matches',
	);
	assert.isTrue(
		s('https://content-script.example.com/sub-page'),
		'it should match a sub-page of matches',
	);

	assert.isFalse(
		s('https://nope.content-script.example.com'),
		'it should not match a subdomain that is not in patches',
	);
	assert.isFalse(
		s('https://permission-only.example.com'),
		'it should ignore non-content script permissions',
	);

	assert.isFalse(
		s('https://granted.example.com/granted'),
		'it should ignore dynamic permissions',
	);
	assert.isFalse(
		s('https://www.example.com/page'),
		'it should ignore unrelated sites',
	);
	assert.isFalse(
		s('https://example.com/page'),
		'it should ignore unrelated sites',
	);
});

test('isContentScriptDynamicallyRegistered', async () => {
	const s = isContentScriptDynamicallyRegistered;

	assert.isTrue(
		await s('https://granted.example.com'),
		'it should find a granted host permission unrelated sites');

	assert.isFalse(
		await s('https://content-script.example.com'),
		'it should not use an origin in matches');

	assert.isFalse(
		await s('https://www.example.com/page'),
		'it should ignore unrelated sites');
	assert.isFalse(
		await s('https://example.com/page'),
		'it should ignore unrelated sites');
});

test('isContentScriptRegistered', async () => {
	const s = isContentScriptRegistered;
	assert.equal(
		await s('https://content-script.example.com'),
		'static',
		'it should find a script in matches',
	);
	assert.equal(
		await s('https://content-script.example.com/sub-page'),
		'static',
		'it should match a sub-page of matches',
	);

	assert.equal(
		await s('https://permission-only.example.com'),
		false,
		'it should ignore non-content script permissions',
	);
	assert.equal(
		await s('https://example.com/page'),
		false,
		'it should ignore unrelated sites',
	);
});
