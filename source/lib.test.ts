import {chrome} from 'jest-chrome';
import {test, describe, it, vi, beforeEach, expect} from 'vitest';
import {getAdditionalPermissions} from 'webext-additional-permissions';
import * as lib from './lib.js';
import {registerContentScript} from './register-content-script.js';

vi.mock('webext-additional-permissions');
vi.mock('./register-content-script.js');

const baseManifest: chrome.runtime.Manifest = {
	name: 'required',
	manifest_version: 3,
	version: '0.0.0',
	content_scripts: [
		{
			js: ['script.js'],
			matches: ['https://content-script.example.com/*'],
		},
	],
	host_permissions: ['https://permission-only.example.com/*'],
	optional_host_permissions: ['*://*/*'],
};

const getAdditionalPermissionsMock = vi.mocked(getAdditionalPermissions);
const registerContentScriptMock = vi.mocked(registerContentScript);

beforeEach(() => {
	registerContentScriptMock.mockClear();
	getAdditionalPermissionsMock.mockResolvedValue({
		origins: ['https://granted.example.com/*'],
		permissions: [],
	});
	chrome.runtime.getManifest.mockReturnValue(baseManifest);
});

test('init', async () => {
	await lib.init();
	expect(getAdditionalPermissionsMock).toHaveBeenCalled();
});

describe('init - registerContentScript', () => {
	it('should register the manifest scripts on new permissions', async () => {
		await lib.init();
		expect(registerContentScriptMock).toMatchSnapshot();
	});

	it('should register the manifest scripts on multiple new permissions', async () => {
		getAdditionalPermissionsMock.mockResolvedValue({
			origins: [
				'https://granted.example.com/*',
				'https://granted-more.example.com/*',
			],
			permissions: [],
		});

		await lib.init();
		expect(registerContentScriptMock).toMatchSnapshot();
	});

	it('should register multiple manifest scripts on new permissions', async () => {
		const manifest = structuredClone(baseManifest);
		manifest.content_scripts!.push({
			js: ['otherScript.js'],
			matches: ['https://content-script-extra.example.com/*'],
		});
		chrome.runtime.getManifest.mockReturnValue(manifest);

		await lib.init();
		expect(registerContentScriptMock).toMatchSnapshot();
	});
});
