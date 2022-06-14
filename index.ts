import registerContentScriptPonyfill from 'content-scripts-register-polyfill/ponyfill.js';
import {getAdditionalPermissions} from 'webext-additional-permissions';
import {injectContentScript} from 'webext-content-scripts';

const registeredScripts = new Map<
string,
Promise<browser.contentScripts.RegisteredContentScript>
>();

type ContentScripts = NonNullable<chrome.runtime.Manifest['content_scripts']>;

const chromeRegister = globalThis?.chrome?.scripting?.registerContentScripts;
const firefoxRegister = globalThis?.browser?.contentScripts?.register;

async function registerContentScript(contentScript: browser.contentScripts.RegisteredContentScriptOptions): Promise<browser.contentScripts.RegisteredContentScript> {
	if (chromeRegister) {
		const id = 'webext-dynamic-content-script-' + JSON.stringify(contentScript);
		await chromeRegister([{
			id,
			...contentScript,
		}]);
		return {
			unregister: async () => chrome.scripting.unregisterContentScripts([id]),
		};
	}

	return (firefoxRegister ?? registerContentScriptPonyfill)(contentScript);
}

// In Firefox, paths in the manifest are converted to full URLs under `moz-extension://` but browser.contentScripts expects exclusively relative paths
function convertPath(file: string): browser.extensionTypes.ExtensionFileOrCode {
	const url = new URL(file, location.origin);
	return {file: url.pathname};
}

function injectToExistingTabs(origins: string[], scripts: ContentScripts) {
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

	// May not be needed in the future in Firefox
	// https://bugzilla.mozilla.org/show_bug.cgi?id=1458947
	injectToExistingTabs(newOrigins || [], manifest);
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

	for (const [origin, scriptPromise] of registeredScripts) {
		if (origins.includes(origin)) {
			// eslint-disable-next-line no-await-in-loop
			const script = await scriptPromise;
			void script.unregister();
		}
	}
});
