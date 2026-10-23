import {queryPermissionsDiff} from 'webext-permissions';
import {patternToRegex} from 'webext-patterns';

export function isContentScriptStaticallyRegistered(url: string): boolean {
	return Boolean(chrome.runtime
		.getManifest()
		.content_scripts
		?.flatMap(script => script.matches!)
		.some(pattern => patternToRegex(pattern).test(url)));
}

export async function isContentScriptDynamicallyRegistered(url: string): Promise<boolean> {
	// Injected by `webext-dynamic-content-scripts`
	const {added} = await queryPermissionsDiff({
		strictOrigins: false,
	});

	// Do not replace the 2 calls above with `permissions.getAll` because it might also include hosts that are permitted by the manifest but have no content script registered
	return patternToRegex(...added?.origins ?? []).test(url);
}

/**
Checks whether a URL will have the content scripts automatically injected.
It returns a promise that resolves with string indicating the type of injection ('static' or 'dynamic') or `false` if it won't be injected on the specified URL.
*/
// eslint-disable-next-line unicorn/consistent-boolean-name -- Public API, it resolves with the type of injection or `false`
export async function isContentScriptRegistered(
	url: string,
): Promise<'static' | 'dynamic' | false> {
	if (isContentScriptStaticallyRegistered(url)) {
		return 'static';
	}

	return (await isContentScriptDynamicallyRegistered(url)) ? 'dynamic' : false;
}
