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

const newActiveTabs = new SimpleEventTarget<ActiveTab>();

const browserAction = chrome.action ?? chrome.browserAction;

export const possiblyActiveTabs = new Map<TabId, Origin>();

async function addIfScriptable({url, id}: chrome.tabs.Tab): Promise<void> {
	if (
		id && url

		// Skip if it already exists. A previous change of origin already cleared this
		&& !possiblyActiveTabs.has(id)

		// ActiveTab makes sense on non-scriptable URLs as they generally don't have scriptable frames
		&& isScriptableUrl(url)

	// Note: Do not filter by `isContentScriptRegistered`; `active-tab` also applies to random `executeScript` calls
	) {
		const {origin} = new URL(url);
		console.debug('activeTab:', id, 'added', {origin});
		possiblyActiveTabs.set(id, origin);
		newActiveTabs.emit({id, origin});
	} else {
		console.debug('activeTab:', id, 'not added', {origin});
	}
}

function dropIfOriginChanged(tabId: number, {url}: chrome.tabs.TabChangeInfo): void {
	if (url && possiblyActiveTabs.has(tabId)) {
		const {origin} = new URL(url);
		if (possiblyActiveTabs.get(tabId) !== origin) {
			console.debug('activeTab:', tabId, 'removed because origin changed from', possiblyActiveTabs.get(tabId), 'to', origin);
			possiblyActiveTabs.delete(tabId);
		}
	}
}

function altListener(_: unknown, tab?: chrome.tabs.Tab): void {
	if (tab) {
		void addIfScriptable(tab);
	}
}

function drop(tabId: TabId): void {
	console.debug('activeTab:', tabId, 'removed');
	possiblyActiveTabs.delete(tabId);
}

// https://developer.chrome.com/docs/extensions/mv3/manifest/activeTab/#invoking-activeTab
export function startActiveTabTracking(): void {
	browserAction?.onClicked.addListener(addIfScriptable);
	chrome.contextMenus?.onClicked.addListener(altListener);
	chrome.commands?.onCommand.addListener(altListener);

	chrome.tabs.onUpdated.addListener(dropIfOriginChanged);
	chrome.tabs.onRemoved.addListener(drop);
}

export function stopActiveTabTracking(): void {
	browserAction?.onClicked.removeListener(addIfScriptable);
	chrome.contextMenus?.onClicked.removeListener(altListener);
	chrome.commands?.onCommand.removeListener(altListener);

	chrome.tabs.onUpdated.removeListener(dropIfOriginChanged);
	chrome.tabs.onRemoved.removeListener(drop);
	possiblyActiveTabs.clear();
}

export function addActiveTabListener(callback: (tab: ActiveTab) => void): void {
	startActiveTabTracking();
	newActiveTabs.add(callback);
}
