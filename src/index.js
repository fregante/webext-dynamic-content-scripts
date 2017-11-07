import {pingContentScript} from 'webext-content-script-ping';

function logRuntimeErrors() {
	if (chrome.runtime.lastError) {
		console.error(chrome.runtime.lastError);
	}
}

async function injectContentScript(script, tabId) {
	const allFrames = script.all_frames;
	const runAt = script.run_at;
	script.css.forEach(file => chrome.tabs.insertCSS(tabId, {file, allFrames, runAt}, logRuntimeErrors));
	script.js.forEach(file => chrome.tabs.executeScript(tabId, {file, allFrames, runAt}, logRuntimeErrors));
}

async function injectContentScripts(tab) {
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

	if (!isPermitted) {
		return;
	}

	// Exit if already injected
	try {
		console.log('webext-dynamic-content-scripts: will ping');
		console.log(tab.id || tab);
		return await pingContentScript(tab.id || tab);
	} catch (err) {
		console.log('webext-dynamic-content-scripts: no ping back', err);
	}

	console.log('webext-dynamic-content-scripts: injecting');
	chrome.runtime.getManifest().content_scripts.forEach(s => injectContentScript(s, tab.id));
}

export default function (tab = false) {
	if (tab === false) {
		console.log('webext-dynamic-content-scripts: will inject scripts on load');
		chrome.tabs.onUpdated.addListener((tabId, {status}) => {
			if (status === 'loading') {
				console.log('webext-dynamic-content-scripts: will inject scripts, now loading');
				console.log(tabId);
				injectContentScripts(tabId);
			}
		});
	} else {
		console.log('webext-dynamic-content-scripts: will inject scripts');
		console.log(tab);
		injectContentScripts(tab);
	}
}
