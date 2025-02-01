import {chrome} from 'jest-chrome';
import {
	describe, it, vi, beforeEach, expect,
} from 'vitest';
import {queryAdditionalPermissions} from 'webext-permissions';
import {onExtensionStart} from 'webext-events';
import {init} from './lib.js';
import {injectToExistingTabs} from './inject-to-existing-tabs.js';

type AsyncFunction = () => void | Promise<void>;

vi.mock('webext-permissions');
vi.mock('webext-events');
vi.mock('./inject-to-existing-tabs.js');

const baseManifest = {
	name: 'required',
	manifest_version: 3,
	version: '0.0.0',
	content_scripts: [
		{
			js: ['script.js'],
			matches: ['https://content-script.example.com/*'],
		},
	],
	permissions: ['storage'],
	host_permissions: ['https://permission-only.example.com/*'],
	optional_host_permissions: ['*://*/*'],
} satisfies chrome.runtime.Manifest;

const additionalPermissions: Required<chrome.permissions.Permissions> = {
	origins: ['https://granted.example.com/*'],
	permissions: [],
};

const queryAdditionalPermissionsMock = vi.mocked(queryAdditionalPermissions);
const injectToExistingTabsMock = vi.mocked(injectToExistingTabs);

const callbacks = new Set<AsyncFunction>();

vi.mocked(onExtensionStart.addListener).mockImplementation((callback: AsyncFunction) => {
	callbacks.add(callback);
});

async function simulateExtensionStart() {
	await Promise.all(Array.from(callbacks).map(async callback => callback()));
	callbacks.clear();
}

beforeEach(() => {
	injectToExistingTabsMock.mockClear();
	queryAdditionalPermissionsMock.mockResolvedValue(additionalPermissions);
	chrome.runtime.getManifest.mockReturnValue(baseManifest);
	// @ts-expect-error Missing types in `jest-chrome`
	// eslint-disable-next-line @typescript-eslint/no-unsafe-call
	chrome.scripting.registerContentScripts.mockClear();
	// @ts-expect-error Missing types in `jest-chrome`
	// eslint-disable-next-line @typescript-eslint/no-unsafe-call
	chrome.scripting.registerContentScripts.mockResolvedValue(undefined);
});

describe('init', () => {
	it('it should register the listeners and start checking permissions', async () => {
		init();
		await simulateExtensionStart();

		expect(queryAdditionalPermissionsMock).toHaveBeenCalled();
		expect(injectToExistingTabsMock).toHaveBeenCalledWith(
			additionalPermissions.origins,
			[{js: ['script.js'], matches: baseManifest.content_scripts[0]?.matches}],
		);

		// TODO: https://github.com/extend-chrome/jest-chrome/issues/20
		// expect(chrome.permissions.onAdded.addListener).toHaveBeenCalledOnce();
		// expect(chrome.permissions.onRemoved.addListener).toHaveBeenCalledOnce();
	});

	it('it should throw if no content scripts exist at all', async () => {
		const manifest: chrome.runtime.Manifest = structuredClone(baseManifest);
		delete manifest.content_scripts;
		chrome.runtime.getManifest.mockReturnValue(manifest);
		init();
		await expect(simulateExtensionStart).rejects
			.toThrowErrorMatchingInlineSnapshot('[Error: webext-dynamic-content-scripts tried to register scripts on the new host permissions, but no content scripts were found in the manifest.]');
	});
});

describe('init - registerContentScript', () => {
	it('should register the manifest scripts on new permissions', async () => {
		init();
		await simulateExtensionStart();
		// @ts-expect-error Missing types in `jest-chrome`
		expect(chrome.scripting.registerContentScripts).toMatchSnapshot();
	});

	it('should register the manifest scripts on multiple new permissions', async () => {
		queryAdditionalPermissionsMock.mockResolvedValue({
			origins: [
				'https://granted.example.com/*',
				'https://granted-more.example.com/*',
			],
			permissions: [],
		});

		init();
		await simulateExtensionStart();
		// @ts-expect-error Missing types in `jest-chrome`
		expect(chrome.scripting.registerContentScripts).toMatchSnapshot();
	});

	it('should register multiple manifest scripts on new permissions', async () => {
		const manifest = structuredClone(baseManifest);
		manifest.content_scripts.push({
			js: ['otherScript.js'],
			matches: ['https://content-script-extra.example.com/*'],
		});
		chrome.runtime.getManifest.mockReturnValue(manifest);

		init();
		await simulateExtensionStart();
		// @ts-expect-error Missing types in `jest-chrome`
		expect(chrome.scripting.registerContentScripts).toMatchSnapshot();
	});
});
