import './index.js'; // Core functionality
import {type ContentScript} from 'webext-content-scripts/types';
import {injectContentScript} from 'webext-content-scripts';
import {type ActiveTab, onActiveTab, possiblyActiveTabs} from './active-tab.js';
import {isContentScriptRegistered} from './utils.js';

type InjectionDetails = {
	tabId: number;
	frameId: number;
	url: string;
};

const gotNavigation = typeof chrome === 'object' && 'webNavigation' in chrome;

const scripts = chrome.runtime.getManifest().content_scripts as ContentScript;

async function injectToTabUnlessRegistered({id, origin}: ActiveTab): Promise<void> {
	if (id && !(await isContentScriptRegistered(origin))) {
		// Warning: This might cause duplicate injections on frames of activeTabs with different origins. Some details in:
		// https://github.com/fregante/webext-dynamic-content-scripts/pull/44
		// https://github.com/pixiebrix/pixiebrix-extension/issues/4983
		void injectContentScript(id, scripts);
	}
}

async function injectIfActive(
	{tabId, frameId, url}: InjectionDetails,
): Promise<void> {
	if (
		possiblyActiveTabs.has(tabId)
		&& !(await isContentScriptRegistered(url))
	) {
		await injectContentScript({tabId, frameId}, scripts);
	}
}

async function tabListener(
	tabId: number,
	{status}: chrome.tabs.TabChangeInfo,
	{url}: chrome.tabs.Tab,
): Promise<void> {
	// Only status updates are relevant
	// No URL = no permission
	if (status === 'loading' && url) {
		await injectIfActive({tabId, url, frameId: 0});
	}
}

function init() {
	onActiveTab(injectToTabUnlessRegistered);

	if (gotNavigation) {
		chrome.webNavigation.onCommitted.addListener(injectIfActive);
	} else {
		chrome.tabs.onUpdated.addListener(tabListener);
	}
}

init();
