import {pingContentScript} from 'webext-content-script-ping';

function logRuntimeErrors() {
	if (chrome.runtime.lastError) {
		console.error(chrome.runtime.lastError);
	}
}

async function injectContentScript(script, tabId) {
	const allFrames = script.all_frames;
	const runAt = script.run_at;

	// Flatten file list
	const list = [
		...script.css.map(file => ({file, fn: 'insertCSS'})),
		...script.js.map(file => ({file, fn: 'executeScript'}))
	];

	// Guarantee execution order
	for (const {file, fn} of list) {
		/* eslint no-await-in-loop: 0 */ // We actually need the loop to wait
		await new Promise(resolve => chrome.tabs[fn](tabId, {file, allFrames, runAt}, resolve));
		logRuntimeErrors(); // TODO: should errors stop the execution instead?
	}
}

async function injectContentScripts(tab) {
	// Exit if already injected
	try {
		return await pingContentScript(tab.id || tab);
	} catch (err) {}

	// Get the tab object if we don't have it already
	if (!tab.id) {
		tab = await new Promise(resolve => chrome.tabs.get(tab, resolve));
		logRuntimeErrors();
	}

	// If we don't have the URL, we definitely can't access it.
	if (!tab.url) {
		return;
	}

	// We might just get the url because of the `tabs` permission,
	// not necessarily because we have access to the origin.
	// This will explicitly verify this permission.
	const isPermitted = await new Promise(resolve => chrome.permissions.contains({
		origins: [new URL(tab.url).origin + '/']
	}, resolve));
	logRuntimeErrors();

	if (isPermitted) {
		chrome.runtime.getManifest().content_scripts.forEach(s => injectContentScript(s, tab.id));
	}
}

export default function (tab = false) {
	if (tab === false) {
		chrome.tabs.onUpdated.addListener((tabId, {status}) => {
			if (status === 'loading') {
				injectContentScripts(tabId);
			}
		});
	} else {
		injectContentScripts(tab);
	}
}
