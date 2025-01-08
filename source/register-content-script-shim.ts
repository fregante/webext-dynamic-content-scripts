import {injectToExistingTabs} from './inject-to-existing-tabs.js';

type ManifestContentScript = NonNullable<chrome.runtime.Manifest['content_scripts']>[0];

// In Firefox, paths in the manifest are converted to full URLs under `moz-extension://` but browser.contentScripts expects exclusively relative paths
function makePathRelative(file: string): string {
	return new URL(file, location.origin).pathname;
}

export async function registerContentScript(id: string, origin: string, config: ManifestContentScript) {
	try {
		await chrome.scripting.registerContentScripts([{
			id,
			// Always convert paths here because we don't know whether Firefox MV3 will accept full URLs
			js: config.js?.map(file => makePathRelative(file)),
			css: config.css?.map(file => makePathRelative(file)),
			allFrames: config.all_frames,
			matches: [origin],
			excludeMatches: config.matches,
			persistAcrossSessions: true,
			runAt: config.run_at as browser.extensionTypes.RunAt,
		}]);
	} catch (error) {
		if ((error as Error)?.message.startsWith('Duplicate script ID')) {
			// Previously registered, nothing to do
			return;
		}

		// Unknown error, throw
		throw error;
	}

	// Registration successful, now inject into existing tabs
	await injectToExistingTabs([origin], [config]);
}
