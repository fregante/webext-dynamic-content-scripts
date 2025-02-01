import {queryAdditionalPermissions} from 'webext-permissions';
import {onExtensionStart} from 'webext-events';
import {injectToExistingTabs} from './inject-to-existing-tabs.js';

type ManifestContentScript = ReturnType<typeof getContentScripts>[number];

// In Firefox, paths in the manifest are converted to full URLs under `moz-extension://` but browser.contentScripts expects exclusively relative paths
function makePathRelative(file: string): string {
	return new URL(file, location.origin).pathname;
}

function getContentScripts() {
	const {content_scripts: scripts} = chrome.runtime.getManifest();

	if (scripts) {
		return scripts;
	}

	throw new Error('webext-dynamic-content-scripts tried to register scripts on the new host permissions, but no content scripts were found in the manifest.');
}

function getIdFromConfig(origin: string, config: ManifestContentScript) {
	return 'webext-dynamic-content-script-' + JSON.stringify({...config, matches: [origin]});
}

async function register(origin: string, config: ManifestContentScript) {
	try {
		await chrome.scripting.registerContentScripts([{
			id: getIdFromConfig(origin, config),
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

async function registerOnOrigins(
	origins: string[],
	contentScripts: ManifestContentScript[],
): Promise<void> {
	for (const origin of origins) {
		for (const config of contentScripts) {
			// Register one at a time to allow removing one at a time as well
			void register(origin, config);
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

	const ids = getContentScripts().flatMap(config => origins.map(origin => getIdFromConfig(origin, config)));
	void chrome.scripting.unregisterContentScripts({ids});
}

async function enableOnOrigins(origins: string[] | undefined) {
	if (!origins?.length) {
		return;
	}

	const contentScripts = getContentScripts();
	await registerOnOrigins(origins, contentScripts);
}

async function registerExistingOrigins() {
	// This should only be necessary for users who granted permissions before `webext-dynamic-content-scripts` was set up
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
