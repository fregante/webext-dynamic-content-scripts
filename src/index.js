import pingContentScript from 'webext-content-script-ping';

async function p(fn, ...args) {
	return new Promise((resolve, reject) => fn(...args, r => {
		if (chrome.runtime.lastError) {
			reject(chrome.runtime.lastError);
		}
		resolve(r);
	}));
}

function injectContentScriptsOnNewTabs() {
	chrome.tabs.onUpdated.addListener((tabId, {status}) => {
		if (status === 'loading') {
			injectContentScripts(tabId);
		}
	});
}

export default async function injectContentScripts(tab = false) {
	// Enable auto-mode
	if (tab === false) {
		return injectContentScriptsOnNewTabs();
	}

	// Really inject scripts on the specified tab
	try {
		const tabId = tab.id || tab;
		if (!await pingContentScript(tabId)) {
			for (const group of chrome.runtime.getManifest().content_scripts) {
				const allFrames = group.all_frames;
				const runAt = group.run_at;
				group.css.forEach(file => p(chrome.tabs.insertCSS, tabId, {file, allFrames, runAt}));
				group.js.forEach(file => p(chrome.tabs.executeScript, tabId, {file, allFrames, runAt}));
			}
		}
	} catch (err) {
		// Probably the domain isn't permitted.
		// It's easier to catch this than do 2 queries
	}
}
