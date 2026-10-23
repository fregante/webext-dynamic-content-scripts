<<<<<<< HEAD
import {queryPermissionsDiff} from 'webext-permissions';
import onExtensionStart from 'webext-events/on-extension-start';
=======
import {queryAdditionalPermissions} from 'webext-permissions';
import {onExtensionStart} from 'webext-events';
>>>>>>> origin/main
import {injectToExistingTabs} from './inject-to-existing-tabs.js';

type ManifestContentScript = ReturnType<typeof getContentScripts>[number];

// In Firefox, paths in the manifest are converted to full URLs under `moz-extension://`; convert to relative paths for `chrome.scripting.registerContentScripts`
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
<<<<<<< HEAD
		// eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- `chrome.scripting` requires either `js` or `css`, and manifest content scripts always have one of them
=======
>>>>>>> origin/main
		await chrome.scripting.registerContentScripts([{
			id: getIdFromConfig(origin, config),
			// Always convert paths here because we don't know whether Firefox MV3 will accept full URLs
			js: config.js?.map(file => makePathRelative(file)),
			css: config.css?.map(file => makePathRelative(file)),
			allFrames: config.all_frames,
			matches: [origin],
			excludeMatches: config.matches,
			persistAcrossSessions: true,
<<<<<<< HEAD
			runAt: config.run_at,
		} as chrome.scripting.RegisteredContentScript]);
	} catch (error) {
		if ((error as Error)?.message.startsWith('Duplicate script ID')) {
=======
			runAt: config.run_at as browser.extensionTypes.RunAt,
		}]);
	} catch (error) {
		// Chrome: `Duplicate script ID '…'`; Firefox: `Content script with id "…" is already registered.`
		if (/^Duplicate script ID|is already registered\.$/.test((error as Error)?.message)) {
>>>>>>> origin/main
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
	if (origins === undefined || origins.length === 0) {
		return;
	}

	const ids = getContentScripts().flatMap(config => origins.map(origin => getIdFromConfig(origin, config)));
	void chrome.scripting.unregisterContentScripts({ids});
}

async function enableOnOrigins(origins: string[] | undefined) {
	if (origins === undefined || origins.length === 0) {
		return;
	}

	const contentScripts = getContentScripts();
	await registerOnOrigins(origins, contentScripts);
}

async function registerExistingOrigins() {
	// This should only be necessary for users who granted permissions before `webext-dynamic-content-scripts` was set up
<<<<<<< HEAD
	const {added} = await queryPermissionsDiff({
=======
	const {origins} = await queryAdditionalPermissions({
>>>>>>> origin/main
		strictOrigins: false,
	});

	await enableOnOrigins(added?.origins);
}

export function init() {
	/* eslint-disable @typescript-eslint/strict-void-return -- Async listeners, rejections must surface as unhandled errors */
	chrome.permissions.onRemoved.addListener(handledDroppedPermissions);
	chrome.permissions.onAdded.addListener(handleNewPermissions);
	/* eslint-enable @typescript-eslint/strict-void-return */
	onExtensionStart.addListener(registerExistingOrigins);
}
