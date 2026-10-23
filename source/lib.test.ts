import {chrome} from 'jest-chrome';
import {
	describe,
	it,
	vi,
	beforeEach,
	expect,
} from 'vitest';
import {queryPermissionsDiff} from 'webext-permissions';
import onExtensionStart from 'webext-events/on-extension-start';
import {init} from './lib.js';
import {injectToExistingTabs} from './inject-to-existing-tabs.js';

type AsyncFunction = () => void | Promise<void>;

vi.mock('webext-permissions');
vi.mock('webext-events/on-extension-start');
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
} satisfies chrome.runtime.ManifestV3;

const additionalPermissions: Required<chrome.permissions.Permissions> = {
	origins: ['https://granted.example.com/*'],
	permissions: [],
};

const queryPermissionsDiffMock = vi.mocked(queryPermissionsDiff);
const injectToExistingTabsMock = vi.mocked(injectToExistingTabs);

const callbacks = new Set<AsyncFunction>();

vi.mocked(onExtensionStart.addListener).mockImplementation((callback: AsyncFunction) => {
	callbacks.add(callback);
});

async function simulateExtensionStart() {
	await Promise.all([...callbacks].map(async callback => callback()));
	callbacks.clear();
}

beforeEach(() => {
	injectToExistingTabsMock.mockClear();
	queryPermissionsDiffMock.mockResolvedValue({added: additionalPermissions});
	chrome.runtime.getManifest.mockReturnValue(baseManifest);
	// @ts-expect-error Missing types in `jest-chrome`
	chrome.scripting.registerContentScripts.mockClear();
	// @ts-expect-error Missing types in `jest-chrome`
	chrome.scripting.registerContentScripts.mockResolvedValue(undefined);
	// @ts-expect-error Missing types in `jest-chrome`
	chrome.scripting.unregisterContentScripts.mockClear();
});

describe('init', () => {
	it('it should register the listeners and start checking permissions', async () => {
		init();
		await simulateExtensionStart();

		expect(queryPermissionsDiffMock).toHaveBeenCalled();
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
		queryPermissionsDiffMock.mockResolvedValue({
			added: {
				origins: [
					'https://granted.example.com/*',
					'https://granted-more.example.com/*',
				],
				permissions: [],
			},
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

	it('should register the `world` of the manifest scripts', async () => {
		const manifest: chrome.runtime.ManifestV3 = {
			...baseManifest,
			content_scripts: [
				...baseManifest.content_scripts,
				{
					js: ['page.js'],
					matches: ['https://content-script.example.com/*'],
					world: 'MAIN',
				},
			],
		};
		chrome.runtime.getManifest.mockReturnValue(manifest);

		init();
		await simulateExtensionStart();
		// @ts-expect-error Missing types in `jest-chrome`
		expect(chrome.scripting.registerContentScripts).toHaveBeenCalledWith([
			expect.objectContaining({js: ['/page.js'], world: 'MAIN'}),
		]);
	});

	it('should register scripts when new permissions are added via onAdded listener', async () => {
		init();
		await simulateExtensionStart();
		// @ts-expect-error Missing types in `jest-chrome`
		chrome.scripting.registerContentScripts.mockClear();
		injectToExistingTabsMock.mockClear();

		const newPermissions: chrome.permissions.Permissions = {
			origins: ['https://new-host.example.com/*'],
			permissions: [],
		};
		// @ts-expect-error Missing types in `jest-chrome`
		await chrome.permissions.onAdded.callListeners(newPermissions);

		// @ts-expect-error Missing types in `jest-chrome`
		expect(chrome.scripting.registerContentScripts).toHaveBeenCalledWith([
			expect.objectContaining({matches: ['https://new-host.example.com/*']}),
		]);
		expect(injectToExistingTabsMock).toHaveBeenCalledWith(
			['https://new-host.example.com/*'],
			[{js: ['script.js'], matches: baseManifest.content_scripts[0]?.matches}],
		);
	});

	it('should not register scripts when onAdded fires with no origins', async () => {
		init();
		await simulateExtensionStart();
		// @ts-expect-error Missing types in `jest-chrome`
		chrome.scripting.registerContentScripts.mockClear();
		injectToExistingTabsMock.mockClear();

		// @ts-expect-error Missing types in `jest-chrome`
		await chrome.permissions.onAdded.callListeners({origins: [], permissions: []});

		// @ts-expect-error Missing types in `jest-chrome`
		expect(chrome.scripting.registerContentScripts).not.toHaveBeenCalled();
		expect(injectToExistingTabsMock).not.toHaveBeenCalled();
	});

	it.each([
		['Chrome', 'Duplicate script ID \'webext-dynamic-content-script-{"js":["script.js"],"matches":["https://granted.example.com/*"]}\''],
		['Firefox', 'Content script with id "webext-dynamic-content-script-{"js":["script.js"],"matches":["https://granted.example.com/*"]}" is already registered.'],
	])('should not re-inject into existing tabs when the script is already registered (duplicate ID, %s)', async (_browser, message) => {
		// @ts-expect-error Missing types in `jest-chrome`
		chrome.scripting.registerContentScripts.mockRejectedValue(new Error(message));

		init();
		await simulateExtensionStart();

		expect(injectToExistingTabsMock).not.toHaveBeenCalled();
	});
});

describe('init - unregisterContentScript', () => {
	it('should unregister scripts when permissions are removed via onRemoved listener', async () => {
		init();
		await simulateExtensionStart();

		const removedPermissions: chrome.permissions.Permissions = {
			origins: ['https://granted.example.com/*'],
			permissions: [],
		};
		// @ts-expect-error Missing types in `jest-chrome`
		await chrome.permissions.onRemoved.callListeners(removedPermissions);

		// @ts-expect-error Missing types in `jest-chrome`
		expect(chrome.scripting.unregisterContentScripts).toHaveBeenCalledWith({
			ids: [
				'webext-dynamic-content-script-{"js":["script.js"],"matches":["https://granted.example.com/*"]}',
			],
		});
	});

	it('should not unregister scripts when onRemoved fires with no origins', async () => {
		init();
		await simulateExtensionStart();

		// @ts-expect-error Missing types in `jest-chrome`
		await chrome.permissions.onRemoved.callListeners({origins: [], permissions: []});

		// @ts-expect-error Missing types in `jest-chrome`
		expect(chrome.scripting.unregisterContentScripts).not.toHaveBeenCalled();
	});
});

describe('init - no existing origins', () => {
	it('should not register scripts when no additional permissions exist at startup', async () => {
		queryPermissionsDiffMock.mockResolvedValue({});

		init();
		await simulateExtensionStart();

		// @ts-expect-error Missing types in `jest-chrome`
		expect(chrome.scripting.registerContentScripts).not.toHaveBeenCalled();
		expect(injectToExistingTabsMock).not.toHaveBeenCalled();
	});
});
