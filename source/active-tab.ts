import {isScriptableUrl} from 'webext-content-scripts';
import {isBackground} from 'webext-detect-page';
import {SimpleEventTarget} from './simple-event-target';

if (!isBackground()) {
	throw new Error('This module is only allowed in a background script');
}

type TabId = number;
type Origin = string;

export type ActiveTab = {
	id: TabId;
	origin: Origin;
};

export const possiblyActiveTabs = new Map<TabId, Origin>();

const newActiveTabs = new SimpleEventTarget<ActiveTab>();

const browserAction = chrome.action ?? chrome.browserAction;

function trackIfScriptable({url, id}: chrome.tabs.Tab): void {
	if (id && url && !possiblyActiveTabs.has(id) && isScriptableUrl(url)) {
		const {origin} = new URL(url);
		possiblyActiveTabs.set(id, origin);
		newActiveTabs.emit({id, origin});
	}
}

function altListener(_: unknown, tab?: chrome.tabs.Tab) {
	if (tab) {
		trackIfScriptable(tab);
	}
}

function removalListener(tabId: TabId) {
	possiblyActiveTabs.delete(tabId);
}

export function startActiveTabTracking() {
	browserAction?.onClicked.addListener(trackIfScriptable);
	chrome.contextMenus?.onClicked.addListener(altListener);
	chrome.commands?.onCommand.addListener(altListener);
	chrome.tabs.onRemoved.addListener(removalListener);
}

export function stopActiveTabTracking() {
	browserAction?.onClicked.removeListener(trackIfScriptable);
	chrome.contextMenus?.onClicked.removeListener(altListener);
	chrome.commands?.onCommand.removeListener(altListener);
	chrome.tabs.onRemoved.removeListener(removalListener);
	possiblyActiveTabs.clear();
}

export function onActiveTab(callback: (tab: ActiveTab) => void) {
	startActiveTabTracking();
	newActiveTabs.add(callback);
}
