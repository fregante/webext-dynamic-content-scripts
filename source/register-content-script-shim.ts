import registerContentScriptPonyfill from 'content-scripts-register-polyfill/ponyfill.js';

export const hasChromeRegister = Boolean(globalThis.chrome?.scripting?.registerContentScripts);
export const hasFirefoxRegister = Boolean(globalThis.browser?.contentScripts?.register);

export async function registerContentScript(
	contentScript: Omit<chrome.scripting.RegisteredContentScript, 'id' | 'world'> & {matches: string[]},
): Promise<browser.contentScripts.RegisteredContentScript> {
	if (hasChromeRegister) {
		const id = 'webext-dynamic-content-script-' + JSON.stringify(contentScript);
		try {
			await globalThis.chrome.scripting.registerContentScripts([{
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

	if (hasFirefoxRegister) {
		return globalThis.browser.contentScripts.register(firefoxContentScript);
	}

	return registerContentScriptPonyfill(firefoxContentScript);
}
