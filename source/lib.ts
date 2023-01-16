import {getAdditionalPermissions} from 'webext-additional-permissions';
import {injectContentScript} from 'webext-content-scripts';
import {registerContentScript} from './register-content-script-shim.js';

const registeredScripts = new Map<
string,
Promise<browser.contentScripts.RegisteredContentScript>
>();

// In Firefox, paths in the manifest are converted to full URLs under `moz-extension://` but browser.contentScripts expects exclusively relative paths
function makePathRelative(file: string): string {
	return new URL(file, location.origin).pathname;
}

function injectToExistingTabs(
	origins: string[],
	scripts: ManifestContentScripts,
) {
	if (origins.length === 0) {
		return;
	}

	chrome.tabs.query({
		url: origins,
	}, tabs => {
		for (const tab of tabs) {
			if (tab.id) {
				void injectContentScript(tab.id, scripts);
			}
		}
	});
}

// Automatically register the content scripts on the new origins
async function registerOnOrigins({
	origins: newOrigins,
}: chrome.permissions.Permissions): Promise<void> {
	const manifest = chrome.runtime.getManifest().content_scripts;

	if (!manifest) {
		throw new Error('webext-dynamic-content-scripts tried to register scripts on the new host permissions, but no content scripts were found in the manifest.');
	}

	// Register one at a time to allow removing one at a time as well
	for (const origin of newOrigins || []) {
		for (const config of manifest) {
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
	injectToExistingTabs(newOrigins || [], manifest);
}

function handleNewPermissions(permissions: chrome.permissions.Permissions) {
	if (permissions.origins && permissions.origins.length > 0) {
		void registerOnOrigins(permissions);
	}
}

async function handledDroppedPermissions({origins}: chrome.permissions.Permissions) {
	if (!origins || origins.length === 0) {
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
	chrome.permissions.onAdded.addListener(handleNewPermissions);
	await registerOnOrigins(
		await getAdditionalPermissions({
			strictOrigins: false,
		}),
	);
}
