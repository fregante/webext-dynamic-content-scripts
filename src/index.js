import pingContentScript from 'webext-content-script-ping';

async function p(fn, ...args) {
	return new Promise((resolve, reject) => fn(...args, r => {
		if (chrome.runtime.lastError) {
			reject(chrome.runtime.lastError);
		} else {
			resolve(r);
		}
	}));
}

export async function addToTab(tab, contentScripts) {
	if (typeof tab !== 'object' && typeof tab !== 'number') {
		throw new TypeError('Specify a Tab or tabId');
	}

	if (contentScripts === false) {
		// Get all scripts from manifest.json
		contentScripts = chrome.runtime.getManifest().content_scripts;
	} else if (!Array.isArray(contentScripts)) {
		// Single script object, make it an array
		contentScripts = [contentScripts];
	}

	try {
		const tabId = tab.id || tab;
		if (!await pingContentScript(tabId)) {
			const injections = [];
			for (const group of contentScripts) {
				const allFrames = group.all_frames;
				const runAt = group.run_at;
				for (const file of group.css) {
					injections.push(p(chrome.tabs.insertCSS, tabId, {file, allFrames, runAt}));
				}
				for (const file of group.js) {
					injections.push(p(chrome.tabs.executeScript, tabId, {file, allFrames, runAt}));
				}
			}
			return Promise.all(injections);
		}
	} catch (err) {
		// Probably the domain isn't permitted.
		// It's easier to catch this than do 2 queries
	}
}

export function addToFutureTabs(scripts) {
	chrome.tabs.onUpdated.addListener((tabId, {status}) => {
		if (status === 'loading') {
			addToTab(tabId, scripts);
		}
	});
}

export default {
	addToTab,
	addToFutureTabs
};
