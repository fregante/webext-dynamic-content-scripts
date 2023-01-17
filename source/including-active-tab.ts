import './index.js'; // Core functionality
import {type ContentScript} from 'webext-content-scripts/types';
import {injectContentScript} from 'webext-content-scripts';
import chromeP from 'webext-polyfill-kinda';
import {type ActiveTab, onActiveTab, possiblyActiveTabs} from './active-tab.js';
import {isContentScriptRegistered} from './utils.js';

type InjectionDetails = {
	tabId: number;
	frameId: number;
	url: string;
};

const gotNavigation = typeof chrome === 'object' && 'webNavigation' in chrome;

const scripts = chrome.runtime.getManifest().content_scripts as ContentScript;

async function injectToTabUnlessRegistered({id: tabId, origin}: ActiveTab): Promise<void> {
	if (tabId === undefined) {
		return;
	}

	const frames = gotNavigation
		? await chromeP.webNavigation.getAllFrames({tabId})
		: [{frameId: 0, url: origin}];

	// .map() needed for async loop
	frames.map(async ({frameId, url}) =>
		// Only same-origins frames are covered
		url.startsWith(origin) && injectIfActive({frameId, url, tabId}),
	);
}

async function injectIfActive(
	{tabId, frameId, url}: InjectionDetails,
): Promise<void> {
	const {origin} = new URL(url);
	if (
		// Check origin because the request might be for a frame; cross-origin frames do not receive activeTab
		possiblyActiveTabs.get(tabId) === origin

		// Don't inject if already registered
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
