import {getTabsByUrl, injectContentScript} from 'webext-content-scripts';

type ManifestContentScripts = NonNullable<chrome.runtime.Manifest['content_scripts']>;

// May not be needed in the future in Firefox
// https://bugzilla.mozilla.org/show_bug.cgi?id=1458947
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
