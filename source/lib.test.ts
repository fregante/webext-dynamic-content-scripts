import {chrome} from 'jest-chrome';
import {
	describe, it, vi, beforeEach, expect,
} from 'vitest';
import {queryAdditionalPermissions} from 'webext-permissions';
import {init} from './lib.js';
import {injectToExistingTabs} from './inject-to-existing-tabs.js';
import {registerContentScript} from './register-content-script-shim.js';

vi.mock('webext-permissions');
vi.mock('./register-content-script-shim.js');
vi.mock('./inject-to-existing-tabs.js');

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

const additionalPermissions: Required<chrome.permissions.Permissions> = {
	origins: ['https://granted.example.com/*'],
	permissions: [],
};

const queryAdditionalPermissionsMock = vi.mocked(queryAdditionalPermissions);
const injectToExistingTabsMock = vi.mocked(injectToExistingTabs);
const registerContentScriptMock = vi.mocked(registerContentScript);

beforeEach(() => {
	registerContentScriptMock.mockClear();
	injectToExistingTabsMock.mockClear();
	queryAdditionalPermissionsMock.mockResolvedValue(additionalPermissions);
	chrome.runtime.getManifest.mockReturnValue(baseManifest);
});

describe('init', () => {
	it('it should register the listeners and start checking permissions', async () => {
		await init();
		expect(queryAdditionalPermissionsMock).toHaveBeenCalled();
		expect(injectToExistingTabsMock).toHaveBeenCalledWith(
			additionalPermissions.origins,
			[{css: [], js: ['script.js']}],
		);

		// TODO: https://github.com/extend-chrome/jest-chrome/issues/20
		// expect(chrome.permissions.onAdded.addListener).toHaveBeenCalledOnce();
		// expect(chrome.permissions.onRemoved.addListener).toHaveBeenCalledOnce();
	});

	it('it should throw if no content scripts exist at all', async () => {
		const manifest = structuredClone(baseManifest);
		delete manifest.content_scripts;
		chrome.runtime.getManifest.mockReturnValue(manifest);
		await expect(init()).rejects.toMatchInlineSnapshot('[Error: webext-dynamic-content-scripts tried to register scripts on the new host permissions, but no content scripts were found in the manifest.]');
	});
});

describe('init - registerContentScript', () => {
	it('should register the manifest scripts on new permissions', async () => {
		await init();
		expect(registerContentScriptMock).toMatchSnapshot();
	});

	it('should register the manifest scripts on multiple new permissions', async () => {
		queryAdditionalPermissionsMock.mockResolvedValue({
			origins: [
				'https://granted.example.com/*',
				'https://granted-more.example.com/*',
			],
			permissions: [],
		});

		await init();
		expect(registerContentScriptMock).toMatchSnapshot();
	});

	it('should register multiple manifest scripts on new permissions', async () => {
		const manifest = structuredClone(baseManifest);
		manifest.content_scripts!.push({
			js: ['otherScript.js'],
			matches: ['https://content-script-extra.example.com/*'],
		});
		chrome.runtime.getManifest.mockReturnValue(manifest);

		await init();
		expect(registerContentScriptMock).toMatchSnapshot();
	});
});
