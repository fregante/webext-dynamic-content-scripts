import {describe, it, type TestContext} from 'node:test';
import type * as Lib from './lib.ts';

type Listener = (...arguments_: any[]) => unknown;
type AsyncFunction = () => void | Promise<void>;

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

const createEvent = () => {
	const listeners = new Set<Listener>();
	return {
		addListener(listener: Listener) {
			listeners.add(listener);
		},
		async callListeners(...arguments_: unknown[]) {
			await Promise.all([...listeners].map(async listener => listener(...arguments_)));
		},
	};
};

const getId = (js: string[], origin: string) => `webext-dynamic-content-script-{"js":${JSON.stringify(js)},"matches":["${origin}"]}`;

// What `registerContentScripts` should receive for a manifest content script
const registration = (js: string, origin: string, excludeMatches: string[]) => [[{
	allFrames: undefined,
	css: undefined,
	excludeMatches,
	id: getId([js], origin),
	js: [`/${js}`],
	matches: [origin],
	persistAcrossSessions: true,
	runAt: undefined,
}]];

const injectedScripts = [{js: ['script.js'], matches: baseManifest.content_scripts[0]?.matches}];

let importCount = 0;

// `webext-permissions`, `webext-events` and `inject-to-existing-tabs` are mocked, so the module must be imported after the mocks
type SetupOptions = {manifest?: chrome.runtime.Manifest; diff?: {added?: chrome.permissions.Permissions}};

async function setup(t: TestContext, {manifest = baseManifest, diff = {added: additionalPermissions}}: SetupOptions = {}) {
	const permissions = {onAdded: createEvent(), onRemoved: createEvent()};
	const registerContentScripts = t.mock.fn(async (_scripts: unknown[]) => undefined);
	const unregisterContentScripts = t.mock.fn(async (_filter: unknown) => undefined);
	Object.assign(globalThis, {
		chrome: {
			runtime: {getManifest: () => manifest},
			scripting: {registerContentScripts, unregisterContentScripts},
			permissions,
		},
	});

	const queryPermissionsDiff = t.mock.fn(async () => diff);
	const injectToExistingTabs = t.mock.fn(async (_origins: string[], _scripts: unknown[]) => undefined);
	const callbacks = new Set<AsyncFunction>();
	const addListener = t.mock.fn((callback: AsyncFunction) => {
		callbacks.add(callback);
	});

	t.mock.module('webext-permissions', {namedExports: {queryPermissionsDiff}});
	t.mock.module('webext-events/on-extension-start', {defaultExport: {addListener}});
	t.mock.module('./inject-to-existing-tabs.ts', {namedExports: {injectToExistingTabs}});
	const {init} = await import(`./lib.ts?${importCount++}`) as typeof Lib;

	return {
		init,
		permissions,
		queryPermissionsDiff,
		registerContentScripts,
		unregisterContentScripts,
		injectToExistingTabs,
		async simulateExtensionStart() {
			await Promise.all([...callbacks].map(async callback => callback()));
			callbacks.clear();
		},
	};
}

describe('init', () => {
	it('it should register the listeners and start checking permissions', async (t: TestContext) => {
		const {init, simulateExtensionStart, queryPermissionsDiff, injectToExistingTabs} = await setup(t);
		init();
		await simulateExtensionStart();

		t.assert.strictEqual(queryPermissionsDiff.mock.callCount(), 1);
		t.assert.deepStrictEqual(injectToExistingTabs.mock.calls.map(call => call.arguments), [
			[additionalPermissions.origins, injectedScripts],
		]);
	});

	it('it should throw if no content scripts exist at all', async (t: TestContext) => {
		const manifest: chrome.runtime.Manifest = structuredClone(baseManifest);
		delete manifest.content_scripts;
		const {init, simulateExtensionStart} = await setup(t, {manifest});
		init();

		await t.assert.rejects(simulateExtensionStart(), {
			message: 'webext-dynamic-content-scripts tried to register scripts on the new host permissions, but no content scripts were found in the manifest.',
		});
	});
});

