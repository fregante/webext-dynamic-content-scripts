import {queryAdditionalPermissions} from 'webext-permissions';
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

// Automatically register the content scripts on the new origins
async function registerOnOrigins({
	origins: newOrigins,
}: chrome.permissions.Permissions): Promise<void> {
	if (!newOrigins?.length) {
		return;
	}

	const {content_scripts: rawManifest, manifest_version: manifestVersion} = chrome.runtime.getManifest();

	if (!rawManifest) {
		throw new Error('webext-dynamic-content-scripts tried to register scripts on the new host permissions, but no content scripts were found in the manifest.');
	}

	const cleanManifest = excludeDuplicateFiles(rawManifest, {warn: manifestVersion === 2});

	// Register one at a time to allow removing one at a time as well
	for (const origin of newOrigins) {
		for (const config of cleanManifest) {
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

	// May not be needed in the future in Firefox
	// https://bugzilla.mozilla.org/show_bug.cgi?id=1458947
	void injectToExistingTabs(newOrigins, cleanManifest);
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

export async function init() {
	chrome.permissions.onRemoved.addListener(handledDroppedPermissions);
	chrome.permissions.onAdded.addListener(registerOnOrigins);
	await registerOnOrigins(
		await queryAdditionalPermissions({
			strictOrigins: false,
		}),
	);
}
