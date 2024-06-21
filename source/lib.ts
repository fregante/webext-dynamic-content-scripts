import {queryAdditionalPermissions} from 'webext-permissions';
import {onExtensionStart} from 'webext-events';
import {excludeDuplicateFiles} from './deduplicator.js';
import {injectToExistingTabs} from './inject-to-existing-tabs.js';
import {registerContentScript} from './register-content-script-shim.js';

const registeredScripts = new Map<
string,
Promise<browser.contentScripts.RegisteredContentScript>
>();

// In Firefox, paths in the manifest are converted to full URLs under `moz-extension://` but browser.contentScripts expects exclusively relative paths
function makePathRelative(file: string): string {
	return new URL(file, location.origin).pathname;
}

function getContentScripts() {
	const {content_scripts: rawManifest, manifest_version: manifestVersion} = chrome.runtime.getManifest();

	if (!rawManifest) {
		throw new Error('webext-dynamic-content-scripts tried to register scripts on the new host permissions, but no content scripts were found in the manifest.');
	}

	return excludeDuplicateFiles(rawManifest, {warn: manifestVersion === 2});
}

// Automatically register the content scripts on the new origins
async function registerOnOrigins(
	origins: string[],
	contentScripts: ReturnType<typeof getContentScripts>,
): Promise<void> {
	if (origins.length === 0) {
		return;
	}

	// Register one at a time to allow removing one at a time as well
	for (const origin of origins) {
		for (const config of contentScripts) {
			const registeredScript = registerContentScript({
				// Always convert paths here because we don't know whether Firefox MV3 will accept full URLs
				js: config.js?.map(file => makePathRelative(file)),
				css: config.css?.map(file => makePathRelative(file)),
				allFrames: config.all_frames,
				matches: [origin],
				excludeMatches: config.matches,
				runAt: config.run_at as browser.extensionTypes.RunAt,
			});
			registeredScripts.set(origin, registeredScript);
		}
	}
}

async function handleNewPermissions({origins}: chrome.permissions.Permissions) {
	await enableOnOrigins(origins);
}

async function handledDroppedPermissions({origins}: chrome.permissions.Permissions) {
	if (!origins?.length) {
		return;
	}

	for (const [origin, scriptPromise] of registeredScripts) {
		if (origins.includes(origin)) {
			// eslint-disable-next-line no-await-in-loop
			const script = await scriptPromise;
			void script.unregister();
		}
	}
}

async function enableOnOrigins(origins: string[] | undefined) {
	if (!origins?.length) {
		return;
	}

	const contentScripts = getContentScripts();
	await Promise.all([
		injectToExistingTabs(origins, contentScripts),
		registerOnOrigins(origins, contentScripts),
	]);
}

async function registerExistingOrigins() {
	const {origins} = await queryAdditionalPermissions({
		strictOrigins: false,
	});

	await enableOnOrigins(origins);
}

export function init() {
	chrome.permissions.onRemoved.addListener(handledDroppedPermissions);
	chrome.permissions.onAdded.addListener(handleNewPermissions);
	onExtensionStart.addListener(registerExistingOrigins);
}