describe('init - registerContentScript', () => {
	it('should register the manifest scripts on new permissions', async (t: TestContext) => {
		const {init, simulateExtensionStart, registerContentScripts} = await setup(t);
		init();
		await simulateExtensionStart();

		t.assert.deepStrictEqual(registerContentScripts.mock.calls.map(call => call.arguments), [
			registration('script.js', 'https://granted.example.com/*', ['https://content-script.example.com/*']),
		]);
	});

	it('should register the manifest scripts on multiple new permissions', async (t: TestContext) => {
		const {init, simulateExtensionStart, registerContentScripts} = await setup(t, {
			diff: {
				added: {
					origins: [
						'https://granted.example.com/*',
						'https://granted-more.example.com/*',
					],
					permissions: [],
				},
			},
		});
		init();
		await simulateExtensionStart();

		t.assert.deepStrictEqual(registerContentScripts.mock.calls.map(call => call.arguments), [
			registration('script.js', 'https://granted.example.com/*', ['https://content-script.example.com/*']),
			registration('script.js', 'https://granted-more.example.com/*', ['https://content-script.example.com/*']),
		]);
	});

	it('should register multiple manifest scripts on new permissions', async (t: TestContext) => {
		const manifest = structuredClone(baseManifest);
		manifest.content_scripts.push({
			js: ['otherScript.js'],
			matches: ['https://content-script-extra.example.com/*'],
		});
		const {init, simulateExtensionStart, registerContentScripts} = await setup(t, {manifest});
		init();
		await simulateExtensionStart();

		t.assert.deepStrictEqual(registerContentScripts.mock.calls.map(call => call.arguments), [
			registration('script.js', 'https://granted.example.com/*', ['https://content-script.example.com/*']),
			registration('otherScript.js', 'https://granted.example.com/*', ['https://content-script-extra.example.com/*']),
		]);
	});

	it('should register scripts when new permissions are added via onAdded listener', async (t: TestContext) => {
		const {init, simulateExtensionStart, permissions, registerContentScripts, injectToExistingTabs} = await setup(t);
		init();
		await simulateExtensionStart();
		registerContentScripts.mock.resetCalls();
		injectToExistingTabs.mock.resetCalls();

		await permissions.onAdded.callListeners({
			origins: ['https://new-host.example.com/*'],
			permissions: [],
		});
		await Promise.resolve();

		t.assert.deepStrictEqual(registerContentScripts.mock.calls.map(call => call.arguments), [registration('script.js', 'https://new-host.example.com/*', ['https://content-script.example.com/*'])]);
		t.assert.deepStrictEqual(injectToExistingTabs.mock.calls.map(call => call.arguments), [
			[['https://new-host.example.com/*'], injectedScripts],
		]);
	});

	it('should not register scripts when onAdded fires with no origins', async (t: TestContext) => {
		const {init, simulateExtensionStart, permissions, registerContentScripts, injectToExistingTabs} = await setup(t);
		init();
		await simulateExtensionStart();
		registerContentScripts.mock.resetCalls();
		injectToExistingTabs.mock.resetCalls();

		await permissions.onAdded.callListeners({origins: [], permissions: []});

		t.assert.strictEqual(registerContentScripts.mock.callCount(), 0);
		t.assert.strictEqual(injectToExistingTabs.mock.callCount(), 0);
	});

	for (const [browser, message] of [
		['Chrome', 'Duplicate script ID \'webext-dynamic-content-script-{"js":["script.js"],"matches":["https://granted.example.com/*"]}\''],
		['Firefox', 'Content script with id "webext-dynamic-content-script-{"js":["script.js"],"matches":["https://granted.example.com/*"]}" is already registered.'],
	] as const) {
		it(`should not re-inject into existing tabs when the script is already registered (duplicate ID, ${browser})`, async (t: TestContext) => {
			const {init, simulateExtensionStart, registerContentScripts, injectToExistingTabs} = await setup(t);
			registerContentScripts.mock.mockImplementation(async () => {
				throw new Error(message);
			});

			init();
			await simulateExtensionStart();

			t.assert.strictEqual(injectToExistingTabs.mock.callCount(), 0);
		});
	}
});

describe('init - unregisterContentScript', () => {
	it('should unregister scripts when permissions are removed via onRemoved listener', async (t: TestContext) => {
		const {init, simulateExtensionStart, permissions, unregisterContentScripts} = await setup(t);
		init();
		await simulateExtensionStart();

		await permissions.onRemoved.callListeners({
			origins: ['https://granted.example.com/*'],
			permissions: [],
		});

		t.assert.deepStrictEqual(unregisterContentScripts.mock.calls.map(call => call.arguments), [
			[{ids: [getId(['script.js'], 'https://granted.example.com/*')]}],
		]);
	});

	it('should not unregister scripts when onRemoved fires with no origins', async (t: TestContext) => {
		const {init, simulateExtensionStart, permissions, unregisterContentScripts} = await setup(t);
		init();
		await simulateExtensionStart();

		await permissions.onRemoved.callListeners({origins: [], permissions: []});

		t.assert.strictEqual(unregisterContentScripts.mock.callCount(), 0);
	});
});

describe('init - no existing origins', () => {
	it('should not register scripts when no additional permissions exist at startup', async (t: TestContext) => {
		const {init, simulateExtensionStart, registerContentScripts, injectToExistingTabs} = await setup(t, {diff: {}});

		init();
		await simulateExtensionStart();

		t.assert.strictEqual(registerContentScripts.mock.callCount(), 0);
		t.assert.strictEqual(injectToExistingTabs.mock.callCount(), 0);
	});
});
