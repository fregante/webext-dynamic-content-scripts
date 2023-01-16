import {injectContentScript} from 'webext-content-scripts';

export function injectToExistingTabs(
	origins: string[],
	scripts: ManifestContentScripts) {
	if (origins.length === 0) {
		return;
	}

	chrome.tabs.query({
		url: origins,
	}, tabs => {
		for (const tab of tabs) {
			if (tab.id) {
				void injectContentScript(tab.id, scripts);
			}
		}
	});
}
