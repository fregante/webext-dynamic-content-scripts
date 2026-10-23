import {injectContentScript} from 'webext-content-scripts';
import queryTabsByUrl from 'webext-tools/query-tabs-by-url.js';

type ManifestContentScripts = NonNullable<chrome.runtime.Manifest['content_scripts']>;

export async function injectToExistingTabs(
	origins: string[],
	scripts: ManifestContentScripts,
) {
	const excludeMatches = scripts.flatMap(script => script.matches ?? []);
	return injectContentScript(
		await queryTabsByUrl(origins, excludeMatches),
		scripts,
		{ignoreTargetErrors: true},
	);
}
