import {getTabsByUrl, injectContentScript} from 'webext-content-scripts';

type ManifestContentScripts = NonNullable<chrome.runtime.Manifest['content_scripts']>;

export async function injectToExistingTabs(
	origins: string[],
	scripts: ManifestContentScripts,
) {
	const excludeMatches = scripts.flatMap(script => script.matches ?? []);
	return injectContentScript(
		await getTabsByUrl(origins, excludeMatches),
		scripts,
		{ignoreTargetErrors: true},
	);
}
