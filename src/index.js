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

export async function toTab(tab = false) {
	if (tab === false) {
		throw new TypeError('Specify a Tab or tabId');
	}
	try {
		const tabId = tab.id || tab;
		if (!await pingContentScript(tabId)) {
			const scripts = [];
			for (const group of chrome.runtime.getManifest().content_scripts) {
				const allFrames = group.all_frames;
				const runAt = group.run_at;
				for (const file of group.css) {
					scripts.push(p(chrome.tabs.insertCSS, tabId, {file, allFrames, runAt}));
				}
				for (const file of group.js) {
					scripts.push(p(chrome.tabs.executeScript, tabId, {file, allFrames, runAt}));
				}
			}
			return Promise.all(scripts);
		}
	} catch (err) {
		// Probably the domain isn't permitted.
		// It's easier to catch this than do 2 queries
	}
}

export function toFutureTabs() {
	chrome.tabs.onUpdated.addListener((tabId, {status}) => {
		if (status === 'loading') {
			toTab(tabId);
		}
	});
}

const contextMenuId = 'webext-dynamic-content-scripts:add-permission';

function getMenuLabel() {
	const manifest = chrome.runtime.getManifest();
	return `Enable ${manifest.name} on this domain`;
}

export function addPermissionContextMenu(title = getMenuLabel()) {
	chrome.contextMenus.create({
		id: contextMenuId,
		title,
		contexts: ['page_action'],
		documentUrlPatterns: [
			'http://*/*',
			'https://*/*'
		]
	});

	chrome.contextMenus.onClicked.addListener(async ({menuItemId}, {tabId, url}) => {
		/* eslint-disable no-alert */
		if (menuItemId === contextMenuId) {
			chrome.permissions.request({
				origins: [
					`${new URL(url).origin}/*`
				]
			}, granted => {
				if (chrome.runtime.lastError) {
					alert(`Error: ${chrome.runtime.lastError.message}`);
				} else if (granted && confirm('Do you want to reload this page to apply Refined GitHub?')) {
					chrome.tabs.reload(tabId);
				}
			});
		}
	});
}

export default {
	toTab,
	toFutureTabs,
	addPermissionContextMenu
};
