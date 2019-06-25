async function p(fn, ...args) {
	return new Promise((resolve, reject) => fn(...args, r => {
		if (chrome.runtime.lastError) {
			reject(chrome.runtime.lastError);
		} else {
			resolve(r);
		}
	}));
}

function getUrl(tab) {
	return new Promise(resolve => {
		chrome.tabs.executeScript(tab.id || tab, {
			code: 'location.href',
			runAt: 'document_start'
		}, urls => {
			if (chrome.runtime.lastError) {
				resolve();
			} else {
				resolve(urls[0]);
			}
		});
	});
}

const manifestContentScripts = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getManifest().content_scripts;

function isFileInManifest(type, matches, file) {
	for (const group of manifestContentScripts) {
		if (group[type].includes(file) && group.matches.some(matches.includes, matches)) {
			return true;
		}
	}

	return false;
}

// TODO: ensure that the same scripts aren't injected multiple times
export async function addToTab(tab, contentScripts) {
	if (typeof tab !== 'object' && typeof tab !== 'number') {
		throw new TypeError('Specify a Tab or tabId');
	}

	if (!Array.isArray(contentScripts)) {
		// Single script object, make it an array
		contentScripts = [contentScripts];
	}

	const tabId = tab.id || tab;
	const previouslyLoaded = await p(chrome.tabs.executeScript, tabId, {
		code: 'document.__webextContentScriptLoaded',
		runAt: 'document_start'
	});
	const injectedFileList = [];
	const injections = [];
	for (let group of contentScripts) {
		group = {css: [], js: [], ...group};

		const runAt = group.run_at;
		const matches = group.matches;
		const allFrames = group.all_frames;

		for (const file of group.css) {
			if (previouslyLoaded.includes(file) || !isFileInManifest('css', matches, file)) {
				continue;
			}

			injectedFileList.push(file);
			injections.push(p(chrome.tabs.insertCSS, tabId, {
				matches,
				file,
				allFrames,
				runAt
			}));
		}

		for (const file of group.js) {
			if (previouslyLoaded.includes(file) || !isFileInManifest('css', matches, file)) {
				continue;
			}

			injectedFileList.push(file);
			injections.push(p(chrome.tabs.executeScript, tabId, {
				matches,
				file,
				allFrames,
				runAt
			}));
		}

		if (injectedFileList.length > 0) {
			// Mark as loaded, from `pingContentScript`
			chrome.tabs.executeScript(tabId, {
				code: `document.__webextContentScriptLoaded = (document.__webextContentScriptLoaded || []).concat(${JSON.stringify(injectedFileList)});`,
				allFrames,
				runAt: 'document_start'
			});
		}


		return Promise.all(injections);
	}
}

export function addToFutureTabs(scripts = chrome.runtime.getManifest().content_scripts) {
	chrome.tabs.onUpdated.addListener(async (tabId, {status}) => {
		if (status !== 'loading') {
			return;
		}

		// If we no URL, we have no permissions
		const url = await getUrl(tabId);
		if (!url) {
			return;
		}

		const {origin} = new URL(url);
		const isOriginPermitted = await p(chrome.permissions.contains, {
			origins: [origin + '/*']
		});
		if (isOriginPermitted) {
			addToTab(tabId, scripts);
		}
	});
}

export default {
	addToTab,
	addToFutureTabs
};
