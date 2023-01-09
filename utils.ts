import {getAdditionalPermissions} from 'webext-additional-permissions';
import {patternToRegex} from 'webext-patterns';

/**
Checks whether a URL will have the content scripts automatically injected.
It returns a promise that resolves with string indicating the type of injection ('static' or 'dynamic') or `false` if it won't be injected on the specified URL.
*/
export async function isContentScriptRegistered(
	url: string,
): Promise<'static' | 'dynamic' | false> {
	const isInjectedByBrowser = chrome.runtime
		.getManifest()
		.content_scripts!
		.flatMap(script => script.matches!)
		.some(pattern => patternToRegex(pattern).test(url));

	if (isInjectedByBrowser) {
		return 'static';
	}

	// Injected by `webext-dynamic-content-scripts`
	const {origins} = await getAdditionalPermissions({
		strictOrigins: false,
	});

	// Do not replace the 2 calls above with `permissions.getAll` because it might also include hosts that are permitted by the manifest but have no content script registered
	return patternToRegex(...origins).test(url) && 'dynamic';
}
