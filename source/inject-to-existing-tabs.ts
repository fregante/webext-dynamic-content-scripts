import {getTabsByUrl, injectContentScript} from 'webext-content-scripts';

export async function injectToExistingTabs(
	origins: string[],
	scripts: ManifestContentScripts,
) {
	return injectContentScript(
		await getTabsByUrl(origins),
		scripts,
	);
}
