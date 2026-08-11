import registerContentScriptPonyfill from 'content-scripts-register-polyfill/ponyfill.js';

export const chromeRegister = globalThis.chrome?.scripting?.registerContentScripts;
export const firefoxRegister = globalThis.browser?.contentScripts?.register;

export async function registerContentScript(
	contentScript: Omit<chrome.scripting.RegisteredContentScript, 'id' | 'world'> & {matches: string[]},
): Promise<browser.contentScripts.RegisteredContentScript> {
	if (chromeRegister !== undefined) {
		const id = 'webext-dynamic-content-script-' + JSON.stringify(contentScript);
		try {
			// Don't use `chromeRegister` directly https://github.com/fregante/webext-dynamic-content-scripts/pull/80
			await chrome.scripting.registerContentScripts([{
				...contentScript,
				id,
			}]);
		} catch (error) {
			if (!(error as Error)?.message.startsWith('Duplicate script ID')) {
				throw error;
			}
		}

		return {
			unregister: async () => chrome.scripting.unregisterContentScripts({ids: [id]}),
		};
	}

	const firefoxContentScript = {
		...contentScript,
		js: contentScript.js?.map(file => ({file})),
		css: contentScript.css?.map(file => ({file})),
	} as const;

	if (firefoxRegister) {
		return firefoxRegister(firefoxContentScript);
	}

	return registerContentScriptPonyfill(firefoxContentScript);
}
