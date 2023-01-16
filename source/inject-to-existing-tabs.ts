import {getTabsByUrl, injectContentScript} from 'webext-content-scripts';

export async function injectToExistingTabs(
	origins: string[],
	scripts: ManifestContentScripts,
) {
	const excludeMatches = scripts.flatMap(script => script.matches ?? []);
	return injectContentScript(
		await getTabsByUrl(origins, excludeMatches),
		scripts,
	);
}
