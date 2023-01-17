import './index.js'; // Core functionality
import {type ContentScript} from 'webext-content-scripts/types';
import {injectContentScript, isScriptableUrl} from 'webext-content-scripts';
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

	frames.map(async ({frameId, url}) => injectIfActive({frameId, url, tabId}));
}

async function injectIfActive(
	{tabId, frameId, url}: InjectionDetails,
): Promise<void> {
	const {origin} = new URL(url);
	if (
		possiblyActiveTabs.get(tabId) === origin
		&& isScriptableUrl(url) // This checks the frame’s URL, which might not match the tab’s
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
