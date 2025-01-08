import 'webext-dynamic-content-scripts/including-active-tab.ts';

chrome.contextMenus.create({
	title: 'Enable activeTab permission',
}, () => {
	if (chrome.runtime.lastError) {
		// Shush
	}
});

chrome.contextMenus.onClicked.addListener(() => {
	console.log('Context menu clicked');
});

console.log('Background loaded');
