import {isScriptableUrl} from 'webext-content-scripts';
import {SimpleEventTarget} from './simple-event-target';

type TabId = number;
type Origin = string;

export type ActiveTab = {
	id: TabId;
	origin: Origin;
};

export const possiblyActiveTabs = new Map<TabId, Origin>();

const emitter = new SimpleEventTarget<ActiveTab>();

const browserAction = chrome.action ?? chrome.browserAction;

function listener({url, id}: chrome.tabs.Tab): void {
	if (id && url && isScriptableUrl(url)) {
		const {origin} = new URL(url);
		possiblyActiveTabs.set(id, origin);
		emitter.emit({id, origin});
	}
}

function altListener(_: unknown, tab?: chrome.tabs.Tab) {
	if (tab) {
		listener(tab);
	}
}

function removalListener(tabId: TabId) {
	possiblyActiveTabs.delete(tabId);
}

export function startActiveTabTracking() {
	browserAction?.onClicked.addListener(listener);
	chrome.contextMenus?.onClicked.addListener(altListener);
	chrome.commands?.onCommand.addListener(altListener);
	chrome.tabs.onRemoved.addListener(removalListener);
}

export function stopActiveTabTracking() {
	browserAction?.onClicked.removeListener(listener);
	chrome.contextMenus?.onClicked.removeListener(altListener);
	chrome.commands?.onCommand.removeListener(altListener);
	chrome.tabs.onRemoved.removeListener(removalListener);
}

export function onActiveTab(callback: (tab: ActiveTab) => void) {
	startActiveTabTracking();
	emitter.add(callback);
}
