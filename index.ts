import registerContentScriptPonyfill from 'content-scripts-register-polyfill/ponyfill.js';
import {getAdditionalPermissions} from 'webext-additional-permissions';

const registeredScripts = new Map<
string,
Promise<browser.contentScripts.RegisteredContentScript>
>();

type ContentScripts = NonNullable<chrome.runtime.Manifest['content_scripts']>;

const registerContentScript
	= globalThis?.browser?.contentScripts?.register
	?? registerContentScriptPonyfill;

// In Firefox, paths in the manifest are converted to full URLs under `moz-extension://` but browser.contentScripts expects exclusively relative paths
function convertPath(file: string): browser.extensionTypes.ExtensionFileOrCode {
	const url = new URL(file, location.origin);
	return {file: url.pathname};
}

function injectIntoTab(tabId: number, scripts: ContentScripts) {
	for (const script of scripts) {
		for (const file of script.css || []) {
			void chrome.tabs.insertCSS(tabId, {
				file,
				allFrames: script.all_frames,
			});
		}

		for (const file of script.js || []) {
			void chrome.tabs.executeScript(tabId, {
				file,
				allFrames: script.all_frames,
			});
		}
	}
}

function injectOnExistingTabs(origins: string[], scripts: ContentScripts) {
	chrome.tabs.query({
		url: origins,
	}, tabs => {
		for (const tab of tabs) {
			if (tab.id) {
				injectIntoTab(tab.id, scripts);
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
		throw new Error('webext-dynamic-content-scripts tried to register scripts on th new host permissions, but no content scripts were found in the manifest.');
	}

	// Register one at a time to allow removing one at a time as well
	for (const origin of newOrigins || []) {
		for (const config of manifest) {
			const registeredScript = registerContentScript({
				js: (config.js || []).map(file => convertPath(file)),
				css: (config.css || []).map(file => convertPath(file)),
				allFrames: config.all_frames,
				matches: [origin],
				excludeMatches: config.matches,
				runAt: config.run_at as browser.extensionTypes.RunAt,
			});
			registeredScripts.set(origin, registeredScript);
		}
	}

	injectOnExistingTabs(newOrigins || [], manifest);
}

(async () => {
	void registerOnOrigins(
		await getAdditionalPermissions({
			strictOrigins: false,
		}),
	);
})();

chrome.permissions.onAdded.addListener(permissions => {
	if (permissions.origins && permissions.origins.length > 0) {
		void registerOnOrigins(permissions);
	}
});

chrome.permissions.onRemoved.addListener(async ({origins}) => {
	if (!origins || origins.length === 0) {
		return;
	}

	for (const [origin, script] of registeredScripts) {
		if (origins.includes(origin)) {
			// eslint-disable-next-line no-await-in-loop
			void (await script).unregister();
		}
	}
});
